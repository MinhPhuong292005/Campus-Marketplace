import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  MessageCircle,
  Repeat,
  Clock,
  Gift,
  ShoppingBag,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calendar,
  Building2,
  Eye,
  Heart,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { listingService } from '../../services/listingService';
import { Listing } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { TRANSACTION_TYPE_LABELS, CONDITION_LABELS } from '../../constants';
import { KarmaBadge } from '../../components/features/KarmaBadge';
import { ReportModal } from '../../components/features/ReportModal';
import { SwapModal } from '../../components/features/SwapModal';
import { SafeMeetingPointsModal } from '../../components/features/SafeMeetingPointsModal';
import { ListingCard } from '../../components/features/ListingCard';
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
  const [giveawayClaimed, setGiveawayClaimed] = useState(false);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isSafePointsModalOpen, setIsSafePointsModalOpen] = useState(false);

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

          {/* Safe Trading & Decree 13 Compliance Box */}
          <div className="p-5 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center gap-2.5 text-blue-800 dark:text-blue-300 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Giao dịch an toàn & Tuân thủ Nghị định 13/2023/NĐ-CP</span>
            </div>
            <p className="text-xs text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
              Nhằm bảo vệ dữ liệu cá nhân của sinh viên, hệ thống chủ động ẩn số điện thoại và địa chỉ phòng riêng.
              Vui lòng trao đổi qua tin nhắn nội bộ và gặp mặt trực tiếp tại <b>Điểm Hẹn An Toàn</b> có camera giám sát trong khuôn viên trường.
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                onClick={() => setIsSafePointsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-50 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Xem Điểm Hẹn An Toàn trong trường</span>
              </button>
            </div>
          </div>
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
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                  {formatCurrency(listing.price)} / thời gian thuê
                </div>
                {listing.rentalTerms && (
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    📋 Quy ước thuê: {listing.rentalTerms}
                  </p>
                )}
                <p className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-2 rounded-xl mt-2">
                  🔒 Cọc bắt buộc giữ an toàn theo Hợp đồng thuê US-10. Hoàn trả cọc 100% khi bàn giao lại đồ nguyên vẹn.
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
          <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
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
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {listing.authorName || 'Sinh viên Campus'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    Đã xác minh
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {listing.universityName || 'Trường Đại học Phenikaa'}
                </p>
              </div>
            </div>

            {listing.authorKarma !== undefined && (
              <div className="shrink-0 text-right">
                <KarmaBadge score={listing.authorKarma} showText={true} />
              </div>
            )}
          </div>

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
                className="w-full py-3 rounded-2xl text-xs font-bold border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Xem & Ký Hợp đồng Thuê đồ (US-10)</span>
              </BaseButton>
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
              <BaseButton
                onClick={() => {
                  if (user?.status === 'SUSPENDED') {
                    alert('⚠️ Tài khoản của bạn đang bị tạm khóa 1 tuần do vi phạm. Không thể nhận đồ tặng.');
                    return;
                  }
                  if (listing.authorStatus === 'SUSPENDED') {
                    alert('⚠️ Người đăng bài này đang bị tạm khóa tài khoản.');
                    return;
                  }
                  setGiveawayClaimed(true);
                  alert('🎉 Bạn đã gửi thông điệp nhận đồ tặng thành công! Chủ sở hữu sẽ liên hệ trao đổi qua chat.');
                }}
                variant="secondary"
                disabled={giveawayClaimed || user?.status === 'SUSPENDED' || listing.authorStatus === 'SUSPENDED'}
                className="w-full py-3 rounded-2xl text-xs font-bold border border-pink-300 dark:border-pink-800 text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4 text-pink-600" />
                <span>{giveawayClaimed ? 'Đã gửi yêu cầu nhận đồ' : 'Đăng ký nhận món đồ tặng này'}</span>
              </BaseButton>
            )}

            {listing.transactionType === 'SELL' && (
              <BaseButton
                onClick={() => setIsSafePointsModalOpen(true)}
                variant="secondary"
                className="w-full py-3 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Chọn Điểm Hẹn An Toàn để nhận hàng</span>
              </BaseButton>
            )}
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span>Mô tả chi tiết từ người đăng</span>
        </h2>
        <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
          {listing.description}
        </div>
      </div>

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

      <SafeMeetingPointsModal
        isOpen={isSafePointsModalOpen}
        onClose={() => setIsSafePointsModalOpen(false)}
        onSelectPoint={(point) => {
          alert(`Đã chọn điểm hẹn an toàn: ${point.name} (${point.locationDescription}). Bạn có thể đề xuất điểm này khi nhắn tin với người bán.`);
        }}
      />
    </div>
  );
};
