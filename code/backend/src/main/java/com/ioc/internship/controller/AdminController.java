package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.*;
import com.ioc.internship.dto.response.*;
import com.ioc.internship.entity.CampusEntity;
import com.ioc.internship.entity.CategoryEntity;
import com.ioc.internship.entity.KeywordBlacklistEntity;
import com.ioc.internship.entity.UniversityEntity;
import com.ioc.internship.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')")
public class AdminController extends BaseController {

    private final AdminService adminService;

    // 1. Dashboard Overview & Realtime KPIs
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<AdminDashboardStatsRes>> getDashboardStats() {
        AdminDashboardStatsRes stats = adminService.getDashboardStats();
        return success(stats, "Tải dữ liệu bảng điều khiển thành công");
    }

    // 2. Listing Moderation & Approval Queue
    @GetMapping("/listings")
    public ResponseEntity<ApiResponse<PaginatedRes<ListingDetailRes>>> getListings(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long universityId,
            @RequestParam(required = false) Boolean isRiskFlagged,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PaginatedRes<ListingDetailRes> res = adminService.getListings(keyword, status, categoryId, universityId, isRiskFlagged, page, size);
        return success(res);
    }

    @PatchMapping("/listings/{id}/moderate")
    public ResponseEntity<ApiResponse<ListingDetailRes>> moderateListing(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ListingModerationReq req) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        String adminEmail = principal != null ? principal.getEmail() : "admin@gmail.com";
        ListingDetailRes res = adminService.moderateListing(adminId, adminEmail, id, req);
        return success(res, "Cập nhật trạng thái kiểm duyệt bài đăng thành công");
    }

    // 3. User Management & Student Verification
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PaginatedRes<UserDetailRes>>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long universityId,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PaginatedRes<UserDetailRes> res = adminService.getUsers(keyword, universityId, status, verified, page, size);
        return success(res);
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserDetailRes>> updateUserStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateReq req) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        String adminEmail = principal != null ? principal.getEmail() : "admin@gmail.com";
        UserDetailRes res = adminService.updateUserStatus(adminId, adminEmail, id, req);
        return success(res, "Cập nhật trạng thái tài khoản thành công");
    }

    @PatchMapping("/users/{id}/student-card")
    public ResponseEntity<ApiResponse<UserDetailRes>> reviewStudentCard(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody StudentCardReviewReq req) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        String adminEmail = principal != null ? principal.getEmail() : "admin@gmail.com";
        UserDetailRes res = adminService.reviewStudentCard(adminId, adminEmail, id, req);
        return success(res, "Xử lý duyệt thẻ sinh viên thành công");
    }

    // 4. Metadata Management: Categories
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryEntity>>> getCategories() {
        return success(adminService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryEntity>> createCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CategoryReq req) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        String adminEmail = principal != null ? principal.getEmail() : "admin@gmail.com";
        CategoryEntity res = adminService.createCategory(adminId, adminEmail, req);
        return created(res, "Tạo danh mục mới thành công");
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryEntity>> updateCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CategoryReq req) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        String adminEmail = principal != null ? principal.getEmail() : "admin@gmail.com";
        CategoryEntity res = adminService.updateCategory(adminId, adminEmail, id, req);
        return success(res, "Cập nhật danh mục thành công");
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        String adminEmail = principal != null ? principal.getEmail() : "admin@gmail.com";
        adminService.deleteCategory(adminId, adminEmail, id);
        return success(null, "Đã xóa danh mục thành công");
    }

    // 5. Metadata Management: Universities & Campuses
    @GetMapping("/universities")
    public ResponseEntity<ApiResponse<List<UniversityEntity>>> getUniversities() {
        return success(adminService.getAllUniversities());
    }

    @PostMapping("/universities")
    public ResponseEntity<ApiResponse<UniversityEntity>> createUniversity(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UniversityReq req) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        String adminEmail = principal != null ? principal.getEmail() : "admin@gmail.com";
        UniversityEntity res = adminService.createUniversity(adminId, adminEmail, req);
        return created(res, "Thêm trường đại học mới thành công");
    }

    @PutMapping("/universities/{id}")
    public ResponseEntity<ApiResponse<UniversityEntity>> updateUniversity(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UniversityReq req) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        String adminEmail = principal != null ? principal.getEmail() : "admin@gmail.com";
        UniversityEntity res = adminService.updateUniversity(adminId, adminEmail, id, req);
        return success(res, "Cập nhật trường đại học thành công");
    }

    @PostMapping("/campuses")
    public ResponseEntity<ApiResponse<CampusEntity>> createCampus(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CampusReq req) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        String adminEmail = principal != null ? principal.getEmail() : "admin@gmail.com";
        CampusEntity res = adminService.createCampus(adminId, adminEmail, req);
        return created(res, "Thêm cơ sở / KTX mới thành công");
    }

    // 6. Security & RBAC: Keywords Blacklist & Audit Logs
    @GetMapping("/keywords")
    public ResponseEntity<ApiResponse<List<KeywordBlacklistEntity>>> getBlacklistKeywords() {
        return success(adminService.getAllBlacklistKeywords());
    }

    @PostMapping("/keywords")
    public ResponseEntity<ApiResponse<KeywordBlacklistEntity>> addBlacklistKeyword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody KeywordBlacklistReq req) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        String adminEmail = principal != null ? principal.getEmail() : "admin@gmail.com";
        KeywordBlacklistEntity res = adminService.addBlacklistKeyword(adminId, adminEmail, req);
        return created(res, "Thêm từ khóa cấm thành công");
    }

    @DeleteMapping("/keywords/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBlacklistKeyword(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        String adminEmail = principal != null ? principal.getEmail() : "admin@gmail.com";
        adminService.deleteBlacklistKeyword(adminId, adminEmail, id);
        return success(null, "Đã xóa từ khóa khỏi danh sách cấm");
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<PaginatedRes<AuditLogRes>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PaginatedRes<AuditLogRes> res = adminService.getAuditLogs(page, size);
        return success(res, "Tải nhật ký kiểm toán thành công");
    }
}
