package com.ioc.internship.common.constants;

public final class RegexConstants {

    private RegexConstants() {}

    public static final String VIETNAM_PHONE_REGEX = "(84|0[3|5|7|8|9])+([0-9]{8})\\b";
    public static final String EDU_EMAIL_REGEX = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.edu\\.vn$";
    public static final String STUDENT_CODE_REGEX = "^[A-Z0-9]{6,15}$";
}
