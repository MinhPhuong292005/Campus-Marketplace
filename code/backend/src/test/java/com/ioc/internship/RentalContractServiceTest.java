package com.ioc.internship;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ioc.internship.dto.request.RentalContractCreateReq;
import com.ioc.internship.dto.request.RentalDisputeReq;
import com.ioc.internship.dto.request.RentalProofImagesReq;
import com.ioc.internship.dto.response.RentalContractRes;
import com.ioc.internship.entity.ListingEntity;
import com.ioc.internship.entity.RentalContractEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.ListingRepository;
import com.ioc.internship.repository.RentalContractRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.impl.RentalContractServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RentalContractServiceTest {

    @Mock
    private RentalContractRepository rentalContractRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private RentalContractServiceImpl rentalContractService;

    private UserEntity renter;
    private UserEntity owner;
    private ListingEntity listing;
    private RentalContractEntity contract;

    @BeforeEach
    void setUp() {
        renter = UserEntity.builder().fullName("Nguyễn Văn An").karmaScore(85).build();
        renter.setId(1L);

        owner = UserEntity.builder().fullName("Lê Thuỳ Linh").karmaScore(40).build();
        owner.setId(2L);

        listing = ListingEntity.builder().title("Máy tính Casio fx-580VNX").user(owner).build();
        listing.setId(10L);

        contract = RentalContractEntity.builder()
                .listing(listing)
                .renter(renter)
                .owner(owner)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(7))
                .totalRentAmount(new BigDecimal("50000"))
                .depositAmount(new BigDecimal("300000"))
                .status("PENDING")
                .proofImages("[]")
                .build();
        contract.setId(100L);
    }

    @Test
    @DisplayName("ST-10.1: Tạo hợp đồng thuê đồ thành công với trạng thái PENDING")
    void testCreateRentalContract() {
        RentalContractCreateReq req = RentalContractCreateReq.builder()
                .listingId(10L)
                .ownerId(2L)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(7))
                .totalRentAmount(new BigDecimal("50000"))
                .depositAmount(new BigDecimal("300000"))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(renter));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(userRepository.findById(2L)).thenReturn(Optional.of(owner));
        when(rentalContractRepository.save(any(RentalContractEntity.class))).thenAnswer(i -> {
            RentalContractEntity c = i.getArgument(0);
            c.setId(100L);
            return c;
        });

        RentalContractRes res = rentalContractService.createRentalContract(1L, req);

        assertNotNull(res);
        assertEquals("PENDING", res.getStatus());
        assertEquals("Máy tính Casio fx-580VNX", res.getListingTitle());
        assertEquals(new BigDecimal("300000"), res.getDepositAmount());
        verify(rentalContractRepository, times(1)).save(any(RentalContractEntity.class));
    }

    @Test
    @DisplayName("ST-10.1: Upload 2-4 ảnh hiện trạng thiết bị chuyển trạng thái hợp đồng sang ACTIVE")
    void testUploadProofImages() {
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(rentalContractRepository.save(any(RentalContractEntity.class))).thenAnswer(i -> i.getArgument(0));

        RentalProofImagesReq req = RentalProofImagesReq.builder()
                .proofImages(List.of("https://res.cloudinary.com/img1.jpg", "https://res.cloudinary.com/img2.jpg"))
                .build();

        RentalContractRes res = rentalContractService.uploadProofImages(1L, 100L, req);

        assertEquals("ACTIVE", res.getStatus());
        assertEquals(2, res.getProofImages().size());
        verify(rentalContractRepository, times(1)).save(contract);
    }

    @Test
    @DisplayName("ST-10.1: Xác nhận trả đồ hoàn cọc, tăng +5 điểm Karma cho cả người thuê và chủ đồ")
    void testConfirmReturnAndRefundDeposit() {
        contract.setStatus("ACTIVE");
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(rentalContractRepository.save(any(RentalContractEntity.class))).thenAnswer(i -> i.getArgument(0));

        RentalContractRes res = rentalContractService.confirmReturnAndRefundDeposit(2L, 100L);

        assertEquals("RETURNED", res.getStatus());
        assertEquals(90, renter.getKarmaScore()); // 85 + 5
        assertEquals(45, owner.getKarmaScore());  // 40 + 5
        verify(userRepository, times(1)).save(renter);
        verify(userRepository, times(1)).save(owner);
    }

    @Test
    @DisplayName("ST-10.1: Báo cáo tranh chấp cọc chuyển trạng thái sang DISPUTED")
    void testReportDispute() {
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(rentalContractRepository.save(any(RentalContractEntity.class))).thenAnswer(i -> i.getArgument(0));

        RentalDisputeReq req = RentalDisputeReq.builder()
                .disputeReason("Máy tính bị nứt màn hình sau khi nhận lại")
                .build();

        RentalContractRes res = rentalContractService.reportDispute(2L, 100L, req);

        assertEquals("DISPUTED", res.getStatus());
        assertEquals("Máy tính bị nứt màn hình sau khi nhận lại", res.getDisputeReason());
    }
}
