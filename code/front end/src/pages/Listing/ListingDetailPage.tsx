import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  Repeat,
  Clock,
  Gift,
  ShoppingBag,
  ShoppingCart,
  FileText,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Eye,
  Heart,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { listingService } from '../../services/listingService';
import { cartService } from '../../services/cartService';
import { Listing } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { TRANSACTION_TYPE_LABELS, CONDITION_LABELS } from '../../constants';
import { KarmaBadge } from '../../components/features/KarmaBadge';
import { ReportModal } from '../../components/features/ReportModal';
import { SwapModal } from '../../components/features/SwapModal';
import { ListingCard } from '../../components/features/ListingCard';
import { ShopeeReviewSection } from '../../components/features/ShopeeReviewSection';
import { GiveawayClaimModal } from '../../components/features/GiveawayClaimModal';
import { DatePickerInput } from '../../components/base/DatePickerInput';
import { rentalService } from '../../services/rentalService';
import { giveawayService, GiveawayClaim } from '../../services/giveawayService';
import { useAuthStore } from '../../store/useAuthStore';

export const ListingDetailPage: React.FC = () => {
  const { user } = useAuthStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [relatedListings, setRelatedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [giveawayToast, setGiveawayToast] = useState<string | null>(null);

  // Giveaway state
  const [giveawayClaims, setGiveawayClaims] = useState<GiveawayClaim[]>([]);
  const [isGiveawayClosed, setIsGiveawayClosed] = useState(false);
  const [hasUserClaimed, setHasUserClaimed] = useState(false);
  const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);

  // Rental date range & days calculation
  const getInitialDates = () => {
    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 2);
    return {
      todayStr: today.toISOString().split('T')[0],
      futureStr: future.toISOString().split('T')[0],
    };
  };

  const initialDates = getInitialDates();
  const [rentalStartDate, setRentalStartDate] = useState(initialDates.todayStr);
  const [rentalEndDate, setRentalEndDate] = useState(initialDates.futureStr);
  const [rentalDays, setRentalDays] = useState(3);
  const [isSubmittingRental, setIsSubmittingRental] = useState(false);
  const [rentalSuccessModal, setRentalSuccessModal] = useState(false);
  const [createdRentalId, setCreatedRentalId] = useState<number | null>(null);

  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [addedToCartToast, setAddedToCartToast] = useState(false);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const fetchListing = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await listingService.getListingById(Number(id));
        if (res.success && res.data) {
          setListing(res.data);
          setSelectedImageIndex(0);

          // Fetch real related listings
          try {
            const relRes = await listingService.getListings({ categoryId: res.data.categoryId });
            if (relRes.success && relRes.data?.content) {
              setRelatedListings(relRes.data.content.filter((item) => item.id !== res.data.id).slice(0, 3));
            }
          } catch {
            setRelatedListings([]);
          }
        } else {
          setListing(null);
        }
      } catch {
        setListing(null);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopiedToast(true);
    setTimeout(() => setShowCopiedToast(false), 2500);
  };

  const handleAddToCart = () => {
    if (!listing) return;
    if (user?.id === listing.userId) {
      setIsOwnerModalOpen(true);
      return;
    }
    cartService.addToCart({
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: currentImageUrl,
      transactionType: listing.transactionType as 'SELL' | 'RENT',
      price: listing.price,
      quantity: listing.transactionType === 'RENT' ? rentalDays : 1,
      rentalDays: listing.transactionType === 'RENT' ? rentalDays : undefined,
      sellerId: listing.userId,
      sellerName: listing.authorName || 'Người bán',
      sellerAvatar: listing.authorAvatar,
      sellerKarma: listing.authorKarma,
      safeMeetingPoint: listing.dormitory || listing.campusName || 'Thư viện trường (Tòa A2)',
    });
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 2500);
  };

  const handleBuyNow = () => {
    if (!listing) return;
    if (user?.id === listing.userId) {
      setIsOwnerModalOpen(true);
      return;
    }
    navigate('/checkout', {
      state: {
        directItem: {
          listingId: listing.id,
          listingTitle: listing.title,
          listingImage: currentImageUrl,
          transactionType: listing.transactionType,
          price: listing.price,
          quantity: listing.transactionType === 'RENT' ? rentalDays : 1,
          sellerId: listing.userId,
          sellerName: listing.authorName || 'Người bán',
          sellerAvatar: listing.authorAvatar,
          sellerKarma: listing.authorKarma,
          safeMeetingPoint: listing.dormitory || listing.campusName || 'Thư viện trường (Tòa A2)',
        },
        isFromCart: false,
      },
    });
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
  };

  const handleStartDateChange = (val: string) => {
    const todayStr = initialDates.todayStr;
    const cleanVal = val < todayStr ? todayStr : val;
    setRentalStartDate(cleanVal);
    if (cleanVal > rentalEndDate) {
      setRentalEndDate(cleanVal);
      setRentalDays(1);
    } else {
      setRentalDays(calculateDays(cleanVal, rentalEndDate));
    }
  };

  const handleEndDateChange = (val: string) => {
    const minEnd = rentalStartDate || initialDates.todayStr;
    const cleanVal = val < minEnd ? minEnd : val;
    setRentalEndDate(cleanVal);
    setRentalDays(calculateDays(rentalStartDate, cleanVal));
  };

  const handleSendRentalRequest = async () => {
    if (!listing) return;
    if (user?.id === listing.userId) {
      setIsOwnerModalOpen(true);
      return;
    }
    if (!user) {
      alert('Vui lòng đăng nhập để gửi yêu cầu thuê thiết bị.');
      return;
    }
    if (user.status === 'SUSPENDED') {
      alert('⚠️ Tài khoản của bạn đang bị tạm khóa 1 tuần do vi phạm quy chế.');
      return;
    }

    try {
      setIsSubmittingRental(true);
      const res = await rentalService.createRentalContract({
        listingId: listing.id,
        listingTitle: listing.title,
        rentalTerms: listing.rentalTerms,
        ownerId: listing.userId,
        ownerName: listing.authorName,
        renterId: user.id,
        renterName: user.fullName,
        startDate: rentalStartDate,
        endDate: rentalEndDate,
        totalRentAmount: listing.price * rentalDays,
        depositAmount: listing.depositAmount || 0,
      });

      if (res.success && res.data) {
        setCreatedRentalId(res.data.id);
        setRentalSuccessModal(true);
      }
    } catch (err: any) {
      alert(err.message || 'Không thể tạo yêu cầu thuê. Vui lòng thử lại.');
    } finally {
      setIsSubmittingRental(false);
    }
  };

  const refreshGiveawayClaims = () => {
    if (!id) return;
    const listingId = Number(id);
    const claims = giveawayService.getClaimsByListing(listingId);
    setGiveawayClaims(claims);
    setIsGiveawayClosed(giveawayService.isGiveawayClosed(listingId));
    setHasUserClaimed(giveawayService.hasUserClaimed(listingId, user?.id));
  };

  useEffect(() => {
    refreshGiveawayClaims();
    const handleClaimsUpdated = () => refreshGiveawayClaims();
    window.addEventListener('campus_giveaway_claims_updated', handleClaimsUpdated);
    window.addEventListener('campus_giveaway_closed', handleClaimsUpdated);
    return () => {
      window.removeEventListener('campus_giveaway_claims_updated', handleClaimsUpdated);
      window.removeEventListener('campus_giveaway_closed', handleClaimsUpdated);
    };
  }, [id, user]);

  const handleAcceptGiveawayClaim = async (claimId: string, requesterName: string, studentCode?: string) => {
    if (!listing) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn chốt tặng món đồ "${listing.title}" cho bạn ${requesterName}${
          studentCode ? ` (MSSV: ${studentCode})` : ''
        } không?\n\nSau khi chốt tặng:\n- Hệ thống sẽ gửi thông báo chúc mừng tới bạn ấy để hai bạn hẹn gặp nhận đồ tại trường.\n- Bài đăng sẽ đóng nhận thêm đăng ký.\n- Bạn sẽ nhận được +10 điểm tín nhiệm Campus Karma!`
      )
    ) {
      return;
    }

    try {
      await giveawayService.acceptClaim(claimId, listing.id);
      refreshGiveawayClaims();
      setGiveawayToast(`🎉 Chúc mừng! Bạn đã chốt tặng món đồ thành công cho ${requesterName} và được thưởng +10 Karma!`);
      setTimeout(() => setGiveawayToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xác nhận tặng đồ.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center space-y-4">
        <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Đang tải thông tin chi tiết sản phẩm #{id}...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-3xl mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Không tìm thấy món đồ</h2>
          <p className="text-sm text-slate-500 mt-1">
            Sản phẩm có thể đã được giao dịch thành công hoặc gỡ bỏ bởi ban quản trị.
          </p>
        </div>
        <BaseButton onClick={() => navigate('/')} variant="primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách đồ
        </BaseButton>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0
    ? listing.images
    : [{ id: 1, listingId: listing.id, mediaUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&q=80', mediaType: 'IMAGE', sortOrder: 0 }];

  const currentImageUrl = images[selectedImageIndex]?.mediaUrl || images[0]?.mediaUrl;

  const getBadgeTypeStyle = (type: Listing['transactionType']) => {
    switch (type) {
      case 'SELL':
        return {
          bg: 'bg-blue-600 text-white',
          icon: <ShoppingBag className="w-4 h-4" />,
          label: 'Cần Bán (Thanh lý)',
        };
      case 'RENT':
        return {
          bg: 'bg-purple-600 text-white',
          icon: <Clock className="w-4 h-4" />,
          label: 'Cho Thuê (Có cọc)',
        };
      case 'GIVEAWAY':
        return {
          bg: 'bg-pink-600 text-white',
          icon: <Gift className="w-4 h-4" />,
          label: 'Tặng Miễn Phí (0đ)',
        };
      case 'SWAP':
        return {
          bg: 'bg-amber-600 text-white',
          icon: <Repeat className="w-4 h-4" />,
          label: 'Đổi Đồ (Swap)',
        };
    }
  };

  const badgeConfig = getBadgeTypeStyle(listing.transactionType);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 text-left">
      {/* Toast Notification */}
      {showCopiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Đã sao chép liên kết vào bộ nhớ tạm!</span>
        </div>
      )}

      {giveawayToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{giveawayToast}</span>
        </div>
      )}

      {/* Breadcrumbs & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 overflow-x-auto scrollbar-none">
          <Link to="/" className="hover:text-blue-600 flex items-center gap-1 shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-600 dark:text-slate-300 shrink-0">
            {listing.categoryName || 'Sản phẩm'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[200px] sm:max-w-sm">
            {listing.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`p-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
              isSaved
                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
            title="Lưu tin"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">{isSaved ? 'Đã lưu' : 'Lưu tin'}</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
            title="Chia sẻ"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="p-2 rounded-xl border border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium transition-all flex items-center gap-1.5"
            title="Báo cáo"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Báo cáo</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Gallery (Left) vs Info & Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Gallery Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-sm group">
            <img
              src={currentImageUrl}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Overlaid Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md backdrop-blur-md ${badgeConfig.bg}`}
              >
                {badgeConfig.icon}
                {TRANSACTION_TYPE_LABELS[listing.transactionType]}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white shadow-md">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                {CONDITION_LABELS[listing.conditionStatus] || 'Đã qua sử dụng'}
              </span>
            </div>

            {/* Image counter */}
            <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white">
              {selectedImageIndex + 1} / {images.length} ảnh
            </div>
          </div>

          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-[4/3] w-24 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.mediaUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}


        </div>

        {/* Info & Action Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category & Status pills */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {listing.categoryName || 'Chung'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> 168 lượt xem
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(listing.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-slate-100 leading-snug">
            {listing.title}
          </h1>

          {/* Pricing Highlight Card */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {listing.transactionType === 'SELL' && 'Giá thanh lý sinh viên'}
              {listing.transactionType === 'RENT' && 'Giá thuê & tiền cọc'}
              {listing.transactionType === 'GIVEAWAY' && 'Hình thức nhận đồ'}
              {listing.transactionType === 'SWAP' && 'Hình thức trao đổi'}
            </div>

            {listing.transactionType === 'SELL' && (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  {formatCurrency(listing.price)}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Tiết kiệm đến 60%
                </span>
              </div>
            )}

            {listing.transactionType === 'RENT' && (
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                    {formatCurrency(listing.price)}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/ ngày</span>
                </div>

                {/* Chọn ngày thuê */}
                <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>Chọn thời gian thuê đồ:</span>
                    </label>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                      {rentalDays} ngày
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <DatePickerInput
                      label="Từ ngày (dd/mm/yyyy):"
                      value={rentalStartDate}
                      minDate={initialDates.todayStr}
                      onChange={handleStartDateChange}
                    />
                    <DatePickerInput
                      label="Đến ngày (dd/mm/yyyy):"
                      value={rentalEndDate}
                      minDate={rentalStartDate || initialDates.todayStr}
                      onChange={handleEndDateChange}
                    />
                  </div>

                  {/* Chi tiết chi phí */}
                  <div className="pt-2 border-t border-purple-200/60 dark:border-purple-900/40 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Tiền thuê:</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300 font-mono">
                        {formatCurrency(listing.price * rentalDays)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <span>Tiền cọc bảo đảm:</span>
                        <span className="text-[10px] text-emerald-600 font-bold">(Hoàn 100% khi trả máy)</span>
                      </span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                        {listing.depositAmount && listing.depositAmount > 0
                          ? formatCurrency(listing.depositAmount)
                          : '0 ₫ (Theo thỏa thuận)'}
                      </span>
                    </div>
                  </div>
                </div>

                {listing.rentalTerms && (
                  <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <span className="font-semibold block">
                      Điều khoản thuê & Quy định phạt vi phạm:
                    </span>
                    <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                      {listing.rentalTerms}
                    </p>
                  </div>
                )}
                <p className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-xl border border-purple-200/50 dark:border-purple-900/40">
                  Cọc bắt buộc bảo vệ quyền lợi sinh viên. Khi trả lại máy nguyên vẹn, người cho thuê sẽ hoàn trả 100% tiền cọc.
                </p>
              </div>
            )}

            {listing.transactionType === 'GIVEAWAY' && (
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-pink-600 dark:text-pink-400 flex items-center gap-2">
                  <Gift className="w-6 h-6" />
                  <span>0 ₫ (Miễn Phí 100%)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Ưu tiên tặng tân sinh viên hoặc các bạn có hoàn cảnh khó khăn.
                </p>
              </div>
            )}

            {listing.transactionType === 'SWAP' && (
              <div className="space-y-2">
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Repeat className="w-5 h-5" />
                  <span>Đổi Đồ (Không Bán Tiền)</span>
                </div>
                {listing.swapTarget && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs text-amber-800 dark:text-amber-200">
                    <b>Cần đổi lấy:</b> {listing.swapTarget}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <span className="text-slate-400 font-medium">Tình trạng máy / đồ</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {CONDITION_LABELS[listing.conditionStatus] || 'Đã dùng'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <span className="text-slate-400 font-medium">Trường học</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate" title={listing.universityName}>
                {listing.universityName || 'Đại học Quốc gia'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <span className="text-slate-400 font-medium">Khuôn viên / KTX</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">{listing.campusName || 'Khu A'}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <span className="text-slate-400 font-medium">Nơi nhận đồ</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate" title={listing.dormitory || listing.campusName}>
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{listing.dormitory || listing.campusName || 'Thư viện trường'}</span>
              </p>
            </div>
          </div>

          {/* Seller Card */}
          <Link
            to={`/seller/${listing.userId}`}
            className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition group cursor-pointer block"
            title="Nhấn để xem trang cá nhân & kho đồ của người bán"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img
                  src={
                    listing.authorAvatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.authorName || 'CampusStudent'}`
                  }
                  alt={listing.authorName}
                  className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-slate-200 dark:border-slate-700"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                    {listing.authorName || 'Sinh viên Campus'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    Đã xác minh
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {listing.universityName || 'Trường Đại học Phenikaa'} • Xem hồ sơ & kho đồ →
                </p>
              </div>
            </div>

            {listing.authorKarma !== undefined && (
              <div className="shrink-0 text-right">
                <KarmaBadge score={listing.authorKarma} showText={true} />
              </div>
            )}
          </Link>

          {/* Seller Suspended Notice */}
          {listing.authorStatus === 'SUSPENDED' && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">Người bán đang bị tạm khóa tài khoản 1 tuần</p>
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                  Tài khoản của {listing.authorName} đang bị Ban quản trị tạm khóa do vi phạm quy định sàn (bị báo cáo scam đồ / trừ điểm uy tín). Các giao dịch thuê, mua bán và nhắn tin với tài khoản này tạm thời bị vô hiệu hóa.
                </p>
              </div>
            </div>
          )}

          {/* Action Triggers */}
          <div className="space-y-3 pt-2">
            {/* Primary Action: Chat */}
            <BaseButton
              onClick={() => {
                if (user?.id === listing.userId) {
                  setIsOwnerModalOpen(true);
                  return;
                }
                navigate('/chat', {
                  state: {
                    sellerId: listing.userId,
                    sellerName: listing.authorName,
                    listingId: listing.id,
                    listingTitle: listing.title,
                  },
                });
              }}
              variant="primary"
              className="w-full py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Nhắn tin với {listing.authorName?.split(' ').pop() || 'Người bán'}</span>
            </BaseButton>

            {/* Context-Specific Actions */}
            {listing.transactionType === 'RENT' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <BaseButton
                    onClick={handleAddToCart}
                    variant="outline"
                    disabled={user?.status === 'SUSPENDED' || listing.authorStatus === 'SUSPENDED'}
                    className="py-3 rounded-2xl text-xs font-bold border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="w-4 h-4 text-purple-600" />
                    <span>Thêm vào giỏ</span>
                  </BaseButton>

                  <BaseButton
                    onClick={handleSendRentalRequest}
                    variant="primary"
                    isLoading={isSubmittingRental}
                    disabled={user?.status === 'SUSPENDED' || listing.authorStatus === 'SUSPENDED'}
                    className="py-3 rounded-2xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Thuê ngay ({rentalDays} ngày)</span>
                  </BaseButton>
                </div>

                <BaseButton
                  onClick={() => {
                    if (user?.status === 'SUSPENDED') {
                      alert('⚠️ Tài khoản của bạn đang bị tạm khóa 1 tuần do vi phạm. Không thể tạo hợp đồng thuê đồ.');
                      return;
                    }
                    if (listing.authorStatus === 'SUSPENDED') {
                      alert('⚠️ Người đăng bài này đang bị tạm khóa tài khoản. Tạm ngưng dịch vụ cho thuê.');
                      return;
                    }
                    navigate('/rentals');
                  }}
                  variant="secondary"
                  disabled={user?.status === 'SUSPENDED' || listing.authorStatus === 'SUSPENDED'}
                  className="w-full py-2.5 rounded-2xl text-[11px] font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  <span>Xem điều khoản & Mẫu hợp đồng thuê US-10</span>
                </BaseButton>
              </div>
            )}

            {listing.transactionType === 'SWAP' && (
              <BaseButton
                onClick={() => {
                  if (user?.status === 'SUSPENDED') {
                    alert('⚠️ Tài khoản của bạn đang bị tạm khóa 1 tuần do vi phạm. Không thể gửi đề xuất đổi đồ.');
                    return;
                  }
                  if (listing.authorStatus === 'SUSPENDED') {
                    alert('⚠️ Người đăng bài này đang bị tạm khóa tài khoản. Tạm ngưng giao dịch trao đổi.');
                    return;
                  }
                  setIsSwapModalOpen(true);
                }}
                variant="secondary"
                disabled={user?.status === 'SUSPENDED' || listing.authorStatus === 'SUSPENDED'}
                className="w-full py-3 rounded-2xl text-xs font-bold border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-center gap-2"
              >
                <Repeat className="w-4 h-4 text-amber-600" />
                <span>Gửi đề xuất đổi món đồ này (Swap)</span>
              </BaseButton>
            )}

            {listing.transactionType === 'GIVEAWAY' && (
              <div className="space-y-2">
                {user?.id === listing.userId ? (
                  <div className="p-3.5 rounded-2xl bg-pink-50/70 dark:bg-pink-950/30 border border-pink-200/80 dark:border-pink-900/50 text-xs text-pink-800 dark:text-pink-300">
                    <p className="font-bold flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-pink-600" />
                      <span>Bài đăng tặng 0đ của bạn</span>
                    </p>
                    <p className="text-[11px] text-pink-700 dark:text-pink-400 mt-1">
                      Hãy xem danh sách các bạn sinh viên gửi đơn xin nhận bên dưới và lựa chọn bạn phù hợp nhất để trao tặng.
                    </p>
                  </div>
                ) : isGiveawayClosed ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Món đồ đã được trao tặng thành công</span>
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Chủ sở hữu đã chốt trao tặng món đồ này cho một bạn sinh viên khác. Bài đăng hiện đã đóng.
                    </p>
                  </div>
                ) : hasUserClaimed ? (
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Bạn đã gửi đơn xin nhận món đồ này</span>
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-400">
                      Chủ đồ đang xem xét danh sách người đăng ký. Bạn sẽ nhận được thông báo ngay khi chủ đồ chốt tặng!
                    </p>
                  </div>
                ) : (
                  <BaseButton
                    onClick={() => {
                      if (!user) {
                        alert('Vui lòng đăng nhập để đăng ký nhận món đồ tặng.');
                        return;
                      }
                      if (user.status === 'SUSPENDED') {
                        alert('⚠️ Tài khoản của bạn đang bị tạm khóa 1 tuần do vi phạm. Không thể nhận đồ tặng.');
                        return;
                      }
                      if (listing.authorStatus === 'SUSPENDED') {
                        alert('⚠️ Người đăng bài này đang bị tạm khóa tài khoản.');
                        return;
                      }
                      setIsGiveawayModalOpen(true);
                    }}
                    variant="primary"
                    disabled={user?.status === 'SUSPENDED' || listing.authorStatus === 'SUSPENDED'}
                    className="w-full py-3.5 rounded-2xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-500/20 flex items-center justify-center gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Đăng ký nhận món đồ tặng này (0đ)</span>
                  </BaseButton>
                )}
              </div>
            )}

            {listing.transactionType === 'SELL' && (
              <div className="grid grid-cols-2 gap-2">
                <BaseButton
                  onClick={handleAddToCart}
                  variant="outline"
                  disabled={user?.status === 'SUSPENDED' || listing.authorStatus === 'SUSPENDED'}
                  className="py-3 rounded-2xl text-xs font-bold border-orange-300 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4 text-orange-500" />
                  <span>Thêm vào giỏ</span>
                </BaseButton>

                <BaseButton
                  onClick={handleBuyNow}
                  variant="primary"
                  disabled={user?.status === 'SUSPENDED' || listing.authorStatus === 'SUSPENDED'}
                  className="py-3 rounded-2xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Mua ngay ({formatCurrency(listing.price)})</span>
                </BaseButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Winner Banner: If current user is the chosen recipient */}
      {listing.transactionType === 'GIVEAWAY' &&
        giveawayClaims.some((c) => c.status === 'ACCEPTED' && c.requesterId === user?.id) && (
          <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 shadow-sm space-y-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                🎉
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Chúc mừng bạn đã được chọn nhận món đồ này!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Chủ đồ (<strong>{listing.authorName}</strong>) đã chọn trao tặng món đồ này cho bạn. Hãy nhắn tin để hẹn giờ và địa điểm gặp mặt nhận đồ tại khuôn viên trường Phenikaa nhé!
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <BaseButton
                onClick={() =>
                  navigate('/chat', {
                    state: {
                      sellerId: listing.userId,
                      sellerName: listing.authorName,
                      listingId: listing.id,
                      listingTitle: listing.title,
                      initialMessage: `Chào bạn ${listing.authorName}, mình cảm ơn bạn rất nhiều vì đã chốt tặng "${listing.title}" cho mình! Khi nào bạn rảnh để mình qua trường gặp nhận đồ ạ?`,
                    },
                  })
                }
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Nhắn tin với chủ đồ để hẹn giờ gặp</span>
              </BaseButton>
            </div>
          </div>
        )}

      {/* Giveaway Applicants Management (Only visible to Owner) */}
      {listing.transactionType === 'GIVEAWAY' && user?.id === listing.userId && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-900/50 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center font-bold">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Danh sách sinh viên đăng ký nhận đồ ({giveawayClaims.length} bạn)
                </h3>
                <p className="text-xs text-slate-500">
                  Xem lý do, hoàn cảnh của các bạn và bấm "Chọn tặng bạn này" để chốt người nhận.
                </p>
              </div>
            </div>

            <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
              🎁 Thưởng +10 Karma khi tặng đồ
            </div>
          </div>

          {giveawayClaims.length === 0 ? (
            <div className="text-center py-10 p-6 rounded-2xl bg-pink-50/40 dark:bg-pink-950/20 border border-dashed border-pink-200 dark:border-pink-900/40 space-y-2">
              <Gift className="w-10 h-10 text-pink-300 dark:text-pink-700 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Chưa có bạn nào gửi đơn đăng ký xin nhận
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Khi có sinh viên gửi lời nhắn và lý do cần món đồ, danh sách sẽ xuất hiện tại đây để bạn lựa chọn.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {giveawayClaims.map((claim) => (
                <div
                  key={claim.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    claim.status === 'ACCEPTED'
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={
                          claim.requesterAvatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${claim.requesterName}`
                        }
                        alt={claim.requesterName}
                        className="w-11 h-11 rounded-xl object-cover bg-white border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {claim.requesterName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono">
                            MSSV: {claim.requesterStudentCode || 'Đã xác minh'}
                          </span>
                          <KarmaBadge score={claim.requesterKarma || 20} showText={false} />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          SĐT/Zalo: <b>{claim.requesterPhone || 'Liên hệ qua chat'}</b> • Gửi lúc {formatDate(claim.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {claim.status === 'ACCEPTED' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã chọn tặng bạn này</span>
                        </span>
                      ) : isGiveawayClosed ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                          Chưa phù hợp lần này
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Reason text */}
                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 block uppercase tracking-wider">
                      Lý do & Hoàn cảnh xin nhận đồ:
                    </span>
                    <p className="leading-relaxed italic whitespace-pre-line font-medium">
                      "{claim.message}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 justify-end">
                    <BaseButton
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate('/chat', {
                          state: {
                            sellerId: claim.requesterId,
                            sellerName: claim.requesterName,
                            listingId: listing.id,
                            listingTitle: listing.title,
                            initialMessage: `Chào bạn ${claim.requesterName}, mình là chủ bài đăng tặng "${listing.title}". Mình đã nhận được đơn xin nhận đồ của bạn!`,
                          },
                        })
                      }
                      className="text-xs font-bold border-blue-300 text-blue-600 hover:bg-blue-50 gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Nhắn tin với {claim.requesterName.split(' ').pop()}</span>
                    </BaseButton>

                    {!isGiveawayClosed && (
                      <BaseButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcceptGiveawayClaim(claim.id, claim.requesterName, claim.requesterStudentCode)}
                        className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold gap-1.5 shadow-sm"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Chọn tặng bạn này (+10 Karma)</span>
                      </BaseButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Mô tả chi tiết từ người đăng
        </h2>
        <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
          {listing.description}
        </div>
      </div>

      {/* Shopee-style Reviews & Ratings Section */}
      <ShopeeReviewSection
        listingId={listing.id}
        listingTitle={listing.title}
        sellerId={listing.userId}
        sellerName={listing.authorName || 'Người bán'}
      />

      {/* Recommendations Section */}
      {relatedListings.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Món đồ tương tự bạn có thể cần
              </h2>
              <p className="text-xs text-slate-500">
                Các tin đăng cùng danh mục hoặc hình thức giao dịch từ sinh viên khác
              </p>
            </div>
            <Link to="/" className="text-xs font-semibold text-blue-600 hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {relatedListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        listingId={listing.id}
        listingTitle={listing.title}
        targetUserId={listing.userId}
        targetUserName={listing.authorName}
        onReportSuccess={() => {
          alert('Báo cáo đã được gửi tới Ban quản trị kiểm duyệt!');
        }}
      />

      <SwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        targetListing={listing}
        onSuccess={() => {
          alert('Gửi đề xuất đổi đồ thành công! Bạn có thể theo dõi trong mục Chat.');
        }}
      />

      {/* Added to cart toast */}
      {addedToCartToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Đã thêm sản phẩm vào Giỏ hàng của bạn!</span>
          <Link to="/cart" className="ml-2 underline text-white font-bold hover:text-emerald-100">
            Xem giỏ hàng →
          </Link>
        </div>
      )}

      {/* Modal Thông báo Gửi yêu cầu thuê thành công */}
      {rentalSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-3xl mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-purple-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Gửi yêu cầu thuê thành công!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Yêu cầu thuê thiết bị <strong>"{listing.title}"</strong> đã được chuyển tới người cho thuê (<strong>{listing.authorName}</strong>) để xem xét sắp xếp lịch.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Thời gian thuê:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatDate(rentalStartDate)} → {formatDate(rentalEndDate)} ({rentalDays} ngày)
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tiền thuê:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300 font-mono">
                  {formatCurrency(listing.price * rentalDays)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tiền cọc bảo đảm:</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                  {formatCurrency(listing.depositAmount || 0)}
                </span>
              </div>
              <div className="pt-2 border-t border-purple-200/60 dark:border-purple-900/40 text-[11px] text-purple-800 dark:text-purple-300 flex items-start gap-1.5">
                <span>💬</span>
                <span>
                  Bước tiếp theo: Người cho thuê sẽ xác nhận duyệt lịch thuê. Bạn hãy nhắn tin trước để thống nhất điểm hẹn và giờ hẹn tại khuôn viên trường nhé!
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <BaseButton
                onClick={() => {
                  setRentalSuccessModal(false);
                  navigate('/chat', {
                    state: {
                      sellerId: listing.userId,
                      sellerName: listing.authorName,
                      listingId: listing.id,
                      listingTitle: listing.title,
                      initialMessage: `Chào bạn, mình vừa gửi yêu cầu thuê "${listing.title}" từ ngày ${formatDate(rentalStartDate)} đến ngày ${formatDate(rentalEndDate)} (${rentalDays} ngày). Bạn xem duyệt giúp mình và hẹn giờ gặp nhé!`,
                    },
                  });
                }}
                variant="primary"
                className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Nhắn tin với chủ đồ</span>
              </BaseButton>

              <BaseButton
                onClick={() => {
                  setRentalSuccessModal(false);
                  navigate(createdRentalId ? `/rentals/${createdRentalId}` : '/rentals');
                }}
                variant="outline"
                className="w-full text-xs border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Xem hợp đồng thuê</span>
              </BaseButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đăng ký nhận đồ tặng 0đ */}
      {isGiveawayModalOpen && listing && (
        <GiveawayClaimModal
          isOpen={isGiveawayModalOpen}
          onClose={() => setIsGiveawayModalOpen(false)}
          listing={listing}
          onSuccess={() => {
            refreshGiveawayClaims();
            setGiveawayToast('🎉 Đã gửi đơn đăng ký nhận đồ thành công! Chủ đồ sẽ xem lý do và phản hồi sớm.');
            setTimeout(() => setGiveawayToast(null), 4000);
          }}
        />
      )}

      {/* Modal Cảnh báo khi người bán tự click mua/thuê sản phẩm của chính mình */}
      {isOwnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-3xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bài đăng của bạn</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                Bạn là người đăng bài viết này. Quy chế Campus Marketplace không cho phép tự đặt mua, thuê hoặc trao đổi với sản phẩm của chính mình.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <BaseButton
                onClick={() => setIsOwnerModalOpen(false)}
                variant="outline"
                className="w-full text-xs"
              >
                Đã hiểu
              </BaseButton>
              <BaseButton
                onClick={() => {
                  setIsOwnerModalOpen(false);
                  navigate('/profile?tab=listings');
                }}
                variant="primary"
                className="w-full text-xs"
              >
                Quản lý bài đăng của tôi
              </BaseButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
