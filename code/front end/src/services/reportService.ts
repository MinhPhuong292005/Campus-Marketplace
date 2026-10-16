import { getRequest, postRequest } from './api';
import { ReportItem, ApiResponse, PaginatedResult, ReportReason, SeverityLevel } from '../types';
import { API_ROUTES } from '../constants';

export interface CreateReportPayload {
  reportedUserId?: number;
  reportedListingId?: number;
  rentalContractId?: number;
  reason: ReportReason;
  description: string;
  evidenceUrl?: string;
  severity?: SeverityLevel;
}

export interface ResolveReportPayload {
  action: 'PENALIZE_KARMA' | 'BAN_USER' | 'REMOVE_LISTING' | 'REJECTED' | 'SUSPEND_1_WEEK' | 'SCAM_PENALTY' | string;
  karmaPenalty?: number;
  resolutionNotes: string;
}

const initialMockReports: ReportItem[] = [
  {
    id: 1,
    reporterId: 1,
    reporterName: 'Nguyễn Văn An',
    reportedUserId: 201,
    reportedUserName: 'Trần Văn Tùng',
    reportedListingId: 5,
    reportedListingTitle: 'Sách Lập trình Web full kèm source',
    reason: 'BOM_HEN',
    description: 'Hẹn gặp ở thư viện Tạ Quang Bửu lúc 14h, mình đợi 45 phút không đến, gọi điện tắt máy, nhắn tin bị chặn.',
    severity: 'MEDIUM',
    evidenceUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=600&q=80',
    status: 'PENDING',
    chatTranscript: [
      { sender: 'Nguyễn Văn An', time: '13:30', text: 'Mình đến sảnh tầng 2 thư viện rồi nhé bạn ơi' },
      { sender: 'Trần Văn Tùng', time: '13:35', text: 'Ok bạn, 10 phút nữa mình qua' },
      { sender: 'Nguyễn Văn An', time: '14:15', text: 'Bạn ơi bạn đến chưa? Mình không gọi được số bạn' },
    ],
    createdAt: '2026-10-08T14:30:00Z',
    updatedAt: '2026-10-08T14:30:00Z',
  },
  {
    id: 2,
    reporterId: 102,
    reporterName: 'Lê Thuỳ Linh',
    reportedUserId: 205,
    reportedUserName: 'Vũ Quốc Đạt',
    rentalContractId: 1,
    reason: 'SCAM_COC',
    description: 'Thuê máy tính Casio nhưng chuyển cọc giả mạo bill ngân hàng Photoshop hòng chiếm đoạt thiết bị.',
    severity: 'HIGH',
    evidenceUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
    status: 'PENDING',
    chatTranscript: [
      { sender: 'Vũ Quốc Đạt', time: '10:00', text: 'Mình đã chuyển cọc 300k rồi bạn check bill nhé' },
      { sender: 'Lê Thuỳ Linh', time: '10:05', text: 'Tài khoản mình chưa nhận được biến động số dư nào cả, font chữ bill bị lệch kìa bạn' },
    ],
    createdAt: '2026-10-09T08:00:00Z',
    updatedAt: '2026-10-09T08:00:00Z',
  },
  {
    id: 3,
    reporterId: 103,
    reporterName: 'Hoàng Minh Quân',
    reportedUserId: 209,
    reportedUserName: 'Đỗ Hải Đăng',
    reportedListingId: 8,
    reportedListingTitle: 'Rao bán hàng nhái / giả mạo thương hiệu',
    reason: 'HANG_GIA',
    description: 'Bán tai nghe Sony XM4 nhái loại 3 giá 1.5 triệu nói là chính hãng còn bảo hành.',
    severity: 'HIGH',
    evidenceUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80',
    status: 'RESOLVED',
    adminResolution: 'Đã xác minh sản phẩm hàng nhái kém chất lượng. Gỡ bỏ bài đăng và cảnh cáo người bán.',
    actionTaken: 'REMOVE_LISTING',
    createdAt: '2026-10-07T09:00:00Z',
    updatedAt: '2026-10-07T11:00:00Z',
  },
];

let localReports = [...initialMockReports];

export const reportService = {
  createReport: async (payload: CreateReportPayload): Promise<ApiResponse<ReportItem>> => {
    try {
      return await postRequest<ReportItem>(API_ROUTES.REPORTS, payload);
    } catch {
      const newReport: ReportItem = {
        id: Date.now(),
        reporterId: 1,
        reporterName: 'Nguyễn Văn An',
        reportedUserId: payload.reportedUserId,
        reportedListingId: payload.reportedListingId,
        rentalContractId: payload.rentalContractId,
        reason: payload.reason,
        description: payload.description,
        evidenceUrl: payload.evidenceUrl,
        severity: payload.severity || 'MEDIUM',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localReports = [newReport, ...localReports];
      return {
        success: true,
        data: newReport,
        message: 'Gửi báo cáo thành công! Moderator sẽ xem xét và phản hồi trong 24h.',
      };
    }
  },

  getReports: async (status = 'ALL', severity = 'ALL', page = 0, size = 10): Promise<ApiResponse<PaginatedResult<ReportItem>>> => {
    try {
      const res = await getRequest<PaginatedResult<ReportItem>>(API_ROUTES.ADMIN_REPORTS, { status, severity, page, size });
      if (res.data?.items?.length) return res;
    } catch {
      // fallback
    }

    let filtered = [...localReports];
    if (status !== 'ALL') {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (severity !== 'ALL') {
      filtered = filtered.filter((r) => r.severity === severity);
    }

    return {
      success: true,
      data: {
        items: filtered,
        page,
        size,
        totalElements: filtered.length,
        totalPages: 1,
      },
    };
  },

  getReportById: async (id: number): Promise<ApiResponse<ReportItem>> => {
    try {
      return await getRequest<ReportItem>(`${API_ROUTES.ADMIN_REPORTS}/${id}`);
    } catch {
      const found = localReports.find((r) => r.id === id) || localReports[0];
      return {
        success: true,
        data: found,
      };
    }
  },

  resolveReport: async (id: number, payload: ResolveReportPayload): Promise<ApiResponse<ReportItem>> => {
    try {
      return await postRequest<ReportItem>(`${API_ROUTES.ADMIN_REPORTS}/${id}/resolve`, payload);
    } catch {
      localReports = localReports.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: payload.action === 'REJECTED' ? ('REJECTED' as const) : ('RESOLVED' as const),
            actionTaken: payload.action,
            adminResolution: payload.resolutionNotes,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      const updated = localReports.find((r) => r.id === id)!;
      return {
        success: true,
        data: updated,
        message: 'Đã giải quyết tố cáo/tranh chấp thành công!',
      };
    }
  },

  dismissUserReports: async (userId: number): Promise<ApiResponse<void>> => {
    try {
      return await postRequest<void>(`${API_ROUTES.ADMIN_REPORTS}/dismiss-user/${userId}`, {});
    } catch {
      return {
        success: true,
        data: undefined as any,
        message: 'Đã bỏ qua cảnh báo vi phạm cho tài khoản này.',
      };
    }
  },
};
