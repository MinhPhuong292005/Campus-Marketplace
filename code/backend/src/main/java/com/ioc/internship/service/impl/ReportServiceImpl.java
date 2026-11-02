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

        // Apply penalties
        UserEntity targetUser = report.getReportedUser();
        if (targetUser != null) {
            if ("PENALIZE_KARMA".equalsIgnoreCase(action)) {
                int penalty = req.getKarmaPenalty() != null ? req.getKarmaPenalty() : 15;
                targetUser.setKarmaScore(Math.max(0, targetUser.getKarmaScore() - penalty));
                userRepository.save(targetUser);
                log.info("Karma penalty of -{} points applied to user #{}", penalty, targetUser.getId());
            } else if ("BAN_USER".equalsIgnoreCase(action) || "BLOCK_USER".equalsIgnoreCase(action)) {
                targetUser.setStatus("BANNED");
                targetUser.setBlockReason(req.getResolutionNotes() != null && !req.getResolutionNotes().isBlank() 
                        ? req.getResolutionNotes() 
                        : "Bị cấm vĩnh viễn do vi phạm nghiêm trọng (tố cáo)");
                userRepository.save(targetUser);
                log.warn("User #{} has been BANNED by admin #{}", targetUser.getId(), adminId);
            } else if ("SUSPEND_1_WEEK".equalsIgnoreCase(action) || "SCAM_PENALTY".equalsIgnoreCase(action)) {
                int penalty = req.getKarmaPenalty() != null ? req.getKarmaPenalty() : 20;
                targetUser.setKarmaScore(Math.max(0, targetUser.getKarmaScore() - penalty));
                targetUser.setStatus("SUSPENDED");
                targetUser.setBlockReason(req.getResolutionNotes() != null && !req.getResolutionNotes().isBlank() 
                        ? req.getResolutionNotes() 
                        : "Tài khoản bị trừ " + penalty + " điểm Karma và tạm khóa 1 tuần do hành vi lừa đảo/scam đồ sinh viên.");
                userRepository.save(targetUser);
                log.warn("User #{} has been SUSPENDED for 1 week and penalized {} Karma by admin #{}", targetUser.getId(), penalty, adminId);
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
