import React, { useState } from 'react';
import { Search, Filter, BookOpen, Laptop, Home, Wrench, Sparkles, RefreshCw } from 'lucide-react';
import { Listing } from '../../types';
import { ListingCard } from '../../components/features/ListingCard';
import { BaseButton } from '../../components/base/BaseButton';

export const DashboardPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data simulating backend listings based on SRS
  const sampleListings: Listing[] = [
    {
      id: 1,
      userId: 101,
      authorName: 'Trần Văn Nam',
      authorKarma: 65,
      universityName: 'ĐH Bách Khoa',
      campusName: 'KTX B5',
      categoryId: 1,
      categoryName: 'Giáo trình & Tài liệu',
      title: 'Giáo trình Giải tích 1 + Bộ đề cương thi cuối kỳ có đáp án',
      description: 'Sách còn 95% mới, có highlight các công thức trọng tâm thi cuối kỳ.',
      price: 35000,
      transactionType: 'SELL',
      conditionStatus: 'GOOD_90',
      status: 'ACTIVE',
      images: [
        {
          id: 1,
          listingId: 1,
          mediaUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
          mediaType: 'IMAGE',
          sortOrder: 0,
        },
      ],
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    },
    {
      id: 2,
      userId: 102,
      authorName: 'Lê Thuỳ Linh',
      authorKarma: 40,
      universityName: 'ĐH Quốc Gia',
      campusName: 'Khu A Thủ Đức',
      categoryId: 2,
      categoryName: 'Thiết bị công nghệ',
      title: 'Cho thuê máy tính Casio fx-580VNX ôn thi cấp tốc 2 tuần',
      description: 'Máy nguyên zin, phím bấm nhạy, pin trâu. Cọc 300k hoàn lại khi trả máy.',
      price: 20000,
      transactionType: 'RENT',
      conditionStatus: 'LIKE_NEW_99',
      rentalTerms: '20.000đ/tuần, cọc 300.000đ',
      status: 'ACTIVE',
      images: [
        {
          id: 2,
          listingId: 2,
          mediaUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&q=80',
          mediaType: 'IMAGE',
          sortOrder: 0,
        },
      ],
      createdAt: '2026-09-21T08:30:00Z',
      updatedAt: '2026-09-21T08:30:00Z',
    },
    {
      id: 3,
      userId: 103,
      authorName: 'Hoàng Minh Quân',
      authorKarma: 80,
      universityName: 'ĐH Kinh Tế Quốc Dân',
      campusName: 'KTX NEU',
      categoryId: 3,
      categoryName: 'Đồ dùng phòng trọ',
      title: 'Tặng ấm đun nước siêu tốc Sunhouse 1.8L còn dùng tốt',
      description: 'Mình chuyển sang ở trọ mới đã có đồ nên tặng lại cho bạn sinh viên năm nhất nào cần.',
      price: 0,
      transactionType: 'GIVEAWAY',
      conditionStatus: 'GOOD_90',
      status: 'ACTIVE',
      images: [
        {
          id: 3,
          listingId: 3,
          mediaUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
          mediaType: 'IMAGE',
          sortOrder: 0,
        },
      ],
      createdAt: '2026-09-22T14:10:00Z',
      updatedAt: '2026-09-22T14:10:00Z',
    },
    {
      id: 4,
      userId: 104,
      authorName: 'Phạm Đức Anh',
      authorKarma: 35,
      universityName: 'ĐH FPT',
      campusName: 'Campus Hòa Lạc',
      categoryId: 2,
      categoryName: 'Thiết bị công nghệ',
      title: 'Đổi màn hình phụ di động 15.6 inch lấy bàn phím cơ không dây',
      description: 'Màn hình Type-C còn bảo hành 6 tháng, muốn đổi phím cơ Akko hoặc tương đương.',
      price: 0,
      transactionType: 'SWAP',
      conditionStatus: 'LIKE_NEW_99',
      swapTarget: 'Bàn phím cơ Akko/Keychron',
      status: 'ACTIVE',
      images: [
        {
          id: 4,
          listingId: 4,
          mediaUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80',
          mediaType: 'IMAGE',
          sortOrder: 0,
        },
      ],
      createdAt: '2026-09-23T09:15:00Z',
      updatedAt: '2026-09-23T09:15:00Z',
    },
  ];

  const categories = [
    { id: 'ALL', label: 'Tất cả danh mục', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'BOOKS', label: 'Giáo trình & Tài liệu', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'TECH', label: 'Thiết bị công nghệ', icon: <Laptop className="w-4 h-4" /> },
    { id: 'ROOM', label: 'Đồ phòng trọ', icon: <Home className="w-4 h-4" /> },
    { id: 'TOOLS', label: 'Dụng cụ chuyên ngành', icon: <Wrench className="w-4 h-4" /> },
  ];

  const transactionTabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'SELL', label: 'Bán' },
    { id: 'RENT', label: 'Cho thuê' },
    { id: 'GIVEAWAY', label: 'Tặng 0đ' },
    { id: 'SWAP', label: 'Đổi đồ' },
  ];

  const filteredListings = sampleListings.filter((item) => {
    if (selectedType !== 'ALL' && item.transactionType !== selectedType) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
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

          {/* Quick Search Bar */}
          <div className="pt-2 flex items-center bg-white rounded-2xl p-1.5 shadow-md max-w-lg text-slate-800">
            <Search className="w-5 h-5 ml-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm giáo trình, mã học phần (IT3010), máy tính..."
              className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none placeholder:text-slate-400"
            />
            <BaseButton variant="primary" size="sm" className="rounded-xl px-4">
              Tìm
            </BaseButton>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Transaction Type Filters & Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl">
          {transactionTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedType === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Tìm thấy <b>{filteredListings.length}</b> bài đăng phù hợp</span>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onClick={(id) => alert(`Xem chi tiết bài đăng #${id}: ${listing.title}`)}
          />
        ))}
      </div>
    </div>
  );
};
