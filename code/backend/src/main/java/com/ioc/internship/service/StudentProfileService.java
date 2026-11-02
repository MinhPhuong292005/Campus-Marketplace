package com.ioc.internship.service;

import com.ioc.internship.dto.request.ChangePasswordReq;
import com.ioc.internship.dto.request.UserProfileReq;
import com.ioc.internship.dto.response.PublicProfileRes;
import com.ioc.internship.dto.response.UserProfileRes;

public interface StudentProfileService {
    UserProfileRes getMyProfile(Long userId);
    UserProfileRes updateMyProfile(Long userId, UserProfileReq req);
    void changePassword(Long userId, ChangePasswordReq req);
    PublicProfileRes getPublicProfile(Long targetUserId);
}
