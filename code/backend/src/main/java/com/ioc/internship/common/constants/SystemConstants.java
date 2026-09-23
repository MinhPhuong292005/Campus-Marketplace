package com.ioc.internship.common.constants;

public final class SystemConstants {

    private SystemConstants() {}

    public static final String ROLE_STUDENT = "ROLE_STUDENT";
    public static final String ROLE_MODERATOR = "ROLE_MODERATOR";
    public static final String ROLE_SUPER_ADMIN = "ROLE_SUPER_ADMIN";

    public static final int DEFAULT_INITIAL_KARMA = 20;
    public static final int STUDENT_CARD_VERIFIED_KARMA = 15;
    public static final int RATING_5_STAR_KARMA = 5;
    public static final int GIVEAWAY_SUCCESS_KARMA = 10;
    public static final int NO_SHOW_PENALTY_KARMA = -15;

    public static final int MAX_LISTING_IMAGES = 6;
    public static final int DEFAULT_PAGE_SIZE = 12;
}
