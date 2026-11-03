import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Check,
  RotateCcw,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Info,
  ShoppingBag,
  Gift,
  FileText,
} from 'lucide-react';
import {
  studentNotificationService,
  StudentNotification,
} from '../../services/studentNotificationService';
import { BaseModal } from '../base/BaseModal';
import { BaseButton } from '../base/BaseButton';
import { useAuthStore } from '../../store/useAuthStore';
import { listingService } from '../../services/listingService';

export const StudentNotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'APPROVED' | 'REJECTED' | 'UNREAD'>('ALL');
  const [selectedNotif, setSelectedNotif] = useState<StudentNotification | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await studentNotificationService.getNotifications();
      setNotifications(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  useEffect(() => {

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setNotifications(e.detail);
      } else {
        loadNotifications();
      }
    };

    window.addEventListener('student_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('student_notifications_updated', handleUpdate);
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const approvedCount = notifications.filter((n) => n.type === 'LISTING_APPROVED').length;
  const rejectedCount = notifications.filter((n) => n.type === 'LISTING_REJECTED').length;

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'APPROVED') return n.type === 'LISTING_APPROVED';
    if (activeTab === 'REJECTED') return n.type === 'LISTING_REJECTED';
    if (activeTab === 'UNREAD') return !n.isRead;
    return true;
  });

  const handleOpenDetail = (notif: StudentNotification) => {
    setSelectedNotif(notif);
    if (!notif.isRead) {
      studentNotificationService.markAsRead(notif.id);
    }
    setIsDetailModalOpen(true);
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await studentNotificationService.markAllAsRead();
    loadNotifications();
  };

  const handleActionFromNotification = async (notif: StudentNotification) => {
    setIsDetailModalOpen(false);

    if (notif.type === 'GIVEAWAY_AWARDED') {
      // Trích xuất tên món đồ & tên người tặng từ thông báo
      const matchItem = notif.title.includes(':')
        ? notif.title.split(':').slice(1).join(':').trim()
        : notif.message.match(/"([^"]+)"/)
        ? notif.message.match(/"([^"]+)"/)![1]
        : 'món đồ tặng';

      let giverName = '';
      const matchGiver = notif.message.match(/bạn ([^]+?) lựa chọn/);
      if (matchGiver && matchGiver[1]) {
        giverName = matchGiver[1].trim();
      }

      let giverId = undefined;

      // Tra cứu thêm thông tin từ bài đăng nếu có mã bài đăng
      if (notif.referenceId) {
        try {
          const res = await listingService.getListingById(notif.referenceId);
          if (res?.data) {
            giverId = res.data.userId;
            giverName = giverName || res.data.authorName || '';
          }
        } catch {}
      }

      const greeting = giverName ? `Chào bạn ${giverName}!` : 'Chào bạn!';
      const draftedText = `${greeting} Mình là người may mắn được bạn chọn trao tặng món đồ "${matchItem}". Mình cảm ơn bạn rất nhiều! Cho mình hỏi chúng ta có thể hẹn gặp nhau vào lúc nào và ở điểm nào tại trường Phenikaa để giao nhận đồ tiện nhất ạ?`;

      navigate('/chat', {
        state: {
          sellerId: giverId,
          sellerName: giverName,
          listingId: notif.referenceId,
          listingTitle: matchItem,
          initialMessage: draftedText,
        },
      });
      return;
    }

    if (notif.type === 'GIVEAWAY_REQUEST' && notif.referenceId) {
      navigate(`/listings/${notif.referenceId}`);
      return;
    }

    if (notif.type === 'RENTAL_REQUEST' || notif.type === 'RENTAL_APPROVED') {
      navigate('/rentals');
      return;
    }

    if (notif.type === 'ORDER_REQUEST') {
      navigate('/orders?tab=sales');
      return;
    }

    if (notif.type === 'ORDER_CONFIRMED') {
      navigate('/chat');
      return;
    }

    navigate('/my-listings');
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Vừa xong';
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
      {/* Bell Button (Hiển thị ở Navbar - Đồng bộ màu Sáng / Tối) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        title="Hộp thư thông báo cá nhân & duyệt bài"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse border-2 border-white dark:border-slate-900 shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover Window (Tự động thích ứng màu Sáng / Tối theo trình duyệt) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-[440px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden transform animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-950/90 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/25 dark:border-blue-500/30 shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Hộp Thư Thông Báo Cá Nhân
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-md bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                      {unreadCount} mới
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {unreadCount > 0
                    ? `${unreadCount} thông báo duyệt bài viết cần bạn xem lý do`
                    : 'Tất cả thông báo đã được xem xét'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={loadNotifications}
                className="text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                title="Làm mới danh sách thông báo"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 transition bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20"
                >
                  <Check className="w-3 h-3" /> Đọc tất cả
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-2 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 text-[11px] overflow-x-auto transition-colors">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
                activeTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('APPROVED')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
                activeTab === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              Đã duyệt ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REJECTED')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
                activeTab === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              Từ chối ({rejectedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('UNREAD')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
                activeTab === 'UNREAD'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notifications List (Scrollable) */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
            {filteredNotifs.length > 0 ? (
              filteredNotifs.map((item) => {
                const isApproved = item.type === 'LISTING_APPROVED';
                const isRejected = item.type === 'LISTING_REJECTED';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenDetail(item)}
                    className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 flex gap-3 ${
                      !item.isRead ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      {item.type === 'GIVEAWAY_AWARDED' ? (
                        <div className="w-8 h-8 rounded-xl bg-pink-500/15 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/25 dark:border-pink-500/30 flex items-center justify-center shadow-xs">
                          <Gift className="w-4 h-4" />
                        </div>
                      ) : item.type === 'GIVEAWAY_REQUEST' ? (
                        <div className="w-8 h-8 rounded-xl bg-purple-500/15 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/25 dark:border-purple-500/30 flex items-center justify-center shadow-xs">
                          <Gift className="w-4 h-4" />
                        </div>
                      ) : item.type === 'GIVEAWAY_CLOSED' ? (
                        <div className="w-8 h-8 rounded-xl bg-slate-500/15 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/25 dark:border-slate-500/30 flex items-center justify-center shadow-xs">
                          <Info className="w-4 h-4" />
                        </div>
                      ) : item.type === 'RENTAL_REQUEST' || item.type === 'RENTAL_APPROVED' ? (
                        <div className="w-8 h-8 rounded-xl bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 dark:border-blue-500/30 flex items-center justify-center shadow-xs">
                          <FileText className="w-4 h-4" />
                        </div>
                      ) : item.type === 'ORDER_REQUEST' ? (
                        <div className="w-8 h-8 rounded-xl bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/25 dark:border-orange-500/30 flex items-center justify-center shadow-xs">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      ) : item.type === 'ORDER_CONFIRMED' ? (
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 dark:border-emerald-500/30 flex items-center justify-center shadow-xs">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      ) : isApproved ? (
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 dark:border-emerald-500/30 flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : isRejected ? (
                        <div className="w-8 h-8 rounded-xl bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 dark:border-rose-500/30 flex items-center justify-center shadow-xs">
                          <XCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 dark:border-amber-500/30 flex items-center justify-center shadow-xs">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      {/* Chỉ hiện lý do trong bản vắn tắt nếu bị từ chối duyệt */}
                      {isRejected && item.reason && item.reason.trim() !== '' && (
                        <div className="my-1.5 p-2 rounded-lg text-[11px] leading-relaxed border bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/25 text-rose-800 dark:text-rose-300">
                          <span className="font-bold flex items-center gap-1 mb-0.5">
                            <ShieldAlert className="w-3 h-3 shrink-0 text-rose-600 dark:text-rose-400" />
                            Lý do từ chối:
                          </span>
                          <p className="line-clamp-2">{item.reason}</p>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Status Pill & Action */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
                        <span
                          className={`font-extrabold px-2 py-0.5 rounded-full uppercase text-[9px] ${
                            isApproved
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                              : isRejected
                              ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isApproved ? 'ĐÃ PHÊ DUYỆT' : isRejected ? 'BỊ TỪ CHỐI' : 'HỆ THỐNG'}
                        </span>

                        <span className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-0.5">
                          Xem chi tiết & Xử lý <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Không có thông báo nào</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Các thông báo phê duyệt hoặc từ chối bài viết sẽ xuất hiện tại đây
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50/90 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-center transition-colors">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/my-listings');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition"
            >
              Quản lý kho đồ & bài đăng của tôi <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Chi tiết thông báo (Đồng bộ Sáng / Tối) */}
      <BaseModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={
          selectedNotif?.type === 'GIVEAWAY_AWARDED'
            ? '🎉 Thông báo nhận quà tặng sinh viên'
            : selectedNotif?.type === 'GIVEAWAY_REQUEST'
            ? 'Yêu cầu xin nhận đồ tặng'
            : selectedNotif?.type === 'GIVEAWAY_CLOSED'
            ? 'Thông báo kết quả trao tặng đồ'
            : selectedNotif?.type?.startsWith('RENTAL')
            ? 'Thông báo hợp đồng thuê đồ'
            : selectedNotif?.type === 'ORDER_CONFIRMED'
            ? 'Thông báo đơn hàng'
            : selectedNotif?.type?.startsWith('LISTING')
            ? 'Chi tiết thông báo kiểm duyệt bài viết'
            : 'Chi tiết thông báo'
        }
      >
        {selectedNotif && (
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            {/* Header info */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 transition-colors">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                  selectedNotif.type === 'GIVEAWAY_AWARDED'
                    ? 'bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800'
                    : selectedNotif.type === 'GIVEAWAY_REQUEST'
                    ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                    : selectedNotif.type === 'GIVEAWAY_CLOSED'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    : selectedNotif.type === 'ORDER_CONFIRMED'
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : selectedNotif.type?.startsWith('RENTAL')
                    ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    : selectedNotif.type === 'LISTING_APPROVED'
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : selectedNotif.type === 'LISTING_REJECTED'
                    ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                }`}
              >
                {selectedNotif.type === 'GIVEAWAY_AWARDED' || selectedNotif.type === 'GIVEAWAY_REQUEST' ? (
                  <Gift className="w-5 h-5" />
                ) : selectedNotif.type === 'ORDER_CONFIRMED' ? (
                  <ShoppingBag className="w-5 h-5" />
                ) : selectedNotif.type?.startsWith('RENTAL') ? (
                  <FileText className="w-5 h-5" />
                ) : selectedNotif.type === 'LISTING_APPROVED' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : selectedNotif.type === 'LISTING_REJECTED' ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {/* HIỂN THỊ ĐẦY ĐỦ TIÊU ĐỀ THÔNG BÁO (KHÔNG BỊ TRUNCATE CẮT BỚT BẰNG DẤU ...) */}
                <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug break-words">
                  {selectedNotif.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{new Date(selectedNotif.createdAt).toLocaleString('vi-VN')}</span>
                </p>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                  selectedNotif.type === 'GIVEAWAY_AWARDED'
                    ? 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                    : selectedNotif.type === 'GIVEAWAY_REQUEST'
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : selectedNotif.type === 'ORDER_CONFIRMED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : selectedNotif.type?.startsWith('RENTAL')
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : selectedNotif.type === 'LISTING_APPROVED'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    : selectedNotif.type === 'LISTING_REJECTED'
                    ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {selectedNotif.type === 'GIVEAWAY_AWARDED'
                  ? 'QUÀ TẶNG (0Đ)'
                  : selectedNotif.type === 'GIVEAWAY_REQUEST'
                  ? 'XIN NHẬN ĐỒ'
                  : selectedNotif.type === 'ORDER_CONFIRMED'
                  ? 'ĐƠN HÀNG'
                  : selectedNotif.type?.startsWith('RENTAL')
                  ? 'THUÊ ĐỒ'
                  : selectedNotif.type === 'LISTING_APPROVED'
                  ? 'ĐÃ DUYỆT'
                  : selectedNotif.type === 'LISTING_REJECTED'
                  ? 'TỪ CHỐI'
                  : 'THÔNG BÁO'}
              </span>
            </div>

            {/* CHỈ HIỆN HỘP LÝ DO NẾU THỰC SỰ CÓ LÝ DO CỤ THỂ (KHÔNG HIỆN "Không có lý do chi tiết được ghi chú.") */}
            {selectedNotif.reason && selectedNotif.reason.trim() !== '' && (
              <div
                className={`p-3.5 rounded-xl border ${
                  selectedNotif.type === 'LISTING_APPROVED'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                    : selectedNotif.type === 'LISTING_REJECTED'
                    ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-200'
                    : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
                }`}
              >
                <h5 className="font-bold mb-1 flex items-center gap-1.5 text-xs">
                  {selectedNotif.type === 'LISTING_APPROVED' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      LÝ DO PHÊ DUYỆT CỦA BAN QUẢN TRỊ:
                    </>
                  ) : selectedNotif.type === 'LISTING_REJECTED' ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      LÝ DO TỪ CHỐI DUYỆT CỦA BAN QUẢN TRỊ:
                    </>
                  ) : (
                    <>
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      LÝ DO:
                    </>
                  )}
                </h5>
                <p className="text-xs leading-relaxed font-semibold bg-white/70 dark:bg-black/20 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/5 text-slate-800 dark:text-slate-100">
                  {selectedNotif.reason}
                </p>
              </div>
            )}

            {/* Chi tiết nội dung thông báo đầy đủ */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 transition-colors">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                Chi tiết nội dung:
              </span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                {selectedNotif.message}
              </p>
            </div>



            {/* Modal actions */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <BaseButton
                variant="secondary"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Đóng
              </BaseButton>

              <BaseButton
                variant="primary"
                size="sm"
                className="gap-1.5 font-bold"
                onClick={() => handleActionFromNotification(selectedNotif)}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>
                  {selectedNotif.type === 'GIVEAWAY_REQUEST'
                    ? 'Xem danh sách để chốt tặng'
                    : selectedNotif.type === 'GIVEAWAY_AWARDED'
                    ? 'Nhắn tin hẹn gặp nhận đồ'
                    : selectedNotif.type === 'RENTAL_REQUEST' || selectedNotif.type === 'RENTAL_APPROVED'
                    ? 'Đến Hợp đồng thuê'
                    : 'Đến Kho đồ của tôi'}
                </span>
              </BaseButton>
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
};
