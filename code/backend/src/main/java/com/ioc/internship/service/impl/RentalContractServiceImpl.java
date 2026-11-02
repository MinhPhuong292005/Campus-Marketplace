package com.ioc.internship.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.dto.request.RentalContractCreateReq;
import com.ioc.internship.dto.request.RentalDisputeReq;
import com.ioc.internship.dto.request.RentalProofImagesReq;
import com.ioc.internship.dto.response.PaginatedRes;
import com.ioc.internship.dto.response.RentalContractRes;
import com.ioc.internship.entity.ListingEntity;
import com.ioc.internship.entity.NotificationEntity;
import com.ioc.internship.entity.RentalContractEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.ListingRepository;
import com.ioc.internship.repository.NotificationRepository;
import com.ioc.internship.repository.RentalContractRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.RentalContractService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalContractServiceImpl implements RentalContractService {

    private final RentalContractRepository rentalContractRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;
    private final com.ioc.internship.service.KarmaService karmaService;

    @Override
    @Transactional
    public RentalContractRes createRentalContract(Long renterId, RentalContractCreateReq req) {
        UserEntity renter = userRepository.findById(renterId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        ListingEntity listing = listingRepository.findById(req.getListingId())
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        UserEntity owner = userRepository.findById(req.getOwnerId())
                .orElse(listing.getUser());

        if (renter.getId().equals(owner.getId())) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
        }

        if ("BANNED".equalsIgnoreCase(renter.getStatus()) || "BLOCKED".equalsIgnoreCase(renter.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị cấm, không thể tạo hợp đồng thuê.");
        }
        if ("SUSPENDED".equalsIgnoreCase(renter.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Tài khoản của bạn đang bị tạm khóa 1 tuần. Không thể thực hiện giao dịch thuê đồ.");
        }
        if ("BANNED".equalsIgnoreCase(owner.getStatus()) || "BLOCKED".equalsIgnoreCase(owner.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Chủ sở hữu món đồ này đã bị cấm tài khoản.");
        }
        if ("SUSPENDED".equalsIgnoreCase(owner.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Chủ sở hữu món đồ này hiện đang bị tạm khóa tài khoản. Tạm ngưng giao dịch.");
        }

        RentalContractEntity contract = RentalContractEntity.builder()
                .listing(listing)
                .renter(renter)
                .owner(owner)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .totalRentAmount(req.getTotalRentAmount())
                .depositAmount(req.getDepositAmount())
                .status("PENDING")
                .proofImages("[]")
                .build();

        RentalContractEntity saved = rentalContractRepository.save(contract);
        log.info("Created rental contract #{} between renter #{} and owner #{}", saved.getId(), renterId, owner.getId());

        // Notify owner about the new rental request
        try {
            NotificationEntity ownerNotif = NotificationEntity.builder()
                    .user(owner)
                    .title("Yêu cầu thuê mới: " + listing.getTitle())
                    .message("Bạn " + renter.getFullName() + " vừa gửi yêu cầu thuê món đồ \"" + listing.getTitle() + "\". Vui lòng kiểm tra mục Hợp đồng thuê để xem xét duyệt!")
                    .type("RENTAL_REQUEST")
                    .referenceId(saved.getId())
                    .isRead(false)
                    .build();
            notificationRepository.save(ownerNotif);
        } catch (Exception e) {
            log.warn("Failed to create rental request notification for owner #{}", owner.getId(), e);
        }

        return mapToRes(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedRes<RentalContractRes> getMyRentalContracts(Long userId, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<RentalContractEntity> entityPage;

        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            entityPage = rentalContractRepository.findByUserAndStatus(userId, status.toUpperCase(), pageable);
        } else {
            entityPage = rentalContractRepository.findAllByUser(userId, pageable);
        }

        List<RentalContractRes> items = entityPage.getContent().stream()
                .map(this::mapToRes)
                .toList();

        return PaginatedRes.<RentalContractRes>builder()
                .items(items)
                .page(entityPage.getNumber())
                .size(entityPage.getSize())
                .totalElements(entityPage.getTotalElements())
                .totalPages(entityPage.getTotalPages())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RentalContractRes getRentalContractById(Long userId, Long contractId) {
        RentalContractEntity contract = getAuthorizedContract(userId, contractId);
        return mapToRes(contract);
    }

    @Override
    @Transactional
    public RentalContractRes uploadProofImages(Long userId, Long contractId, RentalProofImagesReq req) {
        RentalContractEntity contract = getAuthorizedContract(userId, contractId);

        try {
            String json = objectMapper.writeValueAsString(req.getProofImages());
            contract.setProofImages(json);
            // Handover check-in completed: transition to ACTIVE
            contract.setStatus("ACTIVE");
            RentalContractEntity updated = rentalContractRepository.save(contract);
            log.info("Updated proof images for contract #{}, new status ACTIVE", contractId);
            return mapToRes(updated);
        } catch (Exception e) {
            log.error("Error serializing proof images", e);
            throw new CustomBusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional
    public RentalContractRes approveRentalContract(Long userId, Long contractId) {
        RentalContractEntity contract = getAuthorizedContract(userId, contractId);
        if (!contract.getOwner().getId().equals(userId)) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Chỉ chủ sở hữu món đồ mới có quyền phê duyệt yêu cầu thuê.");
        }
        contract.setStatus("APPROVED");
        RentalContractEntity updated = rentalContractRepository.save(contract);
        log.info("Owner #{} approved rental contract #{}", userId, contractId);

        try {
            NotificationEntity renterNotif = NotificationEntity.builder()
                    .user(contract.getRenter())
                    .title("Yêu cầu thuê đã được duyệt: " + contract.getListing().getTitle())
                    .message("Chủ sở hữu " + contract.getOwner().getFullName() + " đã đồng ý cho thuê món đồ \"" + contract.getListing().getTitle() + "\". Hãy liên hệ để hẹn điểm giao nhận đồ!")
                    .type("RENTAL_APPROVED")
                    .referenceId(contract.getId())
                    .isRead(false)
                    .build();
            notificationRepository.save(renterNotif);
        } catch (Exception e) {
            log.warn("Failed to notify renter on approval", e);
        }

        return mapToRes(updated);
    }

    @Override
    @Transactional
    public RentalContractRes confirmHandover(Long userId, Long contractId) {
        RentalContractEntity contract = getAuthorizedContract(userId, contractId);
        contract.setStatus("ACTIVE");
        RentalContractEntity updated = rentalContractRepository.save(contract);
        log.info("Handover confirmed for contract #{}, new status ACTIVE", contractId);

        try {
            NotificationEntity handoverNotif = NotificationEntity.builder()
                    .user(contract.getRenter())
                    .title("Bàn giao đồ thuê thành công: " + contract.getListing().getTitle())
                    .message("Hai bên đã xác nhận bàn giao đồ thành công. Hợp đồng chuyển sang trạng thái Đang trong thời hạn thuê!")
                    .type("RENTAL_HANDOVER")
                    .referenceId(contract.getId())
                    .isRead(false)
                    .build();
            notificationRepository.save(handoverNotif);
        } catch (Exception e) {
            log.warn("Failed to notify on handover", e);
        }

        return mapToRes(updated);
    }

    @Override
    @Transactional
    public RentalContractRes confirmReturnAndRefundDeposit(Long userId, Long contractId) {
        RentalContractEntity contract = getAuthorizedContract(userId, contractId);

        // Transition to RETURNED
        contract.setStatus("RETURNED");

        // Reward Karma for smooth safe return (+5 points each)
        UserEntity renter = contract.getRenter();
        UserEntity owner = contract.getOwner();
        renter.setKarmaScore(renter.getKarmaScore() + 5);
        owner.setKarmaScore(owner.getKarmaScore() + 5);
        userRepository.save(renter);
        userRepository.save(owner);

        // Đồ cho thuê (RENT) là tài sản của chủ sở hữu, khi trả xong tự động đưa về ACTIVE để tiếp tục cho thuê lượt kế tiếp
        ListingEntity listing = contract.getListing();
        if (listing != null && !"DELETED".equalsIgnoreCase(listing.getStatus())) {
            listing.setStatus("ACTIVE");
            listingRepository.save(listing);
            log.info("Listing #{} reset to ACTIVE ready for next rental", listing.getId());
        }

        RentalContractEntity updated = rentalContractRepository.save(contract);
        log.info("Contract #{} completed return & deposit refunded. +5 Karma awarded to users {} and {}",
                contractId, renter.getId(), owner.getId());

        try {
            NotificationEntity renterReturnNotif = NotificationEntity.builder()
                    .user(renter)
                    .title("Hoàn tất thuê đồ & Hoàn cọc (+5 Karma): " + contract.getListing().getTitle())
                    .message("Bạn đã trả lại thiết bị và được hoàn trả 100% tiền cọc an toàn. Bạn được cộng +5 điểm Campus Karma!")
                    .type("RENTAL_RETURNED")
                    .referenceId(contract.getId())
                    .isRead(false)
                    .build();
            notificationRepository.save(renterReturnNotif);

            NotificationEntity ownerReturnNotif = NotificationEntity.builder()
                    .user(owner)
                    .title("Đã nhận lại đồ cho thuê (+5 Karma): " + contract.getListing().getTitle())
                    .message("Hợp đồng thuê món đồ \"" + contract.getListing().getTitle() + "\" đã hoàn tất. Bạn được cộng +5 điểm Campus Karma!")
                    .type("RENTAL_RETURNED")
                    .referenceId(contract.getId())
                    .isRead(false)
                    .build();
            notificationRepository.save(ownerReturnNotif);
        } catch (Exception e) {
            log.warn("Failed to notify on return", e);
        }

        return mapToRes(updated);
    }

    @Override
    @Transactional
    public RentalContractRes reportDispute(Long userId, Long contractId, RentalDisputeReq req) {
        RentalContractEntity contract = getAuthorizedContract(userId, contractId);

        contract.setStatus("DISPUTED");
        contract.setDisputeReason(req.getDisputeReason());

        RentalContractEntity updated = rentalContractRepository.save(contract);
        log.warn("Dispute reported on contract #{}: {}", contractId, req.getDisputeReason());
        return mapToRes(updated);
    }

    @Override
    @Transactional
    public RentalContractRes cancelRentalContract(Long userId, Long contractId, String reason) {
        RentalContractEntity contract = getAuthorizedContract(userId, contractId);
        String oldStatus = contract.getStatus();
        boolean isOwner = userId.equals(contract.getOwner().getId());
        String newStatus = isOwner ? "REJECTED" : "CANCELLED";
        contract.setStatus(newStatus);
        contract.setDisputeReason(reason != null ? reason : (isOwner ? "Chủ đồ từ chối cho thuê" : "Người thuê hủy yêu cầu"));

        // TỰ ĐỘNG HỒI PHỤC LẠI BÀI ĐĂNG THUÊ VỀ ACTIVE
        ListingEntity listing = contract.getListing();
        if (listing != null && !"DELETED".equalsIgnoreCase(listing.getStatus())) {
            listing.setStatus("ACTIVE");
            listingRepository.save(listing);
            log.info("Listing #{} automatically RESTORED to ACTIVE after cancelled/rejected rental contract #{}", listing.getId(), contractId);
        }

        UserEntity canceller = isOwner ? contract.getOwner() : contract.getRenter();
        UserEntity otherUser = isOwner ? contract.getRenter() : contract.getOwner();

        // Chỉ áp dụng trừ 10 điểm Karma nếu đã duyệt (APPROVED) hoặc đang trong hợp đồng (ACTIVE) mà đơn phương hủy
        if ("APPROVED".equalsIgnoreCase(oldStatus) || "ACTIVE".equalsIgnoreCase(oldStatus)) {
            karmaService.adjustKarma(canceller, -10, "Hủy giao dịch thuê đồ sau khi đã duyệt: " + contract.getDisputeReason());
        }

        try {
            NotificationEntity cancelNotif = NotificationEntity.builder()
                    .user(otherUser)
                    .title(isOwner ? "Yêu cầu thuê đồ đã bị từ chối" : "Hợp đồng thuê đồ đã bị hủy")
                    .message((isOwner ? "Chủ đồ " : "Người thuê ") + canceller.getFullName() + 
                            (isOwner ? " đã từ chối yêu cầu thuê món đồ \"" : " đã hủy yêu cầu thuê món đồ \"") + 
                            (listing != null ? listing.getTitle() : "món đồ") + "\". Lý do: " + 
                            contract.getDisputeReason() + ". Bài đăng đã được tự động mở lại trạng thái hoạt động.")
                    .type(isOwner ? "RENTAL_REJECTED" : "RENTAL_CANCELLED")
                    .referenceId(contract.getId())
                    .isRead(false)
                    .build();
            notificationRepository.save(cancelNotif);
        } catch (Exception e) {
            log.warn("Failed to notify on rental cancellation", e);
        }

        RentalContractEntity updated = rentalContractRepository.save(contract);
        return mapToRes(updated);
    }

    @Override
    @Transactional
    public RentalContractRes rejectRentalContract(Long userId, Long contractId, String reason) {
        RentalContractEntity contract = getAuthorizedContract(userId, contractId);
        if (!userId.equals(contract.getOwner().getId())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Chỉ chủ thiết bị mới có quyền từ chối yêu cầu thuê.");
        }
        contract.setStatus("REJECTED");
        contract.setDisputeReason(reason != null ? reason : "Hôm đó tôi đã có lịch thuê / bận");

        // TỰ ĐỘNG HỒI PHỤC LẠI BÀI ĐĂNG THUÊ VỀ ACTIVE
        ListingEntity listing = contract.getListing();
        if (listing != null && !"DELETED".equalsIgnoreCase(listing.getStatus())) {
            listing.setStatus("ACTIVE");
            listingRepository.save(listing);
            log.info("Listing #{} automatically RESTORED to ACTIVE after rejected rental contract #{}", listing.getId(), contractId);
        }

        // Thông báo cho người đi thuê
        try {
            NotificationEntity notif = NotificationEntity.builder()
                    .user(contract.getRenter())
                    .title("Yêu cầu thuê đồ bị từ chối")
                    .message("Chủ đồ " + contract.getOwner().getFullName() + " đã từ chối yêu cầu thuê món đồ \"" + 
                            (listing != null ? listing.getTitle() : "Thiết bị") + "\". Lý do: " + contract.getDisputeReason())
                    .type("RENTAL_REJECTED")
                    .referenceId(contract.getId())
                    .isRead(false)
                    .build();
            notificationRepository.save(notif);
        } catch (Exception e) {
            log.warn("Failed to notify on rental rejection", e);
        }

        RentalContractEntity updated = rentalContractRepository.save(contract);
        return mapToRes(updated);
    }

    private RentalContractEntity getAuthorizedContract(Long userId, Long contractId) {
        RentalContractEntity contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        if (!contract.getRenter().getId().equals(userId) && !contract.getOwner().getId().equals(userId)) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
        return contract;
    }

    private RentalContractRes mapToRes(RentalContractEntity entity) {
        List<String> images = parseProofImages(entity.getProofImages());

        return RentalContractRes.builder()
                .id(entity.getId())
                .listingId(entity.getListing().getId())
                .listingTitle(entity.getListing().getTitle())
                .renterId(entity.getRenter().getId())
                .renterName(entity.getRenter().getFullName())
                .renterKarma(entity.getRenter().getKarmaScore())
                .ownerId(entity.getOwner().getId())
                .ownerName(entity.getOwner().getFullName())
                .ownerKarma(entity.getOwner().getKarmaScore())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .totalRentAmount(entity.getTotalRentAmount())
                .depositAmount(entity.getDepositAmount())
                .proofImages(images)
                .status(entity.getStatus())
                .disputeReason(entity.getDisputeReason())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private List<String> parseProofImages(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            List<String> single = new ArrayList<>();
            single.add(json);
            return single;
        }
    }
}
