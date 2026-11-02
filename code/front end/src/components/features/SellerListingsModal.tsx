import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { BaseModal } from '../base/BaseModal';
import { KarmaBadge } from './KarmaBadge';
import { listingService } from '../../services/listingService';
import { Listing } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface SellerListingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: number;
  sellerName: string;
  sellerAvatar?: string;
  sellerKarma?: number;
}

type TabType = 'ALL' | 'SELL' | 'GIVEAWAY' | 'SWAP' | 'RENT';

export const SellerListingsModal: React.FC<SellerListingsModalProps> = ({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  sellerAvatar,
  sellerKarma = 20,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && sellerId) {
      setIsLoading(true);
      listingService
        .getUserPublicListings(sellerId)
        .then((res) => {
          if (res.data?.content) {
            setListings(res.data.content);
          } else {
            setListings([]);
          }
        })
        .catch(() => setListings([]))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, sellerId]);

  const filteredItems = listings.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.transactionType === activeTab;
  });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Kho Đồ Sinh Viên Của Người Bán"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Seller Info Header */}
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={
                  sellerAvatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${sellerName || 'Student'}`
                }
                alt={sellerName}
                className="w-14 h-14 rounded-2xl object-cover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {sellerName}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Sinh viên Phenikaa
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Trường Đại học Phenikaa • Đã xác thực email sinh viên
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Điểm tín nhiệm</p>
              <KarmaBadge score={sellerKarma} showText={true} />
            </div>
          </div>
        </div>

        {/* Tab Filters: Tất cả, Bán, Cho tặng, Trao đổi, Thuê */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 overflow-x-auto scrollbar-none text-xs">
          {[
            { key: 'ALL', label: `Tất cả (${listings.length})` },
            {
              key: 'SELL',
              label: `Đang bán (${listings.filter((l) => l.transactionType === 'SELL').length})`,
            },
            {
              key: 'GIVEAWAY',
              label: `Cho / Tặng 0đ (${listings.filter((l) => l.transactionType === 'GIVEAWAY').length})`,
            },
            {
              key: 'SWAP',
              label: `Trao đổi (${listings.filter((l) => l.transactionType === 'SWAP').length})`,
            },
            {
              key: 'RENT',
              label: `Cho thuê (${listings.filter((l) => l.transactionType === 'RENT').length})`,
            },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Đang tải danh sách đồ của người bán...
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={
                        item.images?.[0]?.mediaUrl ||
                        (item as any).imageUrls?.[0] ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&q=80'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      {item.transactionType === 'GIVEAWAY' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500 text-white shadow-xs">
                          TẶNG 0Đ
                        </span>
                      )}
                      {item.transactionType === 'SWAP' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white shadow-xs">
                          ĐỔI ĐỒ
                        </span>
                      )}
                      {item.transactionType === 'RENT' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500 text-white shadow-xs">
                          CHO THUÊ
                        </span>
                      )}
                      {item.transactionType === 'SELL' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-600 text-white shadow-xs">
                          BÁN
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-tight">
                      {item.title}
                    </h4>
                    <div className="mt-1 flex items-baseline justify-between">
                      {item.transactionType === 'GIVEAWAY' ? (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          Miễn phí 0đ
                        </span>
                      ) : (
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                          {formatCurrency(item.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to={`/listings/${item.id}`}
                    onClick={onClose}
                    className="w-full py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    <span>Xem chi tiết</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Người bán hiện chưa đăng món đồ nào trong danh mục này
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};