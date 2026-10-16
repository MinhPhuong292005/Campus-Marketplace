package com.ioc.internship.repository;

import com.ioc.internship.entity.ListingImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingImageRepository extends JpaRepository<ListingImageEntity, Long> {
    List<ListingImageEntity> findByListingIdOrderBySortOrderAsc(Long listingId);
}
