package com.ioc.internship.service;

import com.ioc.internship.dto.request.GiveawayAppointmentReq;
import com.ioc.internship.dto.request.GiveawayClaimReq;
import com.ioc.internship.dto.response.GiveawayClaimRes;

import java.util.List;

public interface GiveawayService {

    GiveawayClaimRes createClaim(Long requesterId, Long listingId, GiveawayClaimReq req);

    List<GiveawayClaimRes> getClaimsByListing(Long userId, Long listingId);

    List<GiveawayClaimRes> getClaimsByRequester(Long requesterId);

    GiveawayClaimRes acceptClaim(Long ownerId, Long listingId, Long claimId);

    GiveawayClaimRes updateAppointment(Long userId, Long claimId, GiveawayAppointmentReq req);

    GiveawayClaimRes confirmHandover(Long userId, Long claimId);

    GiveawayClaimRes cancelTransaction(Long userId, Long claimId, String reason);
}

