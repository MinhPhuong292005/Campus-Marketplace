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
        // Safe meeting points inside Phenikaa University campus (Đường Tố Hữu, P. Yên Nghĩa, Q. Hà Đông)
        return List.of(
                SafeMeetingPointRes.builder()
                        .id(1L)
                        .name("Thư viện Tòa A9 (Thư viện Trung tâm Phenikaa)")
                        .address("Tầng 1 - Sảnh chính Tòa A9 (Tòa nhà Hiệu bộ & Thư viện)")
                        .campusName("Cơ sở Yên Nghĩa, Trường ĐH Phenikaa")
                        .description("Không gian yên tĩnh, an ninh cao, có bảo vệ trực 24/7 và camera CCTV, có bàn ghế kiểm tra thiết bị, sách vở.")
                        .recommendedHours("07:30 - 21:00 (Thứ 2 - Thứ 7)")
                        .isCctvMonitored(true)
                        .build(),
                SafeMeetingPointRes.builder()
                        .id(2L)
                        .name("Sảnh Tòa A2 (Khu Giảng đường Trung tâm Phenikaa)")
                        .address("Sảnh tầng 1 Tòa A2 (Khu Giảng đường chung)")
                        .campusName("Cơ sở Yên Nghĩa, Trường ĐH Phenikaa")
                        .description("Khu vực đông đúc sinh viên qua lại giữa các ca học, ánh sáng tốt, có camera an ninh và ghế chờ.")
                        .recommendedHours("07:00 - 18:30 hàng ngày")
                        .isCctvMonitored(true)
                        .build(),
                SafeMeetingPointRes.builder()
                        .id(3L)
                        .name("Sảnh Tòa A8 (Tòa nhà Khoa học Công nghệ & CNTT)")
                        .address("Sảnh Tầng 1 Tòa A8 (Khoa CNTT & Kỹ thuật)")
                        .campusName("Cơ sở Yên Nghĩa, Trường ĐH Phenikaa")
                        .description("Có ổ cắm sạc điện, wifi Phenikaa tốc độ cao, rất thuận tiện kiểm tra máy tính xách tay và đồ công nghệ.")
                        .recommendedHours("07:30 - 20:00 hàng ngày")
                        .isCctvMonitored(true)
                        .build(),
                SafeMeetingPointRes.builder()
                        .id(4L)
                        .name("Căn tin Sinh viên Phenikaa (Khu Dịch vụ Sinh viên)")
                        .address("Căn tin trung tâm cạnh Sân bóng đá & Nhà thi đấu Thể thao Phenikaa")
                        .campusName("Khu dịch vụ Sinh viên ĐH Phenikaa")
                        .description("Khu ẩm thực sinh viên rộng rãi, thoáng mát, nhiều chỗ ngồi giao lưu trao đổi sách vở và giáo trình.")
                        .recommendedHours("06:30 - 20:00 hàng ngày")
                        .isCctvMonitored(true)
                        .build(),
                SafeMeetingPointRes.builder()
                        .id(5L)
                        .name("Sảnh Ký túc xá Phenikaa (Tòa K1 & K2 KTX Sinh viên)")
                        .address("Sảnh tầng 1 trước phòng Quản lý KTX Sinh viên Phenikaa")
                        .campusName("Khu Ký túc xá Đại học Phenikaa")
                        .description("Khu vực có bảo vệ KTX túc trực 24/24, hệ thống camera giám sát ra vào, an toàn tuyệt đối.")
                        .recommendedHours("06:00 - 22:30 hàng ngày")
                        .isCctvMonitored(true)
                        .build(),
                SafeMeetingPointRes.builder()
                        .id(6L)
                        .name("Cổng chính Trường Đại học Phenikaa (Chốt An ninh Cổng 1)")
                        .address("Cổng chính đường Tố Hữu, P. Yên Nghĩa, Q. Hà Đông, Hà Nội")
                        .campusName("Cổng chính Trường ĐH Phenikaa")
                        .description("Chốt kiểm soát an ninh bảo vệ trường và hệ thống camera giám sát phương tiện 24/7.")
                        .recommendedHours("06:00 - 22:00 hàng ngày")
                        .isCctvMonitored(true)
                        .build(),
                SafeMeetingPointRes.builder()
                        .id(7L)
                        .name("Trước cửa Cổng bảo vệ (Cổng chính Trường Đại học Phenikaa)")
                        .address("Trước chốt bảo vệ Cổng chính, Trường ĐH Phenikaa (Đường Nguyễn Trác, P. Yên Nghĩa)")
                        .campusName("Cổng chính Trường ĐH Phenikaa")
                        .description("Chốt bảo vệ an ninh túc trực 24/7, có camera giám sát và đèn chiếu sáng, giao dịch an toàn và thuận tiện ngay lối vào trường.")
                        .recommendedHours("06:00 - 22:30 hàng ngày")
                        .isCctvMonitored(true)
                        .build()
        );
    }
}
