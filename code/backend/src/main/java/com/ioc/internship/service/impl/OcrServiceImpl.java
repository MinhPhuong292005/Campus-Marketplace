package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.dto.request.StudentCardVerifyReq;
import com.ioc.internship.dto.response.StudentCardVerifyRes;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.OcrService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrServiceImpl implements OcrService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public StudentCardVerifyRes verifyStudentCard(Long userId, StudentCardVerifyReq req) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        if (req.getFrontImageUrl() == null || req.getBackImageUrl() == null) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
        }

        // Simulate high precision OCR Vision processing (< 3s response time)
        // Extract fields from card
        String detectedName = user.getFullName() != null && !user.getFullName().isBlank()
                ? user.getFullName()
                : "NGUYỄN VĂN AN";
        String detectedCode = user.getStudentCode() != null && !user.getStudentCode().isBlank()
                ? user.getStudentCode()
                : "2020" + (1000 + (user.getId() != null ? user.getId() : 1));
        String detectedUniversity = user.getUniversity() != null
                ? user.getUniversity().getName()
                : "ĐẠI HỌC BÁCH KHOA HÀ NỘI";

        // Simulated confidence score >= 90%
        double confidence = 96.8;
        boolean autoApproved = confidence >= 90.0;
        int karmaAward = 0;

        if (autoApproved) {
            if (!Boolean.TRUE.equals(user.getStudentCardVerified())) {
                user.setStudentCardVerified(true);
                karmaAward = 15;
                user.setKarmaScore(user.getKarmaScore() + karmaAward);
                userRepository.save(user);
                log.info("OCR Card auto-approved for user #{}. +15 Karma awarded. Total Karma: {}",
                        userId, user.getKarmaScore());
            }
        }

        return StudentCardVerifyRes.builder()
                .fullName(detectedName)
                .studentCode(detectedCode)
                .universityName(detectedUniversity)
                .confidenceScore(confidence)
                .matched(true)
                .autoApproved(autoApproved)
                .karmaAwarded(karmaAward)
                .message(autoApproved
                        ? "Xác thực thẻ sinh viên thành công! Bạn được cộng +15 điểm Karma tín nhiệm."
                        : "Ảnh chụp chưa đủ sắc nét. Hồ sơ đang được chuyển sang bộ phận kiểm duyệt.")
                .build();
    }
}
