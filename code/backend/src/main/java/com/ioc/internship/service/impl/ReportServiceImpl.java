package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.dto.request.ReportCreateReq;
import com.ioc.internship.dto.request.ResolveReportReq;
import com.ioc.internship.dto.response.PaginatedRes;
import com.ioc.internship.dto.response.ReportRes;
import com.ioc.internship.entity.ListingEntity;
import com.ioc.internship.entity.RentalContractEntity;
import com.ioc.internship.entity.ReportEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.ListingRepository;
import com.ioc.internship.repository.RentalContractRepository;
import com.ioc.internship.repository.ReportRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final RentalContractRepository rentalContractRepository;
    private final com.ioc.internship.service.KarmaService karmaService;

    @Override
    @Transactional
    public ReportRes createReport(Long reporterId, ReportCreateReq req) {
        UserEntity reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        UserEntity reportedUser = null;
        if (req.getReportedUserId() != null) {
            reportedUser = userRepository.findById(req.getReportedUserId()).orElse(null);
        }

        ListingEntity reportedListing = null;
        if (req.getReportedListingId() != null) {
            reportedListing = listingRepository.findById(req.getReportedListingId()).orElse(null);
            if (reportedUser == null && reportedListing != null) {
                reportedUser = reportedListing.getUser();
            }
        }

        if (reportedUser != null && reporterId.equals(reportedUser.getId())) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Bạn không thể tự gửi báo cáo vi phạm chính mình");
        }

        RentalContractEntity contract = null;
        if (req.getRentalContractId() != null) {
            contract = rentalContractRepository.findById(req.getRentalContractId()).orElse(null);
        }

        ReportEntity report = ReportEntity.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .reportedListing(reportedListing)
                .rentalContract(contract)
                .reason(req.getReason())
                .description(req.getDescription())
                .evidenceUrl(req.getEvidenceUrl())
                .severity(req.getSeverity() != null ? req.getSeverity() : "MEDIUM")
                .status("PENDING")
                .build();

        ReportEntity saved = reportRepository.save(report);
        log.warn("Report #{} submitted by user #{} against user #{} - reason: {}",
                saved.getId(), reporterId, (reportedUser != null ? reportedUser.getId() : "N/A"), req.getReason());

        // Nếu người bị tố cáo nhận từ 3 báo cáo trở lên -> Tự động tạm khóa 7 ngày và trừ 10 Karma
        if (reportedUser != null && "ACTIVE".equalsIgnoreCase(reportedUser.getStatus())) {
            long reportCount = reportRepository.countByReportedUserId(reportedUser.getId());
            if (reportCount >= 3) {
                log.warn("User #{} has reached {} reports. Applying automatic 7-day temporary suspension.", reportedUser.getId(), reportCount);
                karmaService.applyTemporaryBan(reportedUser, 7, "Tài khoản nhận từ 3 lượt báo cáo vi phạm từ các bạn học khác");
            }
        }

        return mapToRes(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedRes<ReportRes> getReports(String status, String severity, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReportEntity> entityPage;

        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            entityPage = reportRepository.findByStatus(status.toUpperCase(), pageable);
        } else if (severity != null && !severity.isBlank() && !"ALL".equalsIgnoreCase(severity)) {
            entityPage = reportRepository.findBySeverity(severity.toUpperCase(), pageable);
        } else {
            entityPage = reportRepository.findAll(pageable);
        }

        List<ReportRes> items = entityPage.getContent().stream()
                .map(this::mapToRes)
                .toList();

        return PaginatedRes.<ReportRes>builder()
                .items(items)
                .page(entityPage.getNumber())
                .size(entityPage.getSize())
                .totalElements(entityPage.getTotalElements())
                .totalPages(entityPage.getTotalPages())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ReportRes getReportById(Long reportId) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));
        return mapToRes(report);
    }

    @Override
    @Transactional
    public ReportRes resolveReport(Long adminId, Long reportId, ResolveReportReq req) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        String action = req.getAction().toUpperCase();
        report.setActionTaken(action);
        report.setAdminResolution(req.getResolutionNotes());

        if ("REJECTED".equalsIgnoreCase(action)) {
            report.setStatus("REJECTED");
        } else {
            report.setStatus("RESOLVED");
        }

        // Apply penalties via centralized KarmaService
        UserEntity targetUser = report.getReportedUser();
        if (targetUser != null) {
            String note = req.getResolutionNotes() != null && !req.getResolutionNotes().isBlank() 
                    ? req.getResolutionNotes() 
                    : "Xử lý vi phạm báo cáo";
            if ("PENALIZE_KARMA".equalsIgnoreCase(action)) {
                int penalty = req.getKarmaPenalty() != null ? req.getKarmaPenalty() : 10;
                karmaService.adjustKarma(targetUser, -penalty, note);
                log.info("Karma penalty of -{} points applied to user #{}", penalty, targetUser.getId());
            } else if ("BAN_USER".equalsIgnoreCase(action) || "BLOCK_USER".equalsIgnoreCase(action)) {
                karmaService.adjustKarma(targetUser, -100, note);
                log.warn("User #{} has been BANNED by admin #{}", targetUser.getId(), adminId);
            } else if ("SUSPEND_1_WEEK".equalsIgnoreCase(action) || "SCAM_PENALTY".equalsIgnoreCase(action) || "SUSPEND".equalsIgnoreCase(action)) {
                karmaService.applyTemporaryBan(targetUser, 7, note);
                log.warn("User #{} has been SUSPENDED for 1 week by admin #{}", targetUser.getId(), adminId);
            }
        }

        ListingEntity targetListing = report.getReportedListing();
        if (targetListing != null && "REMOVE_LISTING".equalsIgnoreCase(action)) {
            targetListing.setStatus("DELETED");
            listingRepository.save(targetListing);
            log.warn("Listing #{} has been removed by admin #{}", targetListing.getId(), adminId);
        }

        ReportEntity updated = reportRepository.save(report);
        return mapToRes(updated);
    }

    @Override
    @Transactional
    public void dismissReportsForUser(Long adminId, Long reportedUserId) {
        List<ReportEntity> userReports = reportRepository.findByReportedUserId(reportedUserId);
        for (ReportEntity r : userReports) {
            if ("PENDING".equalsIgnoreCase(r.getStatus()) || r.getStatus() == null) {
                r.setStatus("DISMISSED");
                r.setActionTaken("DISMISSED");
                r.setAdminResolution("Quản trị viên đã xem xét và quyết định bỏ qua cảnh báo.");
                reportRepository.save(r);
            }
        }
        log.info("Admin #{} dismissed reports for user #{}", adminId, reportedUserId);
    }

    private ReportRes mapToRes(ReportEntity entity) {
        return ReportRes.builder()
                .id(entity.getId())
                .reporterId(entity.getReporter().getId())
                .reporterName(entity.getReporter().getFullName())
                .reportedUserId(entity.getReportedUser() != null ? entity.getReportedUser().getId() : null)
                .reportedUserName(entity.getReportedUser() != null ? entity.getReportedUser().getFullName() : null)
                .reportedListingId(entity.getReportedListing() != null ? entity.getReportedListing().getId() : null)
                .reportedListingTitle(entity.getReportedListing() != null ? entity.getReportedListing().getTitle() : null)
                .rentalContractId(entity.getRentalContract() != null ? entity.getRentalContract().getId() : null)
                .reason(entity.getReason())
                .description(entity.getDescription())
                .evidenceUrl(entity.getEvidenceUrl())
                .severity(entity.getSeverity())
                .status(entity.getStatus())
                .adminResolution(entity.getAdminResolution())
                .actionTaken(entity.getActionTaken())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
