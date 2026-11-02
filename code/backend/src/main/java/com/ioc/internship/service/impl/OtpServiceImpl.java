package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.service.OtpService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Slf4j
@Service
public class OtpServiceImpl implements OtpService {

    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailSenderUser;

    // Tiền tố key lưu trong Redis để quản lý theo namespace rõ ràng
    private static final String KEY_PREFIX_OTP = "otp:";
    private static final String KEY_PREFIX_COOLDOWN = "otp:cooldown:";
    private static final String KEY_PREFIX_ATTEMPTS = "otp:attempts:";

    // Các tham số cấu hình thời gian
    private static final long OTP_EXPIRY_MINUTES = 5;      // Mã có hiệu lực 5 phút (300 giây)
    private static final long COOLDOWN_SECONDS = 10;       // Thời gian chờ gửi lại (rút ngắn xuống 10 giây)
    private static final int MAX_ATTEMPTS = 5;             // Tối đa 5 lần thử sai để chống Brute Force

    private static final SecureRandom RANDOM = new SecureRandom();

    public OtpServiceImpl(
            StringRedisTemplate redisTemplate,
            @Autowired(required = false) JavaMailSender mailSender) {
        this.redisTemplate = redisTemplate;
        this.mailSender = mailSender;
    }

    /**
     * Gửi mã OTP:
     * 1. Kiểm tra Cooldown 60s trên Redis. Nếu chưa hết 60s -> ném lỗi 429 Too Many Requests (41005).
     * 2. Sinh mã ngẫu nhiên 6 chữ số (100000 - 999999).
     * 3. Lưu mã vào Redis với TTL = 5 phút (key: otp:{email}).
     * 4. Đặt cờ Cooldown vào Redis với TTL = 60s (key: otp:cooldown:{email}).
     * 5. Gửi email chứa mã OTP HTML đẹp mắt qua SMTP (Gmail App Password).
     */
    @Override
    public void sendOtp(String email) {
        String cleanEmail = email.toLowerCase().trim();
        String cooldownKey = KEY_PREFIX_COOLDOWN + cleanEmail;
        String otpKey = KEY_PREFIX_OTP + cleanEmail;
        String attemptsKey = KEY_PREFIX_ATTEMPTS + cleanEmail;

        try {
            // 1. Kiểm tra Cooldown 60s trên Redis
            Boolean hasCooldown = redisTemplate.hasKey(cooldownKey);
            if (Boolean.TRUE.equals(hasCooldown)) {
                log.warn("Rate limit: OTP requested for {} too quickly within 60s", cleanEmail);
                throw new CustomBusinessException(ErrorCodes.OTP_RATE_LIMITED, HttpStatus.TOO_MANY_REQUESTS);
            }

            // 2. Tạo mã OTP 6 số ngẫu nhiên an toàn bằng SecureRandom
            int num = 100000 + RANDOM.nextInt(900000);
            String code = String.valueOf(num);

            // 3. Lưu vào Redis với thời gian sống (TTL) 5 phút
            redisTemplate.opsForValue().set(otpKey, code, Duration.ofMinutes(OTP_EXPIRY_MINUTES));

            // 4. Đặt cờ Cooldown 60 giây trên Redis (tự động biến mất sau 60 giây)
            redisTemplate.opsForValue().set(cooldownKey, "1", Duration.ofSeconds(COOLDOWN_SECONDS));

            // 5. Reset số lần thử sai trước đó
            redisTemplate.delete(attemptsKey);

            // Log mã OTP ra console để lập trình viên dễ dàng kiểm thử local
            log.info("=================================================================");
            log.info(">>> [REDIS OTP] Mã OTP cấp cho {}: {}", cleanEmail, code);
            log.info(">>> Lưu tại Redis Key: '{}' (Hiệu lực: {} phút)", otpKey, OTP_EXPIRY_MINUTES);
            log.info(">>> Cooldown Key: '{}' (Chờ {} giây trước lần gửi tiếp theo)", cooldownKey, COOLDOWN_SECONDS);
            log.info("=================================================================");

            // 6. Gửi email HTML thực tế qua Gmail SMTP (nếu đã cấu hình EMAIL_USER & EMAIL_PASS)
            sendHtmlEmail(cleanEmail, code);

        } catch (CustomBusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi khi tương tác với Redis trong sendOtp: {}", e.getMessage(), e);
            throw new CustomBusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Xác thực mã OTP:
     * 1. Lấy mã lưu trong Redis ra so sánh.
     * 2. Nếu không tìm thấy (đã hết hạn TTL 5 phút hoặc chưa từng gửi) -> return false.
     * 3. Kiểm tra số lần nhập sai. Nếu quá 5 lần -> tự động hủy mã để chống đoán mã.
     * 4. Nếu mã khớp -> Xóa ngay lập tức khỏi Redis để chống Replay Attack (tái sử dụng mã).
     */
    @Override
    public boolean verifyOtp(String email, String otp) {
        if (otp == null || otp.isBlank()) {
            return false;
        }

        String cleanEmail = email.toLowerCase().trim();
        String otpKey = KEY_PREFIX_OTP + cleanEmail;
        String attemptsKey = KEY_PREFIX_ATTEMPTS + cleanEmail;

        try {
            // 1. Kiểm tra số lần thử sai
            String attemptsStr = redisTemplate.opsForValue().get(attemptsKey);
            int attempts = attemptsStr != null ? Integer.parseInt(attemptsStr) : 0;
            if (attempts >= MAX_ATTEMPTS) {
                log.warn("Tài khoản {} đã nhập sai OTP quá {} lần. Tự động hủy mã.", cleanEmail, MAX_ATTEMPTS);
                redisTemplate.delete(otpKey);
                redisTemplate.delete(attemptsKey);
                return false;
            }

            // 2. Lấy mã OTP trong Redis
            String storedOtp = redisTemplate.opsForValue().get(otpKey);
            if (storedOtp == null) {
                log.info("OTP cho {} không tồn tại hoặc đã hết hạn trong Redis", cleanEmail);
                return false;
            }

            // 3. So khớp mã
            boolean isMatched = storedOtp.equals(otp.trim());
            if (isMatched) {
                // Xác thực thành công: Xóa mã ngay lập tức khỏi Redis để chống Replay Attack
                redisTemplate.delete(otpKey);
                redisTemplate.delete(attemptsKey);
                log.info("Xác thực OTP thành công cho email: {}. Đã xóa key khỏi Redis.", cleanEmail);
                return true;
            } else {
                // Nhập sai: Tăng biến đếm số lần sai trong Redis
                redisTemplate.opsForValue().increment(attemptsKey);
                redisTemplate.expire(attemptsKey, Duration.ofMinutes(OTP_EXPIRY_MINUTES));
                log.warn("Mã OTP không khớp cho {}. Lần thử: {}/{}", cleanEmail, attempts + 1, MAX_ATTEMPTS);
                return false;
            }

        } catch (Exception e) {
            log.error("Lỗi khi tương tác với Redis trong verifyOtp: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Gửi Email HTML qua SMTP (Gmail App Password, Brevo, Resend...)
     */
    private void sendHtmlEmail(String toEmail, String otpCode) {
        if (mailSender == null || mailSenderUser == null || mailSenderUser.isBlank()) {
            log.info(">>> [SMTP THÔNG BÁO] Chưa cấu hình EMAIL_USER trong .env. Bỏ qua gửi mail thực tế, kiểm tra mã OTP tại Console & Redis.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("\"Campus Marketplace\" <" + mailSenderUser + ">");
            helper.setTo(toEmail);

            // Tự động BCC về email người gửi (Gmail của lập trình viên) để bạn luôn nhận được bản sao mã OTP trong hộp thư đến
            if (mailSenderUser != null && !mailSenderUser.isBlank() && !mailSenderUser.equalsIgnoreCase(toEmail)) {
                try {
                    helper.setBcc(mailSenderUser);
                } catch (Exception bccEx) {
                    log.warn("Không thể set BCC cho {}: {}", mailSenderUser, bccEx.getMessage());
                }
            }

            helper.setSubject("[Campus Marketplace] Mã OTP xác thực tài khoản sinh viên: " + otpCode);

            String html = """
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #2563eb; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Campus Marketplace</h2>
                        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Nền tảng Mua bán & Trao đổi đồ cũ Sinh viên</p>
                    </div>
                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #f1f5f9;">
                        <p style="color: #334155; font-size: 14px; margin-top: 0;">Xin chào bạn sinh viên,</p>
                        <p style="color: #334155; font-size: 14px; margin-bottom: 20px;">Bạn đang thực hiện xác thực tài khoản trên <strong>Campus Marketplace</strong>. Dưới đây là mã OTP xác thực của bạn:</p>
                        <div style="text-align: center; margin: 24px 0;">
                            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; background: #eff6ff; padding: 12px 28px; border-radius: 10px; border: 1px dashed #bfdbfe; display: inline-block;">
                                %s
                            </span>
                        </div>
                        <p style="color: #dc2626; font-size: 13px; margin-bottom: 0; font-weight: 600;">
                            ⚠️ Lưu ý: Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
                        </p>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                        Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email. Tin nhắn được gửi tự động từ hệ thống Campus Marketplace.
                    </p>
                </div>
                """.formatted(otpCode);

            helper.setText(html, true);
            mailSender.send(message);
            log.info(">>> [SMTP GMAIL] Đã gửi thành công email OTP tới: {}", toEmail);

        } catch (Exception e) {
            log.error(">>> [SMTP GMAIL ERROR] Không thể gửi email tới {}: {}", toEmail, e.getMessage());
        }
    }
}
