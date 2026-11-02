import { adminNotificationService } from './adminNotificationService';
import { studentNotificationService } from './studentNotificationService';
import { adminService, AdminUserItem } from './adminService';
import { User } from '../types';

export interface StudentCardSubmission {
  userId: number;
  fullName: string;
  studentCode?: string;
  email: string;
  phone?: string;
  universityName?: string;
  dormitory?: string;
  karmaScore?: number;
  frontImageUrl: string;
  backImageUrl: string;
  notes?: string;
  submittedAt: string;
}

const STORAGE_KEY_PREFIX = 'campus_student_card_request_';

export const studentCardService = {
  submitVerificationRequest: async (params: {
    user: User;
    frontImageUrl: string;
    backImageUrl: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const { user, frontImageUrl, backImageUrl, notes } = params;
    const now = new Date().toISOString();

    const submission: StudentCardSubmission = {
      userId: user.id,
      fullName: user.fullName,
      studentCode: user.studentCode,
      email: user.email,
      phone: user.phone,
      universityName: user.universityName || 'Trường Đại học Phenikaa',
      dormitory: user.dormitory,
      karmaScore: user.karmaScore,
      frontImageUrl,
      backImageUrl,
      notes,
      submittedAt: now,
    };

    // 1. Lưu hồ sơ xác thực của sinh viên
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.id}`, JSON.stringify(submission));
    } catch {}

    // 2. Cập nhật thông tin trong adminService danh sách users
    try {
      const users: AdminUserItem[] = adminService.getStoredUsers();
      const updated: AdminUserItem[] = users.map((u: AdminUserItem) => {
        if (u.id === user.id) {
          return {
            ...u,
            studentCardStatus: 'PENDING' as const,
            studentCardFrontUrl: frontImageUrl,
            studentCardBackUrl: backImageUrl,
            studentCardImageUrl: frontImageUrl,
            studentCardSubmittedAt: now,
          };
        }
        return u;
      });
      adminService.saveStoredUsers(updated);
    } catch {}

    // 3. Gửi thông báo đến Quản trị viên
    adminNotificationService.addNotification({
      type: 'CARD_VERIFY',
      title: `Yêu cầu duyệt thẻ sinh viên: ${user.fullName} (${user.studentCode || 'Phenikaa'})`,
      studentId: user.id,
      studentName: user.fullName,
      studentEmail: user.email,
      studentCode: user.studentCode,
      phone: user.phone,
      universityName: user.universityName || 'Trường Đại học Phenikaa',
      dormitory: user.dormitory,
      karmaScore: user.karmaScore,
      message: `Sinh viên ${user.fullName} (${user.studentCode || 'N/A'}) vừa tải lên ảnh 2 mặt thẻ sinh viên để xét duyệt cấp Tích Xanh chính chủ và thưởng +15 Karma. Vui lòng đối chiếu và phê duyệt.`,
      imageUrl: frontImageUrl,
    });

    // 4. Gửi thông báo cục bộ cho sinh viên
    studentNotificationService.addLocalNotification(
      {
        title: '📋 Đã gửi hồ sơ xác thực thẻ sinh viên',
        message:
          'Hồ sơ chụp 2 mặt thẻ sinh viên của bạn đã được chuyển đến Ban Quản Trị. Quản trị viên sẽ kiểm tra đối chiếu và cấp Tích Xanh chính chủ cho bạn trong vòng 24 giờ!',
        type: 'SYSTEM',
      },
      user.id
    );

    // 5. Cập nhật localStorage user_info & broadcast event
    try {
      const raw = localStorage.getItem('user_info');
      if (raw) {
        const u = JSON.parse(raw);
        const nextUser = {
          ...u,
          studentCardStatus: 'PENDING',
          studentCardFrontUrl: frontImageUrl,
          studentCardBackUrl: backImageUrl,
          studentCardSubmittedAt: now,
        };
        localStorage.setItem('user_info', JSON.stringify(nextUser));
        window.dispatchEvent(new CustomEvent('campus_user_updated', { detail: nextUser }));
      }
    } catch {}

    return {
      success: true,
      message: 'Đã gửi ảnh 2 mặt thẻ sinh viên đến Quản trị viên thành công!',
    };
  },

  getSubmission: (userId: number): StudentCardSubmission | null => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};
