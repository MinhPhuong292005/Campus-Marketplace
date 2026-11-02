import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Hash,
  School,
  GraduationCap,
  Calendar,
  ShieldCheck,
  MessageCircle,
  Package,
  ShoppingBag,
  Clock,
  Gift,
  Repeat,
  ArrowLeft,
  CheckCircle2,
  Star,
  MessageSquare,
} from 'lucide-react';
import { profileService } from '../../services/profileService';
import { listingService } from '../../services/listingService';
import { reviewService, ReviewRes } from '../../services/reviewService';
import { PublicProfile, Listing } from '../../types';
import { KarmaBadge } from '../../components/features/KarmaBadge';
import { ListingCard } from '../../components/features/ListingCard';
import { BaseButton } from '../../components/base/BaseButton';
import { formatDate } from '../../utils/formatters';

type TabType = 'ALL' | 'SELL' | 'RENT' | 'GIVEAWAY' | 'SWAP';

export const SellerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<ReviewRes[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!id) return;

    const fetchSellerData = async () => {
      setIsLoading(true);
      try {
        const [profileRes, listingsRes, reviewsRes] = await Promise.all([
          profileService.getPublicProfile(Number(id)),
          listingService.getUserPublicListings(Number(id)),
          reviewService.getReviewsForUser(Number(id)),
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }
        if (listingsRes.success && listingsRes.data?.content) {
          setListings(listingsRes.data.content);
        }
        if (reviewsRes.success && reviewsRes.data) {
          setReviews(reviewsRes.data);
        }
      } catch (err) {
        console.error('Failed to load seller profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center space-y-3">
        <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Đang tải hồ sơ sinh viên #{id}...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Không tìm thấy người bán</h3>
        <p className="text-xs text-slate-500">Người dùng này không tồn tại hoặc đã bị khóa tài khoản.</p>
        <BaseButton onClick={() => navigate(-1)} variant="primary" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Quay lại
        </BaseButton>
      </div>
    );
  }

  const filteredListings = listings.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.transactionType === activeTab;
  });

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalReviews
      : 0;

  const ratingDisplayText =
    totalReviews === 0
      ? '0 sao'
      : `${avgRating % 1 === 0 ? avgRating.toFixed(0) : avgRating.toFixed(1)}/5 sao`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 text-left">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>
        <div className="text-xs text-slate-400">
          Hồ sơ thành viên CampusMarket
        </div>
      </div>

      {/* Main Seller Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Avatar and Primary Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={
                  profile.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.fullName || 'Student'}`
                }
                alt={profile.fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover bg-slate-100 border-2 border-white dark:border-slate-800 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white" title="Đang hoạt động">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {profile.fullName}
                </h1>
                {profile.studentCardVerified && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Sinh viên đã xác minh
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-blue-600" />
                <span>{profile.universityName || 'Trường Đại học Phenikaa'}</span>
                <span>•</span>
                <span>Tham gia từ {formatDate(profile.createdAt)}</span>
              </p>

              {profile.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 max-w-xl">
                  "{profile.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Karma & Chat Action */}
          <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="text-left sm:text-right space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Điểm tín nhiệm đánh giá
              </span>
              <KarmaBadge score={profile.karmaScore ?? 20} showText={true} />
            </div>

            <BaseButton
              onClick={() => {
                navigate('/chat', {
                  state: {
                    sellerId: profile.id,
                    sellerName: profile.fullName,
                  },
                });
              }}
              variant="primary"
              className="py-2.5 px-5 rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Nhắn tin với {profile.fullName?.split(' ').pop()}</span>
            </BaseButton>
          </div>
        </div>

        {/* Detailed Info Grid (Điểm đánh giá, MSV, SĐT, Ngành học, Niên khóa) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Điểm đánh giá (Dựa chính xác từ người mua) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-1">
            <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Điểm đánh giá
            </span>
            <p className="font-extrabold text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1.5">
              <span>{ratingDisplayText}</span>
              {totalReviews > 0 && (
                <span className="text-[10px] text-slate-400 font-normal">({totalReviews} lượt)</span>
              )}
            </p>
          </div>

          {/* MSV */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-blue-500" /> Mã sinh viên
            </span>
            <p className="font-bold text-slate-900 dark:text-white font-mono text-xs">
              {profile.studentCode || 'Đã xác thực email'}
            </p>
          </div>

          {/* SĐT */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-500" /> Số điện thoại
            </span>
            <p className="font-bold text-slate-900 dark:text-white font-mono text-xs">
              {profile.phone || '098****** (Bảo mật)'}
            </p>
          </div>

          {/* Khoa / Ngành */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-purple-500" /> Ngành học
            </span>
            <p className="font-bold text-slate-900 dark:text-white truncate" title={profile.major}>
              {profile.major || 'Công nghệ thông tin'}
            </p>
          </div>

          {/* Niên khóa */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" /> Niên khóa
            </span>
            <p className="font-bold text-slate-900 dark:text-white">
              {profile.academicYear || 'K16 (2022 - 2026)'}
            </p>
          </div>
        </div>
      </div>

      {/* Seller Listings / Kho đồ của người bán */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Kho Đồ Đang Đăng Bán & Chia Sẻ ({listings.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Các món đồ giáo trình, thiết bị học tập do {profile.fullName} đăng tải trong trường
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl self-start overflow-x-auto max-w-full">
            {[
              { id: 'ALL', label: 'Tất cả', icon: Package },
              { id: 'SELL', label: 'Cần bán', icon: ShoppingBag },
              { id: 'RENT', label: 'Cho thuê', icon: Clock },
              { id: 'GIVEAWAY', label: 'Tặng đồ', icon: Gift },
              { id: 'SWAP', label: 'Đổi đồ', icon: Repeat },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Chưa có món đồ nào trong danh mục này
            </h4>
            <p className="text-xs text-slate-400">
              Người bán hiện tại chưa đăng sản phẩm nào theo danh mục đã chọn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </div>

      {/* Buyer Reviews Section */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              <span>Đánh Giá Từ Người Mua ({reviews.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Nhận xét thực tế từ các sinh viên đã hoàn tất giao dịch mua hoặc thuê đồ với {profile.fullName}
            </p>
          </div>
          {totalReviews > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{ratingDisplayText}</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Chưa có lượt đánh giá nào
            </h4>
            <p className="text-[11px] text-slate-400">
              Người bán này hiện tại chưa nhận được đánh giá từ giao dịch hoàn tất nào (0 sao).
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={rev.reviewerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rev.reviewerName || 'Student'}`}
                      alt={rev.reviewerName}
                      className="w-9 h-9 rounded-full object-cover bg-slate-100 border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {rev.reviewerName}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= rev.rating
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-slate-200 dark:text-slate-700'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-slate-400 ml-1">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {rev.listingTitle && (
                    <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                      {rev.listingTitle}
                    </span>
                  )}
                </div>

                {rev.comment && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 pl-11">
                    {rev.comment}
                  </p>
                )}

                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-11 pt-1">
                    {rev.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
