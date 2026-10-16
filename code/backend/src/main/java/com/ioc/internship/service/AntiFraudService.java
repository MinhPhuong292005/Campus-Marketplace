package com.ioc.internship.service;

import com.ioc.internship.dto.request.AntiFraudCheckReq;
import com.ioc.internship.dto.response.AntiFraudCheckRes;
import com.ioc.internship.dto.response.SafeMeetingPointRes;

import java.util.List;

public interface AntiFraudService {
    AntiFraudCheckRes scanContent(AntiFraudCheckReq req);
    List<SafeMeetingPointRes> getSafeMeetingPoints(Long campusId);
}
