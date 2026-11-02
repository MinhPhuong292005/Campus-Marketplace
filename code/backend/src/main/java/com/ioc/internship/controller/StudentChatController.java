package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.ChatMessageReq;
import com.ioc.internship.dto.request.CreateChatRoomReq;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.ChatMessageRes;
import com.ioc.internship.dto.response.ChatRoomRes;
import com.ioc.internship.dto.response.UserDetailRes;
import com.ioc.internship.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class StudentChatController extends BaseController {

    private final ChatService chatService;

    @PostMapping("/student/chat/rooms")
    public ResponseEntity<ApiResponse<ChatRoomRes>> createOrGetRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateChatRoomReq req) {
        ChatRoomRes res = chatService.getOrCreateRoom(principal.getUserId(), req);
        return success(res, "Khởi tạo cuộc hội thoại thành công");
    }

    @GetMapping("/student/chat/rooms")
    public ResponseEntity<ApiResponse<List<ChatRoomRes>>> getMyRooms(
            @AuthenticationPrincipal UserPrincipal principal) {
        return success(chatService.getUserRooms(principal.getUserId()));
    }

    @GetMapping("/student/chat/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageRes>>> getRoomMessages(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long roomId) {
        return success(chatService.getRoomMessages(principal.getUserId(), roomId));
    }

    @PostMapping("/student/chat/messages")
    public ResponseEntity<ApiResponse<ChatMessageRes>> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChatMessageReq req) {
        ChatMessageRes res = chatService.sendMessage(principal.getUserId(), req);
        return created(res, "Gửi tin nhắn thành công");
    }

    @PatchMapping("/student/chat/rooms/{roomId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long roomId) {
        chatService.markRoomAsRead(principal.getUserId(), roomId);
        return success(null, "Đã đánh dấu đã đọc");
    }

    @GetMapping("/student/chat/contacts")
    public ResponseEntity<ApiResponse<List<UserDetailRes>>> getContacts(
            @AuthenticationPrincipal UserPrincipal principal) {
        return success(chatService.getAvailableContacts(principal.getUserId()));
    }
}
