package com.ioc.internship.common.exception;

import com.ioc.internship.common.constants.ErrorCodes;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CustomBusinessException extends RuntimeException {

    private final int errorCode;
    private final HttpStatus httpStatus;
    private final Object[] args;
    private final String customMessage;

    public CustomBusinessException(ErrorCodes errorCodes) {
        super(errorCodes.getMessageKey());
        this.errorCode = errorCodes.getCode();
        this.httpStatus = HttpStatus.BAD_REQUEST;
        this.args = new Object[0];
        this.customMessage = null;
    }

    public CustomBusinessException(ErrorCodes errorCodes, HttpStatus httpStatus, Object... args) {
        super(errorCodes.getMessageKey());
        this.errorCode = errorCodes.getCode();
        this.httpStatus = httpStatus;
        this.args = args;
        if (args != null && args.length == 1 && args[0] instanceof String str) {
            this.customMessage = str;
        } else {
            this.customMessage = null;
        }
    }

    public CustomBusinessException(ErrorCodes errorCodes, HttpStatus httpStatus, String customMessage) {
        super(customMessage != null ? customMessage : errorCodes.getMessageKey());
        this.errorCode = errorCodes.getCode();
        this.httpStatus = httpStatus;
        this.args = new Object[0];
        this.customMessage = customMessage;
    }
}
