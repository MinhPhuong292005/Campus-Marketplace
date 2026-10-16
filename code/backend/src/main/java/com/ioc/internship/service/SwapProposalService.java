package com.ioc.internship.service;

import com.ioc.internship.dto.request.SwapProposalCreateReq;
import com.ioc.internship.dto.request.SwapProposalStatusReq;
import com.ioc.internship.dto.response.SwapProposalRes;

import java.util.List;

public interface SwapProposalService {
    SwapProposalRes createProposal(Long currentUserId, SwapProposalCreateReq req);
    List<SwapProposalRes> getMyProposals(Long currentUserId, String type); // all, sent, received
    SwapProposalRes updateProposalStatus(Long currentUserId, Long proposalId, SwapProposalStatusReq req);
}
