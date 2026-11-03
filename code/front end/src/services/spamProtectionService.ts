import { studentNotificationService } from './studentNotificationService';

export interface SpamStatus {
  userId: number;
  count: number;
  isWarning: boolean;
  isLocked: boolean;
  lockoutUntil: number | null;
  minutesLeft: number;
  lastActionTime: number | null;
}

interface StoredSpamRecord {
  userId: number;
  count: number;
  lastActionTime: number;
  lockoutUntil?: number;
}

const SPAM_STORAGE_KEY_PREFIX = 'campus_rental_spam_user_';
const POST_SPAM_STORAGE_KEY_PREFIX = 'campus_post_spam_user_';

const getStorageKey = (userId: number) => `${SPAM_STORAGE_KEY_PREFIX}${userId}`;
const getPostStorageKey = (userId: number) => `${POST_SPAM_STORAGE_KEY_PREFIX}${userId}`;

// Tự động xóa bỏ toàn bộ dữ liệu khóa spam lưu trữ cũ
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(SPAM_STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
} catch {}

export const spamProtectionService = {
  checkRenterSpamStatus: (userId?: number | null): SpamStatus => {
    if (userId) {
      try {
        localStorage.removeItem(getStorageKey(userId));
      } catch {}
    }
    return {
      userId: userId || 0,
      count: 0,
      isWarning: false,
      isLocked: false,
      lockoutUntil: null,
      minutesLeft: 0,
      lastActionTime: null,
    };
  },

  recordRenterAction: (userId: number, _actionType?: 'REQUEST' | 'CANCEL', _details?: string): SpamStatus => {
    // Tạm thời tắt tính năng khóa nếu spam theo yêu cầu
    return {
      userId,
      count: 0,
      isWarning: false,
      isLocked: false,
      lockoutUntil: null,
      minutesLeft: 0,
      lastActionTime: Date.now(),
    };
  },

  resetSpam: (userId: number): void => {
    try {
      localStorage.removeItem(getStorageKey(userId));
      window.dispatchEvent(new CustomEvent('campus_spam_status_updated', { detail: { userId, count: 0 } }));
    } catch {}
  },

  // ===== HỆ THỐNG KIỂM SOÁT SPAM ĐĂNG BÀI (KHÓA 1 TIẾNG KHI SPAM) =====
  checkPostSpamStatus: (userId?: number | null): SpamStatus => {
    if (!userId) {
      return {
        userId: 0,
        count: 0,
        isWarning: false,
        isLocked: false,
        lockoutUntil: null,
        minutesLeft: 0,
        lastActionTime: null,
      };
    }

    try {
      const raw = localStorage.getItem(getPostStorageKey(userId));
      if (!raw) {
        return {
          userId,
          count: 0,
          isWarning: false,
          isLocked: false,
          lockoutUntil: null,
          minutesLeft: 0,
          lastActionTime: null,
        };
      }

      const record: StoredSpamRecord = JSON.parse(raw);
      const now = Date.now();

      // Kiểm tra xem đang bị khóa không (1 tiếng)
      if (record.lockoutUntil && record.lockoutUntil > now) {
        const msLeft = record.lockoutUntil - now;
        const minutesLeft = Math.ceil(msLeft / (60 * 1000));
        return {
          userId,
          count: record.count,
          isWarning: true,
          isLocked: true,
          lockoutUntil: record.lockoutUntil,
          minutesLeft,
          lastActionTime: record.lastActionTime,
        };
      }

      // Đã hết thời hạn khóa 1 tiếng -> Giải phóng
      if (record.lockoutUntil && record.lockoutUntil <= now) {
        localStorage.removeItem(getPostStorageKey(userId));
        return {
          userId,
          count: 0,
          isWarning: false,
          isLocked: false,
          lockoutUntil: null,
          minutesLeft: 0,
          lastActionTime: null,
        };
      }

      // Hết thời gian quan sát 15 phút -> Reset bộ đếm spam
      const ACTION_WINDOW_MS = 15 * 60 * 1000;
      if (now - record.lastActionTime > ACTION_WINDOW_MS) {
        return {
          userId,
          count: 0,
          isWarning: false,
          isLocked: false,
          lockoutUntil: null,
          minutesLeft: 0,
          lastActionTime: record.lastActionTime,
        };
      }

      const isWarning = record.count >= 3;
      return {
        userId,
        count: record.count,
        isWarning,
        isLocked: false,
        lockoutUntil: null,
        minutesLeft: 0,
        lastActionTime: record.lastActionTime,
      };
    } catch {
      return {
        userId,
        count: 0,
        isWarning: false,
        isLocked: false,
        lockoutUntil: null,
        minutesLeft: 0,
        lastActionTime: null,
      };
    }
  },

  recordPostSpamAction: (userId: number): SpamStatus => {
    const now = Date.now();
    const current = spamProtectionService.checkPostSpamStatus(userId);

    // Nếu đã bị khóa thì giữ nguyên
    if (current.isLocked) {
      return current;
    }

    const nextCount = current.count + 1;
    let nextLockoutUntil: number | undefined = undefined;

    // Quy định: Nếu spam đến lần thứ 4 (tiếp tục spam sau 3 lần cảnh báo) -> Khóa 1 tiếng (60 phút)
    if (nextCount >= 4) {
      nextLockoutUntil = now + 60 * 60 * 1000; // Khóa 1 tiếng
    }

    const updatedRecord: StoredSpamRecord = {
      userId,
      count: nextCount,
      lastActionTime: now,
      lockoutUntil: nextLockoutUntil,
    };

    try {
      localStorage.setItem(getPostStorageKey(userId), JSON.stringify(updatedRecord));
      window.dispatchEvent(new CustomEvent('campus_post_spam_status_updated', { detail: updatedRecord }));
    } catch {}

    // Gửi thông báo cảnh báo đỏ ở lần thứ 3
    if (nextCount === 3) {
      studentNotificationService.addLocalNotification(
        {
          title: '🚨 [CẢNH BÁO SPAM] Thao tác gửi bài đăng quá nhanh',
          message:
            'Hệ thống phát hiện bạn gửi bài đăng liên tiếp 3 lần trong thời gian ngắn. Vui lòng không spam bài viết! Nếu còn tiếp tục spam, tài khoản sẽ bị tạm khóa đăng bài trong 1 giờ!',
          type: 'WARNING',
        },
        userId
      );
    }

    // Gửi thông báo tạm khóa 1 giờ ở lần thứ 4
    if (nextCount >= 4) {
      studentNotificationService.addLocalNotification(
        {
          title: '⛔ [TẠM KHÓA ĐĂNG BÀI 1 TIẾNG] Vi phạm spam bài đăng',
          message:
            'Tài khoản của bạn đã bị tạm khóa quyền đăng bài trong 1 giờ do liên tục spam bài viết sau khi đã nhận cảnh báo đỏ. Vui lòng quay lại sau.',
          type: 'WARNING',
        },
        userId
      );
    }

    const minutesLeft = nextLockoutUntil ? 60 : 0;
    return {
      userId,
      count: nextCount,
      isWarning: nextCount >= 3,
      isLocked: Boolean(nextLockoutUntil),
      lockoutUntil: nextLockoutUntil || null,
      minutesLeft,
      lastActionTime: now,
    };
  },

  resetPostSpam: (userId: number): void => {
    try {
      localStorage.removeItem(getPostStorageKey(userId));
      window.dispatchEvent(new CustomEvent('campus_post_spam_status_updated', { detail: { userId, count: 0 } }));
    } catch {}
  },
};
