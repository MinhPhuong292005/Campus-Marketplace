package com.ioc.internship.repository;

import com.ioc.internship.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByStudentCode(String studentCode);
    boolean existsByStudentCodeAndStatus(String studentCode, String status);

    long countByCreatedAtAfter(java.time.LocalDateTime dateTime);

    long countByStudentCardVerifiedTrue();

    long countByStatusIn(java.util.Collection<String> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(u.university.name, 'Chưa xác định'), COUNT(u) FROM UserEntity u GROUP BY u.university.name")
    java.util.List<Object[]> countUsersGroupedByUniversity();

    @org.springframework.data.jpa.repository.Query("SELECT u FROM UserEntity u " +
           "WHERE (:keyword IS NULL OR :keyword = '' " +
           "      OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%')) " +
           "      OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%')) " +
           "      OR (u.studentCode IS NOT NULL AND LOWER(u.studentCode) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%'))) " +
           "      OR (u.phone IS NOT NULL AND u.phone LIKE CONCAT('%', CAST(:keyword AS String), '%'))) " +
           "  AND (:universityId IS NULL OR u.university.id = :universityId) " +
           "  AND (:status IS NULL OR u.status = :status OR (:status = 'BLOCKED_ONLY' AND u.status IN ('BANNED', 'SUSPENDED', 'BLOCKED'))) " +
           "  AND (:verified IS NULL OR u.studentCardVerified = :verified) " +
           "ORDER BY u.createdAt DESC")
    org.springframework.data.domain.Page<UserEntity> adminSearchUsers(
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("universityId") Long universityId,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("verified") Boolean verified,
            org.springframework.data.domain.Pageable pageable
    );
}
