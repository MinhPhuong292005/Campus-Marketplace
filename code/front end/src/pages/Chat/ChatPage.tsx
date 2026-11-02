import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Search,
  MoreHorizontal,
  SquarePen,
  Info,
  ShieldAlert,
  MapPin,
  ImagePlus,
  Smile,
  ThumbsUp,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
  Lock,
  PackageCheck,
  ShieldCheck,
  X,
  Copy,
  Reply,
  Clock,
  Calendar,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { PHENIKAA_SAFE_MEETING_POINTS } from '../../constants/phenikaaData';
import { chatService, ChatRoom, ChatMessage, SafeMeetingPoint } from '../../services/chatService';
import { listingService } from '../../services/listingService';
import { ReportModal } from '../../components/features/ReportModal';
import { SafeMeetingPointsModal } from '../../components/features/SafeMeetingPointsModal';
import { KarmaBadge } from '../../components/features/KarmaBadge';
import { studentNotificationService } from '../../services/studentNotificationService';
import { orderService } from '../../services/orderService';

export const ChatPage: React.FC = () => {
  const { user } = useAuthStore();

  // State
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'CAMPUS'>('ALL');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [fraudWarning, setFraudWarning] = useState<string | null>(null);
  const [selectedSafePointId, setSelectedSafePointId] = useState<number | null>(null);
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState(getTodayStr());
  const [appointmentTime, setAppointmentTime] = useState('14:30');
  const [replyingToMessage, setReplyingToMessage] = useState<{
    id: number;
    senderName: string;
    text: string;
  } | null>(null);
  const [reportTargetMessage, setReportTargetMessage] = useState<ChatMessage | null>(null);
  const [activeListingSellerId, setActiveListingSellerId] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const routeState = location.state as {
    sellerId?: number;
    sellerName?: string;
    listingId?: number;
    listingTitle?: string;
  } | null;


  const deduplicateRooms = (roomList: ChatRoom[]): ChatRoom[] => {
    const map = new Map<number, ChatRoom>();
    for (const r of roomList) {
      if (!map.has(r.peerUserId)) {
        map.set(r.peerUserId, r);
      } else {
        const existing = map.get(r.peerUserId)!;
        if (!existing.lastMessage && r.lastMessage) {
          map.set(r.peerUserId, r);
        }
      }
    }
    return Array.from(map.values());
  };

  useEffect(() => {
    if (!routeState?.sellerId) return;

    let isMounted = true;
    const openSellerChat = async () => {
      try {
        setIsLoadingRooms(true);
        const res = await chatService.createOrGetRoom(routeState.sellerId!, routeState.listingId);
        if (isMounted && res && res.data && res.data.id) {
          const targetRoom = res.data;
          setRooms((prev) => deduplicateRooms([targetRoom, ...prev]));
          setActiveRoomId(targetRoom.id);
          if (routeState.listingTitle) {
            setInputText((prev) => prev || `Chào bạn, mình quan tâm đến sản phẩm "${routeState.listingTitle}" của bạn!`);
          }
        }
      } catch (err) {
        console.error('Failed to open chat with seller:', err);
      } finally {
        if (isMounted) setIsLoadingRooms(false);
      }
    };

    openSellerChat();
    return () => {
      isMounted = false;
    };
  }, [routeState?.sellerId, routeState?.listingId]);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSafePointModalOpen, setIsSafePointModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  useEffect(() => {
    if (isNewChatModalOpen) {
      setIsLoadingContacts(true);
      chatService
        .getContacts()
        .then((res) => {
          if (res && res.data) {
            const studentContacts = res.data.filter(
              (c: any) =>
                c.id !== 1 &&
                !c.role?.toUpperCase().includes('ADMIN') &&
                !c.fullName?.toLowerCase().includes('quản trị viên') &&
                !c.email?.toLowerCase().includes('minhphuong2925@gmail.com')
            );
            setContacts(studentContacts);
          }
        })
        .finally(() => setIsLoadingContacts(false));
    }
  }, [isNewChatModalOpen]);

  // Accordion state in right sidebar
  const [openSections, setOpenSections] = useState({
    chatInfo: true,
    customize: false,
    media: false,
    privacy: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch user's conversation rooms
  const loadRooms = useCallback(async () => {
    try {
      const res = await chatService.getRooms();
      if (res && res.data) {
        const studentRooms = res.data.filter(
          (r) =>
            r.peerUserId !== 1 &&
            !r.peerName?.toLowerCase().includes('quản trị viên') &&
            !r.peerName?.toLowerCase().includes('admin')
        );
        const deduped = deduplicateRooms(studentRooms);
        setRooms(deduped);

        if (routeState?.sellerId) {
          const match = deduped.find((r) => r.peerUserId === routeState.sellerId);
          if (match) {
            setActiveRoomId(match.id);
            return;
          }
        }

        if (deduped.length > 0 && (!activeRoomId || !deduped.some((r) => r.id === activeRoomId))) {
          if (!routeState?.sellerId) {
            setActiveRoomId(deduped[0].id);
          }
        } else if (deduped.length === 0 && !routeState?.sellerId) {
          setActiveRoomId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [activeRoomId]);

  // 2. Fetch messages for active room
  const loadMessages = useCallback(async (roomId: number, silent: boolean = false) => {
    if (!silent) setIsLoadingMessages(true);
    try {
      const res = await chatService.getRoomMessages(roomId);
      if (res && res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load room messages:', err);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Load messages when active room changes
  useEffect(() => {
    if (activeRoomId) {
      loadMessages(activeRoomId);
      chatService.markRoomAsRead(activeRoomId);
    }
  }, [activeRoomId, loadMessages]);

  // Real-time polling every 2.5s for seamless multi-account chat
  useEffect(() => {
    if (!activeRoomId) return;
    const interval = setInterval(() => {
      loadMessages(activeRoomId, true);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeRoomId, loadMessages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time anti-fraud typing detector
  useEffect(() => {
    if (!inputText.trim()) {
      setFraudWarning(null);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await chatService.scanAntiFraud(inputText);
      if (res.data?.isSuspicious) {
        setFraudWarning(res.data.warningMessage);
      } else {
        setFraudWarning(null);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [inputText]);

  // Send message with optional quoted reply
  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const rawContent = (customContent || inputText).trim();
    if (!rawContent || !activeRoomId) return;

    let contentToSend = rawContent;
    if (replyingToMessage) {
      contentToSend = `┌ Trả lời ${replyingToMessage.senderName}: "${replyingToMessage.text.slice(0, 80)}${replyingToMessage.text.length > 80 ? '...' : ''}"\n└ ${rawContent}`;
      setReplyingToMessage(null);
    }

    // Optimistic UI update
    const tempMsg: ChatMessage = {
      id: Date.now(),
      chatRoomId: activeRoomId,
      senderId: user?.id || 0,
      senderName: user?.fullName || 'Tôi',
      content: contentToSend,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    setFraudWarning(null);

    try {
      await chatService.sendMessage(activeRoomId, contentToSend);
      loadMessages(activeRoomId, true);
      loadRooms();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Quick Like Thumb Up (Messenger signature feature)
  const handleSendThumbUp = () => {
    handleSendMessage(undefined, '👍');
  };

  // Safe meeting point proposal
  const handleSelectSafePoint = async (point: SafeMeetingPoint) => {
    if (!activeRoomId) return;
    const meetingMsg = `📍 [ĐỀ XUẤT ĐIỂM HẸN AN TOÀN]\nĐịa điểm: ${point.name}\nĐịa chỉ: ${point.address}\nThời gian khuyến nghị: ${point.recommendedHours}\nKhu vực có bảo vệ & Camera an ninh giám sát.`;
    handleSendMessage(undefined, meetingMsg);
    setIsSafePointModalOpen(false);
  };

  // Send appointment with date, time (6h - 22h) and location
  const handleSendAppointment = () => {
    if (!activeRoomId) return;

    if (appointmentTime) {
      const [hStr] = appointmentTime.split(':');
      const hour = parseInt(hStr, 10);
      if (isNaN(hour) || hour < 6 || hour > 22) {
        alert('Khung giờ hẹn gặp giao dịch an toàn tại trường khuyến nghị từ 06:00 đến 22:00!');
        return;
      }
    }

    const safePoint =
      PHENIKAA_SAFE_MEETING_POINTS.find((p) => p.id === selectedSafePointId) ||
      PHENIKAA_SAFE_MEETING_POINTS[0];
    const dateFormatted = new Date(appointmentDate).toLocaleDateString('vi-VN');

    const appointmentMsg = `📍 [HẸN GẶP GIAO DỊCH TẠI ĐH PHENIKAA]
• Thời gian: ${appointmentTime || '14:30'} - Ngày ${dateFormatted}
• Điểm hẹn: ${safePoint.name} (${safePoint.address})
• Ghi chú: Khu vực an toàn có camera giám sát và bảo vệ trường trực 24/7.`;

    handleSendMessage(undefined, appointmentMsg);
    setToastNotice('Đã gửi lịch hẹn gặp giao dịch vào tin nhắn!');
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Create room with second test user
  const handleStartChatWithPeer = async (peerId: number) => {
    if (peerId === 1) {
      alert('Không thể nhắn tin trực tiếp cho Quản trị viên hệ thống.');
      return;
    }
    try {
      const res = await chatService.createOrGetRoom(peerId);
      if (res && res.data) {
        await loadRooms();
        setActiveRoomId(res.data.id);
        setIsNewChatModalOpen(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo cuộc trò chuyện');
    }
  };

  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Upload ảnh hoặc video từ máy tính
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Vui lòng chỉ chọn tệp hình ảnh (PNG, JPG, WEBP, GIF) hoặc video (MP4, WEBM)!');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('Dung lượng tệp quá lớn (tối đa 25MB). Vui lòng chọn tệp nhỏ hơn!');
      return;
    }

    try {
      setIsUploadingMedia(true);
      const res = await chatService.uploadChatMedia(file);
      if (res.success && res.data?.url) {
        const msgType = res.data.mediaType;
        const newMsgRes = await chatService.sendMessage(activeRoomId, res.data.url, msgType);
        if (newMsgRes && newMsgRes.data) {
          setMessages((prev) => [...prev, newMsgRes.data]);
          loadRooms();
        }
      }
    } catch (err) {
      console.error('Failed to upload chat media:', err);
    } finally {
      setIsUploadingMedia(false);
      if (mediaInputRef.current) {
        mediaInputRef.current.value = '';
      }
    }
  };

  // Sale Confirmation Modal in Chat
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleItemTitle, setSaleItemTitle] = useState('');
  const [salePrice, setSalePrice] = useState<number>(0);
  const [saleMeetingPoint, setSaleMeetingPoint] = useState(
    'Sảnh Tòa A8 (Khu Thực hành Công nghệ & Mô phỏng Y khoa)'
  );
  const [saleMeetingTime, setSaleMeetingTime] = useState('14h30 chiều nay');
  const [saleNote, setSaleNote] = useState('Gặp trực tiếp kiểm tra đồ trước khi thanh toán.');

  const openSaleModal = () => {
    if (!activeRoom) return;
    setSaleItemTitle(activeRoom.listingTitle || 'Máy tính Casio');
    setSalePrice(activeRoom.listingPrice || 50000);
    const pt = PHENIKAA_SAFE_MEETING_POINTS[0]?.name || 'Sảnh Tòa A8';
    setSaleMeetingPoint(pt);
    setSaleMeetingTime('14h30 chiều nay');
    setSaleNote('Gặp trực tiếp kiểm tra đồ trước khi thanh toán.');
    setIsSaleModalOpen(true);
  };

  const handleSubmitSaleConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || !saleItemTitle.trim()) return;

    const sellerName = user?.fullName || 'Người bán';
    const peerName = activeRoom.peerName;

    const confirmMessage = `📦 [XÁC NHẬN CHỐT BÁN HÀNG]
• Món đồ: ${saleItemTitle.trim()}
• Giá thỏa thuận: ${salePrice.toLocaleString('vi-VN')} đ
• Điểm hẹn: ${saleMeetingPoint}
• Thời gian hẹn: ${saleMeetingTime.trim() || 'Thỏa thuận qua chat'}
${saleNote.trim() ? `• Ghi chú: ${saleNote.trim()}` : ''}

✓ Người bán (${sellerName}) đã xác nhận bán món đồ cho bạn (${peerName}). Món đồ sẽ được chuẩn bị và giao trực tiếp an toàn tại khuôn viên trường Phenikaa!`;

    // 1. Send message in chat thread
    handleSendMessage(undefined, confirmMessage);

    // 2. Send notification to buyer
    studentNotificationService.notifyBuyerDeliveryScheduled({
      buyerId: activeRoom.peerUserId,
      listingTitle: saleItemTitle.trim(),
      sellerName,
      meetingPoint: saleMeetingPoint,
    });

    // 3. Update order in orderService
    if (activeRoom.listingId) {
      orderService.createOrder({
        listingId: activeRoom.listingId,
        listingTitle: saleItemTitle.trim(),
        listingImage: activeRoom.listingImage || '',
        sellerId: user?.id || 0,
        sellerName,
        buyerId: activeRoom.peerUserId,
        buyerName: peerName,
        price: salePrice,
      });
    }

    setIsSaleModalOpen(false);
    setToastNotice(`🎉 Đã tạo đơn xác nhận bán thành công! Tin nhắn và thông báo đã được gửi tới ${peerName}.`);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Find active room object
  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];

  // Fetch listing details to identify whether current user is the seller
  useEffect(() => {
    if (activeRoom?.listingId) {
      listingService
        .getListingById(activeRoom.listingId)
        .then((res) => {
          if (res.success && res.data) {
            setActiveListingSellerId(res.data.userId);
          }
        })
        .catch(() => {});
    } else {
      setActiveListingSellerId(null);
    }
  }, [activeRoom?.listingId]);

  // Check if current user is the SELLER (Chỉ người bán mới thấy nút tạo chốt đơn)
  const isCurrentUserSeller = Boolean(
    user?.id && (
      (activeRoom?.sellerId && activeRoom.sellerId === user.id) ||
      (activeListingSellerId && activeListingSellerId === user.id) ||
      (routeState?.sellerId && routeState.sellerId === user.id)
    )
  );

  // Filter rooms
  const filteredRooms = rooms.filter((r) => {
    if (
      r.peerUserId === 1 ||
      r.peerName?.toLowerCase().includes('quản trị viên') ||
      r.peerName?.toLowerCase().includes('admin')
    ) {
      return false;
    }
    const matchesSearch =
      r.peerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.lastMessage && r.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterTab === 'UNREAD') return (r.unreadCount || 0) > 0;
    return true;
  });

  // Relative time formatter
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="flex h-[calc(100vh-130px)] min-h-[580px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR: CONVERSATIONS LIST (ĐOẠN CHAT)           */}
      {/* ======================================================== */}
      <div
        className={`w-full lg:w-[350px] xl:w-[380px] flex-shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 ${
          activeRoomId ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 pb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Đoạn chat
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Tạo đoạn chat mới / Nhắn tin với bạn học"
            >
              <SquarePen className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Tùy chọn"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar (Messenger Style) */}
        <div className="px-4 py-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm trên Messenger..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 rounded-full border-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-1.5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              filterTab === 'ALL'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterTab('UNREAD')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              filterTab === 'UNREAD'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Chưa đọc
          </button>
        </div>

        {/* Rooms Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingRooms ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <p className="text-sm">Chưa có đoạn chat nào.</p>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="mt-3 text-xs text-blue-600 hover:underline font-semibold"
              >
                + Bắt đầu nhắn tin với bạn học
              </button>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isActive = activeRoom?.id === room.id;
              const hasUnread = (room.unreadCount || 0) > 0;
              return (
                <div
                  key={room.id}
                  onClick={() => setActiveRoomId(room.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition select-none ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800/90'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Avatar with Online Status Dot */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        room.peerAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
                      }
                      alt={room.peerName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    {room.peerStatus === 'SUSPENDED' ? (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" title="Tài khoản tạm khóa"></span>
                    ) : (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                    )}
                  </div>

                  {/* Room Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <h3
                          className={`text-sm truncate ${
                            hasUnread
                              ? 'font-bold text-slate-900 dark:text-white'
                              : 'font-semibold text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {room.peerName}
                        </h3>
                        {room.peerStatus === 'SUSPENDED' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold shrink-0 border border-amber-300/60">
                            Tạm khóa
                          </span>
                        )}
                      </div>
                      {room.lastMessageTime && (
                        <span className="text-[11px] text-slate-400 flex-shrink-0">
                          {formatTime(room.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <p
                        className={`truncate max-w-[190px] ${
                          hasUnread
                            ? 'font-semibold text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {room.lastMessage || 'Chưa có tin nhắn'}
                      </p>
                      {hasUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 ml-1"></span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MIDDLE COLUMN: MAIN ACTIVE CHAT AREA                  */}
      {/* ======================================================== */}
      {activeRoom ? (
        <div
          className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 ${
            !activeRoomId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Top Header of Active Chat (Messenger Style) */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur shrink-0 z-10 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setActiveRoomId(null)}
                className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative flex-shrink-0">
                <img
                  src={
                    activeRoom.peerAvatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
                  }
                  alt={activeRoom.peerName}
                  onClick={() => activeRoom.peerUserId && navigate(`/seller/${activeRoom.peerUserId}`)}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition"
                  title="Xem trang cá nhân"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2
                    onClick={() => activeRoom.peerUserId && navigate(`/seller/${activeRoom.peerUserId}`)}
                    className="text-base font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-blue-600 hover:underline transition"
                    title="Xem trang cá nhân"
                  >
                    {activeRoom.peerName}
                  </h2>
                  {activeRoom.peerStatus === 'SUSPENDED' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold border border-amber-300/60">
                      Tài khoản tạm khóa
                    </span>
                  )}
                  {activeRoom.peerKarma && (
                    <KarmaBadge score={activeRoom.peerKarma} showText={false} />
                  )}
                </div>
                {activeRoom.peerStatus === 'SUSPENDED' ? (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Tạm khóa 1 tuần do vi phạm nội quy sàn
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    Đang hoạt động
                    <span className="text-slate-400 font-normal">
                      • {activeRoom.peerCampus || 'Trường Đại học Phenikaa'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Top Right Action Icons */}
            <div className="flex items-center gap-1.5 text-blue-600">
              <button
                onClick={() => setIsRightSidebarOpen((prev) => !prev)}
                className={`p-2.5 rounded-full transition ${
                  isRightSidebarOpen
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title="Thông tin về cuộc trò chuyện"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>



          {/* Messages Stream Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#ffffff] dark:bg-[#0b141a]">
            {/* Profile Header inside chat stream (Messenger style) */}
            <div className="text-center py-6">
              <img
                src={
                  activeRoom.peerAvatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
                }
                alt={activeRoom.peerName}
                onClick={() => activeRoom.peerUserId && navigate(`/seller/${activeRoom.peerUserId}`)}
                className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:opacity-90 transition"
                title="Xem trang cá nhân"
              />
              <h3
                onClick={() => activeRoom.peerUserId && navigate(`/seller/${activeRoom.peerUserId}`)}
                className="font-bold text-base mt-2 text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 hover:underline transition"
                title="Xem trang cá nhân"
              >
                {activeRoom.peerName}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sinh viên {activeRoom.peerCampus || 'Trường Đại học Phenikaa'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold mt-2 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{activeRoom.peerKarma || 20} Karma</span>
              </div>
            </div>

            {/* Date Pill */}
            <div className="text-center my-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60 px-3 py-1 rounded-full">
                Hôm nay
              </span>
            </div>

            {/* Messages */}
            {isLoadingMessages ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Đang tải tin nhắn...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có tin nhắn nào. Hãy gửi lời chào đến {activeRoom.peerName}!
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe =
                  msg.sender === 'ME' || (user && msg.senderId === user.id);

                return (
                  <div
                    key={msg.id || index}
                    className={`flex items-end gap-2 ${
                      isMe ? 'justify-end' : 'justify-start'
                    } group`}
                  >
                    {!isMe && (
                      <img
                        src={
                          activeRoom.peerAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
                        }
                        alt="peer"
                        className="w-7 h-7 rounded-full object-cover mb-1 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                    )}

                    <div
                      className={`max-w-[75%] sm:max-w-[65%] space-y-1 flex flex-col ${
                        isMe ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Message Bubble (Text, Image, Video, or Transaction Confirmation Card) */}
                      {msg.messageType === 'VIDEO' || (msg.content && /\.(mp4|webm|mov|mkv)/i.test(msg.content)) ? (
                        <div className="rounded-2xl overflow-hidden max-w-xs sm:max-w-sm border border-slate-200 dark:border-slate-700 bg-black shadow-xs">
                          <video
                            src={msg.content}
                            controls
                            className="w-full max-h-64 rounded-xl"
                            preload="metadata"
                          />
                        </div>
                      ) : msg.messageType === 'IMAGE' || (msg.content && (msg.content.startsWith('http') || msg.content.startsWith('blob:') || msg.content.startsWith('data:image') || msg.content.startsWith('/')) && /\.(jpg|jpeg|png|webp|gif)/i.test(msg.content)) ? (
                        <div className="rounded-2xl overflow-hidden max-w-xs border border-slate-200 dark:border-slate-700 bg-black/5 shadow-xs">
                          <img
                            src={msg.content}
                            alt="Ảnh đính kèm"
                            className="w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition"
                            onClick={() => window.open(msg.content, '_blank')}
                          />
                        </div>
                      ) : msg.content && (msg.content.includes('[XÁC NHẬN CHỐT BÁN HÀNG]') || msg.content.includes('[XÁC NHẬN BÁN HÀNG]')) ? (
                        <div className="rounded-2xl border-2 border-emerald-400/80 dark:border-emerald-600/80 bg-white dark:bg-slate-900 p-4 shadow-md text-left max-w-sm sm:max-w-md space-y-2.5 animate-in fade-in">
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-100 dark:border-emerald-900/60">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                              <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>XÁC NHẬN CHỐT ĐƠN GIAO DỊCH</span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Đã xác nhận chốt ✓
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                            {msg.content}
                          </div>

                          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Giao dịch trực tiếp tại ĐH Phenikaa • Người mua đã nhận thông báo</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-2xs whitespace-pre-line ${
                            isMe
                              ? 'bg-[#0084ff] text-white rounded-br-xs'
                              : 'bg-[#f0f2f5] dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                          }`}
                        >
                          {msg.content?.startsWith('┌ Trả lời') ? (
                            <div className="space-y-1.5">
                              <div
                                className={`text-[11px] px-2.5 py-1 rounded-lg border-l-2 italic text-left ${
                                  isMe
                                    ? 'bg-blue-700/60 border-blue-200 text-blue-100'
                                    : 'bg-slate-200 dark:bg-slate-700/60 border-blue-500 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {msg.content.split('\n└ ')[0].replace('┌ Trả lời ', 'Đang trả lời ')}
                              </div>
                              <div className="pt-0.5">
                                {msg.content.split('\n└ ')[1] || msg.content}
                              </div>
                            </div>
                          ) : (
                            msg.content || msg.text
                          )}
                        </div>
                      )}

                      {/* Timestamp & Read Receipt */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1 opacity-80 group-hover:opacity-100 transition">
                        <span>{formatTime(msg.createdAt || msg.time)}</span>
                        {isMe && (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                        )}
                      </div>
                    </div>

                    {/* Message Action Toolbar (Sao chép, Phản hồi, Báo cáo) */}
                    <div
                      className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 self-center ${
                        isMe ? 'order-first mr-1' : 'ml-1'
                      }`}
                    >
                      {/* 1. Sao chép */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content || msg.text || '');
                          setToastNotice('Đã sao chép nội dung tin nhắn!');
                          setTimeout(() => setToastNotice(null), 2000);
                        }}
                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                        title="Sao chép nội dung"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* 2. Phản hồi */}
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToMessage({
                            id: msg.id,
                            senderName: isMe ? 'Chính bạn' : activeRoom.peerName,
                            text: msg.content || msg.text || '',
                          });
                        }}
                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                        title="Phản hồi tin nhắn này"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>

                      {/* 3. Báo cáo (Chỉ với tin nhắn của đối phương) */}
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => {
                            setReportTargetMessage(msg);
                            setIsReportModalOpen(true);
                          }}
                          className="p-1 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Báo cáo tin nhắn của đối phương"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Typing Anti-Fraud Alert */}
          {fraudWarning && (
            <div className="mx-4 mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{fraudWarning}</span>
            </div>
          )}

          {/* Chat Input Bar OR Locked Account Notice (Facebook Messenger UI Exact Match) */}
          {activeRoom.peerStatus === 'SUSPENDED' ? (
            <div className="p-7 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center select-none animate-in fade-in">
              <h4 className="text-[15px] font-bold text-slate-900 dark:text-white mb-1.5">
                {activeRoom.peerName} chưa thể truy cập vào đoạn chat này
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                Tài khoản này đang bị Ban quản trị tạm khóa chức năng do vi phạm quy định sàn Phenikaa (Bị báo cáo / trừ điểm uy tín). Bạn sẽ có thể gửi tin nhắn sau khi tài khoản của {activeRoom.peerName} được mở khóa.
              </p>
            </div>
          ) : user?.status === 'SUSPENDED' ? (
            <div className="p-7 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center select-none animate-in fade-in">
              <h4 className="text-[15px] font-bold text-slate-900 dark:text-white mb-1.5 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                Tài khoản của bạn đang bị tạm khóa chức năng nhắn tin
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                Bạn không thể gửi tin nhắn trong thời gian này do tài khoản đang bị tạm khóa 1 tuần{user?.blockReason ? ` (${user.blockReason})` : ''}. Vui lòng liên hệ Quản trị viên để được hỗ trợ giải quyết tranh chấp.
              </p>
            </div>
          ) : (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {/* Thiết lập thời gian & Địa điểm hẹn gặp giao dịch an toàn tại ĐH Phenikaa */}
              <div className="mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50/90 dark:from-slate-800/90 dark:to-slate-800/70 border border-blue-200/80 dark:border-slate-700 shadow-xs space-y-2.5 text-xs">
                {/* Header row with Title & Seller-only Confirm Order button */}
                <div className="flex items-center justify-between pb-1 border-b border-blue-100 dark:border-slate-700/60">
                  <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lên lịch hẹn gặp giao dịch tại Phenikaa</span>
                  </span>
                  {isCurrentUserSeller && (
                    <button
                      type="button"
                      onClick={openSaleModal}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition flex items-center gap-1 cursor-pointer"
                      title="Mở form xác nhận chốt bán món đồ cho người này"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Tạo chốt đơn bán</span>
                    </button>
                  )}
                </div>

                {/* 2 Sub-Sections (Thời gian vs Địa điểm) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  {/* Phần 1: Chọn thời gian hẹn (6h - 22h) */}
                  <div className="space-y-1.5 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span>Thời gian hẹn (6h - 22h):</span>
                      </label>
                      <input
                        type="date"
                        value={appointmentDate}
                        min={getTodayStr()}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        min="06:00"
                        max="22:00"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 w-22 shrink-0"
                      />
                      {/* Khung giờ gợi ý đề xuất */}
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
                        {['09:00', '11:30', '14:30', '17:30', '19:30'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAppointmentTime(preset)}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition shrink-0 cursor-pointer ${
                              appointmentTime === preset
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Phần 2: Chọn địa điểm hẹn */}
                  <div className="space-y-1.5 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Điểm hẹn an toàn Phenikaa:</span>
                      </label>
                      {selectedSafePointId && (
                        <span className="text-[10px] text-emerald-600 font-medium">Có Camera & Bảo vệ</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={selectedSafePointId || ''}
                        onChange={(e) => setSelectedSafePointId(Number(e.target.value) || null)}
                        className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
                      >
                        <option value="">-- Chọn điểm hẹn an toàn --</option>
                        {PHENIKAA_SAFE_MEETING_POINTS.map((pt) => (
                          <option key={pt.id} value={pt.id}>
                            {pt.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleSendAppointment}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 shadow-xs transition cursor-pointer"
                        title="Gửi tin nhắn chốt lịch hẹn gặp vào chat"
                      >
                        Gửi lịch hẹn
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Replying quote preview bar */}
              {replyingToMessage && (
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-500 rounded-t-xl mb-1 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Reply className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-blue-600 dark:text-blue-400 block text-[11px]">
                        Đang trả lời {replyingToMessage.senderName}:
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 truncate block text-xs">
                        {replyingToMessage.text}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingToMessage(null)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Left Action Icons */}
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                  {/* Chỉ hiện nút tạo chốt đơn nếu là người bán */}
                  {isCurrentUserSeller && (
                    <button
                      type="button"
                      onClick={openSaleModal}
                      className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-slate-800 transition text-emerald-600 dark:text-emerald-400 cursor-pointer"
                      title="Tạo đơn chốt bán hàng"
                    >
                      <PackageCheck className="w-5 h-5" />
                    </button>
                  )}
                  {/* Input gửi hình ảnh hoặc video từ máy tính */}
                  <input
                    type="file"
                    ref={mediaInputRef}
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                  <button
                    type="button"
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={isUploadingMedia}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-blue-600 disabled:opacity-50 cursor-pointer"
                    title="Gửi hình ảnh hoặc video từ máy tính"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                </div>

                {/* Capsule Input Field */}
                <div className="flex-1 relative flex items-center bg-[#f0f2f5] dark:bg-slate-800 rounded-full px-4 py-2 border border-transparent focus-within:border-blue-400 transition">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Nhắn tin..."
                    className="w-full bg-transparent border-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setInputText((prev) => prev + ' 😊')}
                    className="text-slate-400 hover:text-blue-600 transition ml-2"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>

                {/* Right Action: Send OR Messenger Thumbs Up */}
                {inputText.trim() ? (
                  <button
                    type="submit"
                    className="p-2 rounded-full bg-[#0084ff] text-white hover:bg-blue-600 transition shadow-sm hover:scale-105 active:scale-95"
                    title="Gửi tin nhắn"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendThumbUp}
                    className="p-2 rounded-full text-[#0084ff] hover:bg-blue-50 dark:hover:bg-slate-800 transition hover:scale-110 active:scale-90"
                    title="Gửi biểu tượng thích (Like)"
                  >
                    <ThumbsUp className="w-5 h-5 fill-current" />
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex items-center justify-center text-slate-400 text-sm">
          Chọn một đoạn chat hoặc bắt đầu cuộc trò chuyện mới.
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. RIGHT SIDEBAR: MESSENGER CHAT INFO PANEL              */}
      {/* ======================================================== */}
      {isRightSidebarOpen && activeRoom && (
        <div className="w-[300px] xl:w-[320px] flex-shrink-0 border-l border-slate-200 dark:border-slate-800 hidden xl:flex flex-col bg-white dark:bg-slate-900 overflow-y-auto">
          {/* Header Contact Profile */}
          <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800">
            <div className="relative inline-block mx-auto">
              <img
                src={
                  activeRoom.peerAvatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
                }
                alt={activeRoom.peerName}
                onClick={() => activeRoom.peerUserId && navigate(`/seller/${activeRoom.peerUserId}`)}
                className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-slate-100 dark:ring-slate-800 cursor-pointer hover:opacity-90 transition"
                title="Xem trang cá nhân của bạn học này"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
            </div>

            <h3
              onClick={() => activeRoom.peerUserId && navigate(`/seller/${activeRoom.peerUserId}`)}
              className="font-bold text-base text-slate-900 dark:text-white mt-3 cursor-pointer hover:text-blue-600 hover:underline transition"
              title="Xem trang cá nhân của bạn học này"
            >
              {activeRoom.peerName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeRoom.peerCampus || 'Trường Đại học Phenikaa'}
            </p>

            {/* Điểm karma thay thế đoạn mã hóa đầu cuối (không có sinh viên đã xác thực) */}
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{activeRoom.peerKarma || 20} Karma</span>
            </div>
          </div>

          {/* Accordion Menu Sections */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {/* 1. File phương tiện và file */}
            <div>
              <button
                onClick={() => toggleSection('media')}
                className="w-full px-4 py-3 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <span>File phương tiện & File</span>
                {openSections.media ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {openSections.media && (
                <div className="px-4 pb-3 text-xs text-slate-400 italic">
                  Chưa có hình ảnh hoặc video nào được chia sẻ.
                </div>
              )}
            </div>

            {/* 2. Quyền riêng tư & Báo cáo */}
            <div>
              <button
                onClick={() => toggleSection('privacy')}
                className="w-full px-4 py-3 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <span>Quyền riêng tư và hỗ trợ</span>
                {openSections.privacy ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {openSections.privacy && (
                <div className="px-4 pb-3 space-y-2">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-full text-left py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Báo cáo tài khoản / Vi phạm hẹn gặp
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL: TẠO ĐOẠN CHAT MỚI HOẶC CHỌN BẠN HỌC           */}
      {/* ======================================================== */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Bắt đầu đoạn chat mới
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Chỉ có thể nhắn tin với các tài khoản sinh viên Phenikaa đã đăng ký:
            </p>

            {isLoadingContacts ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Đang tải danh sách tài khoản đã đăng ký...
              </div>
            ) : contacts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-4">
                Hiện chưa có tài khoản sinh viên nào khác đăng ký trên hệ thống.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleStartChatWithPeer(contact.id)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800 cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                        {contact.fullName ? contact.fullName.charAt(0) : 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {contact.fullName}
                          </h4>
                          {contact.status === 'SUSPENDED' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-200 text-amber-900 font-bold shrink-0">
                              Tạm khóa
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          {contact.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full font-semibold shrink-0 ml-2">
                      Nhắn tin
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsNewChatModalOpen(false)}
              className="mt-5 w-full py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportTargetMessage(null);
        }}
        targetUserId={reportTargetMessage?.senderId || activeRoom?.peerUserId}
        targetUserName={reportTargetMessage ? activeRoom?.peerName : activeRoom?.peerName}
        listingId={activeRoom?.listingId}
        listingTitle={reportTargetMessage ? `Tin nhắn vi phạm: "${(reportTargetMessage.content || reportTargetMessage.text || '').slice(0, 60)}..."` : activeRoom?.listingTitle}
      />

      <SafeMeetingPointsModal
        isOpen={isSafePointModalOpen}
        onClose={() => setIsSafePointModalOpen(false)}
        onSelectPoint={handleSelectSafePoint}
      />

      {/* Modal Form: Tạo đơn chốt bán hàng trong tin nhắn */}
      {isSaleModalOpen && activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tạo chốt đơn bán hàng
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Gửi thẻ xác nhận chốt đơn trực tiếp vào đoạn chat với {activeRoom.peerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSaleModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSaleConfirmation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Món đồ / Sản phẩm giao dịch *
                </label>
                <input
                  type="text"
                  required
                  value={saleItemTitle}
                  onChange={(e) => setSaleItemTitle(e.target.value)}
                  placeholder="vd: Máy tính Casio fx 580 VNX, Túi tote, ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Giá chốt bán (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  placeholder="vd: 50000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Điểm hẹn giao nhận an toàn (Khuôn viên Phenikaa) *
                </label>
                <select
                  value={saleMeetingPoint}
                  onChange={(e) => setSaleMeetingPoint(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {PHENIKAA_SAFE_MEETING_POINTS.map((pt) => (
                    <option key={pt.id} value={`${pt.name} (${pt.address})`}>
                      {pt.name} - {pt.address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Thời gian hẹn gặp *
                </label>
                <input
                  type="text"
                  required
                  value={saleMeetingTime}
                  onChange={(e) => setSaleMeetingTime(e.target.value)}
                  placeholder="vd: 14h30 chiều nay, 9h sáng mai..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú thỏa thuận (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  placeholder="vd: Kiểm tra đồ trực tiếp trước khi thanh toán..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Xác nhận gửi chốt đơn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast thông báo xác nhận giao hàng */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCheck className="w-4 h-4" />
          <span>{toastNotice}</span>
        </div>
      )}
    </div>
  );
};
