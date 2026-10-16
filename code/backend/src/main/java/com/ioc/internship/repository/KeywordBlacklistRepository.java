package com.ioc.internship.repository;

import com.ioc.internship.entity.KeywordBlacklistEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KeywordBlacklistRepository extends JpaRepository<KeywordBlacklistEntity, Long> {
    Optional<KeywordBlacklistEntity> findByKeywordIgnoreCase(String keyword);
    boolean existsByKeywordIgnoreCase(String keyword);
}
