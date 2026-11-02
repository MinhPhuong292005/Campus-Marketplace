package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.NotificationRes;
import com.ioc.internship.entity.NotificationEntity;
import com.ioc.internship.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/student/notifications")
@RequiredArgsConstructor
public class StudentNotificationController extends BaseController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationRes>>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getUserId() : 1L;
        List<NotificationEntity> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<NotificationRes> resList = notifs.stream()
                .map(n -> NotificationRes.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .type(n.getType())
                        .referenceId(n.getReferenceId())
                        .reason(n.getReason())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return success(resList);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (principal == null || n.getUser().getId().equals(principal.getUserId())) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
        return success(null, "Đã đánh dấu đã đọc");
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getUserId() : 1L;
        List<NotificationEntity> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (NotificationEntity n : notifs) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(notifs);
        return success(null, "Đã đánh dấu tất cả đã đọc");
    }
}
