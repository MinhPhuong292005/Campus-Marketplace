import React, { useState } from 'react';
import { Star, Award, Check } from 'lucide-react';
import { BaseModal } from '../base/BaseModal';
import { BaseButton } from '../base/BaseButton';
import { reviewService } from '../../services/reviewService';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: number;
  targetUserName: string;
  listingId?: number;
  listingTitle?: string;
  isGiveaway?: boolean;
  onSuccess?: (karmaAwarded: number) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  listingId,
  listingTitle,
  isGiveaway = false,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Nhiệt tình', 'Đúng giờ']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedKarma, setSubmittedKarma] = useState<number | null>(null);

  const availableTags = [
    'Nhiệt tình',
    'Đúng giờ',
    'Đồ như mô tả',
    'Giao dịch nhanh gọn',
    'Thân thiện',
    'Giữ gìn đồ cẩn thận',
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const calculatedKarma = (rating === 5 ? 5 : rating === 4 ? 3 : 1) + (isGiveaway ? 10 : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await reviewService.createReview({
        targetUserId,
        listingId,
        rating,
        comment,
        tags: selectedTags,
      });

      const awarded = res.data?.karmaAwarded || calculatedKarma;
      setSubmittedKarma(awarded);

      if (onSuccess) {
        onSuccess(awarded);
      }

      setTimeout(() => {
        setSubmittedKarma(null);
        onClose();
      }, 1800);
    } catch {
      setSubmittedKarma(calculatedKarma);
      setTimeout(() => {
        setSubmittedKarma(null);
        onClose();
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Đánh giá giao dịch & Tích điểm Campus Karma"
      maxWidth="md"
    >
      {submittedKarma !== null ? (
        <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Giao dịch hoàn tất thành công!
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bạn đã tặng <b className="text-blue-600">+{submittedKarma} điểm Karma</b> cho {targetUserName}.
            <br />
            Bạn cũng được cộng <b>+2 điểm Karma</b> đóng góp cộng đồng!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {listingTitle && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400">Sản phẩm giao dịch:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                {listingTitle}
              </p>
            </div>
          )}

          {/* Star Rating */}
          <div className="text-center space-y-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Mức độ hài lòng của bạn với <b>{targetUserName}</b>
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 text-slate-300 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              {rating === 5
                ? 'Tuyệt vời (5 sao) - Rất uy tín'
                : rating === 4
                ? 'Hài lòng (4 sao)'
                : rating === 3
                ? 'Bình thường (3 sao)'
                : 'Chưa hài lòng'}
            </p>
          </div>

          {/* Karma Reward Preview */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-blue-900 dark:text-blue-200">
                  Phần thưởng Campus Karma
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {isGiveaway ? 'Bao gồm +10 điểm thưởng vì cho tặng 0đ' : 'Tích lũy điểm uy tín sinh viên'}
                </p>
              </div>
            </div>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">
              +{calculatedKarma} Karma
            </span>
          </div>

          {/* Quick Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nhãn nhận xét nhanh
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Lời nhắn thêm (tùy chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm giao dịch để giúp các bạn sinh viên khác thêm an tâm..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <BaseButton type="button" variant="outline" size="sm" onClick={onClose}>
              Bỏ qua
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Gửi đánh giá & Tích điểm</span>
            </BaseButton>
          </div>
        </form>
      )}
    </BaseModal>
  );
};
