import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng').min(1, 'Vui lòng nhập email trường'),
  password: z.string().min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z
    .string()
    .email('Email không hợp lệ')
    .refine((val) => val.endsWith('.edu.vn') || val.includes('@'), {
      message: 'Ưu tiên sử dụng email sinh viên (.edu.vn) để được cộng 20 điểm Karma',
    }),
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100, 'Họ tên không vượt quá 100 ký tự'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string(),
  universityId: z.number().min(1, 'Vui lòng chọn trường đại học'),
  campusId: z.number().min(1, 'Vui lòng chọn cơ sở'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
