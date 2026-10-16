package com.ioc.internship;

import com.ioc.internship.dto.request.ReviewCreateReq;
import com.ioc.internship.dto.response.ReviewRes;
import com.ioc.internship.entity.ListingEntity;
import com.ioc.internship.entity.ReviewEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.ListingRepository;
import com.ioc.internship.repository.ReviewRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test: Reviews & Campus Karma Evaluation (US-08)")
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ListingRepository listingRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private UserEntity reviewer;
    private UserEntity targetUser;
    private ListingEntity listing;

    @BeforeEach
    void setUp() {
        reviewer = UserEntity.builder()
                .email("reviewer@hust.edu.vn")
                .fullName("Nguyễn Văn A")
                .karmaScore(20)
                .build();
        reviewer.setId(1L);

        targetUser = UserEntity.builder()
                .email("target@hust.edu.vn")
                .fullName("Trần Thị B")
                .karmaScore(30)
                .build();
        targetUser.setId(2L);

        listing = ListingEntity.builder()
                .title("Giáo trình Giải tích 1")
                .transactionType("SELL")
                .status("RESERVED")
                .user(targetUser)
                .build();
        listing.setId(10L);
    }

    @Test
    @DisplayName("Đánh giá 5 sao: cộng 5 điểm Karma và hoàn tất giao dịch")
    void testCreate5StarReview() {
        ReviewCreateReq req = ReviewCreateReq.builder()
                .targetUserId(2L)
                .listingId(10L)
                .rating(5)
                .comment("Bạn sinh viên rất nhiệt tình và đúng giờ!")
                .tags(List.of("Nhiệt tình", "Đúng giờ"))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(reviewRepository.save(any(ReviewEntity.class))).thenAnswer(invocation -> {
            ReviewEntity e = invocation.getArgument(0);
            e.setId(99L);
            return e;
        });

        ReviewRes res = reviewService.createReview(1L, req);

        assertNotNull(res);
        assertEquals(5, res.getKarmaAwarded());
        assertEquals("COMPLETED", listing.getStatus());
        assertEquals(35, targetUser.getKarmaScore()); // 30 + 5
        assertEquals(22, reviewer.getKarmaScore());   // 20 + 2
    }

    @Test
    @DisplayName("Tặng đồ Giveaway: cộng thêm 10 điểm Karma đặc biệt")
    void testCreateGiveawayReview() {
        listing.setTransactionType("GIVEAWAY");

        ReviewCreateReq req = ReviewCreateReq.builder()
                .targetUserId(2L)
                .listingId(10L)
                .rating(5)
                .comment("Cảm ơn bạn đã tặng sách!")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(reviewer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(reviewRepository.save(any(ReviewEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReviewRes res = reviewService.createReview(1L, req);

        assertNotNull(res);
        assertEquals(15, res.getKarmaAwarded()); // 5 (5-star) + 10 (Giveaway)
        assertEquals(45, targetUser.getKarmaScore()); // 30 + 15
    }
}
