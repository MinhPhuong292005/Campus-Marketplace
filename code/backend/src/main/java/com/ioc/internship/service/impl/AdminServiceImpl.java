package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.dto.request.*;
import com.ioc.internship.dto.response.*;
import com.ioc.internship.entity.*;
import com.ioc.internship.repository.*;
import com.ioc.internship.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ReportRepository reportRepository;
    private final RentalContractRepository rentalContractRepository;
    private final CategoryRepository categoryRepository;
    private final UniversityRepository universityRepository;
    private final CampusRepository campusRepository;
    private final AuditLogRepository auditLogRepository;
    private final KeywordBlacklistRepository keywordBlacklistRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardStatsRes getDashboardStats() {
        LocalDateTime startOfToday = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS);
        LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);

        long pendingCount = listingRepository.countByStatus("PENDING_APPROVAL");
        long openReports = reportRepository.countByStatus("PENDING") + reportRepository.countByStatus("OPEN");
        long todayUsers = userRepository.countByCreatedAtAfter(startOfToday);
        long completedTransactions = rentalContractRepository.countByStatus("RETURNED")
                + listingRepository.countByStatus("COMPLETED");
        long totalUsers = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && (u.getEmail().toLowerCase().contains("phenikaa-uni.edu.vn") || u.getEmail().toLowerCase().contains("phenikaa.edu.vn")))
                .count();
        long totalListings = listingRepository.count();
        long blockedCount = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && (u.getEmail().toLowerCase().contains("phenikaa-uni.edu.vn") || u.getEmail().toLowerCase().contains("phenikaa.edu.vn")))
                .filter(u -> "BANNED".equals(u.getStatus()) || "SUSPENDED".equals(u.getStatus()) || "BLOCKED".equals(u.getStatus()))
                .count();

        // 1. Listings by Category
        Map<String, Long> categoryMap = new LinkedHashMap<>();
        List<Object[]> categoryCounts = listingRepository.countListingsGroupedByCategory();
        for (Object[] row : categoryCounts) {
            String catName = (String) row[0];
            Long count = (Long) row[1];
            categoryMap.put(catName, count);
        }

        // 2. Users by University (Phenikaa only)
        Map<String, Long> universityMap = new LinkedHashMap<>();
        List<Object[]> uniCounts = userRepository.countUsersGroupedByUniversity();
        for (Object[] row : uniCounts) {
            String uniName = (String) row[0];
            if (uniName != null && uniName.toLowerCase().contains("phenikaa")) {
                Long count = (Long) row[1];
                universityMap.put(uniName, count);
            }
        }

        // 3. Emergency Alerts (reported >= 1 in last 24h)
        List<AdminDashboardStatsRes.EmergencyAlertUser> emergencyAlerts = new ArrayList<>();
        List<Object[]> reportedUsers = reportRepository.findFrequentlyReportedUsers(last24Hours);
        for (Object[] row : reportedUsers) {
            Long userId = (Long) row[0];
            String fullName = (String) row[1];
            String email = (String) row[2];
            Long count = (Long) row[3];
            emergencyAlerts.add(AdminDashboardStatsRes.EmergencyAlertUser.builder()
                    .userId(userId)
                    .fullName(fullName)
                    .email(email)
                    .reportCount(count)
                    .reasonSummary("Bị báo cáo " + count + " lần trong 24 giờ qua (cần kiểm tra gấp)")
                    .build());
        }

        return AdminDashboardStatsRes.builder()
                .pendingListingsCount(pendingCount)
                .openReportsCount(openReports)
                .todayNewUsersCount(todayUsers)
                .completedTransactionsCount(completedTransactions)
                .totalUsers(totalUsers)
                .totalListings(totalListings)
                .blockedStudentsCount(blockedCount)
                .listingsByCategory(categoryMap)
                .usersByUniversity(universityMap)
                .emergencyAlerts(emergencyAlerts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedRes<ListingDetailRes> getListings(String keyword, String status, Long categoryId, Long universityId, Boolean isRiskFlagged, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String finalStatus = (status == null || status.equalsIgnoreCase("ALL")) ? null : status.toUpperCase();
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        Page<ListingEntity> listingPage = listingRepository.adminSearchListings(kw, finalStatus, categoryId, universityId, isRiskFlagged, pageable);
        List<ListingDetailRes> items = listingPage.getContent().stream()
                .map(this::mapToListingDetailRes)
                .collect(Collectors.toList());

        return PaginatedRes.<ListingDetailRes>builder()
                .items(items)
                .page(listingPage.getNumber())
                .size(listingPage.getSize())
                .totalElements(listingPage.getTotalElements())
                .totalPages(listingPage.getTotalPages())
                .build();
    }

    @Override
    @Transactional
    public ListingDetailRes moderateListing(Long adminId, String adminEmail, Long listingId, ListingModerationReq req) {
        ListingEntity listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        String action = req.getAction().toUpperCase();
        switch (action) {
            case "APPROVE":
                listing.setStatus("ACTIVE");
                listing.setIsRiskFlagged(false);
                break;
            case "REJECT":
                listing.setStatus("REJECTED");
                break;
            case "REQUEST_EDIT":
                listing.setStatus("NEEDS_EDIT");
                break;
            case "HIDE":
                listing.setStatus("ARCHIVED");
                break;
            default:
                throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
        }

        listingRepository.save(listing);

        // Record Audit Log
        recordAudit(adminId, adminEmail, action + "_LISTING", "LISTING", listingId,
                "Lý do: " + (req.getReason() != null ? req.getReason() : "N/A") + " | Ghi chú: " + (req.getNote() != null ? req.getNote() : ""));

        return mapToListingDetailRes(listing);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedRes<UserDetailRes> getUsers(String keyword, Long universityId, String status, Boolean verified, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String finalStatus = (status == null || status.equalsIgnoreCase("ALL")) ? null : status.toUpperCase();
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        Page<UserEntity> userPage = userRepository.adminSearchUsers(kw, universityId, finalStatus, verified, pageable);
        List<UserDetailRes> items = userPage.getContent().stream()
                .filter(u -> u.getEmail() != null && (u.getEmail().toLowerCase().contains("phenikaa-uni.edu.vn") || u.getEmail().toLowerCase().contains("phenikaa.edu.vn") || "admin@gmail.com".equalsIgnoreCase(u.getEmail())))
                .map(this::mapToUserDetailRes)
                .collect(Collectors.toList());

        return PaginatedRes.<UserDetailRes>builder()
                .items(items)
                .page(userPage.getNumber())
                .size(userPage.getSize())
                .totalElements(items.size())
                .totalPages(1)
                .build();
    }

    @Override
    @Transactional
    public UserDetailRes updateUserStatus(Long adminId, String adminEmail, Long targetUserId, UserStatusUpdateReq req) {
        UserEntity user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        String action = req.getAction().toUpperCase();
        switch (action) {
            case "SUSPEND":
                user.setStatus("SUSPENDED");
                user.setBlockReason(req.getReason() != null && !req.getReason().isBlank() ? req.getReason() : "Tài khoản bị khóa tạm thời bởi Quản trị viên");
                user.setSuspendedUntil(LocalDateTime.now().plusDays(7));
                break;
            case "BAN":
                user.setStatus("BANNED");
                user.setBlockReason(req.getReason() != null && !req.getReason().isBlank() ? req.getReason() : "Tài khoản bị cấm vĩnh viễn do vi phạm nghiêm trọng");
                break;
            case "ACTIVATE":
                user.setStatus("ACTIVE");
                user.setBlockReason(null);
                user.setSuspendedUntil(null);
                break;
            case "WARN":
                user.setKarmaScore(Math.max(0, user.getKarmaScore() - 5));
                break;
            case "ADJUST_KARMA":
                int adj = req.getKarmaAdjustment() != null ? req.getKarmaAdjustment() : 0;
                user.setKarmaScore(Math.max(0, user.getKarmaScore() + adj));
                break;
            default:
                throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
        }

        userRepository.save(user);

        // Auto-resolve pending reports against this user so they disappear from emergency warnings
        if ("SUSPENDED".equals(user.getStatus()) || "BANNED".equals(user.getStatus()) || "BLOCKED".equals(user.getStatus())) {
            List<ReportEntity> userReports = reportRepository.findByReportedUserId(targetUserId);
            for (ReportEntity r : userReports) {
                if ("PENDING".equalsIgnoreCase(r.getStatus()) || r.getStatus() == null) {
                    r.setStatus("RESOLVED");
                    r.setActionTaken(action);
                    r.setAdminResolution("Đã xử lý khóa tài khoản người vi phạm: " + (req.getReason() != null ? req.getReason() : action));
                    reportRepository.save(r);
                }
            }
        }

        recordAudit(adminId, adminEmail, action + "_USER", "USER", targetUserId,
                "Lý do: " + (req.getReason() != null ? req.getReason() : "N/A") + " | Karma điều chỉnh: " + req.getKarmaAdjustment());

        return mapToUserDetailRes(user);
    }

    @Override
    @Transactional
    public UserDetailRes reviewStudentCard(Long adminId, String adminEmail, Long targetUserId, StudentCardReviewReq req) {
        UserEntity user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        String action = req.getAction().toUpperCase();
        if ("APPROVE".equals(action)) {
            user.setStudentCardVerified(true);
            int karma = req.getKarmaAward() != null ? req.getKarmaAward() : 15;
            user.setKarmaScore(user.getKarmaScore() + karma);
        } else if ("REVOKE".equals(action) || "REJECT".equals(action)) {
            user.setStudentCardVerified(false);
        }

        userRepository.save(user);

        recordAudit(adminId, adminEmail, action + "_STUDENT_CARD", "USER", targetUserId,
                "Xác thực thẻ sinh viên: " + req.getAction() + " | Lý do: " + req.getReason());

        return mapToUserDetailRes(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryEntity> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Override
    @Transactional
    public CategoryEntity createCategory(Long adminId, String adminEmail, CategoryReq req) {
        String slug = req.getSlug() != null && !req.getSlug().isBlank()
                ? req.getSlug().trim().toLowerCase()
                : req.getName().toLowerCase().replace(" ", "-");

        CategoryEntity category = CategoryEntity.builder()
                .name(req.getName().trim())
                .slug(slug)
                .icon(req.getIcon() != null ? req.getIcon() : "Folder")
                .build();
        CategoryEntity saved = categoryRepository.save(category);

        recordAudit(adminId, adminEmail, "CREATE_CATEGORY", "CATEGORY", saved.getId(), "Tạo danh mục: " + saved.getName());
        return saved;
    }

    @Override
    @Transactional
    public CategoryEntity updateCategory(Long adminId, String adminEmail, Long id, CategoryReq req) {
        CategoryEntity category = categoryRepository.findById(id)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        category.setName(req.getName().trim());
        if (req.getSlug() != null && !req.getSlug().isBlank()) {
            category.setSlug(req.getSlug().trim().toLowerCase());
        }
        if (req.getIcon() != null) {
            category.setIcon(req.getIcon());
        }
        CategoryEntity saved = categoryRepository.save(category);

        recordAudit(adminId, adminEmail, "UPDATE_CATEGORY", "CATEGORY", id, "Cập nhật danh mục: " + saved.getName());
        return saved;
    }

    @Override
    @Transactional
    public void deleteCategory(Long adminId, String adminEmail, Long id) {
        categoryRepository.deleteById(id);
        recordAudit(adminId, adminEmail, "DELETE_CATEGORY", "CATEGORY", id, "Xóa danh mục #" + id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UniversityEntity> getAllUniversities() {
        return universityRepository.findAll().stream()
                .filter(u -> "PHENIKAA".equalsIgnoreCase(u.getShortName()) || (u.getName() != null && u.getName().toLowerCase().contains("phenikaa")))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UniversityEntity createUniversity(Long adminId, String adminEmail, UniversityReq req) {
        UniversityEntity university = UniversityEntity.builder()
                .name(req.getName().trim())
                .shortName(req.getShortName().trim().toUpperCase())
                .emailDomains(req.getEmailDomains().trim().toLowerCase())
                .build();
        UniversityEntity saved = universityRepository.save(university);

        recordAudit(adminId, adminEmail, "CREATE_UNIVERSITY", "UNIVERSITY", saved.getId(), "Tạo trường: " + saved.getName());
        return saved;
    }

    @Override
    @Transactional
    public UniversityEntity updateUniversity(Long adminId, String adminEmail, Long id, UniversityReq req) {
        UniversityEntity university = universityRepository.findById(id)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        university.setName(req.getName().trim());
        university.setShortName(req.getShortName().trim().toUpperCase());
        university.setEmailDomains(req.getEmailDomains().trim().toLowerCase());
        UniversityEntity saved = universityRepository.save(university);

        recordAudit(adminId, adminEmail, "UPDATE_UNIVERSITY", "UNIVERSITY", id, "Cập nhật trường: " + saved.getName());
        return saved;
    }

    @Override
    @Transactional
    public CampusEntity createCampus(Long adminId, String adminEmail, CampusReq req) {
        UniversityEntity university = universityRepository.findById(req.getUniversityId())
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        CampusEntity campus = CampusEntity.builder()
                .university(university)
                .name(req.getName().trim())
                .location(req.getLocation())
                .build();
        CampusEntity saved = campusRepository.save(campus);

        recordAudit(adminId, adminEmail, "CREATE_CAMPUS", "CAMPUS", saved.getId(), "Tạo cơ sở: " + saved.getName() + " thuộc " + university.getName());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<KeywordBlacklistEntity> getAllBlacklistKeywords() {
        return keywordBlacklistRepository.findAll();
    }

    @Override
    @Transactional
    public KeywordBlacklistEntity addBlacklistKeyword(Long adminId, String adminEmail, KeywordBlacklistReq req) {
        String kw = req.getKeyword().trim().toLowerCase();
        if (keywordBlacklistRepository.existsByKeywordIgnoreCase(kw)) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
        }

        KeywordBlacklistEntity entity = KeywordBlacklistEntity.builder()
                .keyword(kw)
                .category(req.getCategory() != null ? req.getCategory() : "PROHIBITED_GOODS")
                .severity(req.getSeverity() != null ? req.getSeverity() : "HIGH")
                .action(req.getAction() != null ? req.getAction() : "AUTO_BLOCK")
                .reason(req.getReason())
                .build();
        KeywordBlacklistEntity saved = keywordBlacklistRepository.save(entity);

        recordAudit(adminId, adminEmail, "ADD_KEYWORD_BLACKLIST", "SYSTEM", saved.getId(), "Thêm từ khóa cấm: " + kw);
        return saved;
    }

    @Override
    @Transactional
    public void deleteBlacklistKeyword(Long adminId, String adminEmail, Long id) {
        keywordBlacklistRepository.deleteById(id);
        recordAudit(adminId, adminEmail, "DELETE_KEYWORD_BLACKLIST", "SYSTEM", id, "Xóa từ khóa cấm #" + id);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedRes<AuditLogRes> getAuditLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogEntity> logPage = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<AuditLogRes> items = logPage.getContent().stream()
                .map(l -> AuditLogRes.builder()
                        .id(l.getId())
                        .adminId(l.getAdminId())
                        .adminEmail(l.getAdminEmail())
                        .action(l.getAction())
                        .targetType(l.getTargetType())
                        .targetId(l.getTargetId())
                        .details(l.getDetails())
                        .ipAddress(l.getIpAddress())
                        .createdAt(l.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return PaginatedRes.<AuditLogRes>builder()
                .items(items)
                .page(logPage.getNumber())
                .size(logPage.getSize())
                .totalElements(logPage.getTotalElements())
                .totalPages(logPage.getTotalPages())
                .build();
    }

    private void recordAudit(Long adminId, String adminEmail, String action, String targetType, Long targetId, String details) {
        try {
            AuditLogEntity logEntity = AuditLogEntity.builder()
                    .adminId(adminId != null ? adminId : 0L)
                    .adminEmail(adminEmail != null ? adminEmail : "admin@system")
                    .action(action)
                    .targetType(targetType)
                    .targetId(targetId)
                    .details(details)
                    .ipAddress("127.0.0.1")
                    .build();
            auditLogRepository.save(logEntity);
        } catch (Exception e) {
            log.error("Failed to record audit log: {}", e.getMessage());
        }
    }

    private ListingDetailRes mapToListingDetailRes(ListingEntity l) {
        return ListingDetailRes.builder()
                .id(l.getId())
                .userId(l.getUser() != null ? l.getUser().getId() : null)
                .authorName(l.getUser() != null ? l.getUser().getFullName() : null)
                .authorKarma(l.getUser() != null ? l.getUser().getKarmaScore() : null)
                .universityName(l.getUser() != null && l.getUser().getUniversity() != null ? l.getUser().getUniversity().getName() : null)
                .campusName(l.getUser() != null && l.getUser().getCampus() != null ? l.getUser().getCampus().getName() : null)
                .title(l.getTitle())
                .description(l.getDescription())
                .price(l.getPrice())
                .transactionType(l.getTransactionType())
                .conditionStatus(l.getConditionStatus())
                .status(l.getStatus())
                .isRiskFlagged(l.getIsRiskFlagged())
                .riskReason(l.getRiskReason())
                .rentalTerms(l.getRentalTerms())
                .swapTarget(l.getSwapTarget())
                .categoryId(l.getCategory() != null ? l.getCategory().getId() : null)
                .categoryName(l.getCategory() != null ? l.getCategory().getName() : null)
                .imageUrls(l.getImages() != null ? l.getImages().stream().map(ListingImageEntity::getMediaUrl).collect(Collectors.toList()) : Collections.emptyList())
                .createdAt(l.getCreatedAt())
                .build();
    }

    private UserDetailRes mapToUserDetailRes(UserEntity u) {
        if (u == null) return null;

        List<UserDetailRes.ViolatingItemRes> violatingItems = new ArrayList<>();
        try {
            List<ListingEntity> userListings = listingRepository.findByUserId(u.getId());
            if (userListings != null) {
                for (ListingEntity l : userListings) {
                    if (Boolean.TRUE.equals(l.getIsRiskFlagged()) || "REJECTED".equalsIgnoreCase(l.getStatus())) {
                        List<String> imgs = l.getImages() != null
                                ? l.getImages().stream().map(ListingImageEntity::getMediaUrl).collect(Collectors.toList())
                                : Collections.emptyList();
                        violatingItems.add(UserDetailRes.ViolatingItemRes.builder()
                                .id(l.getId())
                                .type("LISTING")
                                .title(l.getTitle())
                                .description(l.getDescription())
                                .reason(l.getRiskReason() != null ? l.getRiskReason() : "Bài đăng vi phạm quy chế sàn Marketplace")
                                .imageUrls(imgs)
                                .createdAt(l.getCreatedAt())
                                .build());
                    }
                }
            }

            List<ReportEntity> reports = reportRepository.findByReportedUserId(u.getId());
            if (reports != null) {
                for (ReportEntity r : reports) {
                    List<String> evidence = new ArrayList<>();
                    if (r.getEvidenceUrl() != null && !r.getEvidenceUrl().isBlank()) {
                        evidence.add(r.getEvidenceUrl());
                    }
                    violatingItems.add(UserDetailRes.ViolatingItemRes.builder()
                            .id(r.getId())
                            .type("REPORT")
                            .title("Báo cáo vi phạm: " + (r.getReason() != null ? r.getReason() : "Hành vi gian lận/scam"))
                            .description(r.getDescription())
                            .reason(r.getReason() + (r.getAdminResolution() != null ? " (" + r.getAdminResolution() + ")" : ""))
                            .imageUrls(evidence)
                            .createdAt(r.getCreatedAt())
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Could not load violating items for user #{}: {}", u.getId(), e.getMessage());
        }

        return UserDetailRes.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .avatarUrl(u.getAvatarUrl())
                .universityId(u.getUniversity() != null ? u.getUniversity().getId() : null)
                .universityName(u.getUniversity() != null ? u.getUniversity().getName() : null)
                .campusId(u.getCampus() != null ? u.getCampus().getId() : null)
                .campusName(u.getCampus() != null ? u.getCampus().getName() : null)
                .dormitory(u.getDormitory())
                .studentCode(u.getStudentCode())
                .major(u.getMajor())
                .academicYear(u.getAcademicYear())
                .bio(u.getBio())
                .studentCardVerified(Boolean.TRUE.equals(u.getStudentCardVerified()))
                .studentCardImageUrl(u.getStudentCardImageUrl())
                .karmaScore(u.getKarmaScore())
                .role(u.getRole())
                .status(u.getStatus())
                .blockReason(u.getBlockReason())
                .suspendedUntil(u.getSuspendedUntil() != null ? u.getSuspendedUntil() : ("SUSPENDED".equalsIgnoreCase(u.getStatus()) ? (u.getUpdatedAt() != null ? u.getUpdatedAt().plusDays(7) : LocalDateTime.now().plusDays(7)) : null))
                .violatingItems(violatingItems)
                .createdAt(u.getCreatedAt())
                .build();
    }
}
