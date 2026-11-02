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

const getStorageKey = (userId: number) => `${SPAM_STORAGE_KEY_PREFIX}${userId}`;

export const spamProtectionService = {
  checkRenterSpamStatus: (userId?: number | null): SpamStatus => {
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
      const raw = localStorage.getItem(getStorageKey(userId));
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

      // Check if locked out
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

      // If lockout time expired, reset lock
      if (record.lockoutUntil && record.lockoutUntil <= now) {
        localStorage.removeItem(getStorageKey(userId));
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

      // Check window: If last action was more than 15 minutes ago, counter cools down
      const ACTION_WINDOW_MS = 15 * 60 * 1000; // 15 mins
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

  recordRenterAction: (userId: number, _actionType?: 'REQUEST' | 'CANCEL', _details?: string): SpamStatus => {
    const now = Date.now();
    const current = spamProtectionService.checkRenterSpamStatus(userId);

    // If already locked, remain locked
    if (current.isLocked) {
      return current;
    }

    // Next count
    const nextCount = current.count + 1;
    let nextLockoutUntil: number | undefined = undefined;

    // Rule: If count >= 4 (spam continues after 3rd warning), lock account for 1 hour
    if (nextCount >= 4) {
      nextLockoutUntil = now + 60 * 60 * 1000; // 1 hour lockout
    }

    const updatedRecord: StoredSpamRecord = {
      userId,
      count: nextCount,
      lastActionTime: now,
      lockoutUntil: nextLockoutUntil,
    };

    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(updatedRecord));
      window.dispatchEvent(new CustomEvent('campus_spam_status_updated', { detail: updatedRecord }));
    } catch {}

    // 1. Send warning notification at 3 consecutive actions
    if (nextCount === 3) {
      studentNotificationService.addLocalNotification(
        {
          title: '🚨 [CẢNH BÁO SPAM] Thao tác thuê đồ liên tiếp',
          message:
            'Hệ thống phát hiện bạn đã gửi hoặc hủy yêu cầu thuê liên tiếp 3 lần trong thời gian ngắn. Nếu còn tiếp tục spam, tài khoản sẽ bị tạm khóa trong vòng 1 giờ!',
          type: 'WARNING',
        },
        userId
      );
    }

    // 2. Send lockout notification at >= 4 actions
    if (nextCount >= 4) {
      studentNotificationService.addLocalNotification(
        {
          title: '⛔ [TÀI KHOẢN TẠM KHÓA 1 GIỜ] Vi phạm spam yêu cầu thuê',
          message:
            'Tài khoản của bạn đã bị tạm khóa tính năng thuê đồ trong 1 giờ do liên tục spam sau khi đã nhận cảnh báo đỏ. Vui lòng quay lại sau.',
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

  resetSpam: (userId: number): void => {
    try {
      localStorage.removeItem(getStorageKey(userId));
      window.dispatchEvent(new CustomEvent('campus_spam_status_updated', { detail: { userId, count: 0 } }));
    } catch {}
  },
};
