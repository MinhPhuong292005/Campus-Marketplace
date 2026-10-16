package com.ioc.internship;

import com.ioc.internship.dto.request.ReportCreateReq;
import com.ioc.internship.dto.request.ResolveReportReq;
import com.ioc.internship.dto.response.ReportRes;
import com.ioc.internship.entity.ReportEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.ListingRepository;
import com.ioc.internship.repository.RentalContractRepository;
import com.ioc.internship.repository.ReportRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.impl.ReportServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private RentalContractRepository rentalContractRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    private UserEntity reporter;
    private UserEntity scammer;
    private ReportEntity report;

    @BeforeEach
    void setUp() {
        reporter = UserEntity.builder().fullName("Người Tố Cáo").karmaScore(50).build();
        reporter.setId(1L);

        scammer = UserEntity.builder().fullName("Người Vi Phạm").karmaScore(40).status("ACTIVE").build();
        scammer.setId(2L);

        report = ReportEntity.builder()
                .reporter(reporter)
                .reportedUser(scammer)
                .reason("BOM_HEN")
                .description("Hẹn gặp ở thư viện nhưng không đến và chặn tin nhắn")
                .severity("MEDIUM")
                .status("PENDING")
                .build();
        report.setId(50L);
    }

    @Test
    @DisplayName("ST-12.1: Gửi báo cáo tố cáo thành công với trạng thái PENDING")
    void testCreateReport() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(scammer));
        when(reportRepository.save(any(ReportEntity.class))).thenAnswer(i -> {
            ReportEntity r = i.getArgument(0);
            r.setId(50L);
            return r;
        });

        ReportCreateReq req = ReportCreateReq.builder()
                .reportedUserId(2L)
                .reason("BOM_HEN")
                .description("Hẹn gặp ở thư viện nhưng không đến")
                .severity("MEDIUM")
                .build();

        ReportRes res = reportService.createReport(1L, req);

        assertNotNull(res);
        assertEquals("PENDING", res.getStatus());
        assertEquals("BOM_HEN", res.getReason());
        verify(reportRepository, times(1)).save(any(ReportEntity.class));
    }

    @Test
    @DisplayName("ST-12.1: Admin xử lý vi phạm Bom hẹn: Phạt trừ 15 điểm Karma")
    void testResolveReportPenalizeKarma() {
        when(reportRepository.findById(50L)).thenReturn(Optional.of(report));
        when(reportRepository.save(any(ReportEntity.class))).thenAnswer(i -> i.getArgument(0));

        ResolveReportReq req = ResolveReportReq.builder()
                .action("PENALIZE_KARMA")
                .karmaPenalty(15)
                .resolutionNotes("Xác nhận bom hẹn qua tin nhắn chat. Trừ 15 điểm tín nhiệm.")
                .build();

        ReportRes res = reportService.resolveReport(999L, 50L, req);

        assertEquals("RESOLVED", res.getStatus());
        assertEquals("PENALIZE_KARMA", res.getActionTaken());
        assertEquals(25, scammer.getKarmaScore()); // 40 - 15 = 25
        verify(userRepository, times(1)).save(scammer);
    }

    @Test
    @DisplayName("ST-12.1: Admin xử lý vi phạm Lừa đảo cọc (Scam): Khóa tài khoản vĩnh viễn (BANNED)")
    void testResolveReportBanUser() {
        when(reportRepository.findById(50L)).thenReturn(Optional.of(report));
        when(reportRepository.save(any(ReportEntity.class))).thenAnswer(i -> i.getArgument(0));

        ResolveReportReq req = ResolveReportReq.builder()
                .action("BAN_USER")
                .resolutionNotes("Lừa đảo chiếm đoạt cọc của sinh viên khác. Khóa tài khoản vĩnh viễn.")
                .build();

        ReportRes res = reportService.resolveReport(999L, 50L, req);

        assertEquals("RESOLVED", res.getStatus());
        assertEquals("BAN_USER", res.getActionTaken());
        assertEquals("BANNED", scammer.getStatus());
        verify(userRepository, times(1)).save(scammer);
    }
}
