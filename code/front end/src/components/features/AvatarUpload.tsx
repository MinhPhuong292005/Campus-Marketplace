import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, CheckCircle2, AlertCircle, Loader2, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { listingService } from '../../services/listingService';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange: (url: string) => void;
  fullName?: string;
  email?: string;
  className?: string;
}

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  fullName = 'User',
  email = 'student',
  className = '',
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(
    currentAvatarUrl || '/default-avatar.png'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState(currentAvatarUrl || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fallbackDefault = '/default-avatar.png';

  const validateAndProcessFile = async (file?: File | null) => {
    if (!file) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Kiểm tra định dạng tệp (Strict Image Validation)
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isImageMime = file.type.startsWith('image/');
    const isImageExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext);

    if (!isImageMime && !isImageExt) {
      setErrorMsg(
        `❌ Tệp "${file.name}" không hợp lệ! Ảnh đại diện bắt buộc phải là định dạng hình ảnh (.jpg, .jpeg, .png, .webp, .gif). Hệ thống không chấp nhận video, tệp nén (.zip, .rar) hay tài liệu (.pdf, .pptx, .docx).`
      );
      return;
    }

    // 2. Kiểm tra kích thước (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(
        `❌ Tệp ảnh "${file.name}" vượt quá dung lượng tối đa 5MB (${(file.size / (1024 * 1024)).toFixed(1)}MB). Vui lòng chọn ảnh nhỏ hơn.`
      );
      return;
    }

    // 3. Tải lên máy chủ
    try {
      setIsUploading(true);
      const res = await listingService.uploadMedia(file);
      if (res.success && res.data?.url) {
        setPreviewUrl(res.data.url);
        setCustomUrl(res.data.url);
        onAvatarChange(res.data.url);
        setSuccessMsg('Đã tải ảnh lên thành công!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        // Fallback sang blob preview nếu backend báo lỗi kết nối
        const blobUrl = URL.createObjectURL(file);
        setPreviewUrl(blobUrl);
        setCustomUrl(blobUrl);
        onAvatarChange(blobUrl);
        setSuccessMsg('Đã cập nhật ảnh đại diện xem trước!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setErrorMsg(serverMsg);
      } else {
        const blobUrl = URL.createObjectURL(file);
        setPreviewUrl(blobUrl);
        setCustomUrl(blobUrl);
        onAvatarChange(blobUrl);
        setSuccessMsg('Đã cập nhật ảnh đại diện xem trước!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleCustomUrlApply = () => {
    if (!customUrl.trim()) return;
    setPreviewUrl(customUrl.trim());
    onAvatarChange(customUrl.trim());
    setSuccessMsg('Đã cập nhật liên kết ảnh đại diện!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-blue-600" />
          Ảnh đại diện (Avatar)
        </span>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-normal text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Ẩn nhập URL' : 'Nhập đường dẫn URL'}</span>
        </button>
      </label>

      {/* Main Avatar Dropzone & Preview Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative group cursor-pointer p-4 rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col sm:flex-row items-center gap-4 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01]'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-slate-800/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndProcessFile(e.target.files[0]);
            }
          }}
        />

        {/* Current Avatar Circle / Rounded Box */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 flex items-center justify-center">
            {isUploading ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-blue-600/90 text-white gap-1 animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-[9px] font-bold">Đang tải...</span>
              </div>
            ) : (
              <img
                src={previewUrl || fallbackDefault}
                alt={fullName}
                onError={() => setPreviewUrl(fallbackDefault)}
                className="w-full h-full object-cover transition group-hover:scale-105"
              />
            )}
          </div>

          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-blue-600 text-white shadow-md group-hover:bg-blue-700 transition">
            <Camera className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Instructions & Actions */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Kéo & thả ảnh vào đây hoặc bấm để chọn ảnh</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Chỉ chấp nhận tệp hình ảnh: <b>JPG, PNG, WEBP, GIF</b> (Tối đa 5MB)
          </p>
          <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
              <UploadCloud className="w-3 h-3" />
              Tải ảnh từ máy
            </span>
            {previewUrl !== fallbackDefault && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewUrl(fallbackDefault);
                  setCustomUrl('');
                  onAvatarChange('');
                }}
                className="text-[11px] text-slate-400 hover:text-rose-500 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Khôi phục ảnh mặc định"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* URL Input (Toggled) */}
      {showUrlInput && (
        <div className="flex items-center gap-2 pt-1 animate-in fade-in">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Dán đường dẫn ảnh trực tiếp (https://...)"
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleCustomUrlApply}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition"
          >
            Áp dụng
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
        </div>
      )}
    </div>
  );
};

