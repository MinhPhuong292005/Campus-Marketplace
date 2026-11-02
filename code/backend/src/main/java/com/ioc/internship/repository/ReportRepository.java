package com.ioc.internship.repository;

import com.ioc.internship.entity.ReportEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<ReportEntity, Long> {

    Page<ReportEntity> findByStatus(String status, Pageable pageable);

    Page<ReportEntity> findBySeverity(String severity, Pageable pageable);

    List<ReportEntity> findByReporterId(Long reporterId);

    List<ReportEntity> findByReportedUserId(Long reportedUserId);

    long countByReportedUserId(Long reportedUserId);

    long countByStatus(String status);

    long countByCreatedAtAfter(java.time.LocalDateTime dateTime);

    @org.springframework.data.jpa.repository.Query("SELECT r.reportedUser.id, r.reportedUser.fullName, r.reportedUser.email, COUNT(r) " +
           "FROM ReportEntity r " +
           "WHERE r.reportedUser IS NOT NULL " +
           "AND r.reportedUser.status = 'ACTIVE' " +
           "AND (r.status = 'PENDING' OR r.status IS NULL) " +
           "AND r.createdAt >= :since " +
           "GROUP BY r.reportedUser.id, r.reportedUser.fullName, r.reportedUser.email " +
           "ORDER BY COUNT(r) DESC")
    List<Object[]> findFrequentlyReportedUsers(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
}
