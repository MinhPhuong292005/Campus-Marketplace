package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.dto.request.GiveawayAppointmentReq;
import com.ioc.internship.dto.request.GiveawayClaimReq;
import com.ioc.internship.dto.response.GiveawayClaimRes;
import com.ioc.internship.entity.GiveawayClaimEntity;
import com.ioc.internship.entity.ListingEntity;
import com.ioc.internship.entity.NotificationEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.GiveawayClaimRepository;
import com.ioc.internship.repository.ListingRepository;
import com.ioc.internship.repository.NotificationRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.GiveawayService;
import com.ioc.internship.service.KarmaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GiveawayServiceImpl implements GiveawayService {

    private final GiveawayClaimRepository giveawayClaimRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final KarmaService karmaService;

    @Override
    @Transactional
    public GiveawayClaimRes createClaim(Long requesterId, Long listingId, GiveawayClaimReq req) {
        UserEntity requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        if ("BANNED".equalsIgnoreCase(requester.getStatus()) || "SUSPENDED".equalsIgnoreCase(requester.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Tài khoản của bạn hiện đang bị khóa/cấm. Không thể xin nhận đồ.");
        }

        ListingEntity listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng tặng đồ!"));

        if (listing.getUser().getId().equals(requesterId)) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Bạn không thể tự xin nhận món đồ của chính mình!");
        }

        if (giveawayClaimRepository.existsByListingIdAndRequesterId(listingId, requesterId)) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.CONFLICT, "Bạn đã gửi yêu cầu xin nhận món đồ này trước đó rồi!");
        }

        if ("SOLD".equalsIgnoreCase(listing.getStatus()) || "COMPLETED".equalsIgnoreCase(listing.getStatus())) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Món đồ tặng này đã được trao tặng thành công và ngừng nhận đơn!");
        }

        GiveawayClaimEntity claim = GiveawayClaimEntity.builder()
                .listing(listing)
                .requester(requester)
                .message(req.getMessage().trim())
                .phone(req.getPhone() != null ? req.getPhone().trim() : requester.getPhone())
                .status("PENDING")
                .giverConfirmed(false)
                .receiverConfirmed(false)
                .build();

        GiveawayClaimEntity saved = giveawayClaimRepository.save(claim);

        // Gửi thông báo đến chủ món đồ
        NotificationEntity ownerNotif = NotificationEntity.builder()
                .user(listing.getUser())
                .title("🎁 Có sinh viên xin nhận món đồ: " + listing.getTitle())
                .message("Sinh viên " + requester.getFullName() + " (MSSV: " + (requester.getStudentCode() != null ? requester.getStudentCode() : "N/A")
                        + ", " + (requester.getKarmaScore() != null ? requester.getKarmaScore() : 20) + " Karma) vừa gửi đơn xin nhận món đồ tặng với lý do: \""
                        + req.getMessage().trim() + "\". Hãy vào danh sách để chọn bạn phù hợp hoặc quay vòng quay may mắn!")
                .type("GIVEAWAY_REQUEST")
                .referenceId(listing.getId())
                .reason(req.getMessage().trim())
                .isRead(false)
                .build();
        notificationRepository.save(ownerNotif);

        return mapToRes(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GiveawayClaimRes> getClaimsByListing(Long userId, Long listingId) {
        return giveawayClaimRepository.findByListingIdOrderByCreatedAtDesc(listingId)
                .stream()
                .map(this::mapToRes)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GiveawayClaimRes> getClaimsByRequester(Long requesterId) {
        return giveawayClaimRepository.findByRequesterIdOrderByCreatedAtDesc(requesterId)
                .stream()
                .map(this::mapToRes)
                .toList();
    }

    @Override
    @Transactional
    public GiveawayClaimRes acceptClaim(Long ownerId, Long listingId, Long claimId) {
        ListingEntity listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        if (!listing.getUser().getId().equals(ownerId)) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Bạn không phải chủ nhân của món đồ này!");
        }

        List<GiveawayClaimEntity> allClaims = giveawayClaimRepository.findByListingIdOrderByCreatedAtDesc(listingId);
        GiveawayClaimEntity chosenClaim = allClaims.stream()
                .filter(c -> c.getId().equals(claimId))
                .findFirst()
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu nhận đồ!"));

        chosenClaim.setStatus("ACCEPTED");
        chosenClaim.setGiverConfirmed(false);
        chosenClaim.setReceiverConfirmed(false);
        giveawayClaimRepository.save(chosenClaim);

        // Chuyển tất cả người xin khác sang REJECTED
        for (GiveawayClaimEntity c : allClaims) {
            if (!c.getId().equals(claimId)) {
                c.setStatus("REJECTED");
                giveawayClaimRepository.save(c);

                // Gửi thông báo đến những người không được nhận
                NotificationEntity rejectNotif = NotificationEntity.builder()
                        .user(c.getRequester())
                        .title("Thông báo: Món đồ \"" + listing.getTitle() + "\" đã được trao tặng")
                        .message("Rất tiếc, món đồ \"" + listing.getTitle() + "\" đã được người tặng chốt trao cho bạn học khác. Cảm ơn bạn đã quan tâm, chúc bạn may mắn ở các món đồ tặng tiếp theo trên Campus Marketplace!")
                        .type("GIVEAWAY_CLOSED")
                        .referenceId(listing.getId())
                        .isRead(false)
                        .build();
                notificationRepository.save(rejectNotif);
            }
        }

        listing.setStatus("IN_TRANSACTION");
        listingRepository.save(listing);

        // Gửi thông báo chúc mừng đến NGƯỜI ĐƯỢC NHẬN
        NotificationEntity winnerNotif = NotificationEntity.builder()
                .user(chosenClaim.getRequester())
                .title("🎉 Chúc mừng! Bạn đã được nhận món đồ: " + listing.getTitle())
                .message("Bạn đã được chủ sở hữu lựa chọn để trao tặng món đồ \"" + listing.getTitle() + "\". Hãy vào tin nhắn trao đổi để thống nhất thời gian và địa điểm gặp mặt nhận đồ tại khuôn viên trường Phenikaa!")
                .type("GIVEAWAY_AWARDED")
                .referenceId(listing.getId())
                .isRead(false)
                .build();
        notificationRepository.save(winnerNotif);

        return mapToRes(chosenClaim);
    }

    @Override
    @Transactional
    public GiveawayClaimRes updateAppointment(Long userId, Long claimId, GiveawayAppointmentReq req) {
        GiveawayClaimEntity claim = giveawayClaimRepository.findById(claimId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        Long ownerId = claim.getListing().getUser().getId();
        Long requesterId = claim.getRequester().getId();

        if (!userId.equals(ownerId) && !userId.equals(requesterId)) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Bạn không có quyền cập nhật lịch hẹn cho giao dịch này!");
        }

        claim.setMeetingTime(req.getMeetingTime().trim());
        claim.setMeetingPoint(req.getMeetingPoint().trim());
        GiveawayClaimEntity saved = giveawayClaimRepository.save(claim);

        // Gửi thông báo cho bên còn lại
        UserEntity targetUser = userId.equals(ownerId) ? claim.getRequester() : claim.getListing().getUser();
        NotificationEntity notif = NotificationEntity.builder()
                .user(targetUser)
                .title("📍 Cập nhật điểm hẹn & giờ nhận đồ tặng: " + claim.getListing().getTitle())
                .message("Thời gian: " + req.getMeetingTime() + " • Điểm hẹn: " + req.getMeetingPoint())
                .type("MEETING_UPDATE")
                .referenceId(claim.getListing().getId())
                .isRead(false)
                .build();
        notificationRepository.save(notif);

        return mapToRes(saved);
    }

    @Override
    @Transactional
    public GiveawayClaimRes confirmHandover(Long userId, Long claimId) {
        GiveawayClaimEntity claim = giveawayClaimRepository.findById(claimId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        UserEntity giver = claim.getListing().getUser();
        UserEntity receiver = claim.getRequester();

        if (!userId.equals(giver.getId()) && !userId.equals(receiver.getId())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Bạn không thuộc giao dịch này!");
        }

        if (userId.equals(giver.getId())) {
            claim.setGiverConfirmed(true);
        }
        if (userId.equals(receiver.getId())) {
            claim.setReceiverConfirmed(true);
        }

        // Nếu CẢ HAI BÊN đều đã ấn xác nhận -> Hoàn tất giao dịch!
        if (Boolean.TRUE.equals(claim.getGiverConfirmed()) && Boolean.TRUE.equals(claim.getReceiverConfirmed())) {
            claim.setStatus("COMPLETED");
            claim.setCompletedAt(LocalDateTime.now());

            ListingEntity listing = claim.getListing();
            listing.setStatus("SOLD");
            listingRepository.save(listing);

            // CỘNG +5 ĐIỂM KARMA CHO CẢ HAI BÊN (Mỗi giao dịch thành công cộng 5 karma)
            karmaService.adjustKarma(giver, 5, "Hoàn tất trao tặng món đồ [" + listing.getTitle() + "] thành công");
            karmaService.adjustKarma(receiver, 5, "Hoàn tất nhận món đồ tặng [" + listing.getTitle() + "] thành công");

            // Thông báo hoàn tất
            NotificationEntity doneGiver = NotificationEntity.builder()
                    .user(giver)
                    .title("🎉 Giao dịch tặng đồ thành công! (+5 Karma)")
                    .message("Cả hai bên đã xác nhận bàn giao món đồ \"" + listing.getTitle() + "\". Bạn được cộng +5 điểm Campus Karma vì nghĩa cử chia sẻ đồ dùng học tập!")
                    .type("TRANSACTION_COMPLETED")
                    .referenceId(listing.getId())
                    .isRead(false)
                    .build();
            notificationRepository.save(doneGiver);

            NotificationEntity doneReceiver = NotificationEntity.builder()
                    .user(receiver)
                    .title("🎉 Nhận đồ tặng thành công! (+5 Karma)")
                    .message("Cả hai bên đã xác nhận hoàn tất giao nhận món đồ \"" + listing.getTitle() + "\". Bạn được cộng +5 điểm Campus Karma vì giao dịch đúng hẹn!")
                    .type("TRANSACTION_COMPLETED")
                    .referenceId(listing.getId())
                    .isRead(false)
                    .build();
            notificationRepository.save(doneReceiver);
        }

        GiveawayClaimEntity saved = giveawayClaimRepository.save(claim);
        return mapToRes(saved);
    }

    @Override
    @Transactional
    public GiveawayClaimRes cancelTransaction(Long userId, Long claimId, String reason) {
        GiveawayClaimEntity claim = giveawayClaimRepository.findById(claimId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        UserEntity giver = claim.getListing().getUser();
        UserEntity receiver = claim.getRequester();

        if (!userId.equals(giver.getId()) && !userId.equals(receiver.getId())) {
            throw new CustomBusinessException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, "Bạn không thuộc giao dịch này!");
        }

        claim.setStatus("CANCELLED");
        ListingEntity listing = claim.getListing();
        if (listing != null && !"DELETED".equalsIgnoreCase(listing.getStatus())) {
            // Tự động hồi phục lại bài đăng để các bạn sinh viên khác có thể tiếp tục xem và xin nhận đồ
            listing.setStatus("ACTIVE");
            listingRepository.save(listing);
            log.info("Listing #{} automatically RESTORED to ACTIVE after unsuccessful transaction", listing.getId());
        }

        // Tự động hồi phục các đơn xin khác về trạng thái PENDING để chủ bài đăng có thể chọn lại bạn khác hoặc quay vòng quay
        if (listing != null) {
            List<GiveawayClaimEntity> allClaims = giveawayClaimRepository.findByListingIdOrderByCreatedAtDesc(listing.getId());
            for (GiveawayClaimEntity c : allClaims) {
                if (!c.getId().equals(claimId) && "REJECTED".equalsIgnoreCase(c.getStatus())) {
                    c.setStatus("PENDING");
                    giveawayClaimRepository.save(c);
                }
            }
        }

        UserEntity atFaultUser = userId.equals(giver.getId()) ? giver : receiver;
        UserEntity otherUser = userId.equals(giver.getId()) ? receiver : giver;

        // TRỪ -10 ĐIỂM KARMA KHI GIAO DỊCH THẤT BẠI / HỦY HẸN (mỗi giao dịch thất bại trừ 10 điểm karma)
        karmaService.adjustKarma(atFaultUser, -10, "Giao dịch tặng đồ thất bại / hủy hẹn: " + (reason != null ? reason : "Không đến hoặc hủy giao dịch"));

        NotificationEntity failNotif = NotificationEntity.builder()
                .user(otherUser)
                .title("Giao dịch tặng đồ đã bị hủy")
                .message("Giao dịch món đồ \"" + listing.getTitle() + "\" đã bị hủy với lý do: " + (reason != null ? reason : "Đối phương báo hủy giao dịch"))
                .type("TRANSACTION_CANCELLED")
                .referenceId(listing.getId())
                .isRead(false)
                .build();
        notificationRepository.save(failNotif);

        GiveawayClaimEntity saved = giveawayClaimRepository.save(claim);
        return mapToRes(saved);
    }

    private GiveawayClaimRes mapToRes(GiveawayClaimEntity entity) {
        String listingImg = null;
        if (entity.getListing().getImages() != null && !entity.getListing().getImages().isEmpty()) {
            listingImg = entity.getListing().getImages().get(0).getMediaUrl();
        }

        return GiveawayClaimRes.builder()
                .id(entity.getId())
                .listingId(entity.getListing().getId())
                .listingTitle(entity.getListing().getTitle())
                .listingImage(listingImg)
                .ownerId(entity.getListing().getUser().getId())
                .ownerName(entity.getListing().getUser().getFullName())
                .requesterId(entity.getRequester().getId())
                .requesterName(entity.getRequester().getFullName())
                .requesterAvatar(entity.getRequester().getAvatarUrl())
                .requesterStudentCode(entity.getRequester().getStudentCode())
                .requesterKarma(entity.getRequester().getKarmaScore())
                .requesterPhone(entity.getPhone() != null ? entity.getPhone() : entity.getRequester().getPhone())
                .message(entity.getMessage())
                .status(entity.getStatus())
                .meetingTime(entity.getMeetingTime())
                .meetingPoint(entity.getMeetingPoint())
                .giverConfirmed(entity.getGiverConfirmed())
                .receiverConfirmed(entity.getReceiverConfirmed())
                .createdAt(entity.getCreatedAt())
                .completedAt(entity.getCompletedAt())
                .build();
    }
}
