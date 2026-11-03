import React, { useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  Pencil,
  AlertCircle,
  Gift,
  Clock,
  ArrowLeftRight,
  Image as ImageIcon,
} from 'lucide-react';
import { BaseButton } from '../base/BaseButton';
import { BaseInput } from '../base/BaseInput';
import { BaseModal } from '../base/BaseModal';
import { listingService } from '../../services/listingService';
import { keywordViolationService } from '../../services/keywordViolationService';
import { adminNotificationService } from '../../services/adminNotificationService';
import { PHENIKAA_SAFE_MEETING_POINTS } from '../../constants/phenikaaData';
import { Category, Listing } from '../../types';

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing | null;
  onSuccess?: (updatedListing: Listing) => void;
}

export const EditListingModal: React.FC<EditListingModalProps> = ({
  isOpen,
  onClose,
  listing,
  onSuccess,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [conditionStatus, setConditionStatus] = useState<string>('GOOD_90');
  const [price, setPrice] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [rentalTerms, setRentalTerms] = useState<string>('');
  const [swapTarget, setSwapTarget] = useState<string>('');
  const [safeMeetingPoint, setSafeMeetingPoint] = useState<string>(
    PHENIKAA_SAFE_MEETING_POINTS[0]?.name || 'Sảnh Tòa A10 (Trung tâm Thư viện Phenikaa)'
  );
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await listingService.getCategories();
        if (res.success && res.data && res.data.length > 0) {
          setCategories(res.data);
        } else {
          setCategories([
            { id: 1, name: 'Giáo trình & Sách vở', slug: 'giao-trinh-sach-vo' },
            { id: 2, name: 'Thiết bị công nghệ', slug: 'thiet-bi-cong-nghe' },
            { id: 3, name: 'Đồ dùng phòng trọ', slug: 'do-dung-phong-tro' },
            { id: 4, name: 'Dụng cụ học tập & Thể thao', slug: 'dung-cu-the-thao' },
            { id: 5, name: 'Thời trang & Phụ kiện', slug: 'thoi-trang-phu-kien' },
          ]);
        }
      } catch {
        setCategories([
          { id: 1, name: 'Giáo trình & Sách vở', slug: 'giao-trinh-sach-vo' },
          { id: 2, name: 'Thiết bị công nghệ', slug: 'thiet-bi-cong-nghe' },
          { id: 3, name: 'Đồ dùng phòng trọ', slug: 'do-dung-phong-tro' },
          { id: 4, name: 'Dụng cụ học tập & Thể thao', slug: 'dung-cu-the-thao' },
          { id: 5, name: 'Thời trang & Phụ kiện', slug: 'thoi-trang-phu-kien' },
        ]);
      }
    };
    fetchCats();
  }, []);

  // Pre-populate fields when listing changes
  useEffect(() => {
    if (listing && isOpen) {
      setTitle(listing.title || '');
      setDescription(listing.description || '');
      setCategoryId(listing.categoryId || 1);
      setConditionStatus(listing.conditionStatus || 'GOOD_90');
      setPrice(listing.price || 0);
      setDepositAmount(listing.depositAmount || 0);
      setRentalTerms(listing.rentalTerms || '');
      setSwapTarget(listing.swapTarget || '');
      setSafeMeetingPoint(
        listing.safeMeetingPoint ||
          PHENIKAA_SAFE_MEETING_POINTS[0]?.name ||
          'Sảnh Tòa A10 (Trung tâm Thư viện Phenikaa)'
      );

      // Normalize images
      let imgs: string[] = [];
      const anyListing = listing as any;
      if (Array.isArray(anyListing.imageUrls) && anyListing.imageUrls.length > 0) {
        imgs = [...anyListing.imageUrls];
      } else if (Array.isArray(listing.images) && listing.images.length > 0) {
        imgs = listing.images.map((img: any) =>
          typeof img === 'string' ? img : img.mediaUrl
        );
      }
      setImageUrls(imgs);
      setErrorMsg(null);
    }
  }, [listing, isOpen]);

  // Handle local file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      setErrorMsg(null);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (imageUrls.length >= 6) {
          setErrorMsg('Chỉ được tải lên tối đa 6 hình ảnh sản phẩm.');
          break;
        }

        if (file.size > 5 * 1024 * 1024) {
          setErrorMsg(`Tệp "${file.name}" vượt quá dung lượng cho phép 5MB.`);
          continue;
        }

        try {
          const res = await listingService.uploadMedia(file);
          if (res.success && res.data?.url) {
            setImageUrls((prev) => [...prev, res.data.url]);
          } else {
            const blobUrl = URL.createObjectURL(file);
            setImageUrls((prev) => [...prev, blobUrl]);
          }
        } catch {
          const blobUrl = URL.createObjectURL(file);
          setImageUrls((prev) => [...prev, blobUrl]);
        }
      }
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    if (imageUrls.length >= 6) {
      setErrorMsg('Chỉ được tải lên tối đa 6 hình ảnh sản phẩm.');
      return;
    }
    setImageUrls((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
    setErrorMsg(null);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    setErrorMsg(null);

    // Validation
    const cleanTitle = title.trim();
    if (cleanTitle.length < 5) {
      setErrorMsg('Tiêu đề bài đăng phải có ít nhất 5 ký tự.');
      return;
    }
    if (cleanTitle.length > 150) {
      setErrorMsg('Tiêu đề bài đăng không được vượt quá 150 ký tự.');
      return;
    }

    const cleanDesc = description.trim();
    if (cleanDesc.length < 10) {
      setErrorMsg('Mô tả chi tiết bài đăng phải có ít nhất 10 ký tự.');
      return;
    }

    if (imageUrls.length === 0) {
      setErrorMsg('Vui lòng chọn hoặc tải lên ít nhất 1 hình ảnh sản phẩm.');
      return;
    }

    // Price validation
    if (listing.transactionType === 'SELL' && price <= 0) {
      setErrorMsg('Giá bán thanh lý phải lớn hơn 0 VNĐ.');
      return;
    }
    if (listing.transactionType === 'SWAP' && price <= 0) {
      setErrorMsg('Vui lòng nhập giá trị ước tính của món đồ trao đổi (lớn hơn 0 VNĐ).');
      return;
    }
    if (listing.transactionType === 'RENT' && price <= 0) {
      setErrorMsg('Giá thuê theo ngày phải lớn hơn 0 VNĐ.');
      return;
    }

    // Keyword violation check
    const forbiddenKw = keywordViolationService.checkTextHasForbiddenKeyword(
      `${cleanTitle} ${cleanDesc} ${swapTarget}`
    );
    if (forbiddenKw) {
      setErrorMsg(
        `Nội dung bài đăng chứa từ khóa không phù hợp "${forbiddenKw}". Vui lòng điều chỉnh lại trước khi cập nhật.`
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        title: cleanTitle,
        description: cleanDesc,
        categoryId,
        price: listing.transactionType === 'GIVEAWAY' ? 0 : price,
        conditionStatus: conditionStatus as any,
        rentalTerms: listing.transactionType === 'RENT' ? rentalTerms.trim() : undefined,
        depositAmount: listing.transactionType === 'RENT' ? depositAmount : undefined,
        swapTarget: listing.transactionType === 'SWAP' ? swapTarget.trim() : undefined,
        safeMeetingPoint,
        imageUrls,
      };

      const res = await listingService.updateListing(listing.id, payload);

      if (res.success && res.data) {
        // Send moderation notice to Admin Notification Bell
        adminNotificationService.addNotification({
          type: 'LISTING_PENDING',
          title: `Bài đăng chỉnh sửa cần duyệt lại: ${res.data.title}`,
          studentId: res.data.userId,
          studentName: res.data.authorName || 'Sinh viên',
          studentEmail: '',
          reportedListingId: res.data.id,
          reportedListingTitle: res.data.title,
          reportedListingPrice: res.data.price,
          violationReason: 'Bài đăng được người dùng chỉnh sửa - Chờ BQT duyệt lại',
          message: `Bài viết "${res.data.title}" vừa được cập nhật thông tin. Cần Quản trị viên duyệt lại để hiển thị công khai.`,
          imageUrl: res.data.images?.[0]?.mediaUrl || imageUrls[0] || '',
        });

        if (onSuccess) {
          onSuccess(res.data);
        }
        onClose();
      } else {
        setErrorMsg(res.message || 'Không thể cập nhật bài đăng. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          'Đã xảy ra lỗi khi cập nhật bài đăng. Vui lòng kiểm tra lại đường truyền.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !listing) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title=""
      maxWidth="2xl"
    >
      <div className="space-y-5 -mt-2">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Chỉnh sửa bài đăng</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                #{listing.id}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cập nhật thông tin chi tiết món đồ của bạn trên Chợ Sinh viên Phenikaa
            </p>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Images Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Hình ảnh sản phẩm ({imageUrls.length}/6 ảnh) *</span>
              </label>
              <span className="text-[11px] text-slate-400">Ảnh đầu tiên là ảnh bìa</span>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-2.5">
              {imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group"
                >
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-rose-600 transition-colors"
                    title="Xóa ảnh này"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] bg-blue-600 text-white font-bold">
                      Ảnh bìa
                    </span>
                  )}
                </div>
              ))}

              {/* Upload button */}
              {imageUrls.length < 6 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-900/50 transition-all p-1 text-center group">
                  <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 mb-0.5 transition-all" />
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {isUploading ? 'Đang tải...' : 'Tải thêm ảnh'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>

            {/* Quick URL input */}
            {imageUrls.length < 6 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Hoặc dán URL hình ảnh (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <BaseButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddImageUrl}
                  className="text-xs shrink-0"
                >
                  Thêm URL
                </BaseButton>
              </div>
            )}
          </div>

          {/* Title */}
          <BaseInput
            label="Tiêu đề bài đăng *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="vd: Giáo trình Giải tích 1 kèm tài liệu ôn thi"
            helperText="Tối thiểu 5 ký tự, tối đa 150 ký tự"
          />

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Danh mục hàng hóa *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tình trạng sản phẩm *
              </label>
              <select
                value={conditionStatus}
                onChange={(e) => setConditionStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="NEW_100">Mới 100% (Chưa qua sử dụng)</option>
                <option value="LIKE_NEW_99">Như mới (99%)</option>
                <option value="GOOD_90">Còn tốt (90%)</option>
                <option value="FAIR_70">Khá (70% - Có vết xước nhẹ)</option>
              </select>
            </div>
          </div>

          {/* Transaction Type Details */}
          {listing.transactionType === 'SELL' && (
            <div>
              <BaseInput
                type="number"
                label="Giá thanh lý (VNĐ) *"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="vd: 45000"
                helperText="Bắt buộc lớn hơn 0đ"
              />
            </div>
          )}

          {listing.transactionType === 'GIVEAWAY' && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Món đồ tặng miễn phí (Giá 0đ)</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Trao gửi miễn phí cho bạn học Phenikaa cần dùng.
                  </p>
                </div>
              </div>
              <span className="font-mono font-extrabold text-sm text-emerald-600">0 VNĐ</span>
            </div>
          )}

          {listing.transactionType === 'RENT' && (
            <div className="space-y-3 p-3.5 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Quy định cho thuê ngắn hạn & Đặt cọc</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <BaseInput
                  type="number"
                  label="Giá thuê theo ngày (VNĐ/ngày) *"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="vd: 50000"
                />
                <BaseInput
                  type="number"
                  label="Tiền cọc bảo đảm (VNĐ)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  placeholder="vd: 500000"
                  helperText="Hoàn trả 100% khi người thuê trả đồ nguyên vẹn"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Điều khoản thuê & Quy định phạt
                </label>
                <textarea
                  rows={2}
                  value={rentalTerms}
                  onChange={(e) => setRentalTerms(e.target.value)}
                  placeholder="vd: Hai bên kiểm tra và chụp ảnh hiện trạng khi nhận đồ; giữ gìn cẩn thận..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
          )}

          {listing.transactionType === 'SWAP' && (
            <div className="space-y-3 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                <span>Thông tin Trao đổi đồ</span>
              </div>

              <BaseInput
                type="number"
                label="Giá trị ước tính của món đồ (VNĐ) *"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="vd: 50000"
                helperText="Bắt buộc nhập giá trị lớn hơn 0đ để làm căn cứ quy đổi"
              />

              <BaseInput
                label="Món đồ bạn muốn đổi lấy (Không bắt buộc)"
                value={swapTarget}
                onChange={(e) => setSwapTarget(e.target.value)}
                placeholder="vd: Đổi lấy máy tính Casio FX 580 hoặc giáo trình tương đương..."
                helperText="Có thể để trống nếu cởi mở với mọi đề xuất giao lưu"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mô tả chi tiết món đồ *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả kỹ tình trạng sách/thiết bị, phụ kiện kèm theo, lý do thanh lý..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Safe Meeting Point */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Điểm hẹn giao dịch tại Phenikaa *
            </label>
            <select
              value={safeMeetingPoint}
              onChange={(e) => setSafeMeetingPoint(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {PHENIKAA_SAFE_MEETING_POINTS.map((pt) => (
                <option key={pt.id} value={pt.name}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <BaseButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Lưu thay đổi
            </BaseButton>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};
