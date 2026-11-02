import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  ShoppingBag,
  Layers,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Search,
  BadgeCheck,
  Lock,
  Unlock,
  FileText,
  RefreshCw,
  Clock,
  BarChart3,
  AlertOctagon,
  MessageSquare,
  UserX,
  CreditCard,
  ExternalLink,
  Image as ImageIcon,
  Check,
  X,
  Zap,
  Eye,
  MapPin,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { BaseModal } from '../../components/base/BaseModal';
import {
  adminService,
  AdminStats,
  AdminListingItem,
  AdminUserItem,
  CategoryItem,
  KeywordBlacklistItem,
  AuditLogItem,
  BannedStudentItem,
} from '../../services/adminService';
import { reportService, ResolveReportPayload } from '../../services/reportService';
import { ReportItem } from '../../types';
import { keywordViolationService, KeywordViolationRecord } from '../../services/keywordViolationService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { studentNotificationService } from '../../services/studentNotificationService';
import { adminNotificationService } from '../../services/adminNotificationService';
import { useAuthStore } from '../../store/useAuthStore';

type TabType = 'overview' | 'listings' | 'users' | 'reports' | 'metadata' | 'settings';

export const AdminDashboardPage: React.FC = () => {
  const location = useLocation();

  const getTabFromPath = (pathname: string): TabType => {
    if (pathname.includes('/listings') || pathname.includes('/moderation')) return 'listings';
    if (pathname.includes('/users')) return 'users';
    if (pathname.includes('/reports')) return 'reports';
    if (pathname.includes('/metadata')) return 'metadata';
    if (pathname.includes('/settings')) return 'settings';
    return 'overview';
  };

  const activeTab = getTabFromPath(location.pathname);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [approvalToast, setApprovalToast] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    isAllDone?: boolean;
  } | null>(null);

  // 1. Listings State
  const [listings, setListings] = useState<AdminListingItem[]>([]);
  const [listingStatus, setListingStatus] = useState<string>('ALL');
  const [listingKeyword, setListingKeyword] = useState<string>('');
  const [listingRiskOnly, setListingRiskOnly] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<AdminListingItem | null>(null);
  const [detailModalListing, setDetailModalListing] = useState<AdminListingItem | null>(null);
  const [detailActiveImgIndex, setDetailActiveImgIndex] = useState<number>(0);
  const [rejectReasonModal, setRejectReasonModal] = useState<boolean>(false);
  const [presetReason, setPresetReason] = useState<string>('Ảnh vi phạm bản quyền hoặc mờ');
  const [customNote, setCustomNote] = useState<string>('');

  // Helper: Trích xuất Mã sinh viên (MSSV) của người bán (không hiện trường)
  const getSellerStudentCode = (item: AdminListingItem) => {
    if (item.authorStudentCode && item.authorStudentCode.trim()) {
      return item.authorStudentCode.trim();
    }
    const matchedUser = allUsers.find((u) => u.id === item.userId) || users.find((u) => u.id === item.userId);
    if (matchedUser?.studentCode && matchedUser.studentCode.trim()) {
      return matchedUser.studentCode.trim();
    }
    if (matchedUser?.email && matchedUser.email.includes('@')) {
      const prefix = matchedUser.email.split('@')[0];
      if (/\d+/.test(prefix)) return prefix;
    }
    return '2301' + String(item.userId).padStart(4, '0');
  };

  // 2. Users State
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUserItem[]>([]);
  const [bannedStudents, setBannedStudents] = useState<BannedStudentItem[]>([]);
  const [showBannedModal, setShowBannedModal] = useState<boolean>(false);
  const [userKeyword, setUserKeyword] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [karmaAdjModal, setKarmaAdjModal] = useState<boolean>(false);
  const [karmaAmount, setKarmaAmount] = useState<number>(0);
  const [karmaReason, setKarmaReason] = useState<string>('');

  // Student Card Verification & Violating Posts Modals
  const [selectedCardUser, setSelectedCardUser] = useState<AdminUserItem | null>(null);
  const [studentCardModal, setStudentCardModal] = useState<boolean>(false);
  const [selectedViolatingUser, setSelectedViolatingUser] = useState<AdminUserItem | null>(null);
  const [violatingModal, setViolatingModal] = useState<boolean>(false);

  const studentTotalCount = allUsers.length > 0 ? allUsers.length : users.length;
  const studentActiveCount = allUsers.length > 0
    ? allUsers.filter((u) => u.status === 'ACTIVE').length
    : users.filter((u) => u.status === 'ACTIVE').length;
  const studentBlockedCount = allUsers.length > 0
    ? allUsers.filter((u) => u.status === 'SUSPENDED' || u.status === 'BANNED' || u.status === 'BLOCKED').length
    : users.filter((u) => u.status === 'SUSPENDED' || u.status === 'BANNED' || u.status === 'BLOCKED').length;

  // 3. Reports State
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportFilterTab, setReportFilterTab] = useState<'LOCK_WARNING' | 'ALL' | 'PENDING' | 'RESOLVED'>('LOCK_WARNING');

  const pendingReportsCount = reports.filter((r) => r.status === 'PENDING' || r.status === 'OPEN').length;
  const lockWarningReportsCount = reports.filter(
    (r) =>
      (r.status === 'PENDING' || r.status === 'OPEN') &&
      (r.reason === 'SCAM_OR_FRAUD' ||
        r.reason === 'PROHIBITED_ITEMS' ||
        r.severity === 'CRITICAL' ||
        r.severity === 'HIGH')
  ).length;
  const resolvedReportsCount = reports.filter((r) => r.status === 'RESOLVED' || r.status === 'REJECTED').length;

  const displayedReports = reports.filter((r) => {
    if (reportFilterTab === 'LOCK_WARNING') {
      return (
        (r.status === 'PENDING' || r.status === 'OPEN') &&
        (r.reason === 'SCAM_OR_FRAUD' ||
          r.reason === 'PROHIBITED_ITEMS' ||
          r.severity === 'CRITICAL' ||
          r.severity === 'HIGH')
      );
    }
    if (reportFilterTab === 'PENDING') {
      return r.status === 'PENDING' || r.status === 'OPEN';
    }
    if (reportFilterTab === 'RESOLVED') {
      return r.status === 'RESOLVED' || r.status === 'REJECTED';
    }
    return true;
  });

  // 4. Metadata State (Chỉ quản lý Danh mục sản phẩm)
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');

  // 5. Settings & RBAC State
  const [keywords, setKeywords] = useState<KeywordBlacklistItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [keywordViolations, setKeywordViolations] = useState<KeywordViolationRecord[]>([]);
  const [newKw, setNewKw] = useState('');
  const [newKwCategory, setNewKwCategory] = useState('PROHIBITED_GOODS');
  const [newKwReason, setNewKwReason] = useState('');

  // Custom User Action Modal (Chấm dứt hoàn toàn window.prompt)
  const [userActionModal, setUserActionModal] = useState<{
    isOpen: boolean;
    user: AdminUserItem | null;
    actionType: 'SUSPEND_1_DAY' | 'SUSPEND_1_WEEK' | 'BAN';
    reason: string;
  }>({
    isOpen: false,
    user: null,
    actionType: 'SUSPEND_1_WEEK',
    reason: '',
  });

  // Confirmation Modal State (Mọi thao tác quản trị viên đều phải xác nhận 2 bước)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const askConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    isDestructive = false,
    confirmText = 'Xác nhận thực hiện',
    cancelText = 'Hủy bỏ'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDestructive,
      confirmText,
      cancelText,
    });
  };

  // Notification helper
  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Load Overview Data
  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await adminService.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load Listings
  const loadListings = async () => {
    try {
      setLoading(true);
      const res = await adminService.getListings({
        keyword: listingKeyword || undefined,
        status: listingStatus !== 'ALL' ? listingStatus : undefined,
        isRiskFlagged: listingRiskOnly ? true : undefined,
      });
      if (res.success && res.data) {
        setListings(res.data.items || []);
      }
      // Đồng bộ thông báo chuông admin với danh sách bài chờ duyệt từ backend
      adminNotificationService.syncWithBackend();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load Users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        keyword: userKeyword || undefined,
      });
      if (res.success && res.data) {
        const phenikaaOnly = (res.data.items || []).filter(
          (u) =>
            u.email.toLowerCase().includes('phenikaa-uni.edu.vn') ||
            u.universityName?.toLowerCase().includes('phenikaa')
        );

        // Đồng bộ trạng thái khóa tạm thời từ keywordViolationService & useAuthStore
        const merged = phenikaaOnly.map((u) => {
          const isKwSuspended = keywordViolationService.isUserSuspended(u.id);
          const kwRecord = keywordViolationService.getRecordByUserId(u.id);
          const currentAuth = useAuthStore.getState().user;
          const isCurrentSuspended =
            currentAuth &&
            (currentAuth.id === u.id || String(currentAuth.id) === String(u.id)) &&
            (currentAuth.status === 'SUSPENDED' || currentAuth.status === 'BANNED' || currentAuth.status === 'BLOCKED');

          if (isKwSuspended || isCurrentSuspended || u.status === 'SUSPENDED') {
            const blockReason =
              u.blockReason ||
              (isCurrentSuspended && currentAuth?.blockReason ? currentAuth.blockReason : undefined) ||
              (kwRecord?.lastViolationKeyword
                ? `Tạm khóa do vi phạm từ cấm: "${kwRecord.lastViolationKeyword}"`
                : 'Tạm khóa 1 tuần do bị báo cáo vi phạm quy định sàn liên tục trong 24h.');
            return {
              ...u,
              status: u.status === 'BANNED' ? 'BANNED' : 'SUSPENDED',
              blockReason,
            };
          }
          return u;
        });

        setAllUsers(merged);

        if (userStatusFilter === 'ALL') {
          setUsers(merged);
        } else if (userStatusFilter === 'ACTIVE') {
          setUsers(merged.filter((u) => u.status === 'ACTIVE'));
        } else if (userStatusFilter === 'BLOCKED_ONLY') {
          setUsers(merged.filter((u) => u.status === 'SUSPENDED' || u.status === 'BANNED' || u.status === 'BLOCKED'));
        } else if (userStatusFilter === 'SUSPENDED') {
          setUsers(merged.filter((u) => u.status === 'SUSPENDED'));
        } else if (userStatusFilter === 'BANNED') {
          setUsers(merged.filter((u) => u.status === 'BANNED'));
        }
      }

      try {
        const bannedRes = await adminService.getBannedStudents();
        if (bannedRes.success && bannedRes.data) {
          setBannedStudents(bannedRes.data);
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load Reports
  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await reportService.getReports('ALL', 'ALL');
      if (res.success && res.data) {
        setReports(res.data.items || res.data.content || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load Metadata (Chỉ tải danh mục)
  const loadMetadata = async () => {
    try {
      const catRes = await adminService.getCategories();
      if (catRes.success && catRes.data) setCategories(catRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Settings & Audit
  const loadSettings = async () => {
    try {
      const [kwRes, logRes] = await Promise.all([
        adminService.getBlacklistKeywords(),
        adminService.getAuditLogs({ page: 0, size: 30 }),
      ]);
      if (kwRes.success && kwRes.data) setKeywords(kwRes.data);
      
      const localLogs = keywordViolationService.getAuditLogs();
      const backendLogs = logRes.success && logRes.data ? (logRes.data.items || []) : [];
      setAuditLogs([...localLogs, ...backendLogs]);
      setKeywordViolations(keywordViolationService.getRecords());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStats();
    loadMetadata();
    loadUsers();

    const handleNotifUpdate = () => {
      loadStats();
      loadUsers();
      loadReports();
    };
    const handleViolationsUpdate = () => {
      setKeywordViolations(keywordViolationService.getRecords());
      const localLogs = keywordViolationService.getAuditLogs();
      setAuditLogs((prev) => [...localLogs, ...prev.filter((p) => !localLogs.some((l: any) => l.id === p.id))]);
      loadUsers();
      loadStats();
    };

    window.addEventListener('admin_notifications_updated', handleNotifUpdate);
    window.addEventListener('campus_keyword_violations_updated', handleViolationsUpdate);
    window.addEventListener('campus_user_status_changed', handleViolationsUpdate);
    window.addEventListener('student_notifications_updated', handleNotifUpdate);
    window.addEventListener('campus_audit_logs_updated', handleViolationsUpdate);
    return () => {
      window.removeEventListener('admin_notifications_updated', handleNotifUpdate);
      window.removeEventListener('campus_keyword_violations_updated', handleViolationsUpdate);
      window.removeEventListener('campus_user_status_changed', handleViolationsUpdate);
      window.removeEventListener('student_notifications_updated', handleNotifUpdate);
      window.removeEventListener('campus_audit_logs_updated', handleViolationsUpdate);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') loadStats();
    if (activeTab === 'listings') {
      loadListings();
      if (allUsers.length === 0) loadUsers();
    }
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'metadata') loadMetadata();
    if (activeTab === 'settings') loadSettings();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'listings') {
      loadListings();
      if (allUsers.length === 0) loadUsers();
    }
  }, [listingStatus, listingRiskOnly]);

  useEffect(() => {
    if (allUsers.length > 0) {
      if (userStatusFilter === 'ALL') {
        setUsers(allUsers);
      } else if (userStatusFilter === 'ACTIVE') {
        setUsers(allUsers.filter((u) => u.status === 'ACTIVE'));
      } else if (userStatusFilter === 'BLOCKED_ONLY') {
        setUsers(allUsers.filter((u) => u.status === 'SUSPENDED' || u.status === 'BANNED' || u.status === 'BLOCKED'));
      } else if (userStatusFilter === 'SUSPENDED') {
        setUsers(allUsers.filter((u) => u.status === 'SUSPENDED'));
      } else if (userStatusFilter === 'BANNED') {
        setUsers(allUsers.filter((u) => u.status === 'BANNED'));
      }
    } else {
      loadUsers();
    }
  }, [userStatusFilter]);

  // Moderation Handler
  const handleModerateListing = async (listingId: number, action: string, reason?: string) => {
    try {
      const selectedReason = reason || (action === 'APPROVE' ? 'Bài đăng hợp lệ, đạt chuẩn quy chế' : presetReason);
      const res = await adminService.moderateListing(listingId, {
        action,
        reason: selectedReason,
        note: customNote,
      });
      if (res.success) {
        notify(`Đã cập nhật bài đăng #${listingId}: ${action === 'APPROVE' ? 'Đã duyệt' : action === 'REJECT' ? 'Đã từ chối kèm lý do' : action}`);
        setRejectReasonModal(false);
        setCustomNote('');
        loadListings();
        loadStats();
      }
    } catch (e) {
      notify('Lỗi khi kiểm duyệt bài đăng!');
    }
  };

  // Phê duyệt ngay lập tức 1 bài đăng (không cần modal lý do)
  const handleDirectApproveListing = async (item: AdminListingItem) => {
    try {
      setLoading(true);
      const res = await adminService.moderateListing(item.id, {
        action: 'APPROVE',
        reason: 'Bài đăng hợp lệ, thông tin và hình ảnh đúng quy chế Phenikaa Marketplace',
      });
      if (res.success) {
        // 1. Đồng bộ giải quyết thông báo chuông admin
        adminNotificationService.resolveListingNotification(item.id, 'APPROVED');

        // 2. Gửi thông báo tới chuông của sinh viên
        studentNotificationService.addLocalNotification({
          title: 'Bài đăng của bạn đã được phê duyệt!',
          message: `Bài đăng "${item.title}" (${item.price?.toLocaleString()} đ) đã được Quản trị viên duyệt và đang hiển thị công khai trên sàn.`,
          type: 'LISTING_APPROVED',
          referenceId: item.id,
        }, item.userId);

        // 3. Đếm số bài PENDING còn lại trong danh sách
        const currentPending = listings.filter((l) => l.status === 'PENDING_APPROVAL');
        const remainingCount = currentPending.filter((l) => l.id !== item.id).length;

        if (remainingCount === 0) {
          setApprovalToast({
            isOpen: true,
            title: 'Đã duyệt xong hết',
            subtitle: `Bài viết "${item.title}" đã được duyệt. Hiện tại không còn bài đăng nào cần duyệt trong hàng đợi!`,
            isAllDone: true,
          });
        } else {
          setApprovalToast({
            isOpen: true,
            title: 'Đã duyệt bài viết',
            subtitle: `Đã duyệt bài viết "${item.title}". Còn lại ${remainingCount} bài cần duyệt trong hàng đợi.`,
            isAllDone: false,
          });
        }

        setTimeout(() => {
          setApprovalToast((prev) => (prev ? { ...prev, isOpen: false } : null));
        }, 3500);

        loadListings();
        loadStats();
      }
    } catch {
      notify('Lỗi khi phê duyệt bài đăng!');
    } finally {
      setLoading(false);
    }
  };

  // Duyệt nhanh tất cả bài đăng đang chờ duyệt (Queue)
  const handleFastApproveAll = async () => {
    const pendingListings = listings.filter((l) => l.status === 'PENDING_APPROVAL');
    if (pendingListings.length === 0) {
      notify('Không có bài đăng nào đang chờ duyệt!');
      return;
    }

    try {
      setLoading(true);
      for (const item of pendingListings) {
        await adminService.moderateListing(item.id, {
          action: 'APPROVE',
          reason: 'Duyệt nhanh tự động bởi Quản trị viên',
        });
        adminNotificationService.resolveListingNotification(item.id, 'APPROVED');
        studentNotificationService.addLocalNotification({
          title: 'Bài đăng của bạn đã được phê duyệt!',
          message: `Bài đăng "${item.title}" (${item.price?.toLocaleString()} đ) đã được Quản trị viên duyệt nhanh và đang hiển thị công khai trên sàn.`,
          type: 'LISTING_APPROVED',
          referenceId: item.id,
        }, item.userId);
      }

      setApprovalToast({
        isOpen: true,
        title: 'Đã duyệt xong hết',
        subtitle: `Đã duyệt nhanh thành công toàn bộ ${pendingListings.length} bài đăng trong hàng đợi!`,
        isAllDone: true,
      });

      setTimeout(() => {
        setApprovalToast((prev) => (prev ? { ...prev, isOpen: false } : null));
      }, 4000);

      loadListings();
      loadStats();
    } catch {
      notify('Có lỗi xảy ra trong quá trình duyệt nhanh!');
    } finally {
      setLoading(false);
    }
  };

  // User Actions Handler with Student Realtime Notification & Karma Sync
  const handleUserAction = async (userId: number, action: string, karmaAdjustment?: number, reason?: string) => {
    try {
      const res = await adminService.updateUserStatus(userId, {
        action,
        karmaAdjustment,
        reason,
      });
      if (res.success) {
        const actionLabel = action === 'ACTIVATE' ? 'Mở khóa tài khoản' : action === 'BAN' ? 'Cấm vĩnh viễn' : 'Tạm khóa';
        notify(`Đã ${actionLabel} cho tài khoản #${userId} thành công (Đã gửi thông báo về chuông của sinh viên)`);
        setKarmaAdjModal(false);

        // 1. Đồng bộ thông báo gửi về chuông thông báo sinh viên
        if (action === 'SUSPEND') {
          studentNotificationService.addLocalNotification({
            title: 'Tài khoản của bạn đã bị Ban Quản Trị tạm khóa',
            message: `Tài khoản của bạn tạm thời bị khóa do vi phạm: "${reason || 'Nghi ngờ vi phạm quy định'}". Điểm Karma điều chỉnh: ${karmaAdjustment || -10}. Bạn tạm thời không thể đăng bài hoặc trao đổi.`,
            type: 'WARNING',
            reason: reason || 'Tạm khóa do vi phạm',
            referenceId: userId,
          }, userId);
        } else if (action === 'BAN') {
          studentNotificationService.addLocalNotification({
            title: 'Tài khoản của bạn đã bị Cấm Vĩnh Viễn',
            message: `Tài khoản của bạn đã bị CẤM VĨNH VIỄN do vi phạm nghiêm trọng: "${reason || 'Vi phạm nghiêm trọng quy chế'}". Điểm Karma điều chỉnh: ${karmaAdjustment || -50}.`,
            type: 'WARNING',
            reason: reason || 'Cấm vĩnh viễn',
            referenceId: userId,
          }, userId);
        } else if (action === 'ACTIVATE') {
          studentNotificationService.addLocalNotification({
            title: 'Tài khoản của bạn đã được mở khóa',
            message: 'Ban Quản Trị đã mở khóa tài khoản của bạn. Lượt an toàn vi phạm đã được khôi phục về ban đầu (3/3). Bạn đã có thể tiếp tục đăng bài và trao đổi trên sàn Campus Marketplace.',
            type: 'SYSTEM',
            reason: 'Đã mở khóa tài khoản',
            referenceId: userId,
          }, userId);
          // Khôi phục số lượt an toàn về ban đầu (3/3)
          keywordViolationService.restoreSafeChances(userId, 'Quản Trị Viên mở khóa tài khoản - Hồi phục lượt an toàn 3/3');
        }

        // 2. Đồng bộ trạng thái và điểm Karma cho sinh viên nếu đang đăng nhập trên trình duyệt
        const currentAuthUser = useAuthStore.getState().user;
        if (currentAuthUser && (currentAuthUser.id === userId || String(currentAuthUser.id) === String(userId))) {
          const newStatus = action === 'ACTIVATE' ? 'ACTIVE' : action === 'BAN' ? 'BANNED' : 'SUSPENDED';
          const newKarma = Math.max(0, (currentAuthUser.karmaScore || 0) + (karmaAdjustment || 0));
          const updatedUser = {
            ...currentAuthUser,
            status: newStatus as any,
            blockReason: action === 'ACTIVATE' ? undefined : reason,
            karmaScore: newKarma,
          };
          localStorage.setItem('user_info', JSON.stringify(updatedUser));
          useAuthStore.setState({ user: updatedUser });
        }

        // 3. Phát sự kiện toàn cục để các component (StudentNotificationBell, MainLayout...) cập nhật ngay lập tức
        window.dispatchEvent(new CustomEvent('student_notifications_updated'));
        window.dispatchEvent(new CustomEvent('campus_user_status_changed', { detail: { userId, action, reason, karmaAdjustment } }));

        loadUsers();
        loadStats();
        loadSettings();
      }
    } catch (e) {
      notify('Lỗi khi cập nhật tài khoản!');
    }
  };

  // Student Card Verification Handler
  const handleVerifyStudentCard = async (userId: number, action: string) => {
    try {
      const res = await adminService.reviewStudentCard(userId, { action, karmaAward: 15 });
      if (res.success) {
        notify(`Đã ${action === 'APPROVE' ? 'cấp tích xanh sinh viên (+15 Karma)' : 'hủy xác thực'} cho người dùng #${userId}`);
        loadUsers();
      }
    } catch (e) {
      notify('Lỗi khi duyệt thẻ sinh viên!');
    }
  };

  // Add Blacklist Keyword
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKw.trim()) return;
    try {
      const res = await adminService.addBlacklistKeyword({
        keyword: newKw.trim(),
        category: newKwCategory,
        reason: newKwReason || 'Từ khóa cấm theo quy chế sinh viên',
      });
      if (res.success) {
        notify(`Đã thêm từ khóa cấm: "${newKw}"`);
        setNewKw('');
        setNewKwReason('');
        loadSettings();
      }
    } catch (e) {
      notify('Từ khóa này đã tồn tại hoặc không hợp lệ!');
    }
  };

  // Delete Keyword
  const handleDeleteKeyword = async (id: number) => {
    try {
      await adminService.deleteBlacklistKeyword(id);
      notify('Đã xóa từ khóa cấm');
      loadSettings();
    } catch (e) {
      notify('Lỗi khi xóa từ khóa');
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await adminService.createCategory({
        name: newCatName.trim(),
        slug: newCatSlug || undefined,
        icon: 'Folder',
      });
      if (res.success) {
        notify(`Đã thêm danh mục: ${newCatName}`);
        setShowCatModal(false);
        setNewCatName('');
        setNewCatSlug('');
        loadMetadata();
      }
    } catch (e) {
      notify('Lỗi khi thêm danh mục');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Floating Action Notice Toast */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border border-indigo-400/30 backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-white/70 hover:text-white ml-2 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* KHUNG THÔNG BÁO XANH LÁ Ở GÓC MÀN HÌNH KHI DUYỆT BÀI (CÓ LOGO TRÒN HÌNH TÍCH XANH LÁ Ở ĐẦU) */}
      {approvalToast && approvalToast.isOpen && (
        <div className="fixed top-6 right-6 z-[9999] max-w-sm sm:max-w-md w-[calc(100vw-3rem)] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 dark:bg-emerald-700 text-white rounded-2xl p-4 shadow-2xl shadow-emerald-950/40 border-2 border-emerald-400 flex items-start gap-3.5">
            {/* Logo tròn hình tích xanh lá ở đầu */}
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/30 ring-4 ring-emerald-400/40">
              <Check className="w-6 h-6 stroke-[3.5] text-emerald-600" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                  {approvalToast.title}
                </h4>
                <button
                  type="button"
                  onClick={() => setApprovalToast(null)}
                  className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {approvalToast.subtitle && (
                <p className="text-xs text-emerald-100 font-medium mt-1 leading-relaxed">
                  {approvalToast.subtitle}
                </p>
              )}

              <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-emerald-500/50">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px]">
                  {approvalToast.isAllDone ? '🎉 Hoàn tất duyệt bài' : '✅ Đã công khai trên sàn'}
                </span>
                <span className="text-emerald-200 text-[10px] italic">
                  Đã đồng bộ chuông thông báo sinh viên
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Header & Subtitle with Quick Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>Bảng Điều Khiển Tổng Quan</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Giám sát vận hành sàn, hàng đợi kiểm duyệt tin đăng, phòng ngừa gian lận & mạng lưới sinh viên
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  loadStats();
                  notify('Đã đồng bộ lại chỉ số hệ thống!');
                }}
                disabled={loading}
                className="flex items-center gap-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-800 transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{loading ? 'Đang đồng bộ...' : 'Làm mới số liệu'}</span>
              </button>
            </div>
          </div>

          {/* Emergency Alerts Banner - Tự động ẩn khi không có tài khoản vi phạm hoặc đã duyệt khóa/bỏ qua hết */}
          {stats && stats.emergencyAlerts && stats.emergencyAlerts.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-4 shadow-lg shadow-rose-950/20 animate-in fade-in">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 flex-shrink-0">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-rose-400 text-sm">
                    CẢNH BÁO KHẨN CẤP: Có {stats.emergencyAlerts.length} tài khoản bị báo cáo nhiều lần trong 24h qua!
                  </h3>
                  <button
                    onClick={() => {
                      askConfirmation(
                        'Xác nhận bỏ qua tất cả cảnh báo',
                        `Bạn có chắc chắn muốn bỏ qua toàn bộ ${stats.emergencyAlerts.length} cảnh báo vi phạm khẩn cấp này không? Các báo cáo liên quan sẽ được đóng lại.`,
                        async () => {
                          try {
                            for (const a of stats.emergencyAlerts) {
                              await reportService.dismissUserReports(a.userId);
                            }
                            setStats((prev) => (prev ? { ...prev, emergencyAlerts: [] } : prev));
                            notify('Đã bỏ qua toàn bộ cảnh báo vi phạm khẩn cấp!');
                            loadStats();
                          } catch {
                            notify('Lỗi khi bỏ qua cảnh báo!');
                          }
                        },
                        false,
                        'Bỏ qua tất cả',
                        'Hủy bỏ'
                      );
                    }}
                    className="text-xs text-rose-400 hover:text-white underline font-semibold transition-colors"
                  >
                    Bỏ qua tất cả
                  </button>
                </div>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  Các tài khoản sau khi được xác nhận khóa hoặc bỏ qua sẽ tự động biến mất khỏi danh sách cảnh báo.
                </p>
                <div className="mt-3 space-y-2">
                  {stats.emergencyAlerts.map((alert) => (
                    <div
                      key={alert.userId}
                      className="flex items-center justify-between bg-slate-900/90 px-3.5 py-2.5 rounded-xl text-xs border border-rose-500/20 hover:border-rose-500/40 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <span className="font-semibold text-white">{alert.fullName}</span>{' '}
                        <span className="text-slate-400">({alert.email})</span>
                        <span className="text-rose-400 ml-2 font-medium bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          Bị báo cáo {alert.reportCount} lần
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Nút Bỏ qua */}
                        <button
                          onClick={() => {
                            askConfirmation(
                              'Xác nhận bỏ qua cảnh báo vi phạm',
                              `Bạn có chắc chắn muốn bỏ qua cảnh báo vi phạm cho tài khoản "${alert.fullName}" (${alert.email}) không?\n\nCác báo cáo vi phạm hiện tại sẽ được đánh dấu đã xem xét và đóng lại.`,
                              async () => {
                                try {
                                  await reportService.dismissUserReports(alert.userId);
                                  setStats((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          emergencyAlerts: prev.emergencyAlerts.filter((a) => a.userId !== alert.userId),
                                        }
                                      : prev
                                  );
                                  notify(`Đã bỏ qua cảnh báo vi phạm cho ${alert.fullName}!`);
                                  loadStats();
                                } catch {
                                  notify('Lỗi khi bỏ qua cảnh báo!');
                                }
                              },
                              false,
                              'Bỏ qua cảnh báo',
                              'Hủy bỏ'
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-700/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-colors"
                        >
                          Bỏ qua
                        </button>

                        {/* Nút Khóa tạm thời ngay (yêu cầu xác nhận) */}
                        <button
                          onClick={() => {
                            askConfirmation(
                              'Xác nhận tạm khóa tài khoản vi phạm',
                              `Bạn có chắc chắn muốn khóa tạm thời tài khoản "${alert.fullName}" (${alert.email}) trong vòng 1 tuần do bị báo cáo ${alert.reportCount} lần vi phạm không?\n\n- Quyền đăng bài mới sẽ bị tạm ngưng.\n- Giao dịch mua bán & nhắn tin bị tạm ngưng.\n- Tài khoản bị trừ 20 điểm uy tín Karma.`,
                              async () => {
                                try {
                                  await adminService.updateUserStatus(alert.userId, {
                                    action: 'SUSPEND',
                                    karmaAdjustment: -20,
                                    reason: 'Tạm khóa 1 tuần do bị báo cáo liên tục trong 24h',
                                  });
                                  setStats((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          emergencyAlerts: prev.emergencyAlerts.filter((a) => a.userId !== alert.userId),
                                          blockedStudentsCount: (prev.blockedStudentsCount || 0) + 1,
                                        }
                                      : prev
                                  );
                                  notify(`Đã khóa tạm thời tài khoản "${alert.fullName}" thành công! Cảnh báo đã được giải quyết.`);
                                  loadStats();
                                  loadUsers();
                                } catch {
                                  notify('Lỗi khi khóa tài khoản!');
                                }
                              },
                              true,
                              'Khóa tài khoản ngay',
                              'Hủy bỏ'
                            );
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                        >
                          Khóa tạm thời ngay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4 Realtime KPI Cards with vibrant accents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bài đăng chờ duyệt</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white tracking-tight">
                {stats ? stats.pendingListingsCount : '0'}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-amber-400 font-medium">Cần kiểm duyệt nội dung</span>
                <Link to="/admin/listings" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5">
                  Xử lý →
                </Link>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/80 hover:border-rose-500/40 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Báo cáo vi phạm</span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white tracking-tight">
                {stats ? stats.openReportsCount : '0'}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-rose-400 font-medium">Khiếu nại chưa xử lý</span>
                <Link to="/admin/reports" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5">
                  Xem ngay →
                </Link>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sinh viên mạng lưới</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white tracking-tight">
                {stats?.totalUsers || 1}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium">+{stats?.todayNewUsersCount || 0} mới hôm nay</span>
                <Link to="/admin/users" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5">
                  Quản lý →
                </Link>
              </div>
            </div>

            {/* KPI 4: Sinh viên bị chặn */}
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/80 hover:border-rose-500/40 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Sinh viên bị chặn</span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserX className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-rose-400 tracking-tight">
                {stats?.blockedStudentsCount || 0}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-rose-400/80 font-medium">Khóa / Cấm vĩnh viễn</span>
                <Link
                  to="/admin/users"
                  onClick={() => setUserStatusFilter('BLOCKED_ONLY')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
                >
                  Danh sách →
                </Link>
              </div>
            </div>
          </div>

          {/* Charts & Distribution Section */}
          <div className="w-full">
            {/* Listings by Category */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>Lưu lượng bài đăng theo danh mục</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Phân bố ngành hàng toàn sàn</span>
              </div>

              <div>
                {(() => {
                  const hasData = stats && stats.listingsByCategory && Object.keys(stats.listingsByCategory).length > 0 && (stats.totalListings || 0) > 0;
                  if (!hasData) {
                    return (
                      <div className="py-8 text-center text-slate-500 text-xs font-mono">
                        Chưa có bài đăng nào trên hệ thống. Dữ liệu phân bổ ngành hàng sẽ tự động cập nhật ngay khi bạn đăng sản phẩm đầu tiên.
                      </div>
                    );
                  }

                  const categoriesToDisplay = Object.entries(stats.listingsByCategory).map(([cat, count]) => ({
                    name: cat,
                    count,
                    pct: Math.round((count / (stats.totalListings || 1)) * 100),
                  }));

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {categoriesToDisplay.map((item, idx) => {
                        const gradients = [
                          'from-indigo-500 to-indigo-600',
                          'from-emerald-400 to-teal-500',
                          'from-amber-400 to-orange-500',
                          'from-purple-500 to-pink-500',
                        ];
                        const barGradient = gradients[idx % gradients.length];

                        return (
                          <div key={item.name} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-300 font-medium">{item.name}</span>
                              <span className="text-white font-bold">{item.count} bài ({item.pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
                              <div
                                className={`bg-gradient-to-r ${barGradient} h-full rounded-full transition-all duration-500`}
                                style={{ width: `${Math.max(item.pct, 5)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

          {/* TAB 2: LISTINGS & MODERATION */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <ShoppingBag className="w-6 h-6 text-indigo-400" />
                    <span>Quản Lý Bài Đăng</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Quản lý toàn bộ bài đăng sàn sinh viên: Được duyệt, Chưa được duyệt, Bị cấm và Bị xóa
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  {listings.filter((l) => l.status === 'PENDING_APPROVAL').length > 0 && (
                    <button
                      onClick={handleFastApproveAll}
                      disabled={loading}
                      className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl border border-emerald-400/40 transition-all shadow-md shadow-emerald-950/40 cursor-pointer animate-pulse"
                      title="Duyệt nhanh toàn bộ các bài đăng đang chờ duyệt"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>
                        Duyệt nhanh ({listings.filter((l) => l.status === 'PENDING_APPROVAL').length} bài chờ)
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      loadListings();
                      notify('Đã cập nhật danh sách bài đăng!');
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-800 transition-all shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                    <span>Làm mới danh sách</span>
                  </button>
                </div>
              </div>

              {/* Filters Bar & Quick Status Tabs */}
              <div className="space-y-3">
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="relative min-w-[240px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Tìm bài đăng theo tiêu đề, người đăng, MSSV..."
                        value={listingKeyword}
                        onChange={(e) => setListingKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadListings()}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <select
                      value={listingStatus}
                      onChange={(e) => setListingStatus(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="ALL">Tất cả bài đăng</option>
                      <option value="ACTIVE">Được duyệt</option>
                      <option value="PENDING_APPROVAL">Chưa được duyệt</option>
                      <option value="REJECTED">Bị cấm</option>
                      <option value="DELETED">Bị xóa</option>
                    </select>

                    <label className="flex items-center gap-2 text-xs text-rose-400 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={listingRiskOnly}
                        onChange={(e) => setListingRiskOnly(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0"
                      />
                      <span>Chỉ hiển thị bài có gắn cờ rủi ro (Risk Flagged)</span>
                    </label>
                  </div>

                  <BaseButton size="sm" onClick={loadListings} className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Lọc dữ liệu
                  </BaseButton>
                </div>

                {/* Status Segment Filter Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key: 'ALL', label: 'Tất cả bài đăng' },
                    { key: 'ACTIVE', label: 'Được duyệt' },
                    { key: 'PENDING_APPROVAL', label: 'Chưa được duyệt' },
                    { key: 'REJECTED', label: 'Bị cấm' },
                    { key: 'DELETED', label: 'Bị xóa' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setListingStatus(tab.key)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        listingStatus === tab.key
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listings Queue Table */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Bài đăng</th>
                        <th className="px-4 py-3">Loại / Giá</th>
                        <th className="px-4 py-3">Người bán</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Thao tác / Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {listings.length > 0 ? (
                        listings.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => {
                              setDetailModalListing(item);
                              setDetailActiveImgIndex(0);
                            }}
                            className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                            title="Bấm vào để mở cửa sổ xem chi tiết bài đăng"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {item.imageUrls && item.imageUrls[0] ? (
                                  <img
                                    src={item.imageUrls[0]}
                                    alt=""
                                    className="w-12 h-12 rounded-lg object-cover bg-slate-900 flex-shrink-0 border border-slate-700/60 group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500 text-[10px] border border-slate-800 flex-shrink-0">
                                    No Image
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                                    {item.title}
                                  </p>
                                  <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">
                                    {item.categoryName || 'Danh mục khác'} • {item.conditionStatus}
                                  </p>
                                  {item.isRiskFlagged && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-medium mt-1 border border-rose-500/30">
                                      <AlertTriangle className="w-3 h-3" />
                                      {item.riskReason || 'Nghi vấn từ khóa cấm'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-emerald-400 font-mono">
                                {item.transactionType === 'GIVEAWAY' ? 'Tặng 0đ' : formatCurrency(item.price)}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                                {item.transactionType === 'SALE'
                                  ? 'Bán'
                                  : item.transactionType === 'RENTAL'
                                  ? 'Cho thuê'
                                  : item.transactionType === 'SWAP'
                                  ? 'Trao đổi'
                                  : 'Tặng 0đ'}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-100">{item.authorName || 'Sinh viên'}</p>
                              <p className="text-[11px] text-indigo-400 font-mono font-medium flex items-center gap-1 mt-0.5">
                                <span className="text-slate-400 font-sans">MSSV:</span> {getSellerStudentCode(item)}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                                  item.status === 'ACTIVE'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : item.status === 'PENDING_APPROVAL' || item.status === 'PENDING'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : item.status === 'REJECTED' || item.status === 'BANNED'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-slate-700/60 text-slate-300 border border-slate-600/40'
                                }`}
                              >
                                {item.status === 'ACTIVE'
                                  ? 'Được duyệt'
                                  : item.status === 'PENDING_APPROVAL' || item.status === 'PENDING'
                                  ? 'Chưa được duyệt'
                                  : item.status === 'REJECTED' || item.status === 'BANNED'
                                  ? 'Bị cấm'
                                  : 'Bị xóa'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailModalListing(item);
                                    setDetailActiveImgIndex(0);
                                  }}
                                  title="Xem đầy đủ thông tin bài đăng"
                                  className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center gap-1 text-xs px-2.5 font-semibold transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Chi tiết</span>
                                </button>

                                {item.status !== 'ACTIVE' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDirectApproveListing(item);
                                    }}
                                    title="Duyệt bài đăng ngay lập tức"
                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1 text-xs px-2.5 font-semibold transition cursor-pointer"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline">Duyệt</span>
                                  </button>
                                )}

                                {item.status !== 'REJECTED' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedListing(item);
                                      setRejectReasonModal(true);
                                    }}
                                    title="Từ chối / Cấm bài viết kèm lý do"
                                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1 text-xs px-2 font-medium cursor-pointer"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline">Từ chối</span>
                                  </button>
                                )}

                                {item.status !== 'DELETED' && item.status !== 'ARCHIVED' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      askConfirmation(
                                        'Xác nhận gỡ / ẩn bài đăng',
                                        `Bạn có chắc chắn muốn GỠ / ẨN bài đăng #${item.id} ("${item.title}") khỏi sàn giao dịch?`,
                                        () => handleModerateListing(item.id, 'HIDE'),
                                        true,
                                        'Gỡ bài đăng'
                                      );
                                    }}
                                    title="Gỡ/Ẩn bài đăng"
                                    className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Không tìm thấy bài đăng nào theo tiêu chí lọc
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USERS & VERIFICATION */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>Quản Lý Sinh Viên & Thẻ SV</span>
                  </h1>
                </div>
                <button
                  onClick={() => {
                    loadUsers();
                    notify('Đã cập nhật danh sách sinh viên!');
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-800 transition-all shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Làm mới danh sách</span>
                </button>
              </div>

              {/* Quick Status Sub-tabs for Users */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setUserStatusFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    userStatusFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  Tất cả sinh viên ({studentTotalCount})
                </button>
                <button
                  onClick={() => setUserStatusFilter('ACTIVE')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    userStatusFilter === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  Đang hoạt động ({studentActiveCount})
                </button>
                <button
                  onClick={() => setUserStatusFilter('BLOCKED_ONLY')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    userStatusFilter === 'BLOCKED_ONLY'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                  }`}
                >
                  Danh sách sinh viên bị chặn ({studentBlockedCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="relative min-w-[280px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Tìm sinh viên theo Tên, Email trường, MSSV, SĐT..."
                      value={userKeyword}
                      onChange={(e) => setUserKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hoạt động (Active)</option>
                    <option value="BLOCKED_ONLY">Danh sách sinh viên bị chặn</option>
                    <option value="SUSPENDED">Khóa tạm thời (Suspended)</option>
                    <option value="BANNED">Cấm vĩnh viễn (Banned)</option>
                  </select>
                </div>

                <BaseButton size="sm" onClick={loadUsers} className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tìm kiếm
                </BaseButton>
              </div>

              {/* Users Table */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Hồ sơ Sinh viên</th>
                        <th className="px-4 py-3">Niên khóa & Ngành</th>
                        <th className="px-4 py-3">Uy tín (Karma)</th>
                        <th className="px-4 py-3">Tích xanh thẻ SV</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Hành động quản trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {users.length > 0 ? (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-bold text-white flex items-center gap-1.5">
                                {u.fullName}
                                {u.studentCardVerified && (
                                  <span title="Đã xác thực thẻ sinh viên">
                                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                                  </span>
                                )}
                              </p>
                              <p className="text-slate-400 text-[11px]">{u.email}</p>
                              <p className="text-slate-500 text-[10px]">MSSV: {u.studentCode || 'N/A'} • {u.phone || 'Chưa cập nhật SĐT'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-slate-200 font-semibold">
                                {u.academicYear || (u.studentCode?.startsWith('23') ? 'K17 (2023 - 2027)' : u.studentCode?.startsWith('22') ? 'K16 (2022 - 2026)' : u.studentCode?.startsWith('24') ? 'K18 (2024 - 2028)' : 'K17 (2023 - 2027)')}
                              </p>
                              <p className="text-[11px] text-indigo-400 font-medium mt-0.5">
                                {u.major || 'Công nghệ thông tin'}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                🌟 {u.karmaScore}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {u.studentCardVerified ? (
                                <button
                                  onClick={() => {
                                    setSelectedCardUser(u);
                                    setStudentCardModal(true);
                                  }}
                                  className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 flex items-center gap-1.5 transition shadow-sm"
                                  title="Bấm để kiểm tra lại ảnh thẻ sinh viên hoặc thu hồi tích xanh"
                                >
                                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Đã xác thực</span>
                                  <span className="text-[10px] text-emerald-300/70">(Xem lại / Hủy)</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedCardUser(u);
                                    setStudentCardModal(true);
                                  }}
                                  className="text-[11px] font-semibold text-slate-300 bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-500 flex items-center gap-1.5 transition shadow-sm"
                                  title="Bấm để xem ảnh thẻ sinh viên và đối chiếu thông tin trước khi duyệt"
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Xem & Duyệt thẻ SV</span>
                                  <span className="text-[10px] text-amber-400 font-bold">(+15)</span>
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                    u.status === 'ACTIVE'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : u.status === 'SUSPENDED'
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-rose-500/20 text-rose-400'
                                  }`}
                                >
                                  {u.status === 'BANNED' ? 'ĐÃ CẤM' : u.status === 'SUSPENDED' ? 'TẠM KHÓA' : u.status === 'BLOCKED' ? 'BỊ CHẶN' : 'HOẠT ĐỘNG'}
                                </span>
                                {u.blockReason && (
                                  <p className="text-[10px] text-rose-400 mt-1 max-w-[200px] break-words" title={u.blockReason}>
                                    🚫 {u.blockReason}
                                  </p>
                                )}

                                {/* Nút xem bài vi phạm & bằng chứng cho các tài khoản bị khóa / tạm khóa / cấm hoặc có vi phạm */}
                                {(u.status === 'SUSPENDED' || u.status === 'BANNED' || u.status === 'BLOCKED' || (u.violatingItems && u.violatingItems.length > 0)) && (
                                  <button
                                    onClick={() => {
                                      setSelectedViolatingUser(u);
                                      setViolatingModal(true);
                                    }}
                                    className="mt-1.5 px-2 py-1 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition shadow-sm"
                                    title="Xem lại hình ảnh bài đăng đã vi phạm để quản trị viên xem xét lại"
                                  >
                                    <ImageIcon className="w-3 h-3 text-rose-400" />
                                    <span>Xem bài vi phạm</span>
                                    {u.violatingItems && u.violatingItems.length > 0 && (
                                      <span className="bg-rose-500/30 text-rose-200 px-1 rounded text-[9px]">
                                        {u.violatingItems.length}
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setKarmaAdjModal(true);
                                  }}
                                  title="Điều chỉnh điểm uy tín (Karma)"
                                  className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-semibold"
                                >
                                  ± Karma
                                </button>

                                {u.status === 'ACTIVE' ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setUserActionModal({
                                          isOpen: true,
                                          user: u,
                                          actionType: 'SUSPEND_1_WEEK',
                                          reason: 'Khóa tạm thời do nghi ngờ vi phạm quy định',
                                        });
                                      }}
                                      title="Tạm khóa tài khoản (Chọn thời hạn & lý do)"
                                      className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setUserActionModal({
                                          isOpen: true,
                                          user: u,
                                          actionType: 'BAN',
                                          reason: 'Cấm vĩnh viễn do vi phạm nghiêm trọng quy chế Phenikaa',
                                        });
                                      }}
                                      title="Cấm vĩnh viễn (Ban)"
                                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => askConfirmation(
                                      'Xác nhận mở khóa tài khoản',
                                      `Bạn có chắc chắn muốn MỞ KHÓA tài khoản sinh viên #${u.id} (${u.fullName}) để hoạt động trở lại?`,
                                      () => handleUserAction(u.id, 'ACTIVATE', 0, 'Mở khóa tài khoản'),
                                      false,
                                      'Mở khóa ngay'
                                    )}
                                    title="Mở khóa tài khoản"
                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Không có người dùng nào phù hợp
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REPORTS & DISPUTES */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Header Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    Trung tâm Báo cáo, Tranh chấp & Cảnh báo khóa sinh viên
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Đối chiếu chứng từ, phát hiện hành vi lừa đảo/gian lận, thực thi khóa tài khoản & trừ điểm Karma
                  </p>
                </div>
                <BaseButton size="sm" onClick={loadReports} className="flex items-center gap-1.5 self-start sm:self-auto">
                  <RefreshCw className="w-3.5 h-3.5" /> Làm mới
                </BaseButton>
              </div>

              {/* Lock Warning Summary Alert Box if there are accounts needing lock */}
              {lockWarningReportsCount > 0 && (
                <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                      <AlertOctagon className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white">
                          🚨 CẢNH BÁO KHÓA TÀI KHOẢN SINH VIÊN VI PHẠM
                        </span>
                        <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {lockWarningReportsCount}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Có <b className="text-rose-400">{lockWarningReportsCount} tài khoản bị tố cáo vi phạm nghiêm trọng</b> (Scam cọc / Rao bán hàng cấm). Yêu cầu quản trị viên xác nhận 2 bước để Tạm khóa 1 tuần hoặc Cấm vĩnh viễn (đưa vào danh sách chặn).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                      Cần duyệt khóa
                    </span>
                  </div>
                </div>
              )}

              {/* Filter Tabs / Boxes styled like the reference photo */}
              <div className="flex flex-wrap items-center gap-2.5 pb-1">
                {/* Tab 1: Cảnh báo khóa (styled matching the image with circular badge) */}
                <button
                  type="button"
                  onClick={() => setReportFilterTab('LOCK_WARNING')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    reportFilterTab === 'LOCK_WARNING'
                      ? 'bg-gradient-to-r from-rose-950/70 to-amber-950/40 text-rose-200 border-rose-500/50 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <span>Cảnh báo khóa</span>
                  </div>
                  <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {lockWarningReportsCount}
                  </span>
                </button>

                {/* Tab 2: Chờ xử lý */}
                <button
                  type="button"
                  onClick={() => setReportFilterTab('PENDING')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    reportFilterTab === 'PENDING'
                      ? 'bg-slate-800 text-amber-200 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Chờ xử lý</span>
                  </div>
                  <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {pendingReportsCount}
                  </span>
                </button>

                {/* Tab 3: Tất cả tranh chấp */}
                <button
                  type="button"
                  onClick={() => setReportFilterTab('ALL')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    reportFilterTab === 'ALL'
                      ? 'bg-slate-800 text-white border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-400" />
                    <span>Tất cả báo cáo & Tranh chấp</span>
                  </div>
                  <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {reports.length}
                  </span>
                </button>

                {/* Tab 4: Đã giải quyết */}
                <button
                  type="button"
                  onClick={() => setReportFilterTab('RESOLVED')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    reportFilterTab === 'RESOLVED'
                      ? 'bg-slate-800 text-emerald-200 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Đã giải quyết</span>
                  </div>
                  <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {resolvedReportsCount}
                  </span>
                </button>
              </div>

              {/* Report Items List */}
              <div className="space-y-4">
                {displayedReports.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center text-slate-400 space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300">Không có báo cáo nào trong danh mục này</p>
                    <p className="text-xs text-slate-400">Tất cả khiếu nại và cảnh báo khóa đã được xử lý thỏa đáng.</p>
                  </div>
                ) : (
                  displayedReports.map((report) => {
                    const isLockWarning =
                      (report.status === 'PENDING' || report.status === 'OPEN') &&
                      (report.reason === 'SCAM_OR_FRAUD' ||
                        report.reason === 'PROHIBITED_ITEMS' ||
                        report.severity === 'CRITICAL' ||
                        report.severity === 'HIGH');

                    return (
                      <div
                        key={report.id}
                        className={`bg-slate-800/50 border rounded-2xl p-5 space-y-4 transition-all ${
                          isLockWarning
                            ? 'border-rose-500/40 shadow-lg shadow-rose-950/20 ring-1 ring-rose-500/20'
                            : 'border-slate-700/60'
                        }`}
                      >
                        {/* Lock Warning Banner inside Report Card */}
                        {isLockWarning && (
                          <div className="bg-gradient-to-r from-rose-950/70 to-slate-900/90 border border-rose-500/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5">
                                <Lock className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-rose-300 uppercase tracking-wider">
                                    🚨 CẢNH BÁO KHÓA: NGUY CƠ VI PHẠM NGHIÊM TRỌNG
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    {report.reason === 'SCAM_OR_FRAUD' ? 'Lừa đảo cọc (Scam đồ)' : 'Rao bán hàng cấm'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-1">
                                  Tài khoản bị tố cáo: <b className="text-white underline">{report.reportedUserName || 'Người dùng #' + report.reportedUserId}</b>.
                                  {report.reason === 'SCAM_OR_FRAUD'
                                    ? ' Khuyến nghị: Trừ 20 Karma & Tạm khóa tài khoản 1 tuần.'
                                    : ' Khuyến nghị: Chặn tài khoản vĩnh viễn và thêm vào danh sách chặn sinh viên.'}
                                </p>
                              </div>
                            </div>
                            <span className="min-w-5 h-5 px-2 flex items-center justify-center rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Cần khóa
                            </span>
                          </div>
                        )}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {report.reason}
                        </span>
                        <span className="text-xs text-slate-400">
                          Báo cáo #{report.id} • {formatDate(report.createdAt)}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300">
                        {report.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-slate-400 font-semibold mb-1">BÊN TỐ CÁO (REPORTER):</p>
                        <p className="font-bold text-white text-sm">{report.reporterName}</p>
                        <p className="text-slate-400 mt-2">Mô tả sự việc:</p>
                        <p className="text-slate-200 mt-0.5 italic">"{report.description}"</p>
                      </div>

                      <div>
                        <p className="text-slate-400 font-semibold mb-1">BÊN BỊ TỐ CÁO (REPORTED USER):</p>
                        <p className="font-bold text-rose-300 text-sm">{report.reportedUserName || 'Người dùng #' + report.reportedUserId}</p>
                        {report.reportedListingTitle && (
                          <p className="text-slate-300 mt-2">
                            Bài đăng liên quan: <span className="font-semibold">{report.reportedListingTitle}</span>
                          </p>
                        )}
                        {report.evidenceUrl && (
                          <div className="mt-2">
                            <p className="text-slate-400 mb-1">Ảnh bằng chứng:</p>
                            <a href={report.evidenceUrl} target="_blank" rel="noreferrer">
                              <img src={report.evidenceUrl} alt="Bằng chứng" className="h-20 rounded-lg border border-slate-700 object-cover" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Transcript preview if present */}
                    {report.chatTranscript && report.chatTranscript.length > 0 && (
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                        <p className="font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                          Trích xuất đoạn chat trực tiếp giữa 2 bên:
                        </p>
                        <div className="space-y-1.5">
                          {report.chatTranscript.map((msg, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-slate-500 font-mono text-[10px]">{msg.time}</span>
                              <span className="font-semibold text-indigo-300">{msg.sender}:</span>
                              <span className="text-slate-300">{msg.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phán quyết actions */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-700/50">
                      <button
                        onClick={() => askConfirmation(
                          'Xác nhận xử lý vi phạm Scam đồ',
                          `Bạn có chắc chắn muốn xử lý báo cáo #${report.id}: TRỪ 20 ĐIỂM KARMA và TẠM KHÓA 1 TUẦN tài khoản "${report.reportedUserName || 'bị tố cáo'}"?\nKhi sinh viên đăng nhập sẽ nhận được thông báo bị trừ điểm và tạm khóa trong 7 ngày.`,
                          async () => {
                            const payload: ResolveReportPayload = {
                              action: 'SUSPEND_1_WEEK',
                              karmaPenalty: 20,
                              resolutionNotes: 'Tài khoản bị trừ 20 điểm Karma và tạm khóa 1 tuần do hành vi scam đồ sinh viên. Sẽ được mở khóa sau 7 ngày.',
                            };
                            await reportService.resolveReport(report.id, payload);
                            notify(`Đã trừ 20 Karma và tạm khóa 1 tuần tài khoản ${report.reportedUserName || ''}`);
                            loadReports();
                            loadUsers();
                            loadStats();
                          },
                          true,
                          'Xác nhận trừ điểm & Tạm khóa 1 tuần'
                        )}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Trừ 20 Karma & Tạm khóa 1 tuần (Scam đồ)
                      </button>

                      <button
                        onClick={() => askConfirmation(
                          'Xác nhận chặn & cấm tài khoản',
                          `Bạn có chắc chắn muốn CHẶN VĨNH VIỄN tài khoản "${report.reportedUserName || 'bị tố cáo'}" và đưa vào DANH SÁCH BỊ CHẶN do vi phạm nghiêm trọng (rao bán hàng cấm / gian lận)?`,
                          async () => {
                            const payload: ResolveReportPayload = {
                              action: 'BAN_USER',
                              resolutionNotes: 'Cấm vĩnh viễn và đưa vào danh sách bị chặn do rao bán hàng cấm và bị tố cáo.',
                            };
                            await reportService.resolveReport(report.id, payload);
                            notify(`Đã chặn tài khoản ${report.reportedUserName || ''} và đưa vào danh sách chặn`);
                            loadReports();
                            loadUsers();
                            loadStats();
                          },
                          true,
                          'Chặn tài khoản ngay'
                        )}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Chặn tài khoản ngay (Vào DS chặn)
                      </button>

                      <button
                        onClick={() => askConfirmation(
                          'Trừ điểm uy tín (Karma)',
                          `Xác nhận phạt TRỪ 15 ĐIỂM KARMA tài khoản "${report.reportedUserName || ''}" do vi phạm cam kết mua bán?`,
                          async () => {
                            const payload: ResolveReportPayload = {
                              action: 'PENALIZE_KARMA',
                              karmaPenalty: 15,
                              resolutionNotes: 'Phạt trừ 15 điểm Karma do vi phạm hẹn giao dịch / sai cam kết',
                            };
                            await reportService.resolveReport(report.id, payload);
                            notify(`Đã trừ 15 Karma của tài khoản bị tố cáo`);
                            loadReports();
                            loadUsers();
                          },
                          true,
                          'Trừ 15 Karma'
                        )}
                        className="bg-slate-700 hover:bg-slate-600 text-amber-300 font-semibold text-xs px-3 py-1.5 rounded-xl"
                      >
                        Trừ 15 điểm Karma
                      </button>

                      <button
                        onClick={() => askConfirmation(
                          'Bỏ qua báo cáo',
                          `Bạn có chắc chắn muốn BỎ QUA báo cáo #${report.id} do bằng chứng chưa đủ căn cứ xử phạt?`,
                          async () => {
                            const payload: ResolveReportPayload = {
                              action: 'REJECTED',
                              resolutionNotes: 'Bằng chứng chưa đủ căn cứ xử phạt, bỏ qua báo cáo',
                            };
                            await reportService.resolveReport(report.id, payload);
                            notify(`Đã bỏ qua báo cáo #${report.id}`);
                            loadReports();
                          },
                          false,
                          'Bỏ qua báo cáo'
                        )}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-xl"
                      >
                        Bỏ qua báo cáo
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

          {/* TAB 5: CATEGORIES MANAGEMENT */}
          {activeTab === 'metadata' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>Quản Lý Danh Mục Hàng Hóa</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                      Categories
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Quản lý danh mục hàng hóa sinh viên Phenikaa (Sách giáo trình, Đồ công nghệ, Đồ gia dụng, Thời trang...)
                  </p>
                </div>
              </div>

              <div className="max-w-4xl">
                {/* Categories */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        Cây danh mục hàng hóa Chợ Sinh viên Phenikaa
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Hiện có {categories.length} phân loại hàng hóa chính thức</p>
                    </div>
                    <button
                      onClick={() => setShowCatModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm danh mục
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800">
                    {categories.map((cat) => (
                      <div key={cat.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                        <div>
                          <p className="font-semibold text-white text-sm">{cat.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Slug định danh: <span className="font-mono text-indigo-400">{cat.slug}</span></p>
                        </div>
                        <button
                          onClick={() => {
                            askConfirmation(
                              'Xác nhận xóa danh mục',
                              `Bạn có chắc chắn muốn xóa danh mục "${cat.name}" khỏi sàn không?`,
                              async () => {
                                await adminService.deleteCategory(cat.id);
                                notify(`Đã xóa danh mục ${cat.name}`);
                                loadMetadata();
                              },
                              true,
                              'Xóa danh mục'
                            );
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS & RBAC */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>Cấu Hình Hệ Thống & Nhật Ký Kiểm Toán</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Bộ lọc 14 từ khóa cấm theo thời gian thực & nhật ký kiểm toán không thể can thiệp
                  </p>
                </div>
              </div>

              {/* Chế tài Tự động: Vi phạm Từ cấm (Cơ chế 3 Gậy / 3 Strikes) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-white text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      <span>Quy Chế Chế Tài Tự Động: Vi Phạm Từ Khóa Cấm</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sinh viên đăng bài chứa từ khóa cấm sẽ bị cảnh báo vi phạm. Vi phạm đủ 3 lần sẽ <strong>TỰ ĐỘNG BỊ TẠM KHÓA 1 NGÀY (24 giờ)</strong>.
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    CƠ CHẾ TỰ ĐỘNG HÓA
                  </span>
                </div>

                {/* Table of Violations */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Sinh viên vi phạm</th>
                        <th className="px-4 py-3">Mức độ nhắc nhở (Gậy)</th>
                        <th className="px-4 py-3">Từ cấm gần nhất</th>
                        <th className="px-4 py-3">Trạng thái tài khoản</th>
                        <th className="px-4 py-3 text-right">Xử lý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {keywordViolations.length > 0 ? (
                        keywordViolations.map((v) => (
                          <tr key={v.userId} className="hover:bg-slate-800/30 transition">
                            <td className="px-4 py-3">
                              <p className="font-bold text-white font-sans">{v.userName}</p>
                              <p className="text-[11px] text-slate-400">{v.userEmail}</p>
                              <p className="text-[10px] text-slate-500">MSSV: {v.studentCode || 'N/A'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                  v.strikeCount >= 3
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                                    : v.strikeCount === 2
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                    : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'
                                }`}
                              >
                                {v.strikeCount >= 3
                                  ? '🚫 3/3 GẬY - ĐÃ KHÓA 1 NGÀY'
                                  : `⚠️ ${v.strikeCount}/3 Gậy Cảnh Cáo`}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-rose-400 font-bold">
                                "{v.lastViolationKeyword}"
                              </span>
                              <p className="text-[10px] text-slate-500 mt-1 font-sans">
                                {formatDate(v.lastViolationDate)}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              {v.isSuspended ? (
                                <div>
                                  <span className="text-rose-400 font-bold">Đang tạm khóa 24h</span>
                                  {v.suspendedUntil && (
                                    <p className="text-[10px] text-slate-400 font-sans">
                                      Hết hạn: {formatDate(v.suspendedUntil)}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-emerald-400 font-medium">Bình thường</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    askConfirmation(
                                      'Xóa cảnh cáo vi phạm từ cấm',
                                      `Xác nhận xóa toàn bộ cảnh cáo vi phạm từ khóa cấm cho sinh viên "${v.userName}"? Điểm cảnh cáo sẽ được reset về 0.`,
                                      () => {
                                        keywordViolationService.resetStrikes(v.userId, 'minhphuong2925@gmail.com', 'Quản trị viên xóa cảnh cáo');
                                        notify(`Đã xóa cảnh cáo cho sinh viên ${v.userName}`);
                                        loadSettings();
                                      },
                                      false,
                                      'Reset cảnh cáo'
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-semibold border border-slate-700"
                                >
                                  Xóa cảnh cáo
                                </button>
                                {v.isSuspended && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      askConfirmation(
                                        'Mở khóa sớm cho sinh viên',
                                        `Bạn có chắc muốn mở khóa sớm 24h cho sinh viên "${v.userName}"?`,
                                        () => {
                                          keywordViolationService.unbanEarly(v.userId, 'minhphuong2925@gmail.com', 'Quản trị viên mở khóa sớm');
                                          notify(`Đã mở khóa sớm cho ${v.userName}`);
                                          loadSettings();
                                        },
                                        false,
                                        'Mở khóa ngay'
                                      );
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-sans font-semibold"
                                  >
                                    Mở khóa sớm
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                            Chưa có sinh viên nào vi phạm từ khóa cấm. Hệ thống tự động kiểm soát 100% thời gian thực.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Keyword Blacklist */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      Bộ lọc Từ khóa Cấm & Hàng nhạy cảm (Keyword Blacklist)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tự động chặn bài đăng có từ khóa thuốc lá điện tử, thi hộ, vay nặng lãi, cọc trước
                    </p>
                  </div>
                </div>

                {/* Form Add Keyword */}
                <form onSubmit={handleAddKeyword} className="flex flex-wrap items-center gap-2.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    placeholder="Nhập từ khóa cấm (ví dụ: vape, chạy điểm...)"
                    value={newKw}
                    onChange={(e) => setNewKw(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={newKwCategory}
                    onChange={(e) => setNewKwCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PROHIBITED_GOODS">Hàng cấm / Vũ khí</option>
                    <option value="ACADEMIC_FRAUD">Gian lận học thuật / Thi hộ</option>
                    <option value="SCAM">Lừa đảo / Quỵt cọc</option>
                    <option value="HARASSMENT">Nội dung đồi trụy / Quấy rối</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm từ cấm
                  </button>
                </form>

                {/* Keyword Chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {keywords.map((kw) => (
                    <span
                      key={kw.id}
                      className="inline-flex items-center gap-1.5 bg-slate-900 border border-rose-500/30 text-rose-300 text-xs px-3 py-1 rounded-full font-medium"
                    >
                      <span>{kw.keyword}</span>
                      <button
                        onClick={() => askConfirmation(
                          'Xác nhận xóa từ khóa cấm',
                          `Bạn có chắc chắn muốn xóa từ khóa "${kw.keyword}" khỏi danh mục từ cấm tự động kiểm duyệt?`,
                          () => handleDeleteKeyword(kw.id),
                          true,
                          'Xóa từ cấm'
                        )}
                        className="text-slate-500 hover:text-white"
                        title="Xóa từ khóa"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Audit Logs */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Nhật ký Kiểm toán Hoạt động Ban Quản Trị (Audit Logs)
                  </h3>
                  <BaseButton size="sm" onClick={loadSettings} className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Tải lại
                  </BaseButton>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">Thời gian</th>
                        <th className="px-4 py-2.5">Người thực hiện</th>
                        <th className="px-4 py-2.5">Mã sinh viên</th>
                        <th className="px-4 py-2.5">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {auditLogs.map((log) => {
                        // Tìm mã sinh viên tương ứng
                        const targetUser = users.find((u) => u.id === log.targetId || String(u.id) === String(log.targetId));
                        let sCode = targetUser?.studentCode;
                        if (!sCode && targetUser?.email && targetUser.email.includes('@')) {
                          sCode = targetUser.email.split('@')[0];
                        }
                        if (!sCode && log.targetType && log.targetType !== 'USER' && log.targetType !== 'SYSTEM' && log.targetType !== 'LISTING' && log.targetType !== 'CATEGORY') {
                          sCode = log.targetType;
                        }
                        if (!sCode && (log.targetId === 2 || String(log.targetId) === '2')) {
                          sCode = '23010190';
                        }
                        if (!sCode) {
                          sCode = log.targetId ? `SV${String(log.targetId).padStart(4, '0')}` : '-';
                        }

                        return (
                          <tr key={log.id} className="hover:bg-slate-800/20">
                            <td className="px-4 py-2.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                              {formatDateTime(log.createdAt)}
                            </td>
                            <td className="px-4 py-2.5 text-indigo-300 font-semibold">{log.adminEmail}</td>
                            <td className="px-4 py-2.5">
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono font-bold text-[11px]">
                                {sCode}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-300 font-sans leading-relaxed">{log.details}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

      {/* MODAL: Chi tiết bài đăng Sàn Sinh viên (Popup chi tiết đầy đủ thông tin) */}
      {detailModalListing && (
        <BaseModal
          theme="dark"
          isOpen={!!detailModalListing}
          onClose={() => setDetailModalListing(null)}
          maxWidth="3xl"
          title={
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">Chi tiết bài đăng</span>
                  <span className="text-xs font-mono text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    #{detailModalListing.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Xem đầy đủ thông tin kiểm duyệt bài đăng sinh viên</p>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-slate-200">
            {/* Top Status & Flags */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Trạng thái hiện tại:</span>
                <span
                  className={`px-3 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1.5 ${
                    detailModalListing.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : detailModalListing.status === 'PENDING_APPROVAL' || detailModalListing.status === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : detailModalListing.status === 'REJECTED' || detailModalListing.status === 'BANNED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-slate-700/60 text-slate-300 border border-slate-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      detailModalListing.status === 'ACTIVE'
                        ? 'bg-emerald-400 animate-pulse'
                        : detailModalListing.status === 'PENDING_APPROVAL' || detailModalListing.status === 'PENDING'
                        ? 'bg-amber-400 animate-pulse'
                        : detailModalListing.status === 'REJECTED' || detailModalListing.status === 'BANNED'
                        ? 'bg-rose-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  {detailModalListing.status === 'ACTIVE'
                    ? 'Được duyệt (Đang hiển thị trên sàn)'
                    : detailModalListing.status === 'PENDING_APPROVAL' || detailModalListing.status === 'PENDING'
                    ? 'Chưa được duyệt (Đang chờ duyệt)'
                    : detailModalListing.status === 'REJECTED' || detailModalListing.status === 'BANNED'
                    ? 'Bị cấm (Từ chối duyệt)'
                    : 'Bị xóa (Đã ẩn khỏi sàn)'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Đăng lúc: {formatDateTime(detailModalListing.createdAt)}</span>
              </div>
            </div>

            {/* Risk Warning Box if Flagged */}
            {detailModalListing.isRiskFlagged && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-rose-400">Cảnh báo rủi ro / vi phạm từ khóa</h5>
                  <p className="text-[11px] mt-0.5 text-rose-200">
                    {detailModalListing.riskReason || 'Nghi vấn sản phẩm chứa từ khóa cấm hoặc hành vi không an toàn.'}
                  </p>
                </div>
              </div>
            )}

            {/* Moderation Reason if Rejected */}
            {detailModalListing.moderationReason && (
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300">
                <span className="font-semibold text-slate-400 text-[11px] block mb-1">Ghi chú kiểm duyệt:</span>
                <p className="text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {detailModalListing.moderationReason}
                </p>
                {detailModalListing.moderatedAt && (
                  <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
                    Thời điểm xử lý: {formatDateTime(detailModalListing.moderatedAt)}
                  </p>
                )}
              </div>
            )}

            {/* Product Images & Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Image Preview Gallery */}
              <div className="space-y-2">
                <div className="w-full aspect-square rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden relative flex items-center justify-center">
                  {detailModalListing.imageUrls && detailModalListing.imageUrls.length > 0 ? (
                    <img
                      src={detailModalListing.imageUrls[detailActiveImgIndex] || detailModalListing.imageUrls[0]}
                      alt={detailModalListing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                      <ImageIcon className="w-8 h-8 stroke-1" />
                      <span className="text-xs">Không có hình ảnh</span>
                    </div>
                  )}
                </div>

                {/* Thumbnails row if multiple images */}
                {detailModalListing.imageUrls && detailModalListing.imageUrls.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {detailModalListing.imageUrls.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setDetailActiveImgIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                          detailActiveImgIndex === idx
                            ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/20'
                            : 'border-slate-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Listing Details & Seller Info */}
              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {detailModalListing.categoryName || 'Danh mục khác'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5 leading-snug">
                      {detailModalListing.title}
                    </h3>
                  </div>

                  {/* Price & Transaction Type */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Hình thức giao dịch:</span>
                      <span className="font-bold text-white uppercase text-xs">
                        {detailModalListing.transactionType === 'SALE'
                          ? 'Bán hàng'
                          : detailModalListing.transactionType === 'RENTAL'
                          ? 'Cho thuê đồ'
                          : detailModalListing.transactionType === 'SWAP'
                          ? 'Trao đổi đồ'
                          : 'Tặng miễn phí'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Giá giao dịch:</span>
                      <span className="text-base font-extrabold text-emerald-400 font-mono">
                        {detailModalListing.transactionType === 'GIVEAWAY'
                          ? '0 ₫ (Tặng 0đ)'
                          : formatCurrency(detailModalListing.price)}
                      </span>
                    </div>

                    {detailModalListing.transactionType === 'RENTAL' && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                        <span className="text-slate-400">Tiền cọc bảo đảm:</span>
                        <span className="font-semibold text-amber-400 font-mono">
                          {detailModalListing.depositAmount
                            ? formatCurrency(detailModalListing.depositAmount)
                            : '0 ₫ (Không bắt buộc)'}
                        </span>
                      </div>
                    )}

                    {detailModalListing.transactionType === 'SWAP' && detailModalListing.swapTarget && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                        <span className="text-slate-400">Món đồ muốn đổi lấy:</span>
                        <span className="font-semibold text-cyan-300">
                          {detailModalListing.swapTarget}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-400">Tình trạng đồ:</span>
                      <span className="font-semibold text-slate-200">
                        {detailModalListing.conditionStatus}
                      </span>
                    </div>
                  </div>

                  {/* Phenikaa Safe Meeting Point */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      Điểm hẹn giao nhận an toàn Phenikaa:
                    </span>
                    <p className="text-xs font-semibold text-white">
                      {detailModalListing.safeMeetingPoint || 'Sảnh Tòa A10 (Trung tâm Thư viện Phenikaa & Tòa Điều hành)'}
                    </p>
                  </div>

                  {/* Seller Info Box */}
                  <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 uppercase">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      Thông tin Người bán
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Họ và tên:</span>
                        <span className="font-bold text-white text-xs">{detailModalListing.authorName || 'Sinh viên'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Mã sinh viên (MSSV):</span>
                        <span className="font-bold font-mono text-indigo-400 text-xs">
                          {getSellerStudentCode(detailModalListing)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Điểm Karma:</span>
                        <span className="font-semibold text-emerald-400">
                          ⭐ {detailModalListing.authorKarma ?? 20} Karma
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Trường:</span>
                        <span className="font-semibold text-slate-300">Đại học Phenikaa</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Description */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Mô tả chi tiết sản phẩm:
              </span>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                {detailModalListing.description || 'Không có mô tả chi tiết.'}
              </div>
            </div>

            {/* Rental Terms if applicable */}
            {detailModalListing.rentalTerms && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Điều khoản cho thuê:
                </span>
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200 whitespace-pre-wrap">
                  {detailModalListing.rentalTerms}
                </div>
              </div>
            )}

            {/* Footer Direct Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <a
                  href={`/item/${detailModalListing.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-2 rounded-xl border border-indigo-500/30 transition font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem trên sàn</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                {detailModalListing.status !== 'ACTIVE' && (
                  <button
                    onClick={() => {
                      const item = detailModalListing;
                      setDetailModalListing(null);
                      handleDirectApproveListing(item);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition shadow-md shadow-emerald-950/50 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Duyệt bài đăng</span>
                  </button>
                )}

                {detailModalListing.status !== 'REJECTED' && (
                  <button
                    onClick={() => {
                      const item = detailModalListing;
                      setDetailModalListing(null);
                      setSelectedListing(item);
                      setRejectReasonModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl transition shadow-md shadow-rose-950/50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Từ chối / Cấm bài</span>
                  </button>
                )}

                {detailModalListing.status !== 'DELETED' && detailModalListing.status !== 'ARCHIVED' && (
                  <button
                    onClick={() => {
                      const item = detailModalListing;
                      setDetailModalListing(null);
                      askConfirmation(
                        'Xác nhận gỡ / ẩn bài đăng',
                        `Bạn có chắc chắn muốn GỠ / ẨN bài đăng #${item.id} ("${item.title}") khỏi sàn giao dịch?`,
                        () => handleModerateListing(item.id, 'HIDE'),
                        true,
                        'Gỡ bài đăng'
                      );
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Xóa / Ẩn bài</span>
                  </button>
                )}

                <button
                  onClick={() => setDetailModalListing(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </BaseModal>
      )}

      {/* MODAL: Reject Listing Preset Reason */}
      <BaseModal
        theme="dark"
        isOpen={rejectReasonModal}
        onClose={() => setRejectReasonModal(false)}
        title="Từ chối duyệt bài đăng"
      >
        <div className="space-y-4 text-xs text-slate-200">
          <p>Chọn lý do từ chối mẫu để thông báo gửi về cho sinh viên đăng bài:</p>
          <div className="space-y-2">
            {[
              'Ảnh vi phạm bản quyền hoặc mờ',
              'Giá ảo hoặc không minh bạch',
              'Chứa hàng cấm theo quy chế trường học',
              'Thông tin sai lệch so với phân loại danh mục',
            ].map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  presetReason === reason
                    ? 'bg-indigo-600/10 border-indigo-500 text-white font-semibold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="reject_reason"
                  checked={presetReason === reason}
                  onChange={() => setPresetReason(reason)}
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Ghi chú bổ sung (tùy chọn):</label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Nhập hướng dẫn để sinh viên chỉnh sửa..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <BaseButton variant="secondary" size="sm" onClick={() => setRejectReasonModal(false)}>
              Hủy
            </BaseButton>
            <BaseButton
              variant="danger"
              size="sm"
              onClick={() => selectedListing && handleModerateListing(selectedListing.id, 'REJECT')}
            >
              Xác nhận từ chối
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* MODAL: Banned Student Codes Blacklist */}
      <BaseModal
        theme="dark"
        isOpen={showBannedModal}
        onClose={() => setShowBannedModal(false)}
        title="Danh sách Mã sinh viên bị Cấm vĩnh viễn (Blacklist MSSV)"
      >
        <div className="space-y-4 text-xs text-slate-200 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-slate-400">
            Hệ thống tự động lưu trữ và chặn vĩnh viễn tất cả MSSV/Email vi phạm nghiêm trọng. Nếu sinh viên có trong danh sách này cố gắng tạo tài khoản mới, hệ thống sẽ <strong>từ chối 100%</strong>.
          </p>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60">
            {bannedStudents.length > 0 ? (
              bannedStudents.map((item) => (
                <div key={item.id} className="p-3.5 space-y-1 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-rose-400 text-sm bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                      MSSV: {item.studentCode}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Cấm lúc: {item.bannedAt ? formatDate(item.bannedAt) : 'Mới đây'}
                    </span>
                  </div>
                  <p className="font-semibold text-white">{item.fullName || 'Sinh viên vi phạm'}</p>
                  <p className="text-slate-400 font-mono text-[11px]">{item.email}</p>
                  <div className="mt-1 p-2 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-300 text-[11px]">
                    <strong>Lý do cấm vĩnh viễn:</strong> {item.banReason || 'Vi phạm nghiêm trọng quy chế Phenikaa Campus Marketplace'}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500">
                Chưa có mã sinh viên nào trong danh sách cấm vĩnh viễn
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <BaseButton variant="secondary" size="sm" onClick={() => setShowBannedModal(false)}>
              Đóng
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* MODAL: Karma Adjustment */}
      <BaseModal
        theme="dark"
        isOpen={karmaAdjModal}
        onClose={() => setKarmaAdjModal(false)}
        title="Điều chỉnh điểm uy tín (Campus Karma)"
      >
        <div className="space-y-4 text-xs text-slate-200">
          <p>
            Tài khoản: <strong className="text-white">{selectedUser?.fullName}</strong> ({selectedUser?.email})
          </p>
          <div>
            <label className="block text-slate-400 mb-1">Số điểm Karma muốn cộng (+) hoặc trừ (-):</label>
            <input
              type="number"
              value={karmaAmount}
              onChange={(e) => setKarmaAmount(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="Ví dụ: -10 hoặc +15"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Lý do điều chỉnh:</label>
            <input
              type="text"
              value={karmaReason}
              onChange={(e) => setKarmaReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="Ví dụ: Thưởng đóng góp tích cực cho cộng đồng KTX"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <BaseButton variant="secondary" size="sm" onClick={() => setKarmaAdjModal(false)}>
              Hủy
            </BaseButton>
            <BaseButton
              variant="primary"
              size="sm"
              onClick={() => selectedUser && handleUserAction(selectedUser.id, 'ADJUST_KARMA', karmaAmount, karmaReason)}
            >
              Cập nhật Karma
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* MODAL: Create Category */}
      <BaseModal theme="dark" isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Thêm danh mục hàng hóa mới">
        <form onSubmit={handleAddCategory} className="space-y-4 text-xs text-slate-200">
          <div>
            <label className="block text-slate-400 mb-1">Tên danh mục:</label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ví dụ: Xe cộ & Phương tiện đi lại"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Slug URL (tùy chọn):</label>
            <input
              type="text"
              value={newCatSlug}
              onChange={(e) => setNewCatSlug(e.target.value)}
              placeholder="xe-co-phuong-tien"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <BaseButton variant="secondary" size="sm" onClick={() => setShowCatModal(false)}>
              Hủy
            </BaseButton>
            <BaseButton type="submit" variant="primary" size="sm">
              Lưu danh mục
            </BaseButton>
          </div>
        </form>
      </BaseModal>

      {/* MODAL: Xem & Duyệt / Đối chiếu lại Thẻ Sinh Viên */}
      <BaseModal
        theme="dark"
        isOpen={studentCardModal}
        onClose={() => setStudentCardModal(false)}
        title={selectedCardUser?.studentCardVerified ? "Đối chiếu & Xem lại Thẻ Sinh Viên" : "Xem xét & Duyệt Thẻ Sinh Viên"}
      >
        {selectedCardUser && (
          <div className="space-y-4 text-xs text-slate-200">
            {/* Student Info Card */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  {selectedCardUser.fullName}
                  {selectedCardUser.studentCardVerified && (
                    <span title="Đã có tích xanh">
                      <BadgeCheck className="w-4 h-4 text-emerald-400" />
                    </span>
                  )}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedCardUser.studentCardVerified
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {selectedCardUser.studentCardVerified ? 'Đã xác thực tích xanh' : 'Chưa duyệt tích xanh'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                <p><span className="text-slate-500">Mã SV:</span> <strong className="text-white">{selectedCardUser.studentCode || 'N/A'}</strong></p>
                <p><span className="text-slate-500">Email:</span> {selectedCardUser.email}</p>
                <p><span className="text-slate-500">Trường:</span> {selectedCardUser.universityName || 'Phenikaa'}</p>
                <p><span className="text-slate-500">Cơ sở:</span> {selectedCardUser.campusName || 'Yên Nghĩa'} {selectedCardUser.dormitory ? `• ${selectedCardUser.dormitory}` : ''}</p>
                <p><span className="text-slate-500">Karma:</span> <span className="text-amber-400 font-bold">🌟 {selectedCardUser.karmaScore}</span></p>
                <p><span className="text-slate-500">SĐT:</span> {selectedCardUser.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>

            {/* Student Card Image Preview (Ảnh 2 mặt thẻ sinh viên: Mặt trước & Mặt sau) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  Ảnh chụp 2 mặt Thẻ Sinh Viên thực tế để đối chiếu:
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  (Mặt trước &amp; Mặt sau)
                </span>
              </div>

              {selectedCardUser.studentCardFrontUrl || selectedCardUser.studentCardImageUrl || selectedCardUser.studentCardBackUrl ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mặt trước */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="font-bold text-blue-400">1. Mặt trước thẻ</span>
                      {(selectedCardUser.studentCardFrontUrl || selectedCardUser.studentCardImageUrl) && (
                        <a
                          href={selectedCardUser.studentCardFrontUrl || selectedCardUser.studentCardImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 text-[10px] flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="w-3 h-3" /> Mở ảnh gốc
                        </a>
                      )}
                    </div>
                    {selectedCardUser.studentCardFrontUrl || selectedCardUser.studentCardImageUrl ? (
                      <div className="relative group rounded-xl overflow-hidden border-2 border-blue-500/30 bg-slate-950 flex items-center justify-center max-h-[260px]">
                        <img
                          src={selectedCardUser.studentCardFrontUrl || selectedCardUser.studentCardImageUrl}
                          alt={`Mặt trước thẻ của ${selectedCardUser.fullName}`}
                          className="w-full h-auto max-h-[250px] object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
                        />
                        <div className="absolute bottom-1.5 left-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-blue-300 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3 text-blue-400" />
                          Ảnh chân dung, Họ tên &amp; MSSV
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-center text-slate-500 text-xs">
                        Chưa có ảnh mặt trước
                      </div>
                    )}
                  </div>

                  {/* Mặt sau */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="font-bold text-purple-400">2. Mặt sau thẻ</span>
                      {selectedCardUser.studentCardBackUrl && (
                        <a
                          href={selectedCardUser.studentCardBackUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 text-[10px] flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="w-3 h-3" /> Mở ảnh gốc
                        </a>
                      )}
                    </div>
                    {selectedCardUser.studentCardBackUrl ? (
                      <div className="relative group rounded-xl overflow-hidden border-2 border-purple-500/30 bg-slate-950 flex items-center justify-center max-h-[260px]">
                        <img
                          src={selectedCardUser.studentCardBackUrl}
                          alt={`Mặt sau thẻ của ${selectedCardUser.fullName}`}
                          className="w-full h-auto max-h-[250px] object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
                        />
                        <div className="absolute bottom-1.5 left-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-purple-300 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3 text-purple-400" />
                          Dải từ &amp; Mã vạch Barcode
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-center text-slate-500 text-xs">
                        Chưa có ảnh mặt sau
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 text-center text-slate-400">
                  <CreditCard className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p>Sinh viên này chưa tải lên ảnh thẻ sinh viên hoặc hệ thống đang cập nhật.</p>
                </div>
              )}
            </div>

            {/* Note & Action Buttons */}
            <p className="text-[11px] text-slate-400 italic">
              💡 {selectedCardUser.studentCardVerified 
                ? 'Quản trị viên có thể kiểm tra lại thông tin trên thẻ SV có khớp với hồ sơ hay không. Nếu phát hiện thẻ giả hoặc không chính xác, có thể HỦY tích xanh ngay lập tức.' 
                : 'Đối chiếu Họ tên và Mã sinh viên trên ảnh thẻ với hồ sơ trước khi duyệt. Khi duyệt thành công, sinh viên sẽ được cấp Tích xanh uy tín và cộng +15 điểm Karma.'}
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-700/60">
              <BaseButton variant="secondary" size="sm" onClick={() => setStudentCardModal(false)}>
                Đóng
              </BaseButton>

              {selectedCardUser.studentCardVerified ? (
                <BaseButton
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    askConfirmation(
                      'Hủy xác thực thẻ sinh viên',
                      `Bạn có chắc chắn muốn HỦY tích xanh xác thực thẻ sinh viên của "${selectedCardUser.fullName}"?\nTài khoản sẽ mất biểu tượng xác thực tích xanh.`,
                      async () => {
                        await handleVerifyStudentCard(selectedCardUser.id, 'REVOKE');
                        setStudentCardModal(false);
                      },
                      true,
                      'Hủy tích xanh'
                    );
                  }}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Hủy xác thực thẻ SV
                </BaseButton>
              ) : (
                <>
                  <BaseButton
                    variant="outline"
                    size="sm"
                    className="border-rose-500/50 text-rose-400 hover:bg-rose-950/40"
                    onClick={() => {
                      askConfirmation(
                        'Từ chối thẻ sinh viên',
                        `Từ chối thẻ sinh viên của "${selectedCardUser.fullName}" và yêu cầu chụp lại ảnh 2 mặt rõ nét, đủ ánh sáng?`,
                        async () => {
                          await handleVerifyStudentCard(selectedCardUser.id, 'REJECT');
                          setStudentCardModal(false);
                        },
                        true,
                        'Từ chối thẻ'
                      );
                    }}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Từ chối (Yêu cầu chụp lại)
                  </BaseButton>

                  <BaseButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      askConfirmation(
                        'Duyệt tích xanh thẻ sinh viên',
                        `Bạn có chắc chắn muốn DUYỆT thẻ sinh viên 2 mặt và cộng +15 điểm uy tín Karma cho "${selectedCardUser.fullName}"?\nSinh viên sẽ nhận được Tích Xanh chính chủ.`,
                        async () => {
                          await handleVerifyStudentCard(selectedCardUser.id, 'APPROVE');
                          setStudentCardModal(false);
                        },
                        false,
                        'Duyệt ngay (+15 Karma)'
                      );
                    }}
                  >
                    <BadgeCheck className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                    Duyệt thẻ & Cấp tích xanh (+15 Karma)
                  </BaseButton>
                </>
              )}
            </div>
          </div>
        )}
      </BaseModal>

      {/* MODAL: Xem bài đăng vi phạm & bằng chứng đối với tài khoản bị khóa */}
      <BaseModal
        theme="dark"
        isOpen={violatingModal}
        onClose={() => setViolatingModal(false)}
        title={`Hồ sơ Vi phạm & Bằng chứng bài đăng - ${selectedViolatingUser?.fullName || ''}`}
      >
        {selectedViolatingUser && (
          <div className="space-y-4 text-xs text-slate-200 max-h-[80vh] overflow-y-auto pr-1">
            {/* User Violation Overview Card */}
            <div className="bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-900 border border-rose-500/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>{selectedViolatingUser.fullName}</span>
                    <span className="text-[11px] font-normal text-slate-400">({selectedViolatingUser.email})</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    MSSV: {selectedViolatingUser.studentCode || 'N/A'} • Trường: {selectedViolatingUser.universityName || 'Phenikaa'} • Karma: <span className="text-amber-400 font-bold">{selectedViolatingUser.karmaScore}</span>
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                    selectedViolatingUser.status === 'SUSPENDED'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : selectedViolatingUser.status === 'BANNED' || selectedViolatingUser.status === 'BLOCKED'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-700 text-slate-300 border-slate-600'
                  }`}
                >
                  {selectedViolatingUser.status === 'SUSPENDED' ? 'ĐANG TẠM KHÓA' : selectedViolatingUser.status === 'BANNED' ? 'CẤM VĨNH VIỄN' : selectedViolatingUser.status}
                </span>
              </div>

              {selectedViolatingUser.blockReason && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs">
                  <strong>⚠️ Lý do khóa / chế tài hiện tại:</strong> {selectedViolatingUser.blockReason}
                </div>
              )}
            </div>

            {/* List of Violating Items and Evidence Images */}
            <div>
              <h5 className="font-bold text-white text-xs mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-rose-400" />
                Danh sách bài đăng vi phạm & Hình ảnh bằng chứng ({selectedViolatingUser.violatingItems?.length || 0}):
              </h5>

              {selectedViolatingUser.violatingItems && selectedViolatingUser.violatingItems.length > 0 ? (
                <div className="space-y-3">
                  {selectedViolatingUser.violatingItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.type === 'LISTING' 
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {item.type === 'LISTING' ? 'BÀI ĐĂNG VI PHẠM' : 'BẰNG CHỨNG TỐ CÁO'}
                            </span>
                            {item.createdAt && (
                              <span className="text-[10px] text-slate-500">
                                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                          <h6 className="font-bold text-white text-xs">{item.title}</h6>
                        </div>
                      </div>

                      {item.reason && (
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                          <strong>Lý do vi phạm:</strong> {item.reason}
                        </div>
                      )}

                      {item.description && (
                        <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-950/50 p-2 rounded border border-slate-800">
                          {item.description}
                        </p>
                      )}

                      {/* Images */}
                      {item.imageUrls && item.imageUrls.length > 0 ? (
                        <div>
                          <p className="text-[11px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
                            <span>🖼️ Hình ảnh chụp thực tế / Bằng chứng vi phạm:</span>
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {item.imageUrls.map((url, imgIdx) => (
                              <div
                                key={imgIdx}
                                className="group relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 h-36 flex items-center justify-center"
                              >
                                <img
                                  src={url}
                                  alt={`Bằng chứng vi phạm ${imgIdx + 1}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-[11px] font-semibold transition-opacity"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> Xem ảnh lớn
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">Không có hình ảnh đính kèm cho mục này.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 text-center text-slate-400">
                  <p>Không có bài đăng hay bằng chứng vi phạm nào được ghi nhận cho tài khoản này.</p>
                </div>
              )}
            </div>

            {/* Quick Admin Decision Actions */}
            <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 italic">
                Sau khi xem xét lại bằng chứng, Quản trị viên có thể quyết định mở khóa hoặc nâng mức chế tài.
              </span>
              <div className="flex items-center gap-2">
                <BaseButton variant="secondary" size="sm" onClick={() => setViolatingModal(false)}>
                  Đóng
                </BaseButton>

                {selectedViolatingUser.status !== 'ACTIVE' && (
                  <BaseButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      askConfirmation(
                        'Xác nhận mở khóa tài khoản',
                        `Bạn đã xem xét kỹ hình ảnh bài đăng và bằng chứng.\nBạn có chắc chắn muốn MỞ KHÓA tài khoản sinh viên "${selectedViolatingUser.fullName}"?`,
                        async () => {
                          await handleUserAction(selectedViolatingUser.id, 'ACTIVATE', 0, 'Đã xem xét lại bài vi phạm và mở khóa');
                          setViolatingModal(false);
                        },
                        false,
                        'Mở khóa tài khoản'
                      );
                    }}
                  >
                    <Unlock className="w-3.5 h-3.5 mr-1" />
                    Mở khóa tài khoản
                  </BaseButton>
                )}

                {selectedViolatingUser.status !== 'BANNED' && selectedViolatingUser.status !== 'BLOCKED' && (
                  <BaseButton
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      askConfirmation(
                        'Xác nhận cấm vĩnh viễn (Ban)',
                        `Hình ảnh bài đăng vi phạm rõ ràng.\nBạn có chắc chắn muốn CẤM VĨNH VIỄN sinh viên "${selectedViolatingUser.fullName}" và đưa vào danh sách chặn?`,
                        async () => {
                          await handleUserAction(selectedViolatingUser.id, 'BAN', 0, 'Vi phạm quy chế: Rao bán hàng cấm / Lừa đảo có hình ảnh bằng chứng');
                          setViolatingModal(false);
                        },
                        true,
                        'Cấm vĩnh viễn'
                      );
                    }}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Cấm vĩnh viễn
                  </BaseButton>
                )}
              </div>
            </div>
          </div>
        )}
      </BaseModal>

      {/* CUSTOM USER ACTION MODAL (Clean Minimalist + Subtle Neo-Brutalism, High Contrast) */}
      <BaseModal
        theme="dark"
        maxWidth="lg"
        isOpen={userActionModal.isOpen}
        onClose={() => setUserActionModal({ ...userActionModal, isOpen: false })}
        title={
          <div className="flex items-center gap-2.5">
            {userActionModal.actionType === 'BAN' ? (
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
            )}
            <div>
              <h3 className="text-base font-black text-white tracking-tight">
                {userActionModal.actionType === 'BAN'
                  ? 'Cấm vĩnh viễn tài khoản sinh viên'
                  : 'Tạm khóa tài khoản sinh viên'}
              </h3>
              <p className="text-[11px] text-slate-400 font-normal">
                {userActionModal.actionType === 'BAN'
                  ? 'Sinh viên sẽ bị chặn vĩnh viễn khỏi toàn bộ sàn Campus Marketplace'
                  : 'Tạm ngưng quyền đăng bài & giao dịch của tài khoản có thời hạn'}
              </p>
            </div>
          </div>
        }
      >
        {userActionModal.user && (
          <div className="space-y-4 text-xs text-left">
            {/* 1. Student Identity Card - High Contrast */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-indigo-600 border border-indigo-400/40 text-white flex items-center justify-center font-black text-base shadow-md shadow-indigo-600/20 shrink-0">
                  {userActionModal.user.fullName?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-white text-sm truncate tracking-tight">{userActionModal.user.fullName}</p>
                  <p className="text-indigo-400 font-mono text-xs truncate">{userActionModal.user.email}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] font-mono text-slate-300 font-bold">
                  MSSV: {userActionModal.user.studentCode || 'N/A'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 font-bold">
                  Karma: {userActionModal.user.karmaScore}
                </span>
              </div>
            </div>

            {/* 2. Duration Selector - 3 High Visibility Neo-Brutalist Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  Mức độ chế tài & Thời hạn áp dụng *
                </label>
                <span className="text-[10px] text-slate-400">Chọn 1 trong 3 mức độ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    type: 'SUSPEND_1_DAY',
                    tag: '24 Giờ',
                    label: 'Tạm khóa 1 ngày',
                    deduct: '-10 Karma',
                    theme: 'amber',
                  },
                  {
                    type: 'SUSPEND_1_WEEK',
                    tag: '7 Ngày',
                    label: 'Tạm khóa 1 tuần',
                    deduct: '-20 Karma',
                    theme: 'amber',
                  },
                  {
                    type: 'BAN',
                    tag: 'Vĩnh viễn',
                    label: 'Cấm vĩnh viễn',
                    deduct: null,
                    theme: 'rose',
                  },
                ].map((opt) => {
                  const isSelected = userActionModal.actionType === opt.type;
                  const isRose = opt.theme === 'rose';

                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setUserActionModal({ ...userActionModal, actionType: opt.type as any })}
                      className={`p-3 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? isRose
                            ? 'border-rose-500 bg-rose-500/15 text-white ring-2 ring-rose-500/30 shadow-lg shadow-rose-500/10'
                            : 'border-amber-500 bg-amber-500/15 text-white ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                          : 'border-slate-800 bg-slate-950/80 hover:bg-slate-900/90 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            isSelected
                              ? isRose
                                ? 'bg-rose-500 text-white'
                                : 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {opt.tag}
                        </span>
                      </div>

                      <div>
                        <p className={`font-black text-xs ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {opt.label}
                        </p>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Chế tài:</span>
                        <span className={`font-mono font-bold ${isSelected ? (isRose ? 'text-rose-300' : 'text-amber-300') : 'text-slate-400'}`}>
                          {opt.deduct ? opt.deduct : 'Không có'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Quick Reason Suggestions */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300">
                Gợi ý lý do xử lý nhanh (Bấm để tự điền)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Đăng bài chứa từ cấm nhiều lần',
                  'Nghi ngờ gian lận điểm hẹn an toàn',
                  'Bom hẹn mua bán / Quỵt cọc thỏa thuận',
                  'Cung cấp thông tin sinh viên giả mạo',
                  'Vi phạm quy chế giao dịch tại campus',
                ].map((reason) => {
                  const isSelected = userActionModal.reason === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setUserActionModal({ ...userActionModal, reason })}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-md shadow-indigo-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <span className={isSelected ? 'text-white font-bold' : 'text-indigo-400 font-bold'}>
                        {isSelected ? '✓' : '+'}
                      </span>
                      <span>{reason}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Reason Textarea */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300">
                Lý do chế tài chi tiết (Gửi thông báo tới sinh viên) *
              </label>
              <textarea
                rows={2}
                value={userActionModal.reason}
                onChange={(e) => setUserActionModal({ ...userActionModal, reason: e.target.value })}
                placeholder="Nhập lý do cụ thể gửi thông báo cho sinh viên..."
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-colors resize-none"
              />
            </div>

            {/* 5. Action Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400">
                Hệ quả:{' '}
                <strong className={userActionModal.actionType === 'BAN' ? 'text-rose-400 font-black' : 'text-amber-400 font-black'}>
                  {userActionModal.actionType === 'BAN'
                    ? 'Khóa Vĩnh Viễn (Không có chế tài trừ Karma)'
                    : userActionModal.actionType === 'SUSPEND_1_DAY'
                    ? 'Trừ 10 Karma • Khóa 24h'
                    : 'Trừ 20 Karma • Khóa 7 Ngày'}
                </strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserActionModal({ ...userActionModal, isOpen: false })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!userActionModal.user) return;
                    const action = userActionModal.actionType === 'BAN' ? 'BAN' : 'SUSPEND';
                    const karmaDeduction = userActionModal.actionType === 'BAN' ? 0 : userActionModal.actionType === 'SUSPEND_1_DAY' ? -10 : -20;
                    const finalReason = userActionModal.reason || (action === 'BAN' ? 'Cấm vĩnh viễn do vi phạm nghiêm trọng' : 'Tạm khóa tài khoản do vi phạm quy chế');
                    
                    await handleUserAction(userActionModal.user.id, action, karmaDeduction, finalReason);
                    setUserActionModal({ ...userActionModal, isOpen: false });
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-lg transition cursor-pointer ${
                    userActionModal.actionType === 'BAN'
                      ? 'bg-rose-600 hover:bg-rose-500 border border-rose-500 shadow-rose-600/30'
                      : 'bg-amber-600 hover:bg-amber-500 border border-amber-500 shadow-amber-600/30'
                  }`}
                >
                  {userActionModal.actionType === 'BAN' ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Xác nhận Cấm Vĩnh Viễn</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Xác nhận Tạm Khóa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </BaseModal>

      {/* GLOBAL CONFIRMATION MODAL - Xác nhận 2 bước cho mọi thao tác của Quản trị viên */}
      <BaseModal
        theme="dark"
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
      >
        <div className="space-y-4 text-xs text-slate-200">
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
            <div className={`p-2.5 rounded-xl ${confirmModal.isDestructive ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm mb-1.5">{confirmModal.title}</h4>
              <p className="text-slate-300 leading-relaxed text-xs whitespace-pre-line">{confirmModal.message}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            ⚠️ Thao tác kiểm duyệt này sẽ được lưu vào lịch sử kiểm toán của Ban Quản Trị và tác động ngay lập tức đến hệ thống.
          </p>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-700/60">
            <BaseButton
              variant="secondary"
              size="sm"
              onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
            >
              {confirmModal.cancelText || 'Hủy bỏ'}
            </BaseButton>
            <button
              type="button"
              onClick={async () => {
                const action = confirmModal.onConfirm;
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                await action();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                confirmModal.isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {confirmModal.confirmText || 'Xác nhận thực hiện'}
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};
