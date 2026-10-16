package com.ioc.internship.common.constants;

import lombok.Getter;

@Getter
public enum ErrorCodes {

    // Common errors (400xx - 500xx)
    SUCCESS(200, "Thao tác thành công"),
    BAD_REQUEST(40000, "error.common.bad_request"),
    UNAUTHORIZED(40100, "error.common.unauthorized"),
    FORBIDDEN(40300, "error.common.forbidden"),
    NOT_FOUND(40400, "error.common.not_found"),
    INTERNAL_SERVER_ERROR(50000, "error.common.internal"),

    // Auth errors (400xx - 410xx)
    INVALID_EDU_EMAIL(40001, "error.auth.invalid_edu_email"),
    EMAIL_ALREADY_EXISTS(41001, "error.auth.email_exists"),
    INVALID_CREDENTIALS(41003, "error.auth.invalid_credentials"),
    OTP_EXPIRED_OR_INVALID(41004, "error.auth.otp_expired"),
    OTP_RATE_LIMITED(41005, "error.auth.otp_rate_limited"),

    // Listing errors (420xx)
    LISTING_NOT_FOUND(42001, "error.listing.not_found"),
    LISTING_NOT_OWNER(42002, "error.listing.not_owner"),
    INSUFFICIENT_KARMA(42003, "error.karma.insufficient"),
    IMAGE_LIMIT_EXCEEDED(42004, "error.listing.image_limit_exceeded"),
    INVALID_LISTING_PRICE(42005, "error.listing.invalid_price");

    private final int code;
    private final String messageKey;

    ErrorCodes(int code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }
}
