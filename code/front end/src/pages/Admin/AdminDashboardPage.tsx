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
  Edit3,
  Search,
  BadgeCheck,
  Lock,
  Unlock,
  FileText,
  RefreshCw,
  Clock,
  BarChart3,
  Building2,
  DollarSign,
  AlertOctagon,
  MessageSquare,
  UserX,
  CreditCard,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { BaseModal } from '../../components/base/BaseModal';
import {
  adminService,
  AdminStats,
  AdminListingItem,
  AdminUserItem,
  CategoryItem,
  UniversityItem,
  KeywordBlacklistItem,
  AuditLogItem,
} from '../../services/adminService';
import { reportService, ResolveReportPayload } from '../../services/reportService';
import { ReportItem } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

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

  // 1. Listings State
  const [listings, setListings] = useState<AdminListingItem[]>([]);
  const [listingStatus, setListingStatus] = useState<string>('PENDING_APPROVAL');
  const [listingKeyword, setListingKeyword] = useState<string>('');
  const [listingRiskOnly, setListingRiskOnly] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<AdminListingItem | null>(null);
  const [rejectReasonModal, setRejectReasonModal] = useState<boolean>(false);
  const [presetReason, setPresetReason] = useState<string>('Ảnh vi phạm bản quyền hoặc mờ');
  const [customNote, setCustomNote] = useState<string>('');

  // 2. Users State
  const [users, setUsers] = useState<AdminUserItem[]>([]);
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

  // 4. Metadata State
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [showUniModal, setShowUniModal] = useState(false);
  const [newUniName, setNewUniName] = useState('');
  const [newUniShort, setNewUniShort] = useState('');
  const [newUniDomains, setNewUniDomains] = useState('');

  // 5. Settings & RBAC State
  const [keywords, setKeywords] = useState<KeywordBlacklistItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [newKw, setNewKw] = useState('');
  const [newKwCategory, setNewKwCategory] = useState('PROHIBITED_GOODS');
  const [newKwReason, setNewKwReason] = useState('');

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
        status: userStatusFilter !== 'ALL' ? userStatusFilter : undefined,
      });
      if (res.success && res.data) {
        const phenikaaOnly = (res.data.items || []).filter(
          (u) =>
            u.email.toLowerCase().includes('phenikaa-uni.edu.vn') ||
            u.universityName?.toLowerCase().includes('phenikaa')
        );
        setUsers(phenikaaOnly);
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

  // Load Metadata
  const loadMetadata = async () => {
    try {
      const [catRes, uniRes] = await Promise.all([
        adminService.getCategories(),
        adminService.getUniversities(),
      ]);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (uniRes.success && uniRes.data) setUniversities(uniRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Settings & Audit
  const loadSettings = async () => {
    try {
      const [kwRes, logRes] = await Promise.all([
        adminService.getBlacklistKeywords(),
        adminService.getAuditLogs({ page: 0, size: 20 }),
      ]);
      if (kwRes.success && kwRes.data) setKeywords(kwRes.data);
      if (logRes.success && logRes.data) setAuditLogs(logRes.data.items || []);
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
    window.addEventListener('admin_notifications_updated', handleNotifUpdate);
    return () => {
      window.removeEventListener('admin_notifications_updated', handleNotifUpdate);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') loadStats();
    if (activeTab === 'listings') loadListings();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'metadata') loadMetadata();
    if (activeTab === 'settings') loadSettings();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'listings') loadListings();
  }, [listingStatus, listingRiskOnly]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [userStatusFilter]);

  // Moderation Handler
  const handleModerateListing = async (listingId: number, action: string, reason?: string) => {
    try {
      const res = await adminService.moderateListing(listingId, {
        action,
        reason: reason || presetReason,
        note: customNote,
      });
      if (res.success) {
        notify(`Đã cập nhật bài đăng #${listingId}: ${action}`);
        setRejectReasonModal(false);
        loadListings();
        loadStats();
      }
    } catch (e) {
      notify('Lỗi khi kiểm duyệt bài đăng!');
    }
  };

  // User Actions Handler
  const handleUserAction = async (userId: number, action: string, karmaAdjustment?: number, reason?: string) => {
    try {
      const res = await adminService.updateUserStatus(userId, {
        action,
        karmaAdjustment,
        reason,
      });
      if (res.success) {
        notify(`Đã thực hiện ${action} cho tài khoản #${userId}`);
        setKarmaAdjModal(false);
        loadUsers();
        loadStats();
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

  // Add University
  const handleAddUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniName.trim() || !newUniDomains.trim()) return;
    try {
      const res = await adminService.createUniversity({
        name: newUniName.trim(),
        shortName: newUniShort.trim() || 'UNI',
        emailDomains: newUniDomains.trim(),
      });
      if (res.success) {
        notify(`Đã thêm trường: ${newUniName}`);
        setShowUniModal(false);
        setNewUniName('');
        setNewUniShort('');
        setNewUniDomains('');
        loadMetadata();
      }
    } catch (e) {
      notify('Lỗi khi thêm trường đại học');
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Header & Subtitle with Quick Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>Bảng Điều Khiển Tổng Quan</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                  Realtime Monitoring
                </span>
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

          {/* 5 Realtime KPI Cards with vibrant accents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

            {/* KPI 5 */}
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Giao dịch thành công</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white tracking-tight">
                {stats?.completedTransactionsCount || 0}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-indigo-400 font-medium">Tổng bài: {stats?.totalListings || 0}</span>
                <span className="text-slate-400 text-[11px]">Tin cậy 100%</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {(() => {
                  const hasData = stats && stats.listingsByCategory && Object.keys(stats.listingsByCategory).length > 0;
                  const categoriesToDisplay = hasData
                    ? Object.entries(stats.listingsByCategory).map(([cat, count]) => ({
                        name: cat,
                        count,
                        pct: Math.round((count / (stats.totalListings || 1)) * 100),
                      }))
                    : [
                        { name: '📚 Giáo trình & Sách chuyên ngành', count: 12, pct: 45 },
                        { name: '💻 Đồ công nghệ, Laptop & Phụ kiện', count: 8, pct: 30 },
                        { name: '🛏️ Đồ gia dụng phòng trọ & KTX', count: 4, pct: 15 },
                        { name: '👕 Thời trang & Đồ dùng sinh viên', count: 3, pct: 10 },
                      ];

                  return categoriesToDisplay.map((item, idx) => {
                    const gradients = [
                      'from-indigo-500 to-indigo-600',
                      'from-emerald-400 to-teal-500',
                      'from-amber-400 to-orange-500',
                      'from-purple-500 to-pink-500',
                    ];
                    const barGradient = gradients[idx % gradients.length];

                    return (
                      <div key={item.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium">{item.name}</span>
                          <span className="text-white font-bold">{item.count} bài ({item.pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                          <div
                            className={`bg-gradient-to-r ${barGradient} h-full rounded-full transition-all duration-700`}
                            style={{ width: `${Math.max(item.pct, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Quick Navigation Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Link
              to="/admin/listings"
              className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all flex items-center gap-3.5 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                  Hàng đợi Duyệt bài đăng
                </h4>
                <p className="text-[11px] text-slate-400">Thao tác 1-chạm duyệt hoặc từ chối kèm lý do</p>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex items-center gap-3.5 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Xác thực Thẻ Sinh Viên
                </h4>
                <p className="text-[11px] text-slate-400">Cấp tích xanh & thưởng +15 Karma cho SV</p>
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-rose-500/50 hover:bg-slate-800/50 transition-all flex items-center gap-3.5 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                  Bộ lọc Từ khóa Cấm
                </h4>
                <p className="text-[11px] text-slate-400">Ngăn chặn lừa đảo, cọc thẻ cào & hàng cấm</p>
              </div>
            </Link>
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
                    <span>Hàng Đợi Duyệt Bài Đăng</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                      Moderation Queue
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Kiểm duyệt nội dung, phát hiện từ khóa rủi ro & xử lý bài đăng 1-chạm
                  </p>
                </div>
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

              {/* Filters Bar */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="relative min-w-[240px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Tìm bài đăng theo tiêu đề, người đăng..."
                      value={listingKeyword}
                      onChange={(e) => setListingKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadListings()}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={listingStatus}
                    onChange={(e) => setListingStatus(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PENDING_APPROVAL">Chờ duyệt (Queue)</option>
                    <option value="ACTIVE">Đang hiển thị</option>
                    <option value="RESERVED">Tạm giữ chỗ</option>
                    <option value="COMPLETED">Đã bán/xong</option>
                    <option value="REJECTED">Bị từ chối</option>
                    <option value="ARCHIVED">Đã ẩn/xóa</option>
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

              {/* Listings Queue Table */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Bài đăng</th>
                        <th className="px-4 py-3">Loại / Giá</th>
                        <th className="px-4 py-3">Người bán & Trường</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Thao tác nhanh 1 chạm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {listings.length > 0 ? (
                        listings.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {item.imageUrls && item.imageUrls[0] ? (
                                  <img
                                    src={item.imageUrls[0]}
                                    alt=""
                                    className="w-12 h-12 rounded-lg object-cover bg-slate-900 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500 text-[10px]">
                                    No Image
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-white line-clamp-1">{item.title}</p>
                                  <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">
                                    {item.categoryName || 'Danh mục khác'} • {item.conditionStatus}
                                  </p>
                                  {item.isRiskFlagged && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-medium mt-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      {item.riskReason || 'Nghi vấn từ khóa cấm'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-emerald-400">
                                {item.transactionType === 'GIVEAWAY' ? 'Tặng 0đ' : formatCurrency(item.price)}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5">{item.transactionType}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-200">{item.authorName || 'Sinh viên'}</p>
                              <p className="text-[11px] text-slate-400">{item.universityName || 'ĐH Chưa rõ'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                  item.status === 'ACTIVE'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : item.status === 'PENDING_APPROVAL'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : item.status === 'REJECTED'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => askConfirmation(
                                    'Xác nhận duyệt bài đăng',
                                    `Bạn có chắc chắn muốn DUYỆT bài đăng #${item.id} ("${item.title}") để công khai ngay lên Chợ Phenikaa?`,
                                    () => handleModerateListing(item.id, 'APPROVE'),
                                    false,
                                    'Duyệt ngay'
                                  )}
                                  title="Duyệt bài đăng (Hiển thị ngay)"
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedListing(item);
                                    setRejectReasonModal(true);
                                  }}
                                  title="Từ chối kèm lý do mẫu"
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => askConfirmation(
                                    'Yêu cầu chỉnh sửa bài đăng',
                                    `Bạn có chắc chắn muốn yêu cầu sinh viên sửa lại bài đăng #${item.id} ("${item.title}")?`,
                                    () => handleModerateListing(item.id, 'REQUEST_EDIT'),
                                    false,
                                    'Gửi yêu cầu'
                                  )}
                                  title="Yêu cầu sửa thông tin"
                                  className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => askConfirmation(
                                    'Xác nhận gỡ / ẩn bài đăng',
                                    `Bạn có chắc chắn muốn GỠ / ẨN bài đăng #${item.id} ("${item.title}") khỏi sàn giao dịch?`,
                                    () => handleModerateListing(item.id, 'HIDE'),
                                    true,
                                    'Gỡ bài đăng'
                                  )}
                                  title="Gỡ/Ẩn bài đăng"
                                  className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                      Student Verification
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Xác minh thẻ sinh viên qua OCR, thưởng +15 Karma uy tín & quản lý quyền tài khoản
                  </p>
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
                  Tất cả sinh viên ({stats?.totalUsers || (userStatusFilter === 'ALL' && users.length > 0 ? users.length : 11)})
                </button>
                <button
                  onClick={() => setUserStatusFilter('ACTIVE')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    userStatusFilter === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  Đang hoạt động ({userStatusFilter === 'ACTIVE' ? users.length : 8})
                </button>
                <button
                  onClick={() => setUserStatusFilter('BLOCKED_ONLY')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    userStatusFilter === 'BLOCKED_ONLY'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>🚫 Danh sách sinh viên bị chặn ({stats?.blockedStudentsCount || (userStatusFilter === 'BLOCKED_ONLY' ? users.length : 3)})</span>
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
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hoạt động (Active)</option>
                    <option value="BLOCKED_ONLY">🚫 Danh sách sinh viên bị chặn</option>
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
                        <th className="px-4 py-3">Trường & KTX</th>
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
                              <p className="text-slate-200 font-medium">{u.universityName || 'Đại học'}</p>
                              <p className="text-[11px] text-slate-400">{u.campusName || 'Cơ sở'} {u.dormitory ? `• ${u.dormitory}` : ''}</p>
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
                                        const reason = window.prompt('Nhập lý do tạm khóa tài khoản sinh viên:', 'Khóa tạm thời do nghi ngờ vi phạm quy định');
                                        if (reason !== null) {
                                          askConfirmation(
                                            'Xác nhận tạm khóa tài khoản',
                                            `Bạn có chắc chắn muốn TẠM KHÓA tài khoản sinh viên #${u.id} (${u.fullName})?\nLý do: "${reason}"`,
                                            () => handleUserAction(u.id, 'SUSPEND', 0, reason),
                                            true,
                                            'Tạm khóa'
                                          );
                                        }
                                      }}
                                      title="Khóa tạm thời"
                                      className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reason = window.prompt('Nhập lý do cấm vĩnh viễn sinh viên này:', 'Cấm vĩnh viễn do vi phạm nghiêm trọng quy chế Phenikaa');
                                        if (reason !== null) {
                                          askConfirmation(
                                            'Xác nhận cấm vĩnh viễn (Ban)',
                                            `Bạn có chắc chắn muốn CẤM VĨNH VIỄN sinh viên #${u.id} (${u.fullName}) và đưa vào danh sách bị chặn?\nLý do: "${reason}"`,
                                            () => handleUserAction(u.id, 'BAN', 0, reason),
                                            true,
                                            'Cấm tài khoản'
                                          );
                                        }
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

          {/* TAB 5: METADATA MANAGEMENT */}
          {activeTab === 'metadata' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>Danh Mục & Định Vị Trường Học</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                      Metadata & Campuses
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Quản lý danh mục hàng hóa sinh viên, danh sách trường đại học đối tác & các cụm cơ sở ký túc xá
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Categories */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Cây danh mục hàng hóa sinh viên
                    </h3>
                  <button
                    onClick={() => setShowCatModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm danh mục
                  </button>
                </div>

                <div className="divide-y divide-slate-800">
                  {categories.map((cat) => (
                    <div key={cat.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{cat.name}</p>
                        <p className="text-[11px] text-slate-400">Slug: {cat.slug}</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm(`Xác nhận xóa danh mục ${cat.name}?`)) {
                            await adminService.deleteCategory(cat.id);
                            notify(`Đã xóa danh mục ${cat.name}`);
                            loadMetadata();
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Universities & Campuses */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    Danh sách trường Đại học & Cơ sở KTX
                  </h3>
                  <button
                    onClick={() => setShowUniModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm trường
                  </button>
                </div>

                <div className="divide-y divide-slate-800">
                  {universities.map((uni) => (
                    <div key={uni.id} className="py-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-white text-sm">
                          {uni.name} ({uni.shortName})
                        </p>
                      </div>
                      <p className="text-slate-400">Domain Edu: <span className="text-emerald-400 font-mono">{uni.emailDomains}</span></p>
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
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                      Security & Compliance
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Bộ lọc 14 từ khóa cấm theo thời gian thực & nhật ký kiểm toán không thể can thiệp
                  </p>
                </div>
              </div>

              {/* Keyword Blacklist */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-4">
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
                        <th className="px-4 py-2.5">Hành động</th>
                        <th className="px-4 py-2.5">Đối tượng</th>
                        <th className="px-4 py-2.5">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/20">
                          <td className="px-4 py-2 text-slate-400">{formatDate(log.createdAt)}</td>
                          <td className="px-4 py-2 text-indigo-300 font-semibold">{log.adminEmail}</td>
                          <td className="px-4 py-2">
                            <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-slate-300">{log.targetType} #{log.targetId || '-'}</td>
                          <td className="px-4 py-2 text-slate-400 font-sans">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

      {/* MODAL: Reject Listing Preset Reason */}
      <BaseModal
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

      {/* MODAL: Karma Adjustment */}
      <BaseModal
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
      <BaseModal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Thêm danh mục hàng hóa mới">
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

            {/* Student Card Image Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  Ảnh chụp Thẻ Sinh Viên thực tế để đối chiếu:
                </label>
                {selectedCardUser.studentCardImageUrl && (
                  <a
                    href={selectedCardUser.studentCardImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" /> Mở ảnh gốc
                  </a>
                )}
              </div>

              {selectedCardUser.studentCardImageUrl ? (
                <div className="relative group rounded-xl overflow-hidden border-2 border-indigo-500/30 bg-slate-950 flex items-center justify-center max-h-[340px]">
                  <img
                    src={selectedCardUser.studentCardImageUrl}
                    alt={`Thẻ sinh viên của ${selectedCardUser.fullName}`}
                    className="w-full h-auto max-h-[320px] object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] text-slate-300 flex items-center gap-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                    Thẻ SV chính quy Phenikaa University
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
                <BaseButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    askConfirmation(
                      'Duyệt tích xanh thẻ sinh viên',
                      `Bạn có chắc chắn muốn DUYỆT thẻ sinh viên và cộng +15 điểm uy tín Karma cho "${selectedCardUser.fullName}"?\nSinh viên sẽ nhận được Tích Xanh chính chủ.`,
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
              )}
            </div>
          </div>
        )}
      </BaseModal>

      {/* MODAL: Xem bài đăng vi phạm & bằng chứng đối với tài khoản bị khóa */}
      <BaseModal
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

      {/* MODAL: Create University */}
      <BaseModal isOpen={showUniModal} onClose={() => setShowUniModal(false)} title="Thêm trường đại học đối tác">
        <form onSubmit={handleAddUniversity} className="space-y-4 text-xs text-slate-200">
          <div>
            <label className="block text-slate-400 mb-1">Tên trường đầy đủ:</label>
            <input
              type="text"
              required
              value={newUniName}
              onChange={(e) => setNewUniName(e.target.value)}
              placeholder="Ví dụ: Đại học Thủy Lợi"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Tên viết tắt:</label>
            <input
              type="text"
              value={newUniShort}
              onChange={(e) => setNewUniShort(e.target.value)}
              placeholder="TLU"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Domain email trường (phân tách dấu phẩy):</label>
            <input
              type="text"
              required
              value={newUniDomains}
              onChange={(e) => setNewUniDomains(e.target.value)}
              placeholder="tlu.edu.vn,e.tlu.edu.vn"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <BaseButton variant="secondary" size="sm" onClick={() => setShowUniModal(false)}>
              Hủy
            </BaseButton>
            <BaseButton type="submit" variant="primary" size="sm">
              Thêm trường
            </BaseButton>
          </div>
        </form>
      </BaseModal>

      {/* GLOBAL CONFIRMATION MODAL - Xác nhận 2 bước cho mọi thao tác của Quản trị viên */}
      <BaseModal
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
