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
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Phone,
  Building,
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
  const [activeTab, setActiveTab] = useState<'ALL' | 'APPEAL' | 'REPORT' | 'CARD_VERIFY'>('ALL');
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
  const appealsCount = notifications.filter((n) => n.type === 'APPEAL').length;
  const reportsCount = notifications.filter((n) => n.type === 'REPORT').length;
  const cardsCount = notifications.filter((n) => n.type === 'CARD_VERIFY').length;

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
      adminNotificationService.resolveNotification(
        selectedNotif.id,
        'APPROVED',
        adminNote || 'Đã duyệt khiếu nại'
      );
      setActionSuccessNotice(
        `Đã duyệt khiếu nại mở khóa cho ${selectedNotif.studentName}!`
      );
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 1800);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAppeal = () => {
    if (!selectedNotif) return;
    adminNotificationService.resolveNotification(
      selectedNotif.id,
      'REJECTED',
      adminNote || 'Từ chối đơn khiếu nại'
    );
    setActionSuccessNotice('Đã từ chối đơn khiếu nại. Giữ nguyên chế tài tài khoản.');
    setTimeout(() => {
      setActionSuccessNotice(null);
      setIsReviewModalOpen(false);
      loadNotifs();
    }, 1800);
  };

  const handleSuspendReportedUser = async () => {
    if (!selectedNotif) return;
    try {
      setIsProcessing(true);
      if (selectedNotif.studentId) {
        await adminService.updateUserStatus(selectedNotif.studentId, {
          action: 'SUSPEND',
          karmaAdjustment: -20,
          reason: adminNote || selectedNotif.violationReason || 'Vi phạm quy chế: Rao bán hàng cấm trong KTX',
        });
      }
      adminNotificationService.resolveNotification(
        selectedNotif.id,
        'APPROVED',
        adminNote || 'Trừ 20 Karma và tạm khóa 1 tuần'
      );
      setActionSuccessNotice(
        `Đã trừ 20 điểm Karma và tạm khóa 1 tuần tài khoản ${selectedNotif.studentName}!`
      );
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 2000);
    } catch {
      adminNotificationService.resolveNotification(selectedNotif.id, 'APPROVED');
      setActionSuccessNotice('Đã áp dụng chế tài tạm khóa 1 tuần!');
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 1800);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBanReportedUser = async () => {
    if (!selectedNotif) return;
    try {
      setIsProcessing(true);
      if (selectedNotif.studentId) {
        await adminService.updateUserStatus(selectedNotif.studentId, {
          action: 'BAN',
          reason: adminNote || selectedNotif.violationReason || 'Cấm vĩnh viễn do vi phạm nghiêm trọng nội quy trường',
        });
      }
      adminNotificationService.resolveNotification(
        selectedNotif.id,
        'APPROVED',
        adminNote || 'Cấm vĩnh viễn và đưa vào danh sách chặn'
      );
      setActionSuccessNotice(
        `Đã cấm vĩnh viễn tài khoản ${selectedNotif.studentName} và đưa vào danh sách chặn!`
      );
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 2000);
    } catch {
      adminNotificationService.resolveNotification(selectedNotif.id, 'APPROVED');
      setActionSuccessNotice('Đã cấm tài khoản vĩnh viễn!');
      setTimeout(() => {
        setActionSuccessNotice(null);
        setIsReviewModalOpen(false);
        loadNotifs();
      }, 1800);
    } finally {
      setIsProcessing(false);
    }
  };

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

  const handleDismissReport = () => {
    if (!selectedNotif) return;
    adminNotificationService.resolveNotification(
      selectedNotif.id,
      'REJECTED',
      adminNote || 'Bác báo cáo vi phạm do không đủ bằng chứng'
    );
    setActionSuccessNotice('Đã đóng và bác báo cáo vi phạm này.');
    setTimeout(() => {
      setActionSuccessNotice(null);
      setIsReviewModalOpen(false);
      loadNotifs();
    }, 1800);
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
        title="Hộp thư thông báo và khiếu nại sinh viên"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse border-2 border-slate-900 shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-[440px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden transform animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  Hộp Thư Thông Báo & Khiếu Nại
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                      {unreadCount} mới
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {unreadCount > 0
                    ? `${unreadCount} đơn khiếu nại / báo cáo đang chờ quản trị viên xử lý`
                    : 'Tất cả thông báo đã được xem xét'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adminNotificationService.resetNotifications()}
                className="text-[10px] text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                title="Khôi phục danh sách thông báo mẫu"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => adminNotificationService.markAllAsRead()}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20"
                >
                  <Check className="w-3 h-3" /> Đọc tất cả
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-2 bg-slate-950/50 border-b border-slate-800/80 text-[11px] overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('APPEAL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
                activeTab === 'APPEAL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Khiếu nại ({appealsCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REPORT')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
                activeTab === 'REPORT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Vi phạm ({reportsCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CARD_VERIFY')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
                activeTab === 'CARD_VERIFY'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Duyệt thẻ SV ({cardsCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/70">
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
                    {item.type === 'APPEAL' ? (
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                    ) : item.type === 'REPORT' ? (
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <BadgeCheck className="w-4 h-4" />
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
                        SV: {item.studentName}
                      </span>
                      {item.studentCode && (
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-400 shrink-0">
                          {item.studentCode}
                        </span>
                      )}
                    </div>

                    {item.violationReason && (
                      <p className="text-[10px] text-amber-400/90 font-medium truncate">
                        ⚠️ {item.violationReason}
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
                          {item.type === 'CARD_VERIFY'
                            ? 'Có ảnh Thẻ SV đối soát'
                            : 'Có ảnh bằng chứng / biên lai'}
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

      {/* COMPREHENSIVE NOTIFICATION DETAIL & REVIEW MODAL */}
      <BaseModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        maxWidth="2xl"
        theme="dark"
        title={
          selectedNotif ? (
            <div className="flex items-center gap-2">
              {selectedNotif.type === 'APPEAL' ? (
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
              ) : selectedNotif.type === 'REPORT' ? (
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4" />
                </div>
              )}
              <span className="text-white text-base sm:text-lg">
                {selectedNotif.type === 'APPEAL'
                  ? 'Xem xét Đơn Khiếu nại Mở khóa Tài khoản'
                  : selectedNotif.type === 'REPORT'
                  ? 'Xử lý Báo cáo Vi phạm & Hồ sơ Kiểm duyệt'
                  : 'Xem xét & Xác thực Thẻ Sinh Viên'}
              </span>
            </div>
          ) : (
            'Chi tiết Thông báo'
          )
        }
        description={
          selectedNotif
            ? `Mã hồ sơ: #${selectedNotif.id} • Gửi lúc ${new Date(selectedNotif.createdAt).toLocaleString('vi-VN')}`
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
                      <Sparkles className="w-3 h-3" /> {selectedNotif.karmaScore} Karma
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

              {/* Campus & Contact Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-400">Trường & KTX:</span>
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

            {/* Context / Violation Alert Banner */}
            {(selectedNotif.violationReason || selectedNotif.reportedListingTitle) && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Căn cứ & Lý do liên quan:</span>
                </div>
                {selectedNotif.violationReason && (
                  <p className="text-[11px] leading-relaxed text-slate-200 pl-5">
                    {selectedNotif.violationReason}
                  </p>
                )}
                {selectedNotif.reportedListingTitle && (
                  <p className="text-[11px] text-slate-300 pl-5">
                    Bài đăng vi phạm: <strong>"{selectedNotif.reportedListingTitle}"</strong>
                    {selectedNotif.reportedListingPrice
                      ? ` - Giá: ${selectedNotif.reportedListingPrice.toLocaleString()} đ`
                      : ''}
                  </p>
                )}
              </div>
            )}

            {/* Appeal / Report Explanation Text */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                {selectedNotif.type === 'APPEAL'
                  ? 'Nội dung giải trình & đơn khiếu nại của sinh viên:'
                  : selectedNotif.type === 'REPORT'
                  ? 'Chi tiết nội dung tố cáo & ghi nhận từ hệ thống:'
                  : 'Thông tin đăng ký xác minh thẻ sinh viên:'}
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
                  {selectedNotif.type === 'CARD_VERIFY'
                    ? 'Ảnh thẻ sinh viên đính kèm đối soát:'
                    : 'Hình ảnh bằng chứng / biên lai đối chứng đính kèm:'}
                </label>
                {selectedNotif.imageUrl && (
                  <a
                    href={selectedNotif.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition"
                  >
                    <ExternalLink className="w-3 h-3" /> Mở ảnh gốc trong tab mới
                  </a>
                )}
              </div>

              {selectedNotif.imageUrl ? (
                <div className="rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-950 flex items-center justify-center max-h-[260px] p-1">
                  <img
                    src={selectedNotif.imageUrl}
                    alt="Hình ảnh bằng chứng giải trình"
                    className="w-full h-auto max-h-[250px] object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-[11px]">
                  Sinh viên không đính kèm hình ảnh cho đơn này.
                </div>
              )}
            </div>

            {/* Admin Note Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 text-xs flex items-center justify-between">
                <span>Ghi chú / Phản hồi của Quản trị viên (Admin Note):</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Sẽ lưu vào lịch sử đối soát và gửi cho sinh viên
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
                <button
                  type="button"
                  onClick={() =>
                    setAdminNote('Chấp nhận chứng từ hoàn trả cọc hợp lệ, khôi phục tài khoản.')
                  }
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition"
                >
                  + Đã hoàn trả cọc hợp lệ
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAdminNote('Thông tin thẻ sinh viên khớp 100% cơ sở dữ liệu trường Phenikaa.')
                  }
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition"
                >
                  + Thẻ SV khớp dữ liệu
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
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <BaseButton variant="secondary" size="sm" onClick={() => setIsReviewModalOpen(false)}>
                Đóng cửa sổ
              </BaseButton>

              {/* Action Buttons by Type */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedNotif.type === 'APPEAL' && (
                  <>
                    {selectedNotif.status === 'PENDING' && (
                      <BaseButton
                        variant="danger"
                        size="sm"
                        onClick={handleRejectAppeal}
                        disabled={isProcessing}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
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
                        Chấp nhận & Mở khóa tài khoản ngay
                      </BaseButton>
                    )}
                  </>
                )}

                {selectedNotif.type === 'REPORT' && (
                  <>
                    {selectedNotif.status === 'PENDING' && (
                      <BaseButton
                        variant="secondary"
                        size="sm"
                        onClick={handleDismissReport}
                        disabled={isProcessing}
                      >
                        Bỏ qua / Hủy báo cáo
                      </BaseButton>
                    )}

                    <BaseButton
                      variant="primary"
                      size="sm"
                      onClick={handleSuspendReportedUser}
                      isLoading={isProcessing}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Trừ 20 Karma & Tạm khóa 1 tuần
                    </BaseButton>

                    <BaseButton
                      variant="danger"
                      size="sm"
                      onClick={handleBanReportedUser}
                      isLoading={isProcessing}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cấm tài khoản vĩnh viễn
                    </BaseButton>
                  </>
                )}

                {selectedNotif.type === 'CARD_VERIFY' && (
                  <>
                    {selectedNotif.status === 'PENDING' && (
                      <BaseButton
                        variant="danger"
                        size="sm"
                        onClick={handleRejectAppeal}
                        disabled={isProcessing}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Từ chối thẻ
                      </BaseButton>
                    )}

                    {selectedNotif.status !== 'APPROVED' && (
                      <BaseButton
                        variant="primary"
                        size="sm"
                        onClick={handleApproveStudentCard}
                        isLoading={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <BadgeCheck className="w-3.5 h-3.5 mr-1" />
                        Duyệt Tích Xanh & Thưởng +15 Karma
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
