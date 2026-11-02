package com.ioc.internship.service.impl;

import com.ioc.internship.entity.BannedStudentCodeEntity;
import com.ioc.internship.entity.NotificationEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.BannedStudentCodeRepository;
import com.ioc.internship.repository.NotificationRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.KarmaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class KarmaServiceImpl implements KarmaService {

    private final UserRepository userRepository;
    private final BannedStudentCodeRepository bannedStudentCodeRepository;
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public UserEntity adjustKarma(UserEntity user, int delta, String reason) {
        if (user == null) return null;

        int currentScore = user.getKarmaScore() != null ? user.getKarmaScore() : 20;
        int newScore = Math.max(0, currentScore + delta);
        user.setKarmaScore(newScore);

        log.info("Adjusting Karma for user #{} ({}): {} -> {} (delta={}, reason={})",
                user.getId(), user.getEmail(), currentScore, newScore, delta, reason);

        // Check if Karma dropped to 0 -> Auto Permanent BAN
        if (newScore <= 0) {
            user.setStatus("BANNED");
            String banReason = "Điểm tín nhiệm Campus Karma giảm về 0 do vi phạm quy tắc / hủy giao dịch / bị tố cáo. Lý do gần nhất: " + reason;
            user.setBlockReason(banReason);

            String sCode = user.getStudentCode();
            if ((sCode == null || sCode.trim().isEmpty()) && user.getEmail() != null && user.getEmail().contains("@")) {
                sCode = user.getEmail().split("@")[0].trim();
            }

            if (sCode != null && !sCode.isBlank()) {
                String finalCode = sCode.trim();
                BannedStudentCodeEntity bannedEntity = bannedStudentCodeRepository.findByStudentCode(finalCode)
                        .orElseGet(() -> BannedStudentCodeEntity.builder().studentCode(finalCode).build());
                bannedEntity.setEmail(user.getEmail());
                bannedEntity.setFullName(user.getFullName());
                bannedEntity.setBanReason(banReason);
                bannedEntity.setBannedBy("HỆ THỐNG TỰ ĐỘNG (KARMA = 0)");
                bannedEntity.setBannedAt(LocalDateTime.now());
                bannedStudentCodeRepository.save(bannedEntity);
                log.warn("Student code [{}] has been added to permanent BLACKLIST due to 0 Karma!", finalCode);
            }

            NotificationEntity banNotif = NotificationEntity.builder()
                    .user(user)
                    .title("Tài khoản đã bị CẤM VĨNH VIỄN do điểm Karma về 0")
                    .message("Điểm tín nhiệm Campus Karma của bạn đã giảm về 0. Tài khoản và Mã sinh viên của bạn đã bị đưa vào danh sách cấm vĩnh viễn của Trường Đại học Phenikaa. Lý do: " + reason)
                    .type("WARNING")
                    .referenceId(user.getId())
                    .reason(banReason)
                    .isRead(false)
                    .build();
            notificationRepository.save(banNotif);
        } else {
            // Send regular Karma notification
            String notifTitle = delta > 0 ? "🎉 Bạn được cộng +" + delta + " điểm Campus Karma" : "⚠️ Bạn bị trừ " + Math.abs(delta) + " điểm Campus Karma";
            String notifMsg = delta > 0
                    ? "Chúc mừng! Bạn vừa được cộng +" + delta + " điểm tín nhiệm Campus Karma (" + reason + "). Điểm hiện tại: " + newScore + " Karma."
                    : "Cảnh báo! Bạn vừa bị trừ " + Math.abs(delta) + " điểm tín nhiệm Campus Karma (" + reason + "). Điểm hiện tại: " + newScore + " Karma. Nếu điểm về 0 tài khoản sẽ bị cấm vĩnh viễn.";

            NotificationEntity karmaNotif = NotificationEntity.builder()
                    .user(user)
                    .title(notifTitle)
                    .message(notifMsg)
                    .type(delta > 0 ? "SYSTEM" : "WARNING")
                    .referenceId(user.getId())
                    .reason(reason)
                    .isRead(false)
                    .build();
            notificationRepository.save(karmaNotif);
        }

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public void applyTemporaryBan(UserEntity user, int days, String reason) {
        if (user == null) return;

        user.setStatus("SUSPENDED");
        user.setSuspendedUntil(LocalDateTime.now().plusDays(days));
        String blockMsg = "Tài khoản bị tạm khóa " + days + " ngày do vi phạm quy tắc / bị nhiều người tố cáo. Lý do: " + reason;
        user.setBlockReason(blockMsg);

        // Adjust -10 Karma on temporary ban
        adjustKarma(user, -10, "Bị tạm khóa do vi phạm / bị tố cáo");

        NotificationEntity suspendNotif = NotificationEntity.builder()
                .user(user)
                .title("Tài khoản của bạn bị tạm khóa " + days + " ngày")
                .message("Ban Quản Trị đã tạm khóa tài khoản của bạn đến ngày " + user.getSuspendedUntil().toLocalDate() + ". Lý do: " + reason)
                .type("WARNING")
                .referenceId(user.getId())
                .reason(reason)
                .isRead(false)
                .build();
        notificationRepository.save(suspendNotif);
        userRepository.save(user);
    }
}

