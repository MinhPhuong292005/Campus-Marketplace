import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Laptop, Home, Wrench, Sparkles, SlidersHorizontal, PackageSearch, PlusCircle } from 'lucide-react';
import { Listing } from '../../types';
import { ListingCard } from '../../components/features/ListingCard';
import { SearchBar } from '../../components/features/SearchBar';
import { FilterSidebar, FilterState } from '../../components/features/FilterSidebar';
import { SwapModal } from '../../components/features/SwapModal';
import { listingService } from '../../services/listingService';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [selectedSwapListing, setSelectedSwapListing] = useState<Listing | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const initialFilters: FilterState = {
    category: 'ALL',
    transactionType: 'ALL',
    condition: 'ALL',
    campus: 'ALL',
    maxPrice: 1000000,
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const res = await listingService.getListings();
        if (res.success && res.data?.content) {
          setListings(res.data.content);
        } else {
          setListings([]);
        }
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const categories = [
    { id: 'ALL', label: 'Tất cả danh mục', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'BOOKS', label: 'Giáo trình & Tài liệu', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'TECH', label: 'Thiết bị công nghệ', icon: <Laptop className="w-4 h-4" /> },
    { id: 'ROOM', label: 'Đồ phòng trọ', icon: <Home className="w-4 h-4" /> },
    { id: 'TOOLS', label: 'Dụng cụ chuyên ngành', icon: <Wrench className="w-4 h-4" /> },
  ];

  const filteredListings = listings.filter((item) => {
    // Transaction type
    if (filters.transactionType !== 'ALL' && item.transactionType !== filters.transactionType) {
      return false;
    }
    // Category
    if (filters.category !== 'ALL') {
      if (filters.category === 'BOOKS' && item.categoryId !== 1) return false;
      if (filters.category === 'TECH' && item.categoryId !== 2) return false;
      if (filters.category === 'ROOM' && item.categoryId !== 3) return false;
      if (filters.category === 'TOOLS' && item.categoryId !== 4) return false;
    }
    // Condition
    if (filters.condition !== 'ALL' && item.conditionStatus !== filters.condition) {
      return false;
    }
    // Price
    if (filters.maxPrice < 1000000 && item.price > filters.maxPrice) {
      return false;
    }
    // Campus
    if (filters.campus !== 'ALL') {
      const c = (item.campusName || '').toLowerCase();
      if (filters.campus === 'KTX_K1' && !c.includes('k1')) return false;
      if (filters.campus === 'KTX_K2' && !c.includes('k2')) return false;
      if (filters.campus === 'KTX_K3' && !c.includes('k3')) return false;
      if (filters.campus === 'KTX_NU' && !c.includes('nữ') && !c.includes('nu')) return false;
      if (filters.campus === 'CO_SO_CHINH' && !c.includes('yên nghĩa') && !c.includes('trụ sở')) return false;
    }
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCategory = (item.categoryName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCategory) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white p-6 sm:p-10 shadow-lg shadow-blue-500/10">
        <div className="relative z-10 max-w-2xl space-y-3 text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-blue-100">
            🎓 Chợ Thương Mại Điện Tử Sinh Viên Nội Bộ
          </span>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight leading-tight">
            Mua, Bán, Thuê, Tặng & Đổi đồ ngay trong khuôn viên trường
          </h1>
          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
            100% sinh viên được xác minh qua email trường và thẻ sinh viên. Hẹn gặp trực tiếp tại thư viện hoặc sảnh KTX an toàn.
          </p>
        </div>
      </section>

      {/* Search Bar with Debounce 300ms & Suggestions */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm giáo trình, mã học phần (CS50, IT3010), máy tính, KTX B5..."
        />
      </div>

      {/* Category Pills & Mobile Filter Button */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters({ ...filters, category: cat.id })}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filters.category === cat.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Mobile toggle button */}
        <button
          onClick={() => setShowMobileFilter(!showMobileFilter)}
          className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shrink-0 flex items-center gap-1.5 text-xs font-semibold"
        >
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <span>Bộ lọc</span>
        </button>
      </div>

      {/* Main Layout: Sidebar Filter + Listings Grid */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Sidebar Filter for Desktop & Mobile Toggle */}
        <div className={`${showMobileFilter ? 'block w-full' : 'hidden'} lg:block`}>
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(initialFilters)}
            totalResults={filteredListings.length}
          />
        </div>

        {/* Listings Container */}
        <div className="flex-1 w-full space-y-4">
          {/* Results Summary Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200 dark:border-slate-800">
            <span>
              Hiển thị <b>{filteredListings.length}</b> món đồ
              {searchQuery ? ` cho từ khóa "${searchQuery}"` : ''}
            </span>
          </div>

          {/* Grid of Listings */}
          {loading ? (
            <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium">Đang tải sản phẩm từ Chợ sinh viên...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <PackageSearch className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Chưa có bài đăng nào trên Marketplace
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Toàn bộ dữ liệu mẫu đã được xóa sạch. Hãy là người đầu tiên đăng sách giáo trình, thiết bị công nghệ hoặc đồ dùng sinh viên!
                </p>
              </div>
              <button
                onClick={() => navigate('/create-listing')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Đăng bài đầu tiên ngay</span>
              </button>
            </div>
          ) : filteredListings.length === 0 ? (
            /* AC4: Friendly empty state with suggestions when filtered */
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <PackageSearch className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Không tìm thấy món đồ nào phù hợp
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh khoảng giá và bộ lọc.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 text-xs font-semibold hover:bg-blue-100"
                >
                  Xóa từ khóa tìm kiếm
                </button>
                <button
                  onClick={() => setFilters(initialFilters)}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 text-xs font-semibold hover:bg-slate-200"
                >
                  Xóa toàn bộ bộ lọc
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="relative group">
                  <ListingCard
                    listing={listing}
                    onClick={(id) => navigate(`/listings/${id}`)}
                  />

                  {/* Quick Action Button for SWAP */}
                  {listing.transactionType === 'SWAP' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSwapListing(listing);
                      }}
                      className="mt-2 w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Đề xuất đổi đồ (Swap)</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Swap Modal */}
      {selectedSwapListing && (
        <SwapModal
          isOpen={true}
          onClose={() => setSelectedSwapListing(null)}
          targetListing={selectedSwapListing}
          onSuccess={() => {
            alert('Gửi đề xuất đổi đồ thành công! Người bán sẽ nhận được thông báo.');
          }}
        />
      )}
    </div>
  );
};
