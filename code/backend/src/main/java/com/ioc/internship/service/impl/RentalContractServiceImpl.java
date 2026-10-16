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
import com.ioc.internship.entity.RentalContractEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.ListingRepository;
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
    private final ObjectMapper objectMapper;

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

        RentalContractEntity updated = rentalContractRepository.save(contract);
        log.info("Contract #{} completed return & deposit refunded. +5 Karma awarded to users {} and {}",
                contractId, renter.getId(), owner.getId());
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
