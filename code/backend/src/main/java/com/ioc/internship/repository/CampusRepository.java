package com.ioc.internship.repository;

import com.ioc.internship.entity.CampusEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampusRepository extends JpaRepository<CampusEntity, Long> {
    List<CampusEntity> findByUniversityId(Long universityId);
}
