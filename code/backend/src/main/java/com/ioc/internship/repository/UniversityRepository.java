package com.ioc.internship.repository;

import com.ioc.internship.entity.UniversityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UniversityRepository extends JpaRepository<UniversityEntity, Long> {
    Optional<UniversityEntity> findByShortName(String shortName);
}
