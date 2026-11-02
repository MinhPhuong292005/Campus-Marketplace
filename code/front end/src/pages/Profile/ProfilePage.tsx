import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  School,
  MapPin,
  Building,
  GraduationCap,
  Calendar,
  ShieldCheck,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  Mail,
  Phone,
  Hash,
  ShoppingBag,
  Bell,
  Package,
  FileText,
  Gift,
  Coins,
  Search,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  MessageCircle,
  Camera,
  Loader2,
  Heart,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { KarmaBadge } from '../../components/features/KarmaBadge';
import { BaseButton } from '../../components/base/BaseButton';
import { BaseModal } from '../../components/base/BaseModal';
import { EditProfileModal } from '../../components/features/EditProfileModal';
import { StudentCardVerifyModal } from '../../components/features/StudentCardVerifyModal';
import { ListingCard } from '../../components/features/ListingCard';
import { profileService } from '../../services/profileService';
import { listingService } from '../../services/listingService';
import { favoriteService } from '../../services/favoriteService';
import { User as UserType, Listing } from '../../types';
import { MyListingsPage } from '../Listing/MyListingsPage';
import { RentalListPage } from '../Rental/RentalListPage';
import { orderService, PurchaseOrder } from '../../services/orderService';
import { giveawayService, GiveawayClaim } from '../../services/giveawayService';
import { ShopeeDisputeModal } from '../../components/features/ShopeeDisputeModal';
import { studentNotificationService, StudentNotification } from '../../services/studentNotificationService';
import { formatCurrency, formatDate } from '../../utils/formatters';

type PortalTab = 'account' | 'orders' | 'listings' | 'rentals' | 'notifications' | 'favorites';

type OrderSubTab =
  | 'ALL'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'GIVEAWAY_CLAIMS';

export const ProfilePage: React.FC = () => {
  const { user: storeUser, login, token } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active main tab from URL param or default to 'account' (Hồ sơ & bảo mật trên cùng)
  const tabParam = searchParams.get('tab') as PortalTab | null;
  const [activeTab, setActiveTab] = useState<PortalTab>(
    tabParam && ['account', 'orders', 'listings', 'rentals', 'notifications', 'favorites'].includes(tabParam)
      ? tabParam
      : 'account'
  );

  const [savedListings, setSavedListings] = useState<Listing[]>(() => favoriteService.getFavorites());

  useEffect(() => {
    const updateFavorites = () => {
      setSavedListings(favoriteService.getFavorites());
    };
    updateFavorites();
    window.addEventListener('campus_favorites_updated', updateFavorites);
    return () => window.removeEventListener('campus_favorites_updated', updateFavorites);
  }, []);

  const [user, setUser] = useState<UserType | null>(storeUser);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [accountSubSection, setAccountSubSection] = useState<'INFO' | 'PASSWORD'>('INFO');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (!currentPassword) {
      setPasswordNotice({ type: 'error', message: 'Vui lòng nhập mật khẩu hiện tại' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordNotice({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'error', message: 'Mật khẩu xác nhận không trùng khớp' });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await profileService.changePassword({ currentPassword, newPassword });
      if (res.code === 200 || res.code === 201) {
        setPasswordNotice({ type: 'success', message: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordNotice({ type: 'error', message: res.message || 'Đổi mật khẩu thất bại, vui lòng kiểm tra lại' });
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
      setPasswordNotice({ type: 'error', message: errMsg });
    } finally {
      setPasswordLoading(false);
    }
  };
  const [, setIsLoading] = useState(false);

  // Orders Tab State
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [giveawayClaims, setGiveawayClaims] = useState<GiveawayClaim[]>([]);
  const [orderSubTab, setOrderSubTab] = useState<OrderSubTab>('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedDisputeOrder, setSelectedDisputeOrder] = useState<PurchaseOrder | null>(null);
  const [withdrawConfirmOrderId, setWithdrawConfirmOrderId] = useState<string | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);

  // Direct avatar upload state
  const [avatarNotice, setAvatarNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDraggingOverAvatar, setIsDraggingOverAvatar] = useState(false);
  const directAvatarInputRef = useRef<HTMLInputElement>(null);

  const handleDirectAvatarUpload = async (file?: File | null) => {
    if (!file || !user) return;
    setAvatarNotice(null);

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isImageMime = file.type.startsWith('image/');
    const isImageExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'].includes(ext);

    // Kiểm tra định dạng bắt buộc phải là ảnh
    if (!isImageMime && !isImageExt) {
      setAvatarNotice({
        type: 'error',
        message: `❌ Tệp "${file.name}" không hợp lệ! Ảnh đại diện chỉ chấp nhận định dạng hình ảnh (.jpg, .jpeg, .png, .webp, .gif). Hệ thống không nhận file video (.mp4, .mov) hoặc tài liệu (.zip, .pdf, .docx).`,
      });
      setTimeout(() => setAvatarNotice(null), 5000);
      return;
    }

    // Kiểm tra dung lượng ảnh (Tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarNotice({
        type: 'error',
        message: `❌ Tệp ảnh "${file.name}" vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.`,
      });
      setTimeout(() => setAvatarNotice(null), 5000);
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const res = await listingService.uploadMedia(file);
      let newAvatarUrl = res.data?.url;
      if (!newAvatarUrl) {
        newAvatarUrl = URL.createObjectURL(file);
      }

      const updateRes = await profileService.updateProfile({
        ...user,
        avatarUrl: newAvatarUrl,
      });

      if (updateRes.success && updateRes.data) {
        handleProfileUpdated(updateRes.data);
      } else {
        const optimisticUser = { ...user, avatarUrl: newAvatarUrl };
        handleProfileUpdated(optimisticUser);
      }

      setAvatarNotice({
        type: 'success',
        message: 'Đã cập nhật ảnh đại diện mới thành công!',
      });
      setTimeout(() => setAvatarNotice(null), 4000);
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      setAvatarNotice({
        type: 'error',
        message: serverMsg || 'Không thể tải ảnh đại diện lên lúc này.',
      });
      setTimeout(() => setAvatarNotice(null), 5000);
    } finally {
      setIsUploadingAvatar(false);
      if (directAvatarInputRef.current) directAvatarInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (tabParam && ['account', 'orders', 'listings', 'rentals', 'notifications', 'favorites'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleSelectTab = (tab: PortalTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const loadOrdersAndClaims = () => {
    const all = orderService.getMyOrders();
    const myPurchases = user?.id ? all.filter((o) => o.buyerId === user.id && o.sellerId !== user.id) : all;
    setOrders(myPurchases);
    if (user?.id) {
      setGiveawayClaims(giveawayService.getClaimsByRequester(user.id));
    }
  };

  useEffect(() => {
    loadOrdersAndClaims();
    const handleOrdersUpdated = () => loadOrdersAndClaims();
    const handleClaimsUpdated = () => {
      if (user?.id) {
        setGiveawayClaims(giveawayService.getClaimsByRequester(user.id));
      }
    };

    window.addEventListener('campus_orders_updated', handleOrdersUpdated);
    window.addEventListener('campus_giveaway_claims_updated', handleClaimsUpdated);
    return () => {
      window.removeEventListener('campus_orders_updated', handleOrdersUpdated);
      window.removeEventListener('campus_giveaway_claims_updated', handleClaimsUpdated);
    };
  }, [user?.id]);

  useEffect(() => {
    studentNotificationService.getNotifications().then((notifs) => {
      setNotifications(notifs);
    });
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const res = await profileService.getMyProfile();
        if (res.success && res.data) {
          setUser(res.data);
          if (token) {
            login(res.data, token);
          }
        }
      } catch {
        if (storeUser) setUser(storeUser);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [login, storeUser, token]);

  const handleProfileUpdated = (updatedUser: UserType) => {
    setUser(updatedUser);
    if (token) {
      login(updatedUser, token);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20 max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chưa tìm thấy thông tin hồ sơ</h3>
        <p className="text-xs text-slate-500">Vui lòng đăng nhập bằng tài khoản sinh viên để xem thông tin cá nhân.</p>
        <Link to="/login">
          <BaseButton variant="primary" size="sm">Đăng nhập ngay</BaseButton>
        </Link>
      </div>
    );
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (orderSubTab === 'ALL') {
      // Show all
    } else if (orderSubTab === 'CONFIRMED') {
      if (order.status !== 'CONFIRMED') return false;
    } else if (orderSubTab === 'COMPLETED') {
      if (order.status !== 'COMPLETED') return false;
    } else if (orderSubTab === 'DISPUTED') {
      if (order.status !== 'DISPUTED') return false;
    }

    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      const matchId = order.id.toLowerCase().includes(q);
      const matchSeller = order.sellerName.toLowerCase().includes(q);
      const matchTitle = order.listingTitle.toLowerCase().includes(q);
      if (!matchId && !matchSeller && !matchTitle) return false;
    }

    return true;
  });

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 text-left relative">
      {/* Hidden file input for direct avatar upload */}
      <input
        ref={directAvatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleDirectAvatarUpload(e.target.files[0]);
          }
        }}
      />

      {/* Toast Alert for Avatar Changes */}
      {avatarNotice && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 ${
            avatarNotice.type === 'success'
              ? 'bg-slate-900 text-white border border-slate-700'
              : 'bg-rose-600 text-white shadow-rose-500/25'
          }`}
        >
          {avatarNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{avatarNotice.message}</span>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SIDEBAR (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* User Mini Profile Header */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div
              className={`relative shrink-0 group cursor-pointer transition-transform ${
                isDraggingOverAvatar ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}
              onClick={() => directAvatarInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOverAvatar(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOverAvatar(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOverAvatar(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleDirectAvatarUpload(e.dataTransfer.files[0]);
                }
              }}
              title="Click để chọn ảnh hoặc kéo thả ảnh vào đây để thay đổi ảnh đại diện"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative shadow-xs">
                {isUploadingAvatar ? (
                  <div className="w-full h-full flex items-center justify-center bg-blue-600/90 text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <>
                    <img
                      src={
                        user.avatarUrl ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email || 'student'}`
                      }
                      alt={user.fullName}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Camera className="w-4 h-4" />
                    </div>
                  </>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={user.fullName}>
                {user.fullName || user.email?.split('@')[0]}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {user.studentCode || 'Sinh viên Phenikaa'}
              </p>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            {/* 1. Hồ Sơ & Bảo Mật (Lên đầu tiên theo yêu cầu) */}
            <button
              onClick={() => handleSelectTab('account')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'account' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`} />
              <span>Hồ Sơ & Bảo Mật</span>
            </button>

            {/* 2. Đơn Mua & Đồ Nhận */}
            <button
              onClick={() => handleSelectTab('orders')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className={`w-4 h-4 ${activeTab === 'orders' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`} />
                <span>Đơn Mua & Đồ Nhận</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                {orders.length + giveawayClaims.length}
              </span>
            </button>

            {/* 3. Kho Đồ Sinh Viên */}
            <button
              onClick={() => handleSelectTab('listings')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'listings'
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className={`w-4 h-4 ${activeTab === 'listings' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`} />
                <span>Kho Đồ Sinh Viên (Bán, Tặng, Đổi)</span>
              </div>
            </button>

            {/* 4. Hợp Đồng Thuê */}
            <button
              onClick={() => handleSelectTab('rentals')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'rentals'
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className={`w-4 h-4 ${activeTab === 'rentals' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`} />
                <span>Hợp Đồng Thuê Đồ</span>
              </div>
            </button>

            {/* 5. Thông Báo */}
            <button
              onClick={() => handleSelectTab('notifications')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`} />
                <span>Thông Báo</span>
              </div>
              {unreadNotifsCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-600 text-white">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* 6. Món Đã Thả Tim / Đã Lưu (Thêm dưới thông báo theo yêu cầu) */}
            <button
              onClick={() => handleSelectTab('favorites')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                <span>Món đã thả tim</span>
              </div>
              {savedListings.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
                  {savedListings.length}
                </span>
              )}
            </button>

            {/* Karma Badge Footer */}
            <div className="px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 mt-2 pt-2">
              <div className="flex items-center gap-3">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Điểm Karma</span>
              </div>
              <KarmaBadge score={user.karmaScore || 20} showText={false} />
            </div>
          </nav>
        </div>

        {/* RIGHT CONTENT PANEL (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: ĐƠN MUA & ĐỒ NHẬN */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Sub-Tabs */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none px-2 pt-1">
                  {[
                    { key: 'ALL', label: `Tất cả (${orders.length})` },
                    { key: 'CONFIRMED', label: `Đang giao dịch (${orders.filter((o) => o.status === 'CONFIRMED').length})` },
                    { key: 'COMPLETED', label: `Hoàn tất (${orders.filter((o) => o.status === 'COMPLETED').length})` },
                    { key: 'DISPUTED', label: `Khiếu nại / Trả hàng (${orders.filter((o) => o.status === 'DISPUTED').length})` },
                    { key: 'GIVEAWAY_CLAIMS', label: `Món đồ xin nhận 0đ (${giveawayClaims.length})`, isGift: true },
                  ].map((tab) => {
                    const isSelected = orderSubTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setOrderSubTab(tab.key as OrderSubTab)}
                        className={`px-4 py-3.5 text-xs font-bold transition-all relative whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? tab.isGift
                              ? 'text-pink-600 dark:text-pink-400 font-black'
                              : 'text-orange-600 dark:text-orange-400 font-black'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.isGift && <Gift className="w-3.5 h-3.5" />}
                        <span>{tab.label}</span>
                        {isSelected && (
                          <span
                            className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${
                              tab.isGift ? 'bg-pink-600 dark:bg-pink-400' : 'bg-orange-600 dark:bg-orange-400'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Search bar */}
                {orderSubTab !== 'GIVEAWAY_CLAIMS' && (
                  <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm theo Mã đơn, Người bán hoặc Tên sản phẩm..."
                        className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* View 1: Giveaway Claims */}
              {orderSubTab === 'GIVEAWAY_CLAIMS' ? (
                giveawayClaims.length === 0 ? (
                  <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <Gift className="w-12 h-12 text-pink-300 dark:text-pink-900/60 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Bạn chưa gửi yêu cầu xin nhận món đồ tặng nào
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Khi các bạn sinh viên Phenikaa đăng tặng đồ dùng học tập hoặc tài liệu 0đ, bạn có thể gửi thông điệp xin nhận.
                    </p>
                    <Link to="/?transactionType=GIVEAWAY">
                      <BaseButton variant="primary" size="sm" className="bg-pink-600 hover:bg-pink-700 text-white">
                        Khám phá đồ tặng 0đ trên Chợ
                      </BaseButton>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {giveawayClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-pink-300 dark:hover:border-pink-900/40 transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
                              TẶNG ĐỒ 0Đ
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              Ngày gửi: {formatDate(claim.createdAt)}
                            </span>
                          </div>

                          <div>
                            {claim.status === 'PENDING' && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Đang chờ chủ đồ phản hồi</span>
                              </span>
                            )}
                            {claim.status === 'ACCEPTED' && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>🎉 Chúc mừng! Bạn đã được chọn nhận món đồ này</span>
                              </span>
                            )}
                            {claim.status === 'REJECTED' && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1.5">
                                <span>Món đồ đã được trao cho bạn khác</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <img
                              src={claim.listingImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&q=80'}
                              alt={claim.listingTitle}
                              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                            />
                            <div className="space-y-1">
                              <Link
                                to={`/listings/${claim.listingId}`}
                                className="text-sm font-bold text-slate-900 dark:text-white hover:text-pink-600 transition line-clamp-1"
                              >
                                {claim.listingTitle}
                              </Link>
                              <p className="text-xs text-slate-500">
                                Lời nhắn của bạn:{' '}
                                <span className="italic text-slate-700 dark:text-slate-300">"{claim.message}"</span>
                              </p>
                              <p className="text-xs font-bold text-pink-600 dark:text-pink-400">
                                Miễn phí (0 đ)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link to={`/chat?userId=${claim.ownerId}`}>
                              <BaseButton variant="secondary" size="sm" className="text-xs gap-1.5">
                                <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                                <span>Nhắn tin với chủ đồ</span>
                              </BaseButton>
                            </Link>

                            <Link to={`/listings/${claim.listingId}`}>
                              <BaseButton variant="outline" size="sm" className="text-xs">
                                Xem bài đăng
                              </BaseButton>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* View 2: Regular Purchase Orders */
                filteredOrders.length === 0 ? (
                  <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Chưa có đơn hàng nào trong mục này
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Khi bạn đặt mua sản phẩm trên sàn, đơn hàng sẽ hiển thị tại đây để bạn tiện đối soát và đánh giá sau khi nhận hàng.
                    </p>
                    <Link to="/">
                      <BaseButton variant="primary" size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                        Khám phá sản phẩm
                      </BaseButton>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                              Mã đơn: #{order.id}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-xs text-slate-500">
                              Người bán: <strong className="text-slate-800 dark:text-slate-200">{order.sellerName}</strong>
                            </span>
                          </div>

                          <div>
                            {(order.status === 'CONFIRMED' || order.status === 'DELIVERED') && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                ✓ Đang giao dịch / Chờ nhận đồ
                              </span>
                            )}
                            {order.status === 'COMPLETED' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ĐÃ HOÀN TẤT
                              </span>
                            )}
                            {order.status === 'DISPUTED' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Đang khiếu nại Trả hàng / Hoàn tiền
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={order.listingImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&q=80'}
                              alt={order.listingTitle}
                              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 bg-slate-100 shrink-0"
                            />
                            <div className="space-y-1">
                              <Link
                                to={`/listings/${order.listingId}`}
                                className="text-sm font-bold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition line-clamp-1"
                              >
                                {order.listingTitle}
                              </Link>
                              <p className="text-xs text-slate-400">
                                Ngày đặt: {formatDate(order.orderDate)} • Điểm hẹn: Safe Meeting Point Campus
                              </p>
                              <p className="text-base font-black text-orange-600 dark:text-orange-400">
                                {formatCurrency(order.price)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2.5">
                            <Link to={`/chat?userId=${order.sellerId}`}>
                              <BaseButton variant="secondary" size="sm" className="text-xs gap-1">
                                <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                                <span>Nhắn tin</span>
                              </BaseButton>
                            </Link>

                            <Link to={`/listings/${order.listingId}`}>
                              <BaseButton variant="outline" size="sm" className="text-xs">
                                Xem lại bài đăng
                              </BaseButton>
                            </Link>

                            {(order.status === 'CONFIRMED' || order.status === 'DELIVERED') && (
                              <BaseButton
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  orderService.updateOrderStatus(order.id, 'COMPLETED');
                                  loadOrdersAndClaims();
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Đã nhận được hàng (Hoàn tất)</span>
                              </BaseButton>
                            )}

                            {order.status === 'COMPLETED' && (
                              <Link to={`/listings/${order.listingId}`}>
                                <BaseButton variant="secondary" size="sm" className="text-xs">
                                  Đánh giá sản phẩm
                                </BaseButton>
                              </Link>
                            )}

                            {order.status !== 'DISPUTED' && order.status !== 'COMPLETED' ? (
                              <BaseButton
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedDisputeOrder(order);
                                  setIsDisputeModalOpen(true);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Khiếu nại / Trả hàng</span>
                              </BaseButton>
                            ) : order.status === 'DISPUTED' ? (
                              <button
                                type="button"
                                onClick={() => setWithdrawConfirmOrderId(order.id)}
                                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              >
                                Rút lại khiếu nại
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* TAB 2: KHO ĐỒ CÁ NHÂN */}
          {activeTab === 'listings' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <MyListingsPage />
            </div>
          )}

          {/* TAB 3: HỢP ĐỒNG THUÊ */}
          {activeTab === 'rentals' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <RentalListPage />
            </div>
          )}

          {/* TAB 4: HỒ SƠ & BẢO MẬT */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Profile Card Header Banner */}
              <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-lg overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => directAvatarInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleDirectAvatarUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      title="Click để chọn ảnh hoặc kéo thả ảnh vào đây để thay đổi ảnh đại diện"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-white/20 p-1 border-2 border-white/40 shadow-inner overflow-hidden relative">
                        {isUploadingAvatar ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-blue-600/90 text-white rounded-xl">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : (
                          <>
                            <img
                              src={
                                user.avatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email || 'student'}`
                              }
                              alt={user.fullName}
                              className="w-full h-full object-cover rounded-xl bg-white/30 group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-1 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white gap-0.5">
                              <Camera className="w-5 h-5" />
                              <span className="text-[9px] font-bold">Đổi ảnh</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-emerald-500 text-white shadow" title="Sinh viên Phenikaa">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <h2 className="text-xl font-bold tracking-tight">{user.fullName}</h2>
                        <KarmaBadge score={user.karmaScore || 20} showText={true} />
                      </div>

                      <p className="text-xs text-white/80 mt-1 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                        <School className="w-3.5 h-3.5" />
                        <span>{user.universityName || 'Trường Đại học Phenikaa'}</span>
                        <span>•</span>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{user.campusName || 'Cơ sở Yên Nghĩa'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <BaseButton
                      variant="outline"
                      size="sm"
                      className="bg-emerald-500/20 border-emerald-300/40 text-white hover:bg-emerald-500/30 gap-1.5"
                      onClick={() => setIsOcrModalOpen(true)}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Xác minh thẻ SV (Thủ công)</span>
                    </BaseButton>
                    <BaseButton
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1.5"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Sửa hồ sơ</span>
                    </BaseButton>
                  </div>
                </div>
              </div>

              {/* Mode Switcher: Hồ sơ cá nhân vs Đổi mật khẩu */}
              <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setAccountSubSection('INFO');
                      setPasswordNotice(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      accountSubSection === 'INFO'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Hồ sơ cá nhân</span>
                  </button>
                  <button
                    onClick={() => {
                      setAccountSubSection('PASSWORD');
                      setPasswordNotice(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      accountSubSection === 'PASSWORD'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Đổi mật khẩu</span>
                  </button>
                </div>

                <span className="hidden sm:inline-block text-[11px] text-slate-400 pr-3">
                  Tài khoản sinh viên Phenikaa an toàn & bảo mật
                </span>
              </div>

              {/* Section 1: Personal Private Profile */}
              {accountSubSection === 'INFO' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span>Thông tin sinh viên</span>
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" /> Email trường
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white font-mono">{user.email}</span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> Số điện thoại
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{user.phone || 'Chưa cập nhật'}</span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" /> MSSV
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white font-mono">{user.studentCode || 'Chưa cập nhật'}</span>
                      </div>

                      <div className="flex justify-between py-2">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Xác minh thẻ SV
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {user.studentCardVerified ? 'Đã xác thực' : 'Đã định danh qua Email trường'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <School className="w-4 h-4 text-blue-600" />
                      <span>Học tập & Cư trú</span>
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5" /> Trường học
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{user.universityName || 'Trường Đại học Phenikaa'}</span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Cơ sở
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{user.campusName || 'Cơ sở Yên Nghĩa'}</span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5" /> Ký túc xá / Nơi ở
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{user.dormitory || 'Chưa thiết lập'}</span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5" /> Khoa / Viện
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{user.major || 'Chưa cập nhật'}</span>
                      </div>

                      <div className="flex justify-between py-2">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Niên khóa
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{user.academicYear || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Change Password Form */}
              {accountSubSection === 'PASSWORD' && (
                <div className="max-w-xl mx-auto p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Đổi mật khẩu tài khoản</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cập nhật mật khẩu định kỳ để bảo vệ tài khoản sinh viên Phenikaa
                      </p>
                    </div>
                  </div>

                  {passwordNotice && (
                    <div
                      className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                        passwordNotice.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {passwordNotice.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      )}
                      <span>{passwordNotice.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Mật khẩu hiện tại *
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Nhập mật khẩu hiện tại"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Mật khẩu mới (tối thiểu 6 ký tự) *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nhập mật khẩu mới"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Xác nhận mật khẩu mới *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <BaseButton
                        type="submit"
                        variant="primary"
                        isLoading={passwordLoading}
                        className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Cập nhật mật khẩu</span>
                      </BaseButton>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: THÔNG BÁO */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-500" />
                    <span>Hộp Thư Thông Báo Cá Nhân</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cập nhật tiến độ duyệt bài đăng, yêu cầu tặng đồ và khiếu nại giao dịch
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    studentNotificationService.markAllAsRead().then(() => {
                      studentNotificationService.getNotifications().then(setNotifications);
                    });
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              </div>

              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <Bell className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-500">Chưa có thông báo nào.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.type === 'LISTING_APPROVED' || item.type === 'GIVEAWAY_AWARDED'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                          : item.type === 'LISTING_REJECTED'
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                          : item.type === 'GIVEAWAY_REQUEST'
                          ? 'bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/40'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      } ${!item.isRead ? 'ring-1 ring-orange-500/30' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              item.type === 'LISTING_APPROVED' || item.type === 'GIVEAWAY_AWARDED'
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300'
                                : item.type === 'LISTING_REJECTED'
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300'
                                : item.type === 'GIVEAWAY_REQUEST'
                                ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/60 dark:text-pink-300'
                                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300'
                            }`}
                          >
                            {item.type === 'LISTING_APPROVED' && <CheckCircle2 className="w-5 h-5" />}
                            {item.type === 'GIVEAWAY_AWARDED' && <Gift className="w-5 h-5" />}
                            {item.type === 'GIVEAWAY_REQUEST' && <Gift className="w-5 h-5" />}
                            {item.type === 'LISTING_REJECTED' && <AlertTriangle className="w-5 h-5" />}
                            {item.type !== 'LISTING_APPROVED' &&
                              item.type !== 'LISTING_REJECTED' &&
                              item.type !== 'GIVEAWAY_AWARDED' &&
                              item.type !== 'GIVEAWAY_REQUEST' && <Bell className="w-5 h-5" />}
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{item.title}</span>
                              {!item.isRead && (
                                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                              )}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {item.message}
                            </p>

                            {item.reason && (
                              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px] mt-2">
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {item.type === 'LISTING_APPROVED' ? '✓ Ghi chú duyệt:' : '⚠️ Lý do cụ thể:'}
                                </span>{' '}
                                <span className="text-slate-600 dark:text-slate-300">{item.reason}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: MÓN ĐÃ THẢ TIM / ĐÃ LƯU */}
          {activeTab === 'favorites' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                    <span>Món Đồ Đã Thả Tim ({savedListings.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Danh sách các món đồ bạn đã lưu lại để theo dõi, trao đổi, mua hoặc thuê khi cần.
                  </p>
                </div>
                {savedListings.length > 0 && (
                  <Link to="/">
                    <BaseButton variant="outline" size="sm" className="gap-1.5 text-xs">
                      <span>Tiếp tục khám phá chợ</span>
                    </BaseButton>
                  </Link>
                )}
              </div>

              {savedListings.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
                    <Heart className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Chưa có món đồ nào được thả tim
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Khi lướt chợ sinh viên Phenikaa, bạn hãy bấm vào biểu tượng trái tim ❤️ ở bất kỳ sản phẩm nào để lưu lại và xem lại nhanh chóng tại đây!
                    </p>
                  </div>
                  <Link to="/">
                    <BaseButton variant="primary" size="sm" className="mt-2 text-xs font-semibold px-5 py-2.5 rounded-xl">
                      Khám phá chợ đồ sinh viên
                    </BaseButton>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {savedListings.map((item) => (
                    <div key={item.id} className="relative group">
                      <ListingCard listing={item} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Shopee Dispute Modal for Orders */}
      {selectedDisputeOrder && (
        <ShopeeDisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => {
            setIsDisputeModalOpen(false);
            setSelectedDisputeOrder(null);
          }}
          order={selectedDisputeOrder}
          onSuccess={() => {
            loadOrdersAndClaims();
          }}
        />
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUser={user}
        onUpdated={handleProfileUpdated}
      />

      {/* Student Card OCR Modal */}
      <StudentCardVerifyModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onVerifiedSuccess={(res) => {
          if (user) {
            handleProfileUpdated({
              ...user,
              studentCardVerified: true,
              karmaScore: user.karmaScore + res.karmaAwarded,
            });
          }
        }}
      />

      {/* Confirmation Modal for Rút lại khiếu nại (Thay thế window.confirm / localhost say) */}
      {withdrawConfirmOrderId && (
        <BaseModal
          isOpen={true}
          onClose={() => setWithdrawConfirmOrderId(null)}
          title="Rút lại yêu cầu khiếu nại"
          maxWidth="sm"
        >
          <div className="space-y-4 py-1 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn rút lại yêu cầu khiếu nại cho đơn hàng này không?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <BaseButton variant="outline" size="sm" onClick={() => setWithdrawConfirmOrderId(null)}>
                Hủy
              </BaseButton>
              <BaseButton
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white"
                onClick={() => {
                  orderService.cancelDispute(withdrawConfirmOrderId);
                  setWithdrawConfirmOrderId(null);
                  loadOrdersAndClaims();
                }}
              >
                Xác nhận rút lại
              </BaseButton>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
};
