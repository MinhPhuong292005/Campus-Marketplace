import React, { useState, useRef, useEffect } from 'react';
import { X, Trophy, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { GiveawayClaim } from '../../services/giveawayService';
import { KarmaBadge } from './KarmaBadge';

interface GiveawayWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  claims: GiveawayClaim[];
  listingTitle: string;
  onSelectWinner: (claim: GiveawayClaim) => void;
  isProcessing?: boolean;
}

const SLICE_COLORS = [
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#d97706', // Warm amber
];

export const GiveawayWheelModal: React.FC<GiveawayWheelModalProps> = ({
  isOpen,
  onClose,
  claims,
  listingTitle,
  onSelectWinner,
  isProcessing = false,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<GiveawayClaim | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pendingClaims = claims.filter((c) => c.status === 'PENDING');
  const count = pendingClaims.length;

  // Draw the wheel canvas
  useEffect(() => {
    if (!isOpen || count === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;
    const sliceAngle = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, size, size);

    // Draw slices
    pendingClaims.forEach((claim, i) => {
      const angle = i * sliceAngle;
      ctx.beginPath();
      ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length];
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Border between slices
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Slice text (Applicant name)
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      const displayName = claim.requesterName.length > 14
        ? claim.requesterName.slice(0, 12) + '...'
        : claim.requesterName;
      ctx.fillText(displayName, radius - 20, 4);
      ctx.restore();
    });

    // Outer rim ring
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Center circular badge
    ctx.beginPath();
    ctx.arc(center, center, 36, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText('QUAY', center, center);
  }, [isOpen, count, pendingClaims]);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning || count === 0) return;
    setIsSpinning(true);
    setWinner(null);
    setShowCelebration(false);

    // Pick random winner index
    const winnerIdx = Math.floor(Math.random() * count);
    const sliceDeg = 360 / count;

    // The pointer is at top (270 degrees in standard canvas or 90 offset)
    // Slice i spans [i * sliceDeg, (i + 1) * sliceDeg]
    // To land on winnerIdx under the top pointer:
    const targetDeg = 270 - (winnerIdx * sliceDeg + sliceDeg / 2);
    const fullSpins = 360 * (5 + Math.floor(Math.random() * 3));
    const finalRotation = fullSpins + targetDeg;

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(pendingClaims[winnerIdx]);
      setShowCelebration(true);
    }, 4600);
  };

  const handleReset = () => {
    setWinner(null);
    setShowCelebration(false);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-left relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Vòng quay may mắn (Random)
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-xs">
                Chọn ngẫu nhiên người nhận cho: {listingTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSpinning}
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {count === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Hiện chưa có bạn nào đang chờ nhận món đồ này!
            </p>
            <p className="text-xs text-slate-400">
              Vòng quay chỉ hoạt động khi có ít nhất 1 sinh viên gửi yêu cầu xin nhận đồ thật.
            </p>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center">
            {/* Wheel Container */}
            <div className="relative w-[300px] h-[300px] flex items-center justify-center">
              {/* Pointer indicator */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-rose-600 drop-shadow-md"></div>
              </div>

              {/* Spinning Canvas */}
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                onClick={handleSpin}
                className={`rounded-full cursor-pointer shadow-xl transition-transform ${
                  isSpinning ? 'pointer-events-none' : 'hover:scale-[1.01]'
                }`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: isSpinning ? '4500ms' : '0ms',
                  transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.2, 1.0)',
                }}
              />
            </div>

            {/* Instruction / Spin button */}
            <div className="mt-4 text-center">
              <button
                type="button"
                disabled={isSpinning}
                onClick={handleSpin}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-lg shadow-pink-500/30 flex items-center gap-2 mx-auto active:scale-95 transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSpinning ? 'Đang quay ngẫu nhiên...' : 'QUAY NGAY BÂY GIỜ'}</span>
              </button>
              <p className="text-[11px] text-slate-400 mt-2">
                Quay ngẫu nhiên công bằng giữa {count} bạn sinh viên đã đăng ký thật.
              </p>
            </div>

            {/* Winner Announcement Card */}
            {winner && showCelebration && (
              <div className="mt-4 w-full p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-400 dark:border-emerald-700 animate-in zoom-in-95 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>KẾT QUẢ VÒNG QUAY: NGƯỜI MAY MẮN NHẤT</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                    Trúng giải 🎉
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={
                      winner.requesterAvatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.requesterName}`
                    }
                    alt={winner.requesterName}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {winner.requesterName}
                      </span>
                      <KarmaBadge score={winner.requesterKarma || 20} showText={false} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      MSSV: {winner.requesterStudentCode || 'N/A'} • SĐT: {winner.requesterPhone || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 text-xs text-slate-700 dark:text-slate-300 italic border border-emerald-100 dark:border-emerald-900/50">
                  "{winner.message}"
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onSelectWinner(winner)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận trao tặng cho {winner.requesterName}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

