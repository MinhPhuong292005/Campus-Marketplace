import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  UserX,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { reportService, ResolveReportPayload } from '../../services/reportService';
import { ReportItem, ReportStatus, SeverityLevel } from '../../types';
import { formatDate } from '../../utils/formatters';

export const AdminModerationPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReportStatus>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | SeverityLevel>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    const res = await reportService.getReports(statusFilter, severityFilter);
    if (res.success && res.data) {
      setReports(res.data.items || res.data.content || []);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, severityFilter]);

  const handleResolve = async (
    reportId: number,
    action: 'PENALIZE_KARMA' | 'BAN_USER' | 'REMOVE_LISTING' | 'REJECTED',
    notes: string,
    karmaPenalty?: number
  ) => {
    try {
      setActionLoadingId(reportId);
      setActionMsg(null);

      const payload: ResolveReportPayload = {
        action,
        karmaPenalty,
        resolutionNotes: notes,
      };

      const res = await reportService.resolveReport(reportId, payload);
      if (res.success && res.data) {
        setActionMsg(`Đã thực hiện: ${notes}`);
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? res.data : r))
        );
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <span>Trung Tâm Kiểm Duyệt & Giải Quyết Tranh Chấp (Moderation Shield)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bảo vệ cộng đồng sinh viên: Tra cứu bằng chứng, kiểm tra transcript chat và xử phạt gian lận/bom hẹn 1-click.
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Tổng số khiếu nại</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{reports.length}</p>
        </div>
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-amber-500 font-bold uppercase">Chờ xử lý (Pending)</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {reports.filter((r) => r.status === 'PENDING').length}
          </p>
        </div>
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-rose-500 font-bold uppercase">Mức độ Cao (Scam cọc)</span>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {reports.filter((r) => r.severity === 'HIGH').length}
          </p>
        </div>
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-emerald-500 font-bold uppercase">Đã phán quyết</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {reports.filter((r) => r.status === 'RESOLVED').length}
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'PENDING', 'RESOLVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st === 'ALL'
                ? 'Tất cả'
                : st === 'PENDING'
                ? 'Đang chờ duyệt'
                : st === 'RESOLVED'
                ? 'Đã xử phạt'
                : 'Đã bác bỏ'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 text-[11px]">Mức độ:</span>
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                severityFilter === sev
                  ? 'bg-slate-200 dark:bg-slate-700 font-bold text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((item) => {
          const isExpanded = expandedId === item.id;
          const isActionLoading = actionLoadingId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
            >
              {/* Header summary line */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 flex-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      item.severity === 'HIGH'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                        : item.severity === 'MEDIUM'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {item.severity} SEVERITY
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.reason === 'BOM_HEN'
                          ? 'Bom hẹn không đến'
                          : item.reason === 'SCAM_COC'
                          ? 'Lừa đảo chiếm đoạt tiền cọc'
                          : item.reason === 'HANG_GIA'
                          ? 'Rao bán hàng giả / kém chất lượng'
                          : 'Nội dung phản cảm'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">#{item.id}</span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      Người tố cáo: <b>{item.reporterName}</b> ➔ Bị tố cáo:{' '}
                      <b className="text-rose-600 dark:text-rose-400">
                        {item.reportedUserName || 'Chủ bài đăng'}
                      </b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : item.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.status}
                  </span>

                  <span className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-5 animate-in fade-in duration-150">
                  {/* Detailed Description */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Nội dung khiếu nại:</span>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {item.description}
                    </p>
                    <span className="text-[11px] text-slate-400 block pt-1">
                      Thời điểm gửi: {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {/* Evidence & Chat transcript side-by-side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Evidence Photo */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-500" /> Bằng chứng ảnh đính kèm (AC1)
                      </span>
                      {item.evidenceUrl ? (
                        <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                          <img
                            src={item.evidenceUrl}
                            alt="Bằng chứng khiếu nại"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Không có ảnh đính kèm</p>
                      )}
                    </div>

                    {/* Chat Log Transcript (AC2) */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                        Log chat trích xuất giữa 2 bên (AC2)
                      </span>

                      {item.chatTranscript && item.chatTranscript.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
                          {item.chatTranscript.map((msg, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <b className="text-slate-700 dark:text-slate-300">{msg.sender}</b>
                                <span>{msg.time}</span>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 mt-0.5">{msg.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Phiên giao dịch không có lịch sử chat.</p>
                      )}
                    </div>
                  </div>

                  {/* Resolution if already resolved */}
                  {item.adminResolution && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
                      <b>Kết luận của ban quản trị ({item.actionTaken}):</b> {item.adminResolution}
                    </div>
                  )}

                  {/* 1-Click Action Buttons for Moderator (AC3) */}
                  {item.status === 'PENDING' && (
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-200/60 dark:border-slate-800">
                      {/* Action 1: Penalize Karma (-15 for bom hẹn) */}
                      <BaseButton
                        variant="outline"
                        size="sm"
                        isLoading={isActionLoading}
                        onClick={() =>
                          handleResolve(
                            item.id,
                            'PENALIZE_KARMA',
                            `Xác nhận vi phạm bom hẹn giao dịch. Trừ 15 điểm Karma tín nhiệm của ${item.reportedUserName}.`,
                            15
                          )
                        }
                        className="text-amber-600 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Trừ 15 Karma (Bom hẹn)</span>
                      </BaseButton>

                      {/* Action 2: Remove Listing */}
                      <BaseButton
                        variant="outline"
                        size="sm"
                        isLoading={isActionLoading}
                        onClick={() =>
                          handleResolve(
                            item.id,
                            'REMOVE_LISTING',
                            `Gỡ bỏ tin đăng #${item.reportedListingId} do vi phạm hàng giả/nội dung cấm.`
                          )
                        }
                        className="text-rose-600 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Gỡ bỏ bài đăng</span>
                      </BaseButton>

                      {/* Action 3: Ban user permanently */}
                      <BaseButton
                        variant="primary"
                        size="sm"
                        isLoading={isActionLoading}
                        onClick={() =>
                          handleResolve(
                            item.id,
                            'BAN_USER',
                            `Khóa tài khoản vĩnh viễn đối tượng ${item.reportedUserName} do hành vi lừa đảo cọc (Scam).`
                          )
                        }
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Khóa tài khoản vĩnh viễn (Scam)</span>
                      </BaseButton>

                      {/* Action 4: Reject Report */}
                      <BaseButton
                        variant="outline"
                        size="sm"
                        isLoading={isActionLoading}
                        onClick={() =>
                          handleResolve(item.id, 'REJECTED', 'Không đủ căn cứ hoặc bằng chứng xác thực.')
                        }
                        className="text-slate-500 text-xs"
                      >
                        Bác bỏ khiếu nại
                      </BaseButton>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
