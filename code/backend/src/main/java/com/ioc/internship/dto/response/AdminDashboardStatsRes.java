package com.ioc.internship.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsRes {

    // Realtime KPIs
    private long pendingListingsCount;
    private long openReportsCount;
    private long todayNewUsersCount;
    private long completedTransactionsCount;
    private long totalUsers;
    private long totalListings;
    private long blockedStudentsCount;

    // Trend & Distribution Charts
    private Map<String, Long> listingsByCategory;
    private Map<String, Long> usersByUniversity;

    // Emergency Alerts (accounts heavily reported in last 24h)
    private List<EmergencyAlertUser> emergencyAlerts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmergencyAlertUser {
        private Long userId;
        private String fullName;
        private String email;
        private long reportCount;
        private String reasonSummary;
    }
}
