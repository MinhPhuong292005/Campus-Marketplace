package com.ioc.internship.service;

import com.ioc.internship.dto.request.ChatMessageReq;
import com.ioc.internship.dto.request.CreateChatRoomReq;
import com.ioc.internship.dto.response.ChatMessageRes;
import com.ioc.internship.dto.response.ChatRoomRes;

import java.util.List;

public interface ChatService {
    ChatRoomRes getOrCreateRoom(Long currentUserId, CreateChatRoomReq req);
    List<ChatRoomRes> getUserRooms(Long currentUserId);
    List<ChatMessageRes> getRoomMessages(Long currentUserId, Long roomId);
    ChatMessageRes sendMessage(Long currentUserId, ChatMessageReq req);
    void markRoomAsRead(Long currentUserId, Long roomId);
}
