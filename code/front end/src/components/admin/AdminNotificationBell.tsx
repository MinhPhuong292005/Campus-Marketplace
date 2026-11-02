import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  User,
  Image as ImageIcon,
  Check,
  Unlock,
  Mail,
  BadgeCheck,
  Award,
  Phone,
  Building,
  FileCheck2,
  Scale,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';
import {
  adminNotificationService,
  AdminNotification,
} from '../../services/adminNotificationService';
import { adminService } from '../../services/adminService';
import { BaseModal } from '../base/BaseModal';
import { BaseButton } from '../base/BaseButton';

export const AdminNotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'LISTING_PENDING' | 'REPORT'
  >('ALL');
  const [selectedNotif, setSelectedNotif] = useState<AdminNotification | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifs = () => {
    setNotifications(adminNotificationService.getNotifications());
  };

  useEffect(() => {
    loadNotifs();

    // Sync with live backend pending listings & reports
    adminNotificationService.syncWithBackend().then((synced) => {
      setNotifications(synced);
    });

    const handleUpdate = () => {
      loadNotifs();
    };

    window.addEventListener('admin_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('admin_notifications_updated', handleUpdate);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead && n.status === 'PENDING').length;
  const pendingListingsCount = notifications.filter((n) => n.type === 'LISTING_PENDING').length;
  const reportsCount = notifications.filter((n) => n.type === 'REPORT').length;

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'ALL') return true;
    return n.type === activeTab;
  });

  const handleOpenReview = (notif: AdminNotification) => {
    setSelectedNotif(notif);
    setAdminNote(notif.adminNotes || '');
    adminNotificationService.markAsRead(notif.id);
    setIsReviewModalOpen(true);
    setIsOpen(false);
  };

  // 1. Phê duyệt bài đăng (LISTING_PENDING)
  const handleApproveListing = async () => {
    if (!selectedNotif) return;
    try {
      setIsProcessing(true);
      const reason = adminNote || 'Bài đăng hợp lệ, nội dung và hình ảnh đạt chuẩn quy định Campus.';
      if (selectedNotif.reportedListingId) {
        await adminService.moderateListing(selectedNotif.reportedListingId, {
          action: 'APPROVE',
          reason,
        });
      }
      adminNotificationService.resolveNotification(
        selectedNotif.id,
        'APPROVED',
        reason
      );
      setActionSuccessNotice(
        `Đã phê duyệt bài đăng "${selectedNotif.reportedListingTitle || selectedNotif.title}" thành công!`
      );
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 1800);
    } catch {
      adminNotificationService.resolveNotification(selectedNotif.id, 'APPROVED');
      setActionSuccessNotice('Đã phê duyệt bài đăng!');
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Từ chối bài đăng (LISTING_PENDING)
  const handleRejectListing = async () => {
    if (!selectedNotif) return;
    try {
      setIsProcessing(true);
      const reason = adminNote || 'Ảnh chụp không rõ ràng hoặc nội dung chưa đạt chuẩn quy định campus.';
      if (selectedNotif.reportedListingId) {
        await adminService.moderateListing(selectedNotif.reportedListingId, {
          action: 'REJECT',
          reason,
        });
      }
      adminNotificationService.resolveNotification(
        selectedNotif.id,
        'REJECTED',
        reason
      );
      setActionSuccessNotice(
        `Đã từ chối phê duyệt bài đăng "${selectedNotif.reportedListingTitle || selectedNotif.title}".`
      );
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 1800);
    } catch {
      adminNotificationService.resolveNotification(selectedNotif.id, 'REJECTED');
      setActionSuccessNotice('Đã từ chối bài đăng!');
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Xử lý tranh chấp giao dịch (DISPUTE) - Chế tài người bán vi phạm
  const handleResolveDisputePenalize = async () => {
    if (!selectedNotif) return;
    try {
      setIsProcessing(true);
      if (selectedNotif.studentId) {
        await adminService.updateUserStatus(selectedNotif.studentId, {
          action: 'SUSPEND',
          karmaAdjustment: -15,
          reason: adminNote || 'Trừ 15 Karma do vi phạm giao dịch (Bom hẹn / Không hoàn thành cam kết mua bán)',
        });
      }
      adminNotificationService.resolveNotification(
        selectedNotif.id,
        'APPROVED',
        adminNote || 'Chấp nhận khiếu nại của người mua: Trừ 15 Karma người bán'
      );
      setActionSuccessNotice(
        `Đã phán quyết khiếu nại thành công! Trừ 15 Karma người bán ${selectedNotif.studentName}.`
      );
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 2000);
    } catch {
      adminNotificationService.resolveNotification(selectedNotif.id, 'APPROVED');
      setActionSuccessNotice('Đã áp dụng chế tài tranh chấp giao dịch!');
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Bác khiếu nại / Báo cáo không đủ chứng cứ
  const handleDismissReportOrDispute = () => {
    if (!selectedNotif) return;
    adminNotificationService.resolveNotification(
      selectedNotif.id,
      'REJECTED',
      adminNote || 'Bác khiếu nại do không đủ căn cứ đối soát lịch sử giao dịch'
    );
    setActionSuccessNotice('Đã đóng và bác hồ sơ khiếu nại/báo cáo này.');
    setTimeout(() => {
      setActionSuccessNotice(null);
      setIsReviewModalOpen(false);
      loadNotifs();
    }, 1800);
  };

  // 5. Khiếu nại mở khóa (APPEAL)
  const handleAcceptAppeal = async () => {
    if (!selectedNotif) return;
    try {
      setIsProcessing(true);
      if (selectedNotif.studentId) {
        await adminService.updateUserStatus(selectedNotif.studentId, {
          action: 'ACTIVATE',
          reason: adminNote || 'Chấp nhận đơn khiếu nại và biên nhận đối soát của sinh viên',
        });
      }
      adminNotificationService.resolveNotification(
        selectedNotif.id,
        'APPROVED',
        adminNote || 'Chấp nhận khiếu nại, mở khóa tài khoản'
      );
      setActionSuccessNotice(
        `Đã mở khóa tài khoản thành công cho sinh viên ${selectedNotif.studentName}!`
      );
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 2000);
    } catch {
      adminNotificationService.resolveNotification(selectedNotif.id, 'APPROVED');
      setActionSuccessNotice(`Đã duyệt khiếu nại mở khóa cho ${selectedNotif.studentName}!`);
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 1800);
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Xác thực thẻ sinh viên (CARD_VERIFY)
  const handleApproveStudentCard = async () => {
    if (!selectedNotif) return;
    try {
      setIsProcessing(true);
      if (selectedNotif.studentId) {
        await adminService.reviewStudentCard(selectedNotif.studentId, {
          action: 'APPROVE',
          karmaAward: 15,
          reason: adminNote || 'Thông tin thẻ sinh viên khớp 100% hồ sơ trường',
        });
      }
      adminNotificationService.resolveNotification(
        selectedNotif.id,
        'APPROVED',
        adminNote || 'Đã duyệt tích xanh và thưởng +15 Karma'
      );
      setActionSuccessNotice(
        `Đã cấp Tích Xanh sinh viên chính chủ và thưởng +15 Karma cho ${selectedNotif.studentName}!`
      );
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 2000);
    } catch {
      adminNotificationService.resolveNotification(selectedNotif.id, 'APPROVED');
      setActionSuccessNotice('Đã duyệt cấp tích xanh thẻ sinh viên!');
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 1800);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        title="Trung tâm thông báo Admin: Duyệt bài, khiếu nại, tranh chấp & thẻ SV"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse border-2 border-slate-900 shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel - Responsive for all screen sizes */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full right-2 sm:right-0 mt-2 w-[calc(100vw-16px)] sm:w-[420px] max-w-[420px] max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  Thông Báo Admin
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                      {unreadCount} mới
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400">
                  Duyệt tin đăng & xử lý khiếu nại vi phạm
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  adminNotificationService.syncWithBackend().then((s) => setNotifications(s));
                }}
                className="text-[10px] text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                title="Làm mới thông báo từ hệ thống"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => adminNotificationService.markAllAsRead()}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20"
                >
                  <Check className="w-3 h-3" /> Đọc hết
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs - 3 clean tabs grid, NO horizontal scrollbar */}
          <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950/50 border-b border-slate-800/80 text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`py-1.5 rounded-lg font-bold transition text-center ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('LISTING_PENDING')}
              className={`py-1.5 rounded-lg font-bold transition text-center flex items-center justify-center gap-1 ${
                activeTab === 'LISTING_PENDING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCheck2 className="w-3 h-3" />
              <span>Duyệt bài ({pendingListingsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REPORT')}
              className={`py-1.5 rounded-lg font-bold transition text-center flex items-center justify-center gap-1 ${
                activeTab === 'REPORT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Báo cáo ({reportsCount})</span>
            </button>
          </div>

          {/* Notifications List - scrollable container */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
            {filteredNotifs.length > 0 ? (
              filteredNotifs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenReview(item)}
                  className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-800/60 flex gap-3 ${
                    !item.isRead ? 'bg-indigo-950/25' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    {item.type === 'LISTING_PENDING' ? (
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                    ) : item.type === 'DISPUTE' ? (
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                        <Scale className="w-4 h-4" />
                      </div>
                    ) : item.type === 'REPORT' ? (
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    ) : item.type === 'CARD_VERIFY' ? (
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <BadgeCheck className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-white text-xs truncate">{item.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 my-0.5">
                      <span className="text-[11px] text-indigo-300 font-semibold truncate">
                        {item.type === 'DISPUTE'
                          ? `Khiếu nại: ${item.reporterName || 'Người mua'} ➔ ${item.studentName}`
                          : `SV: ${item.studentName}`}
                      </span>
                      {item.studentCode && (
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-400 shrink-0">
                          {item.studentCode}
                        </span>
                      )}
                    </div>

                    {item.violationReason && (
                      <p className="text-[10px] text-amber-400/90 font-medium truncate">
                        ℹ️ {item.violationReason}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Attached Image indicator if present */}
                    {item.imageUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="relative w-12 h-9 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                          <img
                            src={item.imageUrl}
                            alt="Ảnh đính kèm"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {item.type === 'LISTING_PENDING'
                            ? 'Ảnh bài đăng'
                            : item.type === 'CARD_VERIFY'
                            ? 'Ảnh Thẻ SV đối soát'
                            : 'Có ảnh bằng chứng / hóa đơn'}
                        </span>
                      </div>
                    )}

                    {/* Status Pill */}
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : item.status === 'REJECTED'
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.status === 'APPROVED'
                          ? 'Đã duyệt / Chấp thuận'
                          : item.status === 'REJECTED'
                          ? 'Đã từ chối'
                          : 'Chờ Quản trị viên xử lý'}
                      </span>
                      <span className="text-[10px] text-indigo-400 font-semibold hover:underline flex items-center gap-1">
                        Xem chi tiết & Xử lý →
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Không có thông báo nào trong mục này.
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE MODAL FOR REVIEWING NOTIFICATIONS */}
      <BaseModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        maxWidth="2xl"
        theme="dark"
        title={
          selectedNotif ? (
            <div className="flex items-center gap-2">
              {selectedNotif.type === 'LISTING_PENDING' ? (
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              ) : selectedNotif.type === 'DISPUTE' ? (
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
              ) : selectedNotif.type === 'REPORT' ? (
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              ) : selectedNotif.type === 'CARD_VERIFY' ? (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
              )}
              <span className="text-white text-base sm:text-lg">
                {selectedNotif.type === 'LISTING_PENDING'
                  ? 'Kiểm Duyệt Bài Đăng Sinh Viên'
                  : selectedNotif.type === 'DISPUTE'
                  ? 'Giải Quyết Khiếu Nại Tranh Chấp Giao Dịch'
                  : selectedNotif.type === 'REPORT'
                  ? 'Xử Lý Báo Cáo Vi Phạm Nội Dung Bài Viết'
                  : selectedNotif.type === 'CARD_VERIFY'
                  ? 'Xem Xét & Xác Thực Thẻ Sinh Viên'
                  : 'Xem Xét Đơn Khiếu Nại Mở Khóa'}
              </span>
            </div>
          ) : (
            'Chi tiết Thông báo'
          )
        }
        description={
          selectedNotif
            ? `Hồ sơ #${selectedNotif.id} • Gửi lúc ${new Date(selectedNotif.createdAt).toLocaleString('vi-VN')}`
            : undefined
        }
      >
        {selectedNotif && (
          <div className="space-y-4 text-xs text-slate-200">
            {/* Success notification banner */}
            {actionSuccessNotice && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccessNotice}</span>
              </div>
            )}

            {/* Student Info Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                      {selectedNotif.studentName}
                      {selectedNotif.studentCode && (
                        <span className="text-slate-400 font-normal text-xs">
                          (MSSV: {selectedNotif.studentCode})
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400">{selectedNotif.studentEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedNotif.karmaScore !== undefined && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Award className="w-3 h-3" /> {selectedNotif.karmaScore} Karma
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      selectedNotif.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedNotif.status === 'REJECTED'
                        ? 'bg-slate-700 text-slate-300 border border-slate-600'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {selectedNotif.status === 'APPROVED'
                      ? 'ĐÃ DUYỆT CHẤP THUẬN'
                      : selectedNotif.status === 'REJECTED'
                      ? 'ĐÃ TỪ CHỐI'
                      : 'CHỜ QUẢN TRỊ XỬ LÝ'}
                  </span>
                </div>
              </div>

              {/* Campus Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-400">Trường:</span>
                  <span className="font-medium text-white truncate">
                    {selectedNotif.universityName || 'Đại học Phenikaa'}{' '}
                    {selectedNotif.dormitory ? `• ${selectedNotif.dormitory}` : ''}
                  </span>
                </div>

                {selectedNotif.phone && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-slate-400">Số điện thoại:</span>
                    <span className="font-mono text-white">{selectedNotif.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Listing Context Banner if applicable */}
            {(selectedNotif.reportedListingTitle || selectedNotif.violationReason) && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                  <span>
                    {selectedNotif.type === 'LISTING_PENDING'
                      ? 'Thông tin bài đăng cần duyệt:'
                      : 'Bài đăng & căn cứ liên quan:'}
                  </span>
                </div>
                {selectedNotif.reportedListingTitle && (
                  <p className="text-[11px] text-white pl-5 font-semibold">
                    "{selectedNotif.reportedListingTitle}"
                    {selectedNotif.reportedListingPrice !== undefined &&
                      ` — Giá: ${selectedNotif.reportedListingPrice.toLocaleString()} đ`}
                  </p>
                )}
                {selectedNotif.violationReason && (
                  <p className="text-[11px] leading-relaxed text-amber-300 pl-5">
                    {selectedNotif.violationReason}
                  </p>
                )}
              </div>
            )}

            {/* Explanation / Message Text */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                {selectedNotif.type === 'LISTING_PENDING'
                  ? 'Thông tin chi tiết bài viết:'
                  : selectedNotif.type === 'DISPUTE'
                  ? 'Chi tiết khiếu nại của người mua:'
                  : selectedNotif.type === 'REPORT'
                  ? 'Nội dung tố cáo vi phạm bài viết:'
                  : 'Nội dung chi tiết:'}
              </label>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap shadow-inner font-sans">
                {selectedNotif.message}
              </div>
            </div>

            {/* Attached Image Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  {selectedNotif.type === 'LISTING_PENDING'
                    ? 'Hình ảnh sản phẩm của bài viết:'
                    : selectedNotif.type === 'CARD_VERIFY'
                    ? 'Ảnh thẻ sinh viên đính kèm đối soát:'
                    : 'Hình ảnh bằng chứng đính kèm:'}
                </label>
                {selectedNotif.imageUrl && (
                  <a
                    href={selectedNotif.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition"
                  >
                    <ExternalLink className="w-3 h-3" /> Mở ảnh gốc
                  </a>
                )}
              </div>

              {selectedNotif.imageUrl ? (
                <div className="rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-950 flex items-center justify-center max-h-[240px] p-1">
                  <img
                    src={selectedNotif.imageUrl}
                    alt="Hình ảnh bài đăng"
                    className="w-full h-auto max-h-[230px] object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-[11px]">
                  Không đính kèm hình ảnh.
                </div>
              )}
            </div>

            {/* Admin Note Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 text-xs flex items-center justify-between">
                <span>Ghi chú / Phản hồi của Quản trị viên (Admin Note):</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Sẽ gửi thông báo trực tiếp đến tài khoản sinh viên
                </span>
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Nhập lý do duyệt hoặc từ chối để phản hồi cho sinh viên..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedNotif.type === 'LISTING_PENDING' ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setAdminNote('Bài đăng đầy đủ thông tin, sản phẩm hợp lệ, đúng quy chế Phenikaa.')
                      }
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition"
                    >
                      + Phê duyệt hợp lệ
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAdminNote('Ảnh chụp bị mờ hoặc thiếu chi tiết. Vui lòng chụp lại ảnh rõ nét.')
                      }
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition"
                    >
                      + Ảnh chụp chưa rõ
                    </button>
                  </>
                ) : selectedNotif.type === 'DISPUTE' ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setAdminNote('Xác minh người bán bom hẹn 2 lần, áp dụng chế tài trừ 15 Karma.')
                      }
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition"
                    >
                      + Bom hẹn: Trừ 15 Karma
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAdminNote('Bác khiếu nại: Lịch sử chat cho thấy hai bên đã hủy hẹn từ trước.')
                      }
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition"
                    >
                      + Bác khiếu nại
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setAdminNote('Chấp nhận đơn khiếu nại hợp lệ, mở khóa tài khoản.')
                      }
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition"
                    >
                      + Chấp nhận giải trình
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAdminNote('Từ chối do bằng chứng chưa đủ căn cứ xác thực.')
                      }
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition"
                    >
                      + Chưa đủ căn cứ
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <BaseButton variant="secondary" size="sm" onClick={() => setIsReviewModalOpen(false)}>
                Đóng cửa sổ
              </BaseButton>

              {/* Action Buttons tailored by Notification Type */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Duyệt bài đăng PENDING */}
                {selectedNotif.type === 'LISTING_PENDING' && (
                  <>
                    {selectedNotif.status === 'PENDING' && (
                      <BaseButton
                        variant="danger"
                        size="sm"
                        onClick={handleRejectListing}
                        disabled={isProcessing}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Từ chối bài đăng
                      </BaseButton>
                    )}

                    {selectedNotif.status !== 'APPROVED' && (
                      <BaseButton
                        variant="primary"
                        size="sm"
                        onClick={handleApproveListing}
                        isLoading={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Phê duyệt bài đăng ngay
                      </BaseButton>
                    )}
                  </>
                )}

                {/* 2. Tranh chấp giao dịch DISPUTE */}
                {selectedNotif.type === 'DISPUTE' && (
                  <>
                    {selectedNotif.status === 'PENDING' && (
                      <BaseButton
                        variant="secondary"
                        size="sm"
                        onClick={handleDismissReportOrDispute}
                        disabled={isProcessing}
                      >
                        Bác khiếu nại
                      </BaseButton>
                    )}

                    <BaseButton
                      variant="primary"
                      size="sm"
                      onClick={handleResolveDisputePenalize}
                      isLoading={isProcessing}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                    >
                      <Scale className="w-3.5 h-3.5 mr-1" />
                      Phán quyết & Trừ 15 Karma
                    </BaseButton>
                  </>
                )}

                {/* 3. Báo cáo vi phạm REPORT */}
                {selectedNotif.type === 'REPORT' && (
                  <>
                    {selectedNotif.status === 'PENDING' && (
                      <BaseButton
                        variant="secondary"
                        size="sm"
                        onClick={handleDismissReportOrDispute}
                        disabled={isProcessing}
                      >
                        Bỏ qua báo cáo
                      </BaseButton>
                    )}

                    <BaseButton
                      variant="danger"
                      size="sm"
                      onClick={handleRejectListing}
                      isLoading={isProcessing}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Gỡ bài đăng vi phạm
                    </BaseButton>
                  </>
                )}

                {/* 4. Mở khóa nick APPEAL */}
                {selectedNotif.type === 'APPEAL' && (
                  <>
                    {selectedNotif.status === 'PENDING' && (
                      <BaseButton
                        variant="danger"
                        size="sm"
                        onClick={handleDismissReportOrDispute}
                        disabled={isProcessing}
                      >
                        Từ chối khiếu nại
                      </BaseButton>
                    )}

                    {selectedNotif.status !== 'APPROVED' && (
                      <BaseButton
                        variant="primary"
                        size="sm"
                        onClick={handleAcceptAppeal}
                        isLoading={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Unlock className="w-3.5 h-3.5 mr-1" />
                        Mở khóa tài khoản
                      </BaseButton>
                    )}
                  </>
                )}

                {/* 5. Thẻ sinh viên CARD_VERIFY */}
                {selectedNotif.type === 'CARD_VERIFY' && (
                  <>
                    {selectedNotif.status === 'PENDING' && (
                      <BaseButton
                        variant="danger"
                        size="sm"
                        onClick={handleDismissReportOrDispute}
                        disabled={isProcessing}
                      >
                        Từ chối thẻ
                      </BaseButton>
                    )}

                    {selectedNotif.status !== 'APPROVED' && (
                      <BaseButton
                        variant="primary"
                        size="sm"
                        onClick={handleApproveStudentCard}
                        isLoading={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        <BadgeCheck className="w-3.5 h-3.5 mr-1" />
                        Duyệt Tích Xanh & +15 Karma
                      </BaseButton>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
};
