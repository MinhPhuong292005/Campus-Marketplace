import { adminService } from './adminService';
import { useAuthStore } from '../store/useAuthStore';

export interface KeywordViolationStrike {
  keyword: string;
  listingTitle?: string;
  timestamp: string;
  strikeNumber: number;
}

export interface KeywordViolationRecord {
  userId: number;
  userEmail: string;
  userName: string;
  studentCode?: string;
  strikeCount: number; // 1, 2, 3
  isSuspended: boolean;
  suspendedUntil?: string; // ISO string 24h from strike 3
  lastViolationKeyword: string;
  lastViolationDate: string;
  violationHistory: KeywordViolationStrike[];
}

const STORAGE_KEY = 'campus_keyword_violations_fresh_v1';
const AUDIT_LOGS_KEY = 'campus_audit_logs_fresh_v1';

export const FORBIDDEN_KEYWORDS_LIST = [
  'vape',
  'pod',
  'thuốc lá điện tử',
  'thi hộ',
  'học hộ',
  'chạy điểm',
  'phao thi',
  'làm bằng',
  'tiền cọc trước',
  'chuyển khoản trước',
  'vay nóng',
  'bốc bát họ',
  'nội dung nhạy cảm',
  '18+',
];

export const keywordViolationService = {
  getRecords: (): KeywordViolationRecord[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveRecords: (records: KeywordViolationRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      window.dispatchEvent(new CustomEvent('campus_keyword_violations_updated', { detail: records }));
    } catch {}
  },

  checkTextHasForbiddenKeyword: (text: string): string | null => {
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const kw of FORBIDDEN_KEYWORDS_LIST) {
      if (lower.includes(kw)) {
        return kw;
      }
    }
    return null;
  },

  getRecordByUserId: (userId: number): KeywordViolationRecord | null => {
    const records = keywordViolationService.getRecords();
    const target = records.find((r) => r.userId === userId);
    if (!target) return null;
    if (target.isSuspended && target.suspendedUntil) {
      const expiry = new Date(target.suspendedUntil).getTime();
      if (Date.now() > expiry) {
        target.isSuspended = false;
        target.suspendedUntil = undefined;
        target.strikeCount = 0; // Khôi phục về ban đầu khi hết hạn
        keywordViolationService.saveRecords(records);
      }
    }
    return target;
  },

  isUserSuspended: (userId: number): boolean => {
    const records = keywordViolationService.getRecords();
    const target = records.find((r) => r.userId === userId);
    if (!target || !target.isSuspended) return false;
    if (target.suspendedUntil) {
      const expiry = new Date(target.suspendedUntil).getTime();
      if (Date.now() > expiry) {
        target.isSuspended = false;
        target.suspendedUntil = undefined;
        target.strikeCount = 0; // Khôi phục số lượt an toàn về ban đầu khi hết hạn
        keywordViolationService.saveRecords(records);
        return false;
      }
    }
    return true;
  },

  recordSpamBan: (userId: number, userEmail: string, userName: string) => {
    const records = keywordViolationService.getRecords();
    let record = records.find((r) => r.userId === userId);
    const now = new Date();
    const suspendedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    if (!record) {
      record = {
        userId,
        userEmail,
        userName,
        strikeCount: 3,
        isSuspended: true,
        suspendedUntil,
        lastViolationKeyword: 'SPAM_POSTING',
        lastViolationDate: now.toISOString(),
        violationHistory: [
          {
            keyword: 'Spam đăng bài liên tục',
            timestamp: now.toISOString(),
            strikeNumber: 3,
          },
        ],
      };
      records.push(record);
    } else {
      record.strikeCount = 3;
      record.isSuspended = true;
      record.suspendedUntil = suspendedUntil;
      record.lastViolationKeyword = 'SPAM_POSTING';
      record.lastViolationDate = now.toISOString();
    }
    keywordViolationService.saveRecords(records);
    keywordViolationService.addAuditLog({
      adminEmail: 'minhphuong2925@gmail.com',
      action: 'SPAM_SUSPEND_1_DAY',
      targetType: 'USER',
      targetId: userId,
      details: `Hệ thống tự động cấm đăng bài 1 ngày (24 giờ) đối với sinh viên ${userName} (${userEmail}) do tiếp tục spam bài đăng.`,
    });

    // Cập nhật trạng thái người dùng trong useAuthStore và localStorage
    const reason = 'Tự động tạm khóa 1 ngày do spam bài đăng liên tục';
    const authUser = useAuthStore.getState().user;
    if (authUser && (authUser.id === userId || String(authUser.id) === String(userId))) {
      useAuthStore.getState().updateUserStatus('SUSPENDED', reason, suspendedUntil);
    }
    // Cập nhật đồng bộ vào bảng quản lý của admin & CSDL backend
    adminService
      .updateUserStatus(userId, {
        action: 'SUSPEND',
        karmaAdjustment: -10,
        reason,
      })
      .catch(() => {});

    window.dispatchEvent(
      new CustomEvent('campus_user_status_changed', {
        detail: { userId, status: 'SUSPENDED', reason, suspendedUntil },
      })
    );
  },

  recordViolation: (payload: {
    userId: number;
    userEmail: string;
    userName: string;
    studentCode?: string;
    keyword: string;
    listingTitle?: string;
  }): { record: KeywordViolationRecord; isNewlySuspended: boolean } => {
    const records = keywordViolationService.getRecords();
    let record = records.find((r) => r.userId === payload.userId);
    let isNewlySuspended = false;

    const now = new Date();
    const nowIso = now.toISOString();

    if (!record) {
      record = {
        userId: payload.userId,
        userEmail: payload.userEmail,
        userName: payload.userName,
        studentCode: payload.studentCode,
        strikeCount: 1,
        isSuspended: false,
        lastViolationKeyword: payload.keyword,
        lastViolationDate: nowIso,
        violationHistory: [
          {
            keyword: payload.keyword,
            listingTitle: payload.listingTitle,
            timestamp: nowIso,
            strikeNumber: 1,
          },
        ],
      };
      records.push(record);
    } else {
      record.strikeCount += 1;
      record.lastViolationKeyword = payload.keyword;
      record.lastViolationDate = nowIso;
      record.violationHistory.push({
        keyword: payload.keyword,
        listingTitle: payload.listingTitle,
        timestamp: nowIso,
        strikeNumber: record.strikeCount,
      });

      // Strike 3 Rule: Bị nhắc 3 lần -> Tự động tạm khóa 1 ngày (24 giờ)
      if (record.strikeCount >= 3) {
        record.isSuspended = true;
        const suspendedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        record.suspendedUntil = suspendedUntil.toISOString();
        isNewlySuspended = true;

        const reason = `Tự động tạm khóa 1 ngày do đăng bài chứa từ cấm 3 lần ("${payload.keyword}")`;

        // Ghi Audit Log tự động
        keywordViolationService.addAuditLog({
          adminEmail: 'SYSTEM_AUTOPILOT',
          action: 'AUTO_SUSPEND_1_DAY',
          targetType: 'USER',
          targetId: payload.userId,
          details: `Hệ thống tự động tạm khóa tài khoản 1 ngày (24h) đối với sinh viên ${payload.userName} (${payload.userEmail}) do đăng bài chứa từ cấm lần thứ ${record.strikeCount} ("${payload.keyword}").`,
        });

        // Cập nhật trạng thái người dùng trong useAuthStore và localStorage
        const authUser = useAuthStore.getState().user;
        if (authUser && (authUser.id === payload.userId || String(authUser.id) === String(payload.userId))) {
          useAuthStore.getState().updateUserStatus('SUSPENDED', reason, record.suspendedUntil);
        }

        // Cập nhật đồng bộ vào bảng quản lý sinh viên của admin & backend
        adminService
          .updateUserStatus(payload.userId, {
            action: 'SUSPEND',
            karmaAdjustment: -10,
            reason,
          })
          .catch(() => {});

        window.dispatchEvent(
          new CustomEvent('campus_user_status_changed', {
            detail: { userId: payload.userId, status: 'SUSPENDED', reason, suspendedUntil: record.suspendedUntil },
          })
        );
      }
    }

    keywordViolationService.saveRecords(records);
    return { record, isNewlySuspended };
  },

  resetStrikes: (userId: number, adminEmail: string, note?: string) => {
    const records = keywordViolationService.getRecords();
    const target = records.find((r) => r.userId === userId);
    if (target) {
      target.strikeCount = 0;
      target.isSuspended = false;
      target.suspendedUntil = undefined;
      keywordViolationService.saveRecords(records);

      keywordViolationService.addAuditLog({
        adminEmail,
        action: 'RESET_STRIKES',
        targetType: 'USER',
        targetId: userId,
        details: `Quản trị viên ${adminEmail} đã xóa cảnh cáo vi phạm từ cấm cho sinh viên ${target.userName}. Lý do: ${note || 'Đã kiểm tra giải trình hợp lệ'}.`,
      });

      const authUser = useAuthStore.getState().user;
      if (authUser && (authUser.id === userId || String(authUser.id) === String(userId))) {
        useAuthStore.getState().updateUserStatus('ACTIVE');
      }
      adminService.updateUserStatus(userId, { action: 'ACTIVATE', reason: 'Mở khóa / Xóa cảnh cáo' }).catch(() => {});
      window.dispatchEvent(new CustomEvent('campus_user_status_changed', { detail: { userId, status: 'ACTIVE' } }));
    }
  },

  unbanEarly: (userId: number, adminEmail: string, note?: string) => {
    const records = keywordViolationService.getRecords();
    const target = records.find((r) => r.userId === userId);
    if (target) {
      target.isSuspended = false;
      target.suspendedUntil = undefined;
      target.strikeCount = 0; // Hồi phục số lượt an toàn về ban đầu
      keywordViolationService.saveRecords(records);

      keywordViolationService.addAuditLog({
        adminEmail,
        action: 'UNBAN_EARLY',
        targetType: 'USER',
        targetId: userId,
        details: `Quản trị viên ${adminEmail} đã mở khóa sớm 24h và khôi phục 3/3 lượt an toàn cho sinh viên ${target.userName}. Lý do: ${note || 'Cam kết không tái phạm'}.`,
      });

      const authUser = useAuthStore.getState().user;
      if (authUser && (authUser.id === userId || String(authUser.id) === String(userId))) {
        useAuthStore.getState().updateUserStatus('ACTIVE');
      }
      adminService.updateUserStatus(userId, { action: 'ACTIVATE', reason: 'Mở khóa sớm' }).catch(() => {});
      window.dispatchEvent(new CustomEvent('campus_user_status_changed', { detail: { userId, status: 'ACTIVE' } }));
    }
  },

  restoreSafeChances: (userId: number, note?: string) => {
    const records = keywordViolationService.getRecords();
    const target = records.find((r) => r.userId === userId);
    if (target) {
      target.strikeCount = 0;
      target.isSuspended = false;
      target.suspendedUntil = undefined;
      keywordViolationService.saveRecords(records);

      keywordViolationService.addAuditLog({
        adminEmail: 'SYSTEM_AUTOPILOT',
        action: 'RESTORE_SAFE_CHANCES',
        targetType: 'USER',
        targetId: userId,
        details: `Hệ thống đã phục hồi số lượt an toàn về ban đầu (3/3) cho sinh viên ${target.userName}. Lý do: ${note || 'Tài khoản đã được mở khóa hoạt động trở lại'}.`,
      });
    }

    const authUser = useAuthStore.getState().user;
    if (authUser && (authUser.id === userId || String(authUser.id) === String(userId))) {
      useAuthStore.getState().updateUserStatus('ACTIVE');
    }
    window.dispatchEvent(new CustomEvent('campus_keyword_violations_updated'));
    window.dispatchEvent(new CustomEvent('campus_user_status_changed', { detail: { userId, status: 'ACTIVE' } }));
  },

  getAuditLogs: () => {
    try {
      const raw = localStorage.getItem(AUDIT_LOGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addAuditLog: (entry: {
    adminEmail: string;
    action: string;
    targetType: string;
    targetId?: number;
    details: string;
  }) => {
    try {
      const logs = keywordViolationService.getAuditLogs();
      const newLog = {
        id: Date.now(),
        adminId: 1,
        adminEmail: entry.adminEmail,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details,
        createdAt: new Date().toISOString(),
      };
      logs.unshift(newLog);
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
      window.dispatchEvent(new CustomEvent('campus_audit_logs_updated', { detail: logs }));
    } catch {}
  },
};
