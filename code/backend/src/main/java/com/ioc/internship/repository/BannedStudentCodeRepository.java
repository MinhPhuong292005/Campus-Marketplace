package com.ioc.internship.repository;

import com.ioc.internship.entity.BannedStudentCodeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BannedStudentCodeRepository extends JpaRepository<BannedStudentCodeEntity, Long> {

    boolean existsByStudentCode(String studentCode);

    Optional<BannedStudentCodeEntity> findByStudentCode(String studentCode);

    boolean existsByEmailIgnoreCase(String email);
}
