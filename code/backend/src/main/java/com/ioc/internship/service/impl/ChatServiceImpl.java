package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.dto.request.ChatMessageReq;
import com.ioc.internship.dto.request.CreateChatRoomReq;
import com.ioc.internship.dto.response.ChatMessageRes;
import com.ioc.internship.dto.response.ChatRoomRes;
import com.ioc.internship.dto.response.UserDetailRes;
import com.ioc.internship.entity.ChatRoomEntity;
import com.ioc.internship.entity.ListingEntity;
import com.ioc.internship.entity.MessageEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.ChatRoomRepository;
import com.ioc.internship.repository.ListingRepository;
import com.ioc.internship.repository.MessageRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public ChatRoomRes getOrCreateRoom(Long currentUserId, CreateChatRoomReq req) {
        if (currentUserId.equals(req.getPeerUserId())) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
        }

        UserEntity currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        if ("BANNED".equalsIgnoreCase(currentUser.getStatus()) || "BLOCKED".equalsIgnoreCase(currentUser.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị cấm, không thể mở cuộc trò chuyện.");
        }

        UserEntity peerUser = userRepository.findById(req.getPeerUserId())
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        // Sinh viên không thể nhắn tin trực tiếp cho Quản trị viên hệ thống
        if (peerUser.getId().equals(1L) ||
                (peerUser.getRole() != null && peerUser.getRole().toUpperCase().contains("ADMIN")) ||
                "minhphuong2925@gmail.com".equalsIgnoreCase(peerUser.getEmail())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Không thể nhắn tin trực tiếp cho Quản trị viên hệ thống.");
        }

        ListingEntity listing = null;
        if (req.getListingId() != null) {
            listing = listingRepository.findById(req.getListingId()).orElse(null);
        }

        // Each pair of users shares exactly ONE single conversation room
        List<ChatRoomEntity> between = chatRoomRepository.findBetweenUsers(currentUserId, req.getPeerUserId());
        if (!between.isEmpty()) {
            ChatRoomEntity existing = between.get(0);
            if (listing != null && existing.getListing() == null) {
                existing.setListing(listing);
                chatRoomRepository.save(existing);
            }
            return mapToRoomRes(existing, currentUserId);
        }

        ChatRoomEntity room = ChatRoomEntity.builder()
                .userOne(currentUser)
                .userTwo(peerUser)
                .listing(listing)
                .build();

        ChatRoomEntity saved = chatRoomRepository.save(room);
        log.info("Created new chat room #{} between user #{} and #{}", saved.getId(), currentUserId, req.getPeerUserId());

        return mapToRoomRes(saved, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomRes> getUserRooms(Long currentUserId) {
        List<ChatRoomEntity> allRooms = chatRoomRepository.findAllUserRooms(currentUserId);
        Map<Long, ChatRoomEntity> uniqueByPeer = new LinkedHashMap<>();

        for (ChatRoomEntity room : allRooms) {
            UserEntity peer = room.getUserOne().getId().equals(currentUserId) ? room.getUserTwo() : room.getUserOne();
            if (peer.getId().equals(1L)) continue;
            if (peer.getRole() != null && peer.getRole().toUpperCase().contains("ADMIN")) continue;
            if ("minhphuong2925@gmail.com".equalsIgnoreCase(peer.getEmail())) continue;

            if (!uniqueByPeer.containsKey(peer.getId())) {
                uniqueByPeer.put(peer.getId(), room);
            }
        }

        return uniqueByPeer.values().stream()
                .map(room -> mapToRoomRes(room, currentUserId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageRes> getRoomMessages(Long currentUserId, Long roomId) {
        ChatRoomEntity room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        if (!room.getUserOne().getId().equals(currentUserId) && !room.getUserTwo().getId().equals(currentUserId)) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        return messageRepository.findByChatRoomIdOrderByCreatedAtAsc(roomId).stream()
                .map(this::mapToMessageRes)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChatMessageRes sendMessage(Long currentUserId, ChatMessageReq req) {
        ChatRoomEntity room = chatRoomRepository.findById(req.getChatRoomId())
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        if (!room.getUserOne().getId().equals(currentUserId) && !room.getUserTwo().getId().equals(currentUserId)) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        UserEntity sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        if ("BANNED".equalsIgnoreCase(sender.getStatus()) || "BLOCKED".equalsIgnoreCase(sender.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị cấm, không thể gửi tin nhắn.");
        }
        if ("SUSPENDED".equalsIgnoreCase(sender.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Tài khoản của bạn đang bị tạm khóa 1 tuần. Không thể gửi tin nhắn lúc này.");
        }

        UserEntity peer = room.getUserOne().getId().equals(currentUserId) ? room.getUserTwo() : room.getUserOne();
        if ("BANNED".equalsIgnoreCase(peer.getStatus()) || "BLOCKED".equalsIgnoreCase(peer.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Tài khoản đối phương đã bị cấm, không thể gửi tin nhắn.");
        }
        if ("SUSPENDED".equalsIgnoreCase(peer.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, peer.getFullName() + " hiện đang bị tạm khóa tài khoản. Bạn chưa thể gửi tin nhắn cho người dùng này lúc này.");
        }

        MessageEntity message = MessageEntity.builder()
                .chatRoom(room)
                .sender(sender)
                .content(req.getContent())
                .messageType(req.getMessageType() != null ? req.getMessageType() : "TEXT")
                .isRead(false)
                .build();

        MessageEntity saved = messageRepository.save(message);

        // Update room's timestamp
        chatRoomRepository.save(room);

        ChatMessageRes res = mapToMessageRes(saved);

        // Broadcast to STOMP topic
        try {
            messagingTemplate.convertAndSend("/topic/chat/" + room.getId(), res);
        } catch (Exception e) {
            log.warn("Failed to broadcast WebSocket message to /topic/chat/{}: {}", room.getId(), e.getMessage());
        }

        return res;
    }

    @Override
    @Transactional
    public void markRoomAsRead(Long currentUserId, Long roomId) {
        messageRepository.markAllAsRead(roomId, currentUserId);
    }

    private ChatRoomRes mapToRoomRes(ChatRoomEntity room, Long currentUserId) {
        UserEntity peer = room.getUserOne().getId().equals(currentUserId) ? room.getUserTwo() : room.getUserOne();
        ListingEntity listing = room.getListing();

        String listingImg = (listing != null && listing.getImages() != null && !listing.getImages().isEmpty())
                ? listing.getImages().get(0).getMediaUrl() : null;

        List<MessageEntity> messages = room.getMessages();
        String lastMsg = null;
        java.time.LocalDateTime lastMsgTime = null;
        if (messages != null && !messages.isEmpty()) {
            MessageEntity latest = messages.get(messages.size() - 1);
            lastMsg = latest.getContent();
            lastMsgTime = latest.getCreatedAt();
        }

        long unread = messageRepository.countUnreadMessages(room.getId(), currentUserId);

        return ChatRoomRes.builder()
                .id(room.getId())
                .listingId(listing != null ? listing.getId() : null)
                .sellerId(listing != null && listing.getUser() != null ? listing.getUser().getId() : null)
                .listingTitle(listing != null ? listing.getTitle() : null)
                .listingPrice(listing != null ? listing.getPrice() : null)
                .listingImage(listingImg)
                .listingType(listing != null ? listing.getTransactionType() : null)
                .peerUserId(peer.getId())
                .peerName(peer.getFullName())
                .peerAvatar(peer.getAvatarUrl())
                .peerKarma(peer.getKarmaScore())
                .peerCampus(peer.getCampus() != null ? peer.getCampus().getName() : peer.getDormitory())
                .peerStatus(peer.getStatus())
                .peerBlockReason(peer.getBlockReason())
                .lastMessage(lastMsg)
                .lastMessageTime(lastMsgTime)
                .unreadCount(unread)
                .createdAt(room.getCreatedAt())
                .build();
    }

    private ChatMessageRes mapToMessageRes(MessageEntity m) {
        return ChatMessageRes.builder()
                .id(m.getId())
                .chatRoomId(m.getChatRoom().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getFullName())
                .senderAvatar(m.getSender().getAvatarUrl())
                .content(m.getContent())
                .messageType(m.getMessageType())
                .isRead(m.getIsRead())
                .createdAt(m.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDetailRes> getAvailableContacts(Long currentUserId) {
        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .filter(u -> !"BANNED".equalsIgnoreCase(u.getStatus()))
                .filter(u -> !u.getId().equals(1L))
                .filter(u -> u.getRole() == null || !u.getRole().toUpperCase().contains("ADMIN"))
                .filter(u -> !"minhphuong2925@gmail.com".equalsIgnoreCase(u.getEmail()))
                .map(u -> UserDetailRes.builder()
                        .id(u.getId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .studentCode(u.getStudentCode())
                        .avatarUrl(u.getAvatarUrl())
                        .karmaScore(u.getKarmaScore())
                        .status(u.getStatus())
                        .blockReason(u.getBlockReason())
                        .role(u.getRole())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }
}
