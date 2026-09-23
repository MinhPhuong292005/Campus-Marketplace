package com.ioc.internship.common.exception;

import com.ioc.internship.common.constants.ErrorCodes;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CustomBusinessException extends RuntimeException {

    private final int errorCode;
    private final HttpStatus httpStatus;
    private final Object[] args;

    public CustomBusinessException(ErrorCodes errorCodes) {
        super(errorCodes.getMessageKey());
        this.errorCode = errorCodes.getCode();
        this.httpStatus = HttpStatus.BAD_REQUEST;
        this.args = new Object[0];
    }

    public CustomBusinessException(ErrorCodes errorCodes, HttpStatus httpStatus, Object... args) {
        super(errorCodes.getMessageKey());
        this.errorCode = errorCodes.getCode();
        this.httpStatus = httpStatus;
        this.args = args;
    }
}
