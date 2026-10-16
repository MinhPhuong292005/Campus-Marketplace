package com.ioc.internship.entity;

import com.ioc.internship.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "keyword_blacklists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeywordBlacklistEntity extends BaseEntity {

    @Column(name = "keyword", nullable = false, unique = true, length = 100)
    private String keyword;

    @Column(name = "category", nullable = false, length = 50)
    @Builder.Default
    private String category = "PROHIBITED_GOODS"; // PROHIBITED_GOODS, SCAM, ACADEMIC_FRAUD, HARASSMENT

    @Column(name = "severity", nullable = false, length = 20)
    @Builder.Default
    private String severity = "HIGH"; // HIGH, MEDIUM, LOW

    @Column(name = "action", nullable = false, length = 30)
    @Builder.Default
    private String action = "AUTO_BLOCK"; // AUTO_BLOCK, FLAG_FOR_REVIEW

    @Column(name = "reason", length = 255)
    private String reason;
}
