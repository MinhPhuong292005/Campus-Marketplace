package com.ioc.internship.service;

import com.ioc.internship.dto.request.ListingCreateReq;
import com.ioc.internship.dto.request.ListingStatusReq;
import com.ioc.internship.dto.request.ListingUpdateReq;
import com.ioc.internship.dto.response.ListingDetailRes;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface ListingService {
    ListingDetailRes createListing(Long userId, ListingCreateReq req);
    ListingDetailRes updateListing(Long userId, Long listingId, ListingUpdateReq req);
    void deleteListing(Long userId, Long listingId);
    ListingDetailRes updateListingStatus(Long userId, Long listingId, ListingStatusReq req);
    Page<ListingDetailRes> getMyListings(Long userId, String status, Pageable pageable);
    Page<ListingDetailRes> getAllActiveListings(Pageable pageable);
    ListingDetailRes getListingDetails(Long listingId);
    Page<ListingDetailRes> searchListings(
            String keyword,
            Long categoryId,
            String transactionType,
            String conditionStatus,
            Long universityId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable
    );
}
