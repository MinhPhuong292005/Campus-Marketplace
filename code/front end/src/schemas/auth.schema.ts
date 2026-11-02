import { z } from 'zod';

const isPhenikaaEmail = (val: string) => {
  if (!val || !val.includes('@')) return false;
  const clean = val.trim().toLowerCase();
  const domain = clean.substring(clean.lastIndexOf('@') + 1);
  return (
    domain === 'st.phenikaa-uni.edu.vn' ||
    domain === 'phenikaa-uni.edu.vn' ||
    domain === 'st.phenikaa.edu.vn' ||
    domain === 'phenikaa.edu.vn'
  );
};

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email trường')
    .email('Email không đúng định dạng')
    .refine((val) => isPhenikaaEmail(val) || val.endsWith('@gmail.com'), {
      message: 'Tài khoản phải thuộc trường Đại học Phenikaa (@st.phenikaa-uni.edu.vn)',
    }),
  password: z.string().min(5, 'Mật khẩu phải có tối thiểu 5 ký tự'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email trường')
    .email('Email không hợp lệ')
    .refine(isPhenikaaEmail, {
      message: 'Ứng dụng chỉ áp dụng cho sinh viên trường Đại học Phenikaa (Ví dụ: 23010190@st.phenikaa-uni.edu.vn)',
    }),
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100, 'Họ tên không vượt quá 100 ký tự'),
  password: z.string().min(5, 'Mật khẩu tối thiểu 5 ký tự'),
  confirmPassword: z.string(),
  universityId: z.number().optional().default(5),
  campusId: z.number().optional().nullable().default(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
