package com.ioc.internship.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomRes {
    private Long id;

    // Associated Listing
    private Long listingId;
    private String listingTitle;
    private BigDecimal listingPrice;
    private String listingImage;
    private String listingType;

    // Peer user
    private Long peerUserId;
    private String peerName;
    private String peerAvatar;
    private Integer peerKarma;
    private String peerCampus;
    private String peerStatus;
    private String peerBlockReason;

    // Status
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Long unreadCount;

    private LocalDateTime createdAt;
}
