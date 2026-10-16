import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, MapPin, Repeat, Clock, Gift, ShoppingBag } from 'lucide-react';
import { Listing } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { TRANSACTION_TYPE_LABELS, CONDITION_LABELS } from '../../constants';
import { KarmaBadge } from './KarmaBadge';

interface ListingCardProps {
  listing: Listing;
  onClick?: (id: number) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(listing.id);
    } else {
      navigate(`/listings/${listing.id}`);
    }
  };
  const getBadgeTypeStyle = (type: Listing['transactionType']) => {
    switch (type) {
      case 'SELL':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200',
          icon: <ShoppingBag className="w-3.5 h-3.5" />,
        };
      case 'RENT':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'GIVEAWAY':
        return {
          bg: 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200',
          icon: <Gift className="w-3.5 h-3.5" />,
        };
      case 'SWAP':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200',
          icon: <Repeat className="w-3.5 h-3.5" />,
        };
    }
  };

  const badgeConfig = getBadgeTypeStyle(listing.transactionType);
  const rawPrimaryImage = listing.images?.[0]?.mediaUrl || (listing as any).imageUrls?.[0];
  const primaryImage = rawPrimaryImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80';

  return (
    <div
      onClick={handleClick}
      className="group flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
    >
      {/* Image Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={primaryImage}
          alt={listing.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${badgeConfig.bg}`}
          >
            {badgeConfig.icon}
            {TRANSACTION_TYPE_LABELS[listing.transactionType]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 text-left">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="flex items-center gap-1 truncate">
            <Tag className="w-3 h-3" />
            {listing.categoryName || 'Giáo trình'}
          </span>
          <span className="text-slate-400">{CONDITION_LABELS[listing.conditionStatus] || 'Đã dùng'}</span>
        </div>

        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {listing.title}
        </h3>

        <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(listing.price)}
            </p>
            {listing.campusName && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3" /> {listing.campusName}
              </p>
            )}
          </div>
          {listing.authorKarma !== undefined && (
            <KarmaBadge score={listing.authorKarma} showText={false} />
          )}
        </div>
      </div>
    </div>
  );
};
