package com.ioc.internship.service;

import com.ioc.internship.dto.request.RentalContractCreateReq;
import com.ioc.internship.dto.request.RentalDisputeReq;
import com.ioc.internship.dto.request.RentalProofImagesReq;
import com.ioc.internship.dto.response.PaginatedRes;
import com.ioc.internship.dto.response.RentalContractRes;

public interface RentalContractService {

    RentalContractRes createRentalContract(Long renterId, RentalContractCreateReq req);

    PaginatedRes<RentalContractRes> getMyRentalContracts(Long userId, String status, int page, int size);

    RentalContractRes getRentalContractById(Long userId, Long contractId);

    RentalContractRes uploadProofImages(Long userId, Long contractId, RentalProofImagesReq req);

    RentalContractRes approveRentalContract(Long userId, Long contractId);

    RentalContractRes confirmHandover(Long userId, Long contractId);

    RentalContractRes confirmReturnAndRefundDeposit(Long userId, Long contractId);

    RentalContractRes reportDispute(Long userId, Long contractId, RentalDisputeReq req);

    RentalContractRes cancelRentalContract(Long userId, Long contractId, String reason);
}
