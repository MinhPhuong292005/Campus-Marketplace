package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.common.utils.JwtUtils;
import com.ioc.internship.common.utils.PasswordEncoderUtils;
import com.ioc.internship.dto.request.LoginReq;
import com.ioc.internship.dto.request.RegisterReq;
import com.ioc.internship.dto.request.SendOtpReq;
import com.ioc.internship.dto.request.VerifyOtpReq;
import com.ioc.internship.dto.response.AuthRes;
import com.ioc.internship.dto.response.UserDetailRes;
import com.ioc.internship.entity.CampusEntity;
import com.ioc.internship.entity.UniversityEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.BannedStudentCodeRepository;
import com.ioc.internship.repository.CampusRepository;
import com.ioc.internship.repository.UniversityRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.AuthService;
import com.ioc.internship.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final CampusRepository campusRepository;
    private final PasswordEncoderUtils passwordEncoderUtils;
    private final JwtUtils jwtUtils;
    private final OtpService otpService;
    private final BannedStudentCodeRepository bannedStudentCodeRepository;

    private String extractStudentCode(String email, String providedStudentCode) {
        if (providedStudentCode != null && !providedStudentCode.trim().isEmpty()) {
            return providedStudentCode.trim();
        }
        if (email != null && email.contains("@")) {
            return email.substring(0, email.indexOf("@")).trim();
        }
        return null;
    }

    private void checkBannedStudent(String email, String studentCode) {
        String code = extractStudentCode(email, studentCode);
        if (code != null && !code.isBlank()) {
            if (bannedStudentCodeRepository.existsByStudentCode(code)) {
                throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Mã sinh viên [" + code + "] nằm trong danh sách CẤM VĨNH VIỄN do vi phạm nghiêm trọng quy chế Phenikaa. Hệ thống không cho phép tạo tài khoản mới!");
            }
            if (userRepository.existsByStudentCodeAndStatus(code, "BANNED")) {
                throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Mã sinh viên [" + code + "] đã bị CẤM VĨNH VIỄN khỏi hệ thống. Không được phép tạo tài khoản mới!");
            }
        }
        if (email != null && bannedStudentCodeRepository.existsByEmailIgnoreCase(email.trim())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Email sinh viên này nằm trong danh sách CẤM VĨNH VIỄN của hệ thống. Không được phép đăng ký lại!");
        }
    }

    private boolean isPhenikaaStudentEmail(String email) {
        if (email == null || !email.contains("@")) {
            return false;
        }
        String domain = email.substring(email.lastIndexOf("@") + 1).toLowerCase().trim();
        return domain.equals("st.phenikaa-uni.edu.vn")
                || domain.equals("phenikaa-uni.edu.vn")
                || domain.equals("st.phenikaa.edu.vn")
                || domain.equals("phenikaa.edu.vn");
    }

    @Override
    public void sendOtp(SendOtpReq req) {
        String email = req.getEmail().trim().toLowerCase();
        if (!isPhenikaaStudentEmail(email)) {
            throw new CustomBusinessException(ErrorCodes.INVALID_EDU_EMAIL, HttpStatus.BAD_REQUEST,
                    "Ứng dụng chỉ áp dụng cho sinh viên trường Đại học Phenikaa (email @st.phenikaa-uni.edu.vn). Không tiếp nhận sinh viên trường khác.");
        }

        // Kiểm tra danh sách cấm vĩnh viễn (Blacklist MSSV & Email)
        checkBannedStudent(email, null);

        // Kiểm tra mã sinh viên đã có tài khoản chưa
        String studentCode = extractStudentCode(email, null);
        if (studentCode != null && !studentCode.isBlank() && userRepository.existsByStudentCode(studentCode)) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.CONFLICT,
                    "Mã sinh viên [" + studentCode + "] đã được đăng ký tài khoản trên hệ thống. Vui lòng đăng nhập bằng tài khoản này.");
        }

        otpService.sendOtp(email);
    }

    @Override
    public boolean verifyOtp(VerifyOtpReq req) {
        String email = req.getEmail().trim().toLowerCase();
        if (!isPhenikaaStudentEmail(email)) {
            throw new CustomBusinessException(ErrorCodes.INVALID_EDU_EMAIL, HttpStatus.BAD_REQUEST,
                    "Ứng dụng chỉ áp dụng cho sinh viên trường Đại học Phenikaa (email @st.phenikaa-uni.edu.vn). Không tiếp nhận sinh viên trường khác.");
        }

        boolean verified = otpService.verifyOtp(email, req.getOtp());
        if (!verified) {
            throw new CustomBusinessException(ErrorCodes.OTP_EXPIRED_OR_INVALID, HttpStatus.BAD_REQUEST);
        }
        return true;
    }

    @Override
    @Transactional
    public AuthRes register(RegisterReq req) {
        String email = req.getEmail().trim().toLowerCase();

        // 1. Chỉ chấp nhận sinh viên trường Đại học Phenikaa
        if (!isPhenikaaStudentEmail(email)) {
            throw new CustomBusinessException(ErrorCodes.INVALID_EDU_EMAIL, HttpStatus.BAD_REQUEST,
                    "Ứng dụng chỉ áp dụng cho sinh viên trường Đại học Phenikaa (email @st.phenikaa-uni.edu.vn). Không tiếp nhận sinh viên trường khác.");
        }

        // 2. Kiểm tra danh sách cấm vĩnh viễn (Blacklist MSSV & Email)
        checkBannedStudent(email, req.getStudentCode());

        // Kiểm tra mã sinh viên đã tồn tại chưa
        String finalStudentCode = extractStudentCode(email, req.getStudentCode());
        if (finalStudentCode != null && !finalStudentCode.isBlank() && userRepository.existsByStudentCode(finalStudentCode)) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.CONFLICT,
                    "Mã sinh viên [" + finalStudentCode + "] đã được đăng ký tài khoản trên hệ thống. Mỗi mã sinh viên chỉ được phép tạo 1 tài khoản duy nhất!");
        }

        // 3. Check if email exists
        if (userRepository.existsByEmail(email)) {
            throw new CustomBusinessException(ErrorCodes.EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT);
        }

        // 4. Verify OTP if provided
        if (req.getOtp() != null && !req.getOtp().isBlank()) {
            boolean verified = otpService.verifyOtp(email, req.getOtp());
            if (!verified) {
                throw new CustomBusinessException(ErrorCodes.OTP_EXPIRED_OR_INVALID, HttpStatus.BAD_REQUEST);
            }
        }

        // 5. Bắt buộc liên kết với Trường Đại học Phenikaa
        UniversityEntity university = null;
        if (req.getUniversityId() != null) {
            university = universityRepository.findById(req.getUniversityId()).orElse(null);
        }
        if (university == null || (!"PHENIKAA".equalsIgnoreCase(university.getShortName()) && !university.getName().toLowerCase().contains("phenikaa"))) {
            university = universityRepository.findAll().stream()
                    .filter(u -> "PHENIKAA".equalsIgnoreCase(u.getShortName()) || (u.getName() != null && u.getName().toLowerCase().contains("phenikaa")))
                    .findFirst()
                    .orElse(null);
        }

        CampusEntity campus = null;
        if (req.getCampusId() != null) {
            campus = campusRepository.findById(req.getCampusId()).orElse(null);
        }
        if (campus == null && university != null && university.getCampuses() != null && !university.getCampuses().isEmpty()) {
            campus = university.getCampuses().get(0);
        }

        // 6. Create user with +20 initial Campus Karma
        UserEntity user = UserEntity.builder()
                .email(email)
                .passwordHash(passwordEncoderUtils.encode(req.getPassword()))
                .fullName(req.getFullName().trim())
                .phone(req.getPhone())
                .university(university)
                .campus(campus)
                .dormitory(req.getDormitory())
                .studentCode(finalStudentCode)
                .studentCardVerified(false)
                .karmaScore(20) // Initial +20 Karma bonus
                .role("ROLE_STUDENT")
                .status("ACTIVE")
                .build();

        UserEntity savedUser = userRepository.save(user);

        // 6. Issue JWT Tokens
        String accessToken = jwtUtils.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());
        String refreshToken = jwtUtils.generateRefreshToken(savedUser.getId(), savedUser.getEmail());

        return AuthRes.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .user(mapToUserDetailRes(savedUser))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthRes login(LoginReq req) {
        String email = req.getEmail().trim().toLowerCase();

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED));

        if (!passwordEncoderUtils.matches(req.getPassword(), user.getPasswordHash())) {
            throw new CustomBusinessException(ErrorCodes.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
        }

        // Chặn sinh viên bị cấm / xóa khỏi hệ thống
        if ("BANNED".equalsIgnoreCase(user.getStatus()) || "BLOCKED".equalsIgnoreCase(user.getStatus())) {
            String reason = user.getBlockReason() != null ? " Lý do: " + user.getBlockReason() : "";
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị cấm do vi phạm quy chế sàn sinh viên Phenikaa." + reason);
        }

        String accessToken = jwtUtils.generateToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtUtils.generateRefreshToken(user.getId(), user.getEmail());

        return AuthRes.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .user(mapToUserDetailRes(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthRes refreshToken(String refreshToken) {
        if (refreshToken == null || jwtUtils.isTokenExpired(refreshToken)) {
            throw new CustomBusinessException(ErrorCodes.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
        }

        Long userId = jwtUtils.extractUserId(refreshToken);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        String newAccessToken = jwtUtils.generateToken(user.getId(), user.getEmail(), user.getRole());
        String newRefreshToken = jwtUtils.generateRefreshToken(user.getId(), user.getEmail());

        return AuthRes.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(mapToUserDetailRes(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetailRes getMe(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));
        return mapToUserDetailRes(user);
    }

    private UserDetailRes mapToUserDetailRes(UserEntity user) {
        return UserDetailRes.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl((user.getAvatarUrl() != null && !user.getAvatarUrl().isBlank()) ? user.getAvatarUrl() : "/default-avatar.png")
                .email(user.getEmail())
                .phone(user.getPhone())
                .studentCode(user.getStudentCode())
                .major(user.getMajor())
                .academicYear(user.getAcademicYear())
                .bio(user.getBio())
                .status(user.getStatus())
                .blockReason(user.getBlockReason())
                .universityId(user.getUniversity() != null ? user.getUniversity().getId() : null)
                .universityName(user.getUniversity() != null ? user.getUniversity().getName() : null)
                .campusId(user.getCampus() != null ? user.getCampus().getId() : null)
                .campusName(user.getCampus() != null ? user.getCampus().getName() : null)
                .dormitory(user.getDormitory())
                .studentCardVerified(Boolean.TRUE.equals(user.getStudentCardVerified()))
                .studentCardImageUrl(user.getStudentCardImageUrl())
                .suspendedUntil(user.getSuspendedUntil())
                .karmaScore(user.getKarmaScore())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
