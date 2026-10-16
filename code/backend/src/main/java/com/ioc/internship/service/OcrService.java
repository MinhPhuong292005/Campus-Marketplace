package com.ioc.internship.service;

import com.ioc.internship.dto.request.StudentCardVerifyReq;
import com.ioc.internship.dto.response.StudentCardVerifyRes;

public interface OcrService {

    StudentCardVerifyRes verifyStudentCard(Long userId, StudentCardVerifyReq req);
}
