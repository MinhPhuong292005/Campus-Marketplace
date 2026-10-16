package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.dto.request.ListingCreateReq;
import com.ioc.internship.dto.request.ListingStatusReq;
import com.ioc.internship.dto.request.ListingUpdateReq;
import com.ioc.internship.dto.response.ListingDetailRes;
import com.ioc.internship.entity.CategoryEntity;
import com.ioc.internship.entity.ListingEntity;
import com.ioc.internship.entity.ListingImageEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.CategoryRepository;
import com.ioc.internship.repository.ListingImageRepository;
import com.ioc.internship.repository.ListingRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.ListingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ListingServiceImpl implements ListingService {

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final com.ioc.internship.repository.KeywordBlacklistRepository keywordBlacklistRepository;

    private List<String> scanBannedKeywords(String text) {
        if (text == null || text.isBlank()) return java.util.Collections.emptyList();
        String lower = text.toLowerCase(java.util.Locale.ROOT);
        List<String> matched = new ArrayList<>();
        for (com.ioc.internship.entity.KeywordBlacklistEntity kw : keywordBlacklistRepository.findAll()) {
            if (kw.getKeyword() != null && !kw.getKeyword().isBlank()) {
                String banned = kw.getKeyword().trim().toLowerCase(java.util.Locale.ROOT);
                if (lower.contains(banned)) {
                    matched.add(kw.getKeyword().trim());
                }
            }
        }
        return matched;
    }

    @Override
    @Transactional
    public ListingDetailRes createListing(Long userId, ListingCreateReq req) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        // Check if student is blocked/banned
        if ("BANNED".equalsIgnoreCase(user.getStatus()) || "SUSPENDED".equalsIgnoreCase(user.getStatus()) || "BLOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Tài khoản của bạn đang bị khóa hoặc chặn quyền đăng bài");
        }

        CategoryEntity category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Danh mục không tồn tại"));

        // AC Validation: Price constraints
        BigDecimal price = req.getPrice();
        if ("SELL".equalsIgnoreCase(req.getTransactionType())) {
            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                throw new CustomBusinessException(ErrorCodes.INVALID_LISTING_PRICE, HttpStatus.BAD_REQUEST);
            }
        } else if ("GIVEAWAY".equalsIgnoreCase(req.getTransactionType())) {
            price = BigDecimal.ZERO;
        }

        // AC Validation: max 6 images
        if (req.getImageUrls() != null && req.getImageUrls().size() > 6) {
            throw new CustomBusinessException(ErrorCodes.IMAGE_LIMIT_EXCEEDED, HttpStatus.BAD_REQUEST);
        }

        // Quét từ khóa cấm trong tiêu đề và mô tả
        String combinedContent = req.getTitle().trim() + " " + req.getDescription().trim();
        List<String> detectedBannedKeywords = scanBannedKeywords(combinedContent);

        String initialStatus;
        boolean isRiskFlagged;
        String riskReason;

        if (!detectedBannedKeywords.isEmpty()) {
            // Tự động không duyệt do chứa từ khóa cấm trong danh mục của Quản trị viên
            initialStatus = "REJECTED";
            isRiskFlagged = true;
            riskReason = "Tự động từ chối duyệt: Chứa từ khóa bị cấm [" + String.join(", ", detectedBannedKeywords) + "]";
        } else {
            // Bài đăng hợp lệ: Bắt buộc Quản trị viên duyệt thì mới được phép hiển thị ACTIVE
            initialStatus = "PENDING_APPROVAL";
            isRiskFlagged = false;
            riskReason = null;
        }

        ListingEntity listing = ListingEntity.builder()
                .user(user)
                .category(category)
                .title(req.getTitle().trim())
                .description(req.getDescription().trim())
                .price(price)
                .transactionType(req.getTransactionType().toUpperCase())
                .conditionStatus(req.getConditionStatus())
                .rentalTerms(req.getRentalTerms())
                .swapTarget(req.getSwapTarget())
                .status(initialStatus)
                .isRiskFlagged(isRiskFlagged)
                .riskReason(riskReason)
                .build();

        ListingEntity savedListing = listingRepository.save(listing);

        // Save images
        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            List<ListingImageEntity> images = new ArrayList<>();
            for (int i = 0; i < req.getImageUrls().size(); i++) {
                String url = req.getImageUrls().get(i);
                images.add(ListingImageEntity.builder()
                        .listing(savedListing)
                        .mediaUrl(url)
                        .mediaType(url.endsWith(".mp4") ? "VIDEO" : "IMAGE")
                        .sortOrder(i)
                        .build());
            }
            listingImageRepository.saveAll(images);
            savedListing.setImages(images);
        }

        return mapToDetailRes(savedListing);
    }

    @Override
    @Transactional
    public ListingDetailRes updateListing(Long userId, Long listingId, ListingUpdateReq req) {
        ListingEntity listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.LISTING_NOT_FOUND, HttpStatus.NOT_FOUND));

        if (!listing.getUser().getId().equals(userId)) {
            throw new CustomBusinessException(ErrorCodes.LISTING_NOT_OWNER, HttpStatus.FORBIDDEN);
        }

        // Check if student is blocked/banned
        UserEntity author = listing.getUser();
        if ("BANNED".equalsIgnoreCase(author.getStatus()) || "SUSPENDED".equalsIgnoreCase(author.getStatus()) || "BLOCKED".equalsIgnoreCase(author.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Tài khoản của bạn đang bị khóa hoặc chặn quyền chỉnh sửa bài đăng");
        }

        CategoryEntity category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Danh mục không tồn tại"));

        BigDecimal price = req.getPrice();
        if ("SELL".equalsIgnoreCase(listing.getTransactionType())) {
            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                throw new CustomBusinessException(ErrorCodes.INVALID_LISTING_PRICE, HttpStatus.BAD_REQUEST);
            }
        } else if ("GIVEAWAY".equalsIgnoreCase(listing.getTransactionType())) {
            price = BigDecimal.ZERO;
        }

        if (req.getImageUrls() != null && req.getImageUrls().size() > 6) {
            throw new CustomBusinessException(ErrorCodes.IMAGE_LIMIT_EXCEEDED, HttpStatus.BAD_REQUEST);
        }

        listing.setTitle(req.getTitle().trim());
        listing.setDescription(req.getDescription().trim());
        listing.setCategory(category);
        listing.setPrice(price);
        listing.setConditionStatus(req.getConditionStatus());
        listing.setRentalTerms(req.getRentalTerms());
        listing.setSwapTarget(req.getSwapTarget());

        // Kiểm tra lại từ khóa cấm khi cập nhật
        String combinedContent = req.getTitle().trim() + " " + req.getDescription().trim();
        List<String> detectedBannedKeywords = scanBannedKeywords(combinedContent);

        if (!detectedBannedKeywords.isEmpty()) {
            listing.setStatus("REJECTED");
            listing.setIsRiskFlagged(true);
            listing.setRiskReason("Tự động từ chối duyệt: Chứa từ khóa bị cấm [" + String.join(", ", detectedBannedKeywords) + "]");
        } else {
            // Cập nhật nội dung cần được Quản trị viên duyệt lại
            listing.setStatus("PENDING_APPROVAL");
            listing.setIsRiskFlagged(false);
            listing.setRiskReason(null);
        }

        if (req.getImageUrls() != null) {
            listing.getImages().clear();
            for (int i = 0; i < req.getImageUrls().size(); i++) {
                String url = req.getImageUrls().get(i);
                listing.getImages().add(ListingImageEntity.builder()
                        .listing(listing)
                        .mediaUrl(url)
                        .mediaType(url.endsWith(".mp4") ? "VIDEO" : "IMAGE")
                        .sortOrder(i)
                        .build());
            }
        }

        ListingEntity updated = listingRepository.save(listing);
        return mapToDetailRes(updated);
    }

    @Override
    @Transactional
    public void deleteListing(Long userId, Long listingId) {
        ListingEntity listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.LISTING_NOT_FOUND, HttpStatus.NOT_FOUND));

        if (!listing.getUser().getId().equals(userId)) {
            throw new CustomBusinessException(ErrorCodes.LISTING_NOT_OWNER, HttpStatus.FORBIDDEN);
        }

        // Soft delete per conventions
        listing.setStatus("DELETED");
        listingRepository.save(listing);
    }

    @Override
    @Transactional
    public ListingDetailRes updateListingStatus(Long userId, Long listingId, ListingStatusReq req) {
        ListingEntity listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.LISTING_NOT_FOUND, HttpStatus.NOT_FOUND));

        if (!listing.getUser().getId().equals(userId)) {
            throw new CustomBusinessException(ErrorCodes.LISTING_NOT_OWNER, HttpStatus.FORBIDDEN);
        }

        listing.setStatus(req.getStatus().toUpperCase());
        ListingEntity saved = listingRepository.save(listing);
        return mapToDetailRes(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ListingDetailRes> getMyListings(Long userId, String status, Pageable pageable) {
        Page<ListingEntity> page;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            page = listingRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status.toUpperCase(), pageable);
        } else {
            page = listingRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        return page.map(this::mapToDetailRes);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ListingDetailRes> getAllActiveListings(Pageable pageable) {
        Page<ListingEntity> page = listingRepository.findByStatusOrderByCreatedAtDesc("ACTIVE", pageable);
        return page.map(this::mapToDetailRes);
    }

    @Override
    @Transactional(readOnly = true)
    public ListingDetailRes getListingDetails(Long listingId) {
        ListingEntity listing = listingRepository.findByIdWithDetails(listingId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.LISTING_NOT_FOUND, HttpStatus.NOT_FOUND));

        return mapToDetailRes(listing);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ListingDetailRes> searchListings(
            String keyword,
            Long categoryId,
            String transactionType,
            String conditionStatus,
            Long universityId,
            java.math.BigDecimal minPrice,
            java.math.BigDecimal maxPrice,
            Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanType = (transactionType != null && !"ALL".equalsIgnoreCase(transactionType) && !transactionType.trim().isEmpty()) ? transactionType.trim() : null;
        String cleanCond = (conditionStatus != null && !"ALL".equalsIgnoreCase(conditionStatus) && !conditionStatus.trim().isEmpty()) ? conditionStatus.trim() : null;

        Page<ListingEntity> page = listingRepository.searchListings(
                cleanKeyword,
                categoryId,
                cleanType,
                cleanCond,
                universityId,
                minPrice,
                maxPrice,
                "ACTIVE",
                pageable
        );
        return page.map(this::mapToDetailRes);
    }

    private ListingDetailRes mapToDetailRes(ListingEntity listing) {
        UserEntity author = listing.getUser();
        List<String> imageUrls = (listing.getImages() != null)
                ? listing.getImages().stream().map(ListingImageEntity::getMediaUrl).collect(Collectors.toList())
                : List.of();

        return ListingDetailRes.builder()
                .id(listing.getId())
                .userId(author != null ? author.getId() : null)
                .authorName(author != null ? author.getFullName() : "Sinh viên")
                .authorKarma(author != null ? author.getKarmaScore() : 20)
                .authorStatus(author != null ? author.getStatus() : "ACTIVE")
                .universityName(author != null && author.getUniversity() != null ? author.getUniversity().getName() : "")
                .campusName(author != null && author.getCampus() != null ? author.getCampus().getName() : "")
                .categoryId(listing.getCategory() != null ? listing.getCategory().getId() : null)
                .categoryName(listing.getCategory() != null ? listing.getCategory().getName() : "")
                .title(listing.getTitle())
                .description(listing.getDescription())
                .price(listing.getPrice())
                .transactionType(listing.getTransactionType())
                .conditionStatus(listing.getConditionStatus())
                .rentalTerms(listing.getRentalTerms())
                .swapTarget(listing.getSwapTarget())
                .status(listing.getStatus())
                .isRiskFlagged(listing.getIsRiskFlagged())
                .riskReason(listing.getRiskReason())
                .imageUrls(imageUrls)
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }
}
