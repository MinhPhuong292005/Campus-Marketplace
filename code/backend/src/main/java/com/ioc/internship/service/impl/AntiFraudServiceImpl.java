package com.ioc.internship.service.impl;

import com.ioc.internship.dto.request.AntiFraudCheckReq;
import com.ioc.internship.dto.response.AntiFraudCheckRes;
import com.ioc.internship.dto.response.SafeMeetingPointRes;
import com.ioc.internship.service.AntiFraudService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
@Slf4j
public class AntiFraudServiceImpl implements AntiFraudService {

    // Regex and keyword patterns for student scam detection
    private static final Map<String, List<String>> SUSPICIOUS_PATTERNS = new LinkedHashMap<>();

    static {
        SUSPICIOUS_PATTERNS.put("DEPOSIT_FRAUD", List.of(
                "chuyển cọc", "đặt cọc trước", "chuyển tiền trước", "chuyển khoản cọc",
                "cọc gấp", "gửi cọc", "chuyển khoản giữ chỗ", "cọc 50%", "cọc 100%"
        ));
        SUSPICIOUS_PATTERNS.put("PHISHING_LINK", List.of(
                "bấm vào link", "nhấp vào link", "truy cập link", "link nhận tiền",
                "link xác nhận", "bit.ly", "tinyurl", "cutt.ly", "ngan-hang", "vietcombank-login"
        ));
        SUSPICIOUS_PATTERNS.put("CARD_SCAM", List.of(
                "nạp thẻ", "thẻ cào", "mã thẻ cào", "mua thẻ viettel", "mua thẻ garena", "nạp card"
        ));
        SUSPICIOUS_PATTERNS.put("EXTERNAL_REDIRECT", List.of(
                "qua telegram", "chat kín telegram", "kết bạn zalo nhận quà", "link đăng ký nhận tiền"
        ));
    }

    private static final Pattern URL_PATTERN = Pattern.compile(
            "https?://(bit\\.ly|tinyurl\\.com|cutt\\.ly|goo\\.gl|t\\.me)/[a-zA-Z0-9]+",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public AntiFraudCheckRes scanContent(AntiFraudCheckReq req) {
        if (req == null || req.getContent() == null || req.getContent().isBlank()) {
            return AntiFraudCheckRes.builder()
                    .isSuspicious(false)
                    .riskLevel("LOW")
                    .flaggedKeywords(Collections.emptyList())
                    .warningMessage("Nội dung an toàn.")
                    .recommendedAction("Tiếp tục giao dịch bình thường.")
                    .build();
        }

        String lowerContent = req.getContent().toLowerCase(Locale.ROOT);
        List<String> detected = new ArrayList<>();
        String riskCategory = null;

        for (Map.Entry<String, List<String>> entry : SUSPICIOUS_PATTERNS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (lowerContent.contains(keyword)) {
                    detected.add(keyword);
                    if (riskCategory == null) {
                        riskCategory = entry.getKey();
                    }
                }
            }
        }

        if (URL_PATTERN.matcher(req.getContent()).find()) {
            detected.add("Link rút gọn đáng ngờ");
            riskCategory = "PHISHING_LINK";
        }

        if (!detected.isEmpty()) {
            String warning;
            String recommendation;
            String level = "HIGH";

            if ("DEPOSIT_FRAUD".equals(riskCategory)) {
                warning = "⚠️ CẢNH BÁO: Phát hiện dấu hiệu yêu cầu chuyển cọc trước. Tuyệt đối không chuyển tiền cọc vào tài khoản cá nhân khi chưa gặp trực tiếp!";
                recommendation = "Hãy hẹn gặp trực tiếp tại Điểm hẹn an toàn trong trường (Thư viện, Sảnh KTX) và kiểm tra đồ trước khi thanh toán.";
            } else if ("PHISHING_LINK".equals(riskCategory)) {
                warning = "⚠️ CẢNH BÁO NGUY HIỂM: Tin nhắn chứa liên kết lạ hoặc link rút gọn có nguy cơ đánh cắp thông tin thẻ ngân hàng!";
                recommendation = "Không nhấp vào link bên ngoài Campus Marketplace. Báo cáo tài khoản nếu có hành vi lừa đảo.";
            } else if ("CARD_SCAM".equals(riskCategory)) {
                warning = "⚠️ CẢNH BÁO: Yêu cầu thanh toán bằng thẻ cào điện thoại là hình thức lừa đảo phổ biến!";
                recommendation = "Hệ thống chỉ chấp nhận giao dịch trực tiếp bằng tiền mặt hoặc chuyển khoản tại chỗ khi đã kiểm tra đồ.";
            } else {
                warning = "⚠️ LƯU Ý BẢO MẬT: Phát hiện lời mời chuyển kênh liên lạc ra ngoài ứng dụng.";
                recommendation = "Nên tiếp tục trao đổi trên hệ thống để lưu lại lịch sử làm bằng chứng bảo vệ bạn khi có khiếu nại.";
                level = "MEDIUM";
            }

            return AntiFraudCheckRes.builder()
                    .isSuspicious(true)
                    .riskLevel(level)
                    .flaggedKeywords(detected)
                    .warningMessage(warning)
                    .recommendedAction(recommendation)
                    .build();
        }

        return AntiFraudCheckRes.builder()
                .isSuspicious(false)
                .riskLevel("LOW")
                .flaggedKeywords(Collections.emptyList())
                .warningMessage("Nội dung tin cậy, không phát hiện dấu hiệu lừa đảo.")
                .recommendedAction("Tiếp tục trao đổi và giữ lịch sự với bạn học.")
                .build();
    }

    @Override
    public List<SafeMeetingPointRes> getSafeMeetingPoints(Long campusId) {
        // Predefined safe public meeting points in university campuses (AC3)
        return List.of(
                SafeMeetingPointRes.builder()
                        .id(1L)
                        .name("Thư viện Tạ Quang Bửu / Thư viện Trung Tâm")
                        .address("Tầng 1 sảnh chính, có bảo vệ và camera giám sát")
                        .campusName("Khuôn viên chính")
                        .description("Không gian yên tĩnh, an ninh cao, có bàn ghế kiểm tra máy móc thiết bị")
                        .recommendedHours("08:00 - 18:00 (Thứ 2 - Thứ 7)")
                        .isCctvMonitored(true)
                        .build(),
                SafeMeetingPointRes.builder()
                        .id(2L)
                        .name("Sảnh Lễ tân Ký túc xá (KTX)")
                        .address("Sảnh tòa B5 / Nhà A3 KTX Sinh viên")
                        .campusName("Khu KTX Sinh viên")
                        .description("Điểm hẹn đông người qua lại, gần phòng trực ban quản lý KTX")
                        .recommendedHours("07:00 - 21:00 hàng ngày")
                        .isCctvMonitored(true)
                        .build(),
                SafeMeetingPointRes.builder()
                        .id(3L)
                        .name("Căng tin Trung Tâm / Quán Cà phê Sinh viên")
                        .address("Khu nhà Căng tin sinh viên cơ sở chính")
                        .campusName("Khu dịch vụ sinh viên")
                        .description("Địa điểm sáng sủa, thoải mái trò chuyện trao đổi sách vở và giáo trình")
                        .recommendedHours("07:30 - 19:30 hàng ngày")
                        .isCctvMonitored(true)
                        .build(),
                SafeMeetingPointRes.builder()
                        .id(4L)
                        .name("Phòng tự học Chung & Co-working Space")
                        .address("Tòa nhà Thư viện / Tòa A2")
                        .campusName("Khuôn viên chính")
                        .description("Có ổ cắm điện, wifi trường để test laptop, thiết bị điện tử")
                        .recommendedHours("08:00 - 21:00 hàng ngày")
                        .isCctvMonitored(true)
                        .build()
        );
    }
}
