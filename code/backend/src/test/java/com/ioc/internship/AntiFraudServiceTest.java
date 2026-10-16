package com.ioc.internship;

import com.ioc.internship.dto.request.AntiFraudCheckReq;
import com.ioc.internship.dto.response.AntiFraudCheckRes;
import com.ioc.internship.dto.response.SafeMeetingPointRes;
import com.ioc.internship.service.AntiFraudService;
import com.ioc.internship.service.impl.AntiFraudServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Test: Anti-Fraud Shield & Safe Meeting Points (US-07)")
class AntiFraudServiceTest {

    private AntiFraudService antiFraudService;

    @BeforeEach
    void setUp() {
        antiFraudService = new AntiFraudServiceImpl();
    }

    @Test
    @DisplayName("Nội dung an toàn không bị cờ gian lận")
    void testSafeContent() {
        AntiFraudCheckReq req = new AntiFraudCheckReq("Chào bạn, chiều nay 15h mình gặp ở Thư viện trường lấy sách nhé!");
        AntiFraudCheckRes res = antiFraudService.scanContent(req);

        assertNotNull(res);
        assertFalse(res.getIsSuspicious());
        assertEquals("LOW", res.getRiskLevel());
    }

    @Test
    @DisplayName("Phát hiện từ khóa lừa đảo cọc trước và cảnh báo đỏ")
    void testDepositScamDetection() {
        AntiFraudCheckReq req = new AntiFraudCheckReq("Bạn chuyển cọc trước 100k vào số tài khoản này để mình giữ máy nhé!");
        AntiFraudCheckRes res = antiFraudService.scanContent(req);

        assertNotNull(res);
        assertTrue(res.getIsSuspicious());
        assertEquals("HIGH", res.getRiskLevel());
        assertTrue(res.getFlaggedKeywords().contains("chuyển cọc"));
        assertTrue(res.getWarningMessage().contains("Tuyệt đối không chuyển tiền cọc"));
    }

    @Test
    @DisplayName("Phát hiện liên kết rút gọn đáng ngờ (Phishing)")
    void testPhishingShortLinkDetection() {
        AntiFraudCheckReq req = new AntiFraudCheckReq("Bấm vào link https://bit.ly/nhantien de xac nhan don hang nhe");
        AntiFraudCheckRes res = antiFraudService.scanContent(req);

        assertNotNull(res);
        assertTrue(res.getIsSuspicious());
        assertEquals("HIGH", res.getRiskLevel());
    }

    @Test
    @DisplayName("Trả về danh sách các điểm hẹn an toàn có bảo vệ/camera")
    void testGetSafeMeetingPoints() {
        List<SafeMeetingPointRes> points = antiFraudService.getSafeMeetingPoints(1L);

        assertNotNull(points);
        assertFalse(points.isEmpty());
        assertTrue(points.stream().anyMatch(p -> p.getName().contains("Thư viện")));
        assertTrue(points.stream().allMatch(SafeMeetingPointRes::getIsCctvMonitored));
    }
}
