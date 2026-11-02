package com.ioc.internship.service;

import com.ioc.internship.dto.request.*;
import com.ioc.internship.dto.response.*;
import com.ioc.internship.entity.CampusEntity;
import com.ioc.internship.entity.CategoryEntity;
import com.ioc.internship.entity.KeywordBlacklistEntity;
import com.ioc.internship.entity.UniversityEntity;

import java.util.List;

public interface AdminService {

    // 1. Dashboard & KPIs
    AdminDashboardStatsRes getDashboardStats();

    // 2. Listing Moderation
    PaginatedRes<ListingDetailRes> getListings(String keyword, String status, Long categoryId, Long universityId, Boolean isRiskFlagged, int page, int size);
    ListingDetailRes moderateListing(Long adminId, String adminEmail, Long listingId, ListingModerationReq req);

    // 3. User Management & Student Verification
    PaginatedRes<UserDetailRes> getUsers(String keyword, Long universityId, String status, Boolean verified, int page, int size);
    UserDetailRes updateUserStatus(Long adminId, String adminEmail, Long targetUserId, UserStatusUpdateReq req);
    UserDetailRes reviewStudentCard(Long adminId, String adminEmail, Long targetUserId, StudentCardReviewReq req);

    // 4. Categories Management
    List<CategoryEntity> getAllCategories();
    CategoryEntity createCategory(Long adminId, String adminEmail, CategoryReq req);
    CategoryEntity updateCategory(Long adminId, String adminEmail, Long id, CategoryReq req);
    void deleteCategory(Long adminId, String adminEmail, Long id);

    // 5. Universities & Campuses Management
    List<UniversityEntity> getAllUniversities();
    UniversityEntity createUniversity(Long adminId, String adminEmail, UniversityReq req);
    UniversityEntity updateUniversity(Long adminId, String adminEmail, Long id, UniversityReq req);
    void deleteUniversity(Long adminId, String adminEmail, Long id);
    CampusEntity createCampus(Long adminId, String adminEmail, CampusReq req);
    CampusEntity updateCampus(Long adminId, String adminEmail, Long id, CampusReq req);
    void deleteCampus(Long adminId, String adminEmail, Long id);

    // 6. Keyword Blacklist & Audit Logs
    List<KeywordBlacklistEntity> getAllBlacklistKeywords();
    KeywordBlacklistEntity addBlacklistKeyword(Long adminId, String adminEmail, KeywordBlacklistReq req);
    void deleteBlacklistKeyword(Long adminId, String adminEmail, Long id);
    PaginatedRes<AuditLogRes> getAuditLogs(int page, int size);
}
