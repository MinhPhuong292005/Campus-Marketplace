package com.ioc.internship.service;

import com.ioc.internship.entity.UserEntity;

public interface KarmaService {
    UserEntity adjustKarma(UserEntity user, int delta, String reason);
    void applyTemporaryBan(UserEntity user, int days, String reason);
}

