package com.ioc.internship.repository;

import com.ioc.internship.entity.GiveawayClaimEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GiveawayClaimRepository extends JpaRepository<GiveawayClaimEntity, Long> {

    List<GiveawayClaimEntity> findByListingIdOrderByCreatedAtDesc(Long listingId);

    List<GiveawayClaimEntity> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    boolean existsByListingIdAndRequesterId(Long listingId, Long requesterId);

    Optional<GiveawayClaimEntity> findByListingIdAndStatus(Long listingId, String status);
}

