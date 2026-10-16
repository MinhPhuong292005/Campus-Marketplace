package com.ioc.internship.repository;

import com.ioc.internship.entity.SwapProposalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SwapProposalRepository extends JpaRepository<SwapProposalEntity, Long> {

    @Query("SELECT s FROM SwapProposalEntity s " +
           "WHERE s.initiatorListing.user.id = :userId OR s.targetListing.user.id = :userId " +
           "ORDER BY s.createdAt DESC")
    List<SwapProposalEntity> findAllUserProposals(@Param("userId") Long userId);

    @Query("SELECT s FROM SwapProposalEntity s " +
           "WHERE s.initiatorListing.user.id = :userId " +
           "ORDER BY s.createdAt DESC")
    List<SwapProposalEntity> findSentProposals(@Param("userId") Long userId);

    @Query("SELECT s FROM SwapProposalEntity s " +
           "WHERE s.targetListing.user.id = :userId " +
           "ORDER BY s.createdAt DESC")
    List<SwapProposalEntity> findReceivedProposals(@Param("userId") Long userId);
}
