package com.ioc.internship;

import com.ioc.internship.dto.request.SwapProposalCreateReq;
import com.ioc.internship.dto.request.SwapProposalStatusReq;
import com.ioc.internship.dto.response.SwapProposalRes;
import com.ioc.internship.entity.ListingEntity;
import com.ioc.internship.entity.SwapProposalEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.ListingRepository;
import com.ioc.internship.repository.SwapProposalRepository;
import com.ioc.internship.service.impl.SwapProposalServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test: Swap Proposals (US-09)")
class SwapProposalServiceTest {

    @Mock
    private SwapProposalRepository swapProposalRepository;

    @Mock
    private ListingRepository listingRepository;

    @InjectMocks
    private SwapProposalServiceImpl swapProposalService;

    private UserEntity userA;
    private UserEntity userB;
    private ListingEntity myListing;
    private ListingEntity targetListing;

    @BeforeEach
    void setUp() {
        userA = UserEntity.builder().fullName("Sinh viên A").karmaScore(40).build();
        userA.setId(10L);

        userB = UserEntity.builder().fullName("Sinh viên B").karmaScore(50).build();
        userB.setId(20L);

        myListing = ListingEntity.builder()
                .title("Bàn phím cơ Akko 3084")
                .status("ACTIVE")
                .transactionType("SWAP")
                .price(BigDecimal.valueOf(500000))
                .user(userA)
                .build();
        myListing.setId(101L);

        targetListing = ListingEntity.builder()
                .title("Màn hình phụ di động 15.6 inch")
                .status("ACTIVE")
                .transactionType("SWAP")
                .price(BigDecimal.valueOf(800000))
                .user(userB)
                .build();
        targetListing.setId(102L);
    }

    @Test
    @DisplayName("Tạo đề xuất đổi đồ thành công kèm tiền bù trừ")
    void testCreateSwapProposal() {
        SwapProposalCreateReq req = SwapProposalCreateReq.builder()
                .initiatorListingId(101L)
                .targetListingId(102L)
                .cashAdjustment(BigDecimal.valueOf(300000))
                .note("Mình bù thêm 300k nhé!")
                .build();

        when(listingRepository.findById(101L)).thenReturn(Optional.of(myListing));
        when(listingRepository.findById(102L)).thenReturn(Optional.of(targetListing));
        when(swapProposalRepository.save(any(SwapProposalEntity.class))).thenAnswer(i -> {
            SwapProposalEntity e = i.getArgument(0);
            e.setId(55L);
            return e;
        });

        SwapProposalRes res = swapProposalService.createProposal(10L, req);

        assertNotNull(res);
        assertEquals(55L, res.getId());
        assertEquals("PENDING", res.getStatus());
        assertEquals(BigDecimal.valueOf(300000), res.getCashAdjustment());
    }

    @Test
    @DisplayName("Chấp nhận đề xuất: chuyển cả 2 bài đăng sang RESERVED")
    void testAcceptSwapProposal() {
        SwapProposalEntity proposal = SwapProposalEntity.builder()
                .initiatorListing(myListing)
                .targetListing(targetListing)
                .cashAdjustment(BigDecimal.ZERO)
                .status("PENDING")
                .build();
        proposal.setId(55L);

        when(swapProposalRepository.findById(55L)).thenReturn(Optional.of(proposal));
        when(swapProposalRepository.save(any(SwapProposalEntity.class))).thenAnswer(i -> i.getArgument(0));

        SwapProposalStatusReq req = new SwapProposalStatusReq("ACCEPTED");
        SwapProposalRes res = swapProposalService.updateProposalStatus(20L, 55L, req);

        assertNotNull(res);
        assertEquals("ACCEPTED", res.getStatus());
        assertEquals("RESERVED", myListing.getStatus());
        assertEquals("RESERVED", targetListing.getStatus());
    }
}
