import { z } from 'zod';

export const listingSchema = z.object({
  title: z.string().min(5, 'Tiêu đề tối thiểu 5 ký tự').max(150, 'Tiêu đề tối đa 150 ký tự'),
  description: z.string().min(10, 'Mô tả chi tiết tối thiểu 10 ký tự').max(3000),
  categoryId: z.number().min(1, 'Vui lòng chọn danh mục'),
  transactionType: z.enum(['SELL', 'RENT', 'GIVEAWAY', 'SWAP']),
  conditionStatus: z.enum(['NEW_100', 'LIKE_NEW_99', 'GOOD_90', 'FAIR_70']),
  price: z.number().min(0, 'Giá không được âm'),
  rentalTerms: z.string().optional(),
  depositAmount: z.number().optional(),
  swapTarget: z.string().optional(),
  safeMeetingPoint: z.string().optional(),
  imageUrls: z.array(z.string()).min(1, 'Cần ít nhất 1 hình ảnh sản phẩm').max(7, 'Tối đa 6 hình ảnh và 1 video'),
}).refine(
  (data) => {
    if (data.transactionType === 'SELL' && data.price <= 0) {
      return false;
    }
    if (data.transactionType === 'SWAP' && data.price <= 0) {
      return false;
    }
    return true;
  },
  {
    message: 'Vui lòng nhập giá trị của món đồ (lớn hơn 0đ)',
    path: ['price'],
  }
);

export type ListingFormData = z.infer<typeof listingSchema>;
