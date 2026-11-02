package com.ioc.internship.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiveawayClaimRes {

    private Long id;
    private Long listingId;
    private String listingTitle;
    private String listingImage;
    private Long ownerId;
    private String ownerName;

    private Long requesterId;
    private String requesterName;
    private String requesterAvatar;
    private String requesterStudentCode;
    private Integer requesterKarma;
    private String requesterPhone;

    private String message;
    private String status;

    private String meetingTime;
    private String meetingPoint;
    private Boolean giverConfirmed;
    private Boolean receiverConfirmed;

    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}

