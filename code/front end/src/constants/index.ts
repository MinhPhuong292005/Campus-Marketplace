export const APP_CONFIG = {
  APP_NAME: 'Campus Marketplace',
  MAX_IMAGE_COUNT: 6,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_VIDEO_DURATION_SECONDS: 15,
  DEBOUNCE_SEARCH_MS: 300,
  DEFAULT_PAGE_SIZE: 12,
} as const;

export const KARMA_RULES = {
  EDU_EMAIL_VERIFY_BONUS: 20,
  STUDENT_CARD_VERIFY_BONUS: 15,
  RATING_5_STAR_BONUS: 5,
  GIVEAWAY_SUCCESS_BONUS: 10,
  NO_SHOW_PENALTY: -15,
} as const;

export const TRANSACTION_TYPE_LABELS = {
  SELL: 'Bán',
  RENT: 'Cho thuê',
  GIVEAWAY: 'Tặng 0đ',
  SWAP: 'Đổi đồ',
} as const;

export const CONDITION_LABELS = {
  NEW_100: 'Mới 100% (Chưa qua sử dụng)',
  LIKE_NEW_99: 'Như mới (99%)',
  GOOD_90: 'Tốt (90%)',
  FAIR_70: 'Khá (70%)',
} as const;

export const API_ROUTES = {
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_SEND_OTP: '/auth/send-otp',
  AUTH_VERIFY_OTP: '/auth/verify-otp',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',
  STUDENT_PROFILE: '/student/profile',
  CHANGE_PASSWORD: '/student/profile/change-password',
  PUBLIC_PROFILE: '/public/profile',
  LISTINGS: '/student/listings',
  MY_LISTINGS: '/student/my-listings',
  MEDIA_UPLOAD: '/student/media/upload',
  CATEGORIES: '/public/categories',
  UNIVERSITIES: '/public/universities',
  PUBLIC_LISTINGS: '/public/listings',
  RENTALS: '/student/rentals',
  OCR_VERIFY: '/student/profile/ocr-verify',
  REPORTS: '/student/reports',
  ADMIN_REPORTS: '/admin/reports',
} as const;

export const DEFAULT_AVATAR = '/default-avatar.png';

