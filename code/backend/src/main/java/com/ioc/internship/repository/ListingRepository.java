package com.ioc.internship.repository;

import com.ioc.internship.entity.ListingEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface ListingRepository extends JpaRepository<ListingEntity, Long> {

    Page<ListingEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    java.util.List<ListingEntity> findByUserId(Long userId);

    Page<ListingEntity> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status, Pageable pageable);

    Page<ListingEntity> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    @Query("SELECT l FROM ListingEntity l " +
           "LEFT JOIN FETCH l.images " +
           "LEFT JOIN FETCH l.user u " +
           "LEFT JOIN FETCH u.university " +
           "LEFT JOIN FETCH u.campus " +
           "LEFT JOIN FETCH l.category " +
           "WHERE l.id = :id")
    Optional<ListingEntity> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT l FROM ListingEntity l " +
           "WHERE (:status IS NULL OR l.status = :status) " +
           "  AND (:keyword IS NULL OR :keyword = '' OR LOWER(l.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%')) OR LOWER(l.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%'))) " +
           "  AND (:categoryId IS NULL OR l.category.id = :categoryId) " +
           "  AND (:transactionType IS NULL OR l.transactionType = :transactionType) " +
           "  AND (:conditionStatus IS NULL OR l.conditionStatus = :conditionStatus) " +
           "  AND (:universityId IS NULL OR l.user.university.id = :universityId) " +
           "  AND (:minPrice IS NULL OR l.price >= :minPrice) " +
           "  AND (:maxPrice IS NULL OR l.price <= :maxPrice) " +
           "ORDER BY l.createdAt DESC")
    Page<ListingEntity> searchListings(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("transactionType") String transactionType,
            @Param("conditionStatus") String conditionStatus,
            @Param("universityId") Long universityId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("status") String status,
            Pageable pageable
    );

    long countByStatus(String status);

    long countByCreatedAtAfter(java.time.LocalDateTime dateTime);

    @Query("SELECT c.name, COUNT(l) FROM ListingEntity l JOIN l.category c GROUP BY c.name")
    java.util.List<Object[]> countListingsGroupedByCategory();

    @Query("SELECT l FROM ListingEntity l " +
           "WHERE (:status IS NULL OR l.status = :status) " +
           "  AND (:keyword IS NULL OR :keyword = '' OR LOWER(l.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%')) OR LOWER(l.user.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%'))) " +
           "  AND (:categoryId IS NULL OR l.category.id = :categoryId) " +
           "  AND (:universityId IS NULL OR l.user.university.id = :universityId) " +
           "  AND (:isRiskFlagged IS NULL OR l.isRiskFlagged = :isRiskFlagged) " +
           "ORDER BY l.createdAt DESC")
    Page<ListingEntity> adminSearchListings(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("categoryId") Long categoryId,
            @Param("universityId") Long universityId,
            @Param("isRiskFlagged") Boolean isRiskFlagged,
            Pageable pageable
    );
}
