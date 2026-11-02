package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.dto.request.SwapProposalCreateReq;
import com.ioc.internship.dto.request.SwapProposalStatusReq;
import com.ioc.internship.dto.response.SwapProposalRes;
import com.ioc.internship.entity.ListingEntity;
import com.ioc.internship.entity.SwapProposalEntity;
import com.ioc.internship.repository.ListingRepository;
import com.ioc.internship.repository.SwapProposalRepository;
import com.ioc.internship.service.SwapProposalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SwapProposalServiceImpl implements SwapProposalService {

    private final SwapProposalRepository swapProposalRepository;
    private final ListingRepository listingRepository;

    @Override
    @Transactional
    public SwapProposalRes createProposal(Long currentUserId, SwapProposalCreateReq req) {
        // Find initiator listing
        ListingEntity initiatorListing = listingRepository.findById(req.getInitiatorListingId())
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.LISTING_NOT_FOUND, HttpStatus.NOT_FOUND));

        // AC1: Must be user's own listing and ACTIVE
        if (!initiatorListing.getUser().getId().equals(currentUserId)) {
            throw new CustomBusinessException(ErrorCodes.LISTING_NOT_OWNER, HttpStatus.FORBIDDEN);
        }
        if (!"ACTIVE".equalsIgnoreCase(initiatorListing.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
        }

        // Find target listing
        ListingEntity targetListing = listingRepository.findById(req.getTargetListingId())
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.LISTING_NOT_FOUND, HttpStatus.NOT_FOUND));

        if (targetListing.getUser().getId().equals(currentUserId)) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
        }

        if (!"ACTIVE".equalsIgnoreCase(targetListing.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
        }

        if ("BANNED".equalsIgnoreCase(initiatorListing.getUser().getStatus()) || "BLOCKED".equalsIgnoreCase(initiatorListing.getUser().getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị cấm, không thể gửi yêu cầu đổi đồ.");
        }
        if ("SUSPENDED".equalsIgnoreCase(initiatorListing.getUser().getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Tài khoản của bạn đang bị tạm khóa 1 tuần. Không thể gửi yêu cầu đổi đồ.");
        }
        if ("BANNED".equalsIgnoreCase(targetListing.getUser().getStatus()) || "BLOCKED".equalsIgnoreCase(targetListing.getUser().getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Chủ sở hữu món đồ này đã bị cấm tài khoản.");
        }
        if ("SUSPENDED".equalsIgnoreCase(targetListing.getUser().getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Chủ sở hữu món đồ này hiện đang bị tạm khóa tài khoản. Tạm ngưng giao dịch.");
        }

        SwapProposalEntity entity = SwapProposalEntity.builder()
                .initiatorListing(initiatorListing)
                .targetListing(targetListing)
                .cashAdjustment(req.getCashAdjustment() != null ? req.getCashAdjustment() : BigDecimal.ZERO)
                .note(req.getNote())
                .status("PENDING")
                .build();

        SwapProposalEntity saved = swapProposalRepository.save(entity);
        log.info("Created swap proposal #{} between listing #{} and listing #{}",
                saved.getId(), initiatorListing.getId(), targetListing.getId());

        return mapToRes(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SwapProposalRes> getMyProposals(Long currentUserId, String type) {
        List<SwapProposalEntity> list;
        if ("sent".equalsIgnoreCase(type)) {
            list = swapProposalRepository.findSentProposals(currentUserId);
        } else if ("received".equalsIgnoreCase(type)) {
            list = swapProposalRepository.findReceivedProposals(currentUserId);
        } else {
            list = swapProposalRepository.findAllUserProposals(currentUserId);
        }
        return list.stream().map(this::mapToRes).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SwapProposalRes updateProposalStatus(Long currentUserId, Long proposalId, SwapProposalStatusReq req) {
        SwapProposalEntity proposal = swapProposalRepository.findById(proposalId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        String newStatus = req.getStatus().toUpperCase();

        if ("ACCEPTED".equals(newStatus)) {
            // Target listing owner accepts
            if (!proposal.getTargetListing().getUser().getId().equals(currentUserId)) {
                throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN);
            }

            proposal.setStatus("ACCEPTED");

            // AC3: Both listings automatically transition to RESERVED
            ListingEntity initiatorListing = proposal.getInitiatorListing();
            ListingEntity targetListing = proposal.getTargetListing();

            initiatorListing.setStatus("RESERVED");
            targetListing.setStatus("RESERVED");

            listingRepository.save(initiatorListing);
            listingRepository.save(targetListing);

            log.info("Swap proposal #{} ACCEPTED. Listings #{} and #{} set to RESERVED",
                    proposalId, initiatorListing.getId(), targetListing.getId());

        } else if ("REJECTED".equals(newStatus)) {
            if (!proposal.getTargetListing().getUser().getId().equals(currentUserId)) {
                throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN);
            }
            proposal.setStatus("REJECTED");

            // Tự động hồi phục lại cả 2 bài đăng về ACTIVE nếu trước đó đã đặt trạng thái RESERVED
            restoreListingIfReserved(proposal.getInitiatorListing());
            restoreListingIfReserved(proposal.getTargetListing());

        } else if ("CANCELLED".equals(newStatus)) {
            if (!proposal.getInitiatorListing().getUser().getId().equals(currentUserId) 
                    && !proposal.getTargetListing().getUser().getId().equals(currentUserId)) {
                throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN);
            }
            proposal.setStatus("CANCELLED");

            // Tự động hồi phục lại cả 2 bài đăng về ACTIVE khi giao dịch swap không thành công
            restoreListingIfReserved(proposal.getInitiatorListing());
            restoreListingIfReserved(proposal.getTargetListing());
        } else {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
        }

        SwapProposalEntity updated = swapProposalRepository.save(proposal);
        return mapToRes(updated);
    }

    private void restoreListingIfReserved(ListingEntity listing) {
        if (listing != null && !"DELETED".equalsIgnoreCase(listing.getStatus())) {
            listing.setStatus("ACTIVE");
            listingRepository.save(listing);
            log.info("Listing #{} automatically RESTORED to ACTIVE after unsuccessful swap transaction", listing.getId());
        }
    }

    private SwapProposalRes mapToRes(SwapProposalEntity entity) {
        ListingEntity init = entity.getInitiatorListing();
        ListingEntity target = entity.getTargetListing();

        String initImg = (init.getImages() != null && !init.getImages().isEmpty())
                ? init.getImages().get(0).getMediaUrl() : null;
        String targetImg = (target.getImages() != null && !target.getImages().isEmpty())
                ? target.getImages().get(0).getMediaUrl() : null;

        return SwapProposalRes.builder()
                .id(entity.getId())
                .initiatorListingId(init.getId())
                .initiatorListingTitle(init.getTitle())
                .initiatorListingPrice(init.getPrice())
                .initiatorListingImageUrl(initImg)
                .initiatorUserId(init.getUser().getId())
                .initiatorUserName(init.getUser().getFullName())
                .initiatorKarma(init.getUser().getKarmaScore())
                .targetListingId(target.getId())
                .targetListingTitle(target.getTitle())
                .targetListingPrice(target.getPrice())
                .targetListingImageUrl(targetImg)
                .targetUserId(target.getUser().getId())
                .targetUserName(target.getUser().getFullName())
                .targetKarma(target.getUser().getKarmaScore())
                .cashAdjustment(entity.getCashAdjustment())
                .note(entity.getNote())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
