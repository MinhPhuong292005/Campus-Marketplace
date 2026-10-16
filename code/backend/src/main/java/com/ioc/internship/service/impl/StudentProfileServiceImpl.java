package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.dto.request.UserProfileReq;
import com.ioc.internship.dto.response.PublicProfileRes;
import com.ioc.internship.dto.response.UserProfileRes;
import com.ioc.internship.entity.CampusEntity;
import com.ioc.internship.entity.UniversityEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.CampusRepository;
import com.ioc.internship.repository.UniversityRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.StudentProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentProfileServiceImpl implements StudentProfileService {

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final CampusRepository campusRepository;

    @Override
    @Transactional(readOnly = true)
    public UserProfileRes getMyProfile(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));
        return mapToUserProfileRes(user);
    }

    @Override
    @Transactional
    public UserProfileRes updateMyProfile(Long userId, UserProfileReq req) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        user.setFullName(req.getFullName().trim());
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
        if (req.getDormitory() != null) user.setDormitory(req.getDormitory());
        if (req.getStudentCode() != null) user.setStudentCode(req.getStudentCode());
        if (req.getMajor() != null) user.setMajor(req.getMajor());
        if (req.getAcademicYear() != null) user.setAcademicYear(req.getAcademicYear());
        if (req.getBio() != null) user.setBio(req.getBio());

        if (req.getUniversityId() != null) {
            UniversityEntity uni = universityRepository.findById(req.getUniversityId()).orElse(null);
            user.setUniversity(uni);
        }

        if (req.getCampusId() != null) {
            CampusEntity cam = campusRepository.findById(req.getCampusId()).orElse(null);
            user.setCampus(cam);
        }

        UserEntity saved = userRepository.save(user);
        return mapToUserProfileRes(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PublicProfileRes getPublicProfile(Long targetUserId) {
        UserEntity user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        // ND 13/2023/ND-CP Compliance: absolutely NO email, NO phone, NO studentCode exposed
        return PublicProfileRes.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .universityName(user.getUniversity() != null ? user.getUniversity().getName() : null)
                .campusName(user.getCampus() != null ? user.getCampus().getName() : null)
                .dormitory(user.getDormitory())
                .major(user.getMajor())
                .academicYear(user.getAcademicYear())
                .bio(user.getBio())
                .studentCardVerified(Boolean.TRUE.equals(user.getStudentCardVerified()))
                .karmaScore(user.getKarmaScore())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserProfileRes mapToUserProfileRes(UserEntity user) {
        return UserProfileRes.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .universityId(user.getUniversity() != null ? user.getUniversity().getId() : null)
                .universityName(user.getUniversity() != null ? user.getUniversity().getName() : null)
                .campusId(user.getCampus() != null ? user.getCampus().getId() : null)
                .campusName(user.getCampus() != null ? user.getCampus().getName() : null)
                .dormitory(user.getDormitory())
                .studentCode(user.getStudentCode())
                .major(user.getMajor())
                .academicYear(user.getAcademicYear())
                .bio(user.getBio())
                .studentCardVerified(Boolean.TRUE.equals(user.getStudentCardVerified()))
                .karmaScore(user.getKarmaScore())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
