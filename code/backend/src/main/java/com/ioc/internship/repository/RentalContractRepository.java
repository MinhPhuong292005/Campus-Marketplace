package com.ioc.internship.repository;

import com.ioc.internship.entity.RentalContractEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentalContractRepository extends JpaRepository<RentalContractEntity, Long> {

    @Query("SELECT r FROM RentalContractEntity r WHERE r.renter.id = :userId OR r.owner.id = :userId ORDER BY r.createdAt DESC")
    Page<RentalContractEntity> findAllByUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT r FROM RentalContractEntity r WHERE (r.renter.id = :userId OR r.owner.id = :userId) AND r.status = :status ORDER BY r.createdAt DESC")
    Page<RentalContractEntity> findByUserAndStatus(@Param("userId") Long userId, @Param("status") String status, Pageable pageable);

    List<RentalContractEntity> findByListingId(Long listingId);

    long countByStatus(String status);

    @Query("SELECT COUNT(r) > 0 FROM RentalContractEntity r WHERE (r.renter.id = :u1 AND r.owner.id = :u2) OR (r.renter.id = :u2 AND r.owner.id = :u1)")
    boolean existsContractBetweenUsers(@Param("u1") Long u1, @Param("u2") Long u2);
}
