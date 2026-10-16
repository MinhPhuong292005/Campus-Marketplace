package com.ioc.internship.controller;

import com.ioc.internship.dto.request.ChatMessageReq;
import com.ioc.internship.dto.response.ChatMessageRes;
import com.ioc.internship.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

    private final ChatService chatService;

    @MessageMapping("/chat.send")
    public void processMessage(
            @Payload ChatMessageReq req,
            @Header(name = "userId", defaultValue = "1") Long userId) {
        log.info("Received WebSocket chat message from user #{}: {}", userId, req.getContent());
        chatService.sendMessage(userId, req);
    }
}
