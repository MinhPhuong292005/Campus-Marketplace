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

export const initialMockReports: ReportItem[] = [];

let localReports: ReportItem[] = [];

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
