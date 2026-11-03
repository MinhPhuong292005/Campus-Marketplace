import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Lock,
  Send,
  AlertCircle,
  Award,
} from 'lucide-react';
import { BaseButton } from '../base/BaseButton';
import { reviewService, ReviewRes } from '../../services/reviewService';
import { useAuthStore } from '../../store/useAuthStore';
import { orderService } from '../../services/orderService';

interface ShopeeReviewSectionProps {
  listingId: number;
  listingTitle?: string;
  sellerId: number;
  sellerName: string;
}

export const ShopeeReviewSection: React.FC<ShopeeReviewSectionProps> = ({
  listingId,
  listingTitle = 'Sản phẩm',
  sellerId,
  sellerName,
}) => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<ReviewRes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | '5' | '4' | '3' | 'WITH_COMMENT'>('ALL');

  // Eligibility
  const [canReview, setCanReview] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState('');

  // New review form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helpful likes counter per review
  const [likedReviews, setLikedReviews] = useState<Record<number, boolean>>({});

  const presetTags = [
    'Đúng như mô tả',
    'Giao hàng đúng hẹn',
    'Chủ đồ rất nhiệt tình',
    'Chất lượng tốt',
    'Giá cả hợp lý cho SV',
    'Rất đáng tiền',
  ];

  const fetchReviewsAndEligibility = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch reviews
      const res = await reviewService.getReviewsForListing(listingId);
      if (res.success && res.data) {
        setReviews(res.data);
      }

      // 2. Check eligibility if logged in
      if (user) {
        if (user.id === sellerId) {
          setIsOwner(true);
          setCanReview(false);
          setEligibilityReason('Bạn là chủ sở hữu bài viết nên không thể tự đánh giá chính mình.');
        } else {
          const localOrder = orderService.getOrderByListingId(listingId, user.id);
          const hasLocalOrder = Boolean(localOrder && (localOrder.status === 'CONFIRMED' || localOrder.status === 'COMPLETED' || localOrder.status === 'DELIVERED'));

          // Check if user has completed rental contract
          let hasCompletedRental = false;
          try {
            const rawRentals = localStorage.getItem('campus_rentals_fresh_v2');
            if (rawRentals) {
              const rentals = JSON.parse(rawRentals);
              hasCompletedRental = rentals.some(
                (r: any) => r.listingId === listingId && (r.renterId === user.id || !r.renterId) && r.status === 'RETURNED'
              );
            }
          } catch {}

          const elig = await reviewService.checkEligibility(listingId);
          if (elig.success && elig.data) {
            setCanReview(elig.data.canReview || hasLocalOrder || hasCompletedRental);
            setAlreadyReviewed(elig.data.alreadyReviewed);
            setEligibilityReason(elig.data.reason);
          } else if (hasLocalOrder || hasCompletedRental) {
            setCanReview(true);
            setEligibilityReason('Đủ điều kiện đánh giá (Người dùng đã hoàn tất mua hoặc thuê sản phẩm này)');
          }
        }
      } else {
        setCanReview(false);
        setEligibilityReason('Vui lòng đăng nhập để kiểm tra điều kiện đánh giá.');
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsAndEligibility();
  }, [listingId, user?.id]);

  // Calculations for Shopee rating summary
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalReviews).toFixed(1)
      : '0.0';

  const count5 = reviews.filter((r) => r.rating === 5).length;
  const count4 = reviews.filter((r) => r.rating === 4).length;
  const count3 = reviews.filter((r) => r.rating === 3).length;
  const countWithComment = reviews.filter((r) => r.comment && r.comment.trim().length > 0).length;

  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === '5') return r.rating === 5;
    if (selectedFilter === '4') return r.rating === 4;
    if (selectedFilter === '3') return r.rating === 3;
    if (selectedFilter === 'WITH_COMMENT') return r.comment && r.comment.trim().length > 0;
    return true;
  });

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleToggleLike = (reviewId: number) => {
    setLikedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Vui lòng nhập lời nhận xét hoặc cảm nhận của bạn về sản phẩm.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await reviewService.createReview({
        targetUserId: sellerId,
        listingId,
        rating,
        comment: comment.trim(),
        tags: selectedTags,
      });

      if (res.success && res.data) {
        setSuccessMsg('Đăng đánh giá thành công! Bạn nhận được +2 điểm Campus Karma.');
        setAlreadyReviewed(true);
        setCanReview(false);
        setIsFormOpen(false);
        

        // Prepend new review to list
        setReviews([res.data, ...reviews]);
        setComment('');
        setSelectedTags([]);
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Không thể gửi đánh giá lúc này. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabel =
    (hoverRating || rating) === 5
      ? 'Cực kỳ hài lòng (5 sao)'
      : (hoverRating || rating) === 4
      ? 'Hài lòng (4 sao)'
      : (hoverRating || rating) === 3
      ? 'Bình thường (3 sao)'
      : (hoverRating || rating) === 2
      ? 'Không hài lòng (2 sao)'
      : 'Rất tệ (1 sao)';

  const userOrder = user ? orderService.getOrderByListingId(listingId, user.id) : null;
  const isVerifiedBuyer = Boolean(canReview || (userOrder && (userOrder.status === 'CONFIRMED' || userOrder.status === 'COMPLETED' || userOrder.status === 'DELIVERED')));
  const activeCanReview = isVerifiedBuyer && !alreadyReviewed && !isOwner;

  return (
    <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
      {/* Header Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              ĐÁNH GIÁ & BÌNH LUẬN SẢN PHẨM
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {totalReviews} đánh giá
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nhận xét thực tế từ sinh viên cho <strong>"{listingTitle}"</strong> • Đánh giá minh bạch từ người mua / thuê đồ
            </p>
          </div>
        </div>
      </div>

      {/* Shopee-style Score Overview Box */}
      <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex flex-col md:flex-row items-center gap-6">
        {/* Score Column */}
        <div className="text-center md:text-left shrink-0 md:pr-6 md:border-r border-amber-200 dark:border-amber-900/50">
          <div className="flex items-baseline justify-center md:justify-start gap-1">
            <span className="text-4xl sm:text-5xl font-black text-amber-600 dark:text-amber-400">
              {averageRating}
            </span>
            <span className="text-base font-bold text-amber-700/80 dark:text-amber-300">/ 5</span>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  totalReviews > 0 && star <= Math.round(Number(averageRating))
                    ? 'fill-amber-500 text-amber-500'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dựa trên {totalReviews} lượt đánh giá sinh viên
          </p>
        </div>

        {/* Filter Chips (Shopee Style) */}
        <div className="flex-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === 'ALL'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            Tất cả ({totalReviews})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('5')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              selectedFilter === '5'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            <span>5 Sao</span>
            <span className="text-[10px] opacity-80">({count5})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('4')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              selectedFilter === '4'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            <span>4 Sao</span>
            <span className="text-[10px] opacity-80">({count4})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('3')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              selectedFilter === '3'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            <span>3 Sao</span>
            <span className="text-[10px] opacity-80">({count3})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('WITH_COMMENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              selectedFilter === 'WITH_COMMENT'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Có Bình luận ({countWithComment})</span>
          </button>
        </div>
      </div>

      {/* Verified Buyer Write Review Section */}
      <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        {alreadyReviewed ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Bạn đã gửi đánh giá cho sản phẩm này rồi!</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Cảm ơn bạn đã chia sẻ trải nghiệm để giúp các bạn sinh viên Phenikaa khác đưa ra quyết định tốt hơn.
              </p>
            </div>
          </div>
        ) : isOwner ? (
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Bạn là chủ sở hữu bài đăng này.</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Hệ thống chỉ cho phép người mua sản phẩm đánh giá và bình luận để đảm bảo tính khách quan.
              </p>
            </div>
          </div>
        ) : !activeCanReview ? (
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Chỉ người đã từng mua sản phẩm mới có thể đánh giá & bình luận
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {eligibilityReason || 'Để đảm bảo tính trung thực và khách quan, bạn cần hoàn tất giao dịch mua hoặc thuê sản phẩm này trước khi gửi đánh giá sao.'}
              </p>
            </div>
          </div>
        ) : !isFormOpen ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Bạn đã hoàn tất giao dịch món đồ này</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                    Người mua đã xác thực
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Hãy chia sẻ trải nghiệm thực tế để giúp cộng đồng sinh viên Phenikaa và nhận ngay +2 điểm Karma.
                </p>
              </div>
            </div>
            <BaseButton
              type="button"
              onClick={() => setIsFormOpen(true)}
              variant="primary"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 shadow-md shadow-amber-600/20 flex items-center gap-1.5"
            >
              <Star className="w-4 h-4 fill-amber-300 text-amber-200" />
              <span>Viết đánh giá sản phẩm</span>
            </BaseButton>
          </div>
        ) : (
          /* Interactive Review Creation Form for Verified Buyer */
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Xác nhận Người Mua Đã Giao Dịch • Viết Đánh Giá
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> +2 Karma cho đánh giá hữu ích
                </span>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium px-2 py-0.5"
                >
                  Đóng lại
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-600 text-xs">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-600 text-xs">
                {successMsg}
              </div>
            )}

            {/* Interactive Star Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Chất lượng sản phẩm & mức độ hài lòng *
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {ratingLabel}
                </span>
              </div>
            </div>

            {/* Quick Tags Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Thẻ cảm nhận nhanh
              </label>
              <div className="flex flex-wrap gap-2">
                {presetTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-xs font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Bình luận chi tiết về món đồ & người bán *
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Hãy chia sẻ trải nghiệm thực tế khi nhận đồ: tình trạng sách/máy, thái độ người bán, độ đúng hẹn tại điểm hẹn campus..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <BaseButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Đăng Đánh Giá & Bình Luận
              </BaseButton>
            </div>
          </form>
        )}
      </div>

      {/* Shopee Review Items List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>Đang tải đánh giá từ sinh viên...</p>
          </div>
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((rev) => {
            const isLiked = !!likedReviews[rev.id];
            return (
              <div
                key={rev.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 transition hover:shadow-sm"
              >
                {/* Reviewer Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        rev.reviewerAvatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${rev.reviewerName}`
                      }
                      alt={rev.reviewerName}
                      className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {rev.reviewerName}
                        </span>
                        {/* Verified Buyer Tag */}
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Đã mua hàng tại Phenikaa
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-slate-400 ml-2">
                          {new Date(rev.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Karma score earned */}
                  {rev.karmaAwarded > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      +{rev.karmaAwarded} Karma
                    </span>
                  )}
                </div>

                {/* Tags if any */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      >
                        ✓ {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Comment Body */}
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {rev.comment}
                </p>

                {/* Footer Reactions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(rev.id)}
                    className={`text-[11px] font-semibold flex items-center gap-1.5 transition ${
                      isLiked
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>Hữu ích ({isLiked ? 1 : 0})</span>
                  </button>

                  <span className="text-[10px] text-slate-400">
                    Phản hồi dành cho người bán: <strong>{sellerName}</strong>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs space-y-1">
            <p className="font-semibold">Chưa có đánh giá nào cho mục lọc này.</p>
            <p className="text-[11px]">Người mua sau khi nhận đồ sẽ xuất hiện đánh giá tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
};
