import React from 'react';
import { LayoutGrid, BookOpen, Laptop, Home, Wrench, Shirt, Bike, Package } from 'lucide-react';

export interface AppCategoryItem {
  id: string; // 'ALL', '1', '2', '3', '4', '5', '6', '7'
  numericId: number;
  label: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const APP_CATEGORIES: AppCategoryItem[] = [
  { id: 'ALL', numericId: 0, label: 'Tất cả danh mục', slug: 'all', icon: LayoutGrid },
  { id: '1', numericId: 1, label: 'Giáo trình & Sách vở', slug: 'giao-trinh-sach-vo', icon: BookOpen },
  { id: '2', numericId: 2, label: 'Thiết bị công nghệ', slug: 'thiet-bi-cong-nghe', icon: Laptop },
  { id: '3', numericId: 3, label: 'Đồ dùng phòng trọ', slug: 'do-dung-phong-tro', icon: Home },
  { id: '4', numericId: 4, label: 'Dụng cụ học tập & Thể thao', slug: 'dung-cu-the-thao', icon: Wrench },
  { id: '5', numericId: 5, label: 'Thời trang & Phụ kiện', slug: 'thoi-trang-phu-kien', icon: Shirt },
  { id: '6', numericId: 6, label: 'Phương tiện đi lại & Vật dụng', slug: 'xe-co-phuong-tien', icon: Bike },
  { id: '7', numericId: 7, label: 'Khác', slug: 'khac', icon: Package },
];

/**
 * Resolve any category representation (number, slug, name, legacy key) to valid category ID ('1'..'7' or 'ALL')
 */
export const resolveCategoryId = (val: string | null | undefined): string => {
  if (!val) return 'ALL';
  const clean = val.trim().toLowerCase();
  if (clean === 'all' || clean === 'tat-ca' || clean === '0') return 'ALL';

  // Direct numeric match ('1'..'7')
  const matchedById = APP_CATEGORIES.find((c) => c.id === clean);
  if (matchedById) return matchedById.id;

  // Legacy keys
  if (clean === 'books') return '1';
  if (clean === 'tech') return '2';
  if (clean === 'room') return '3';
  if (clean === 'tools') return '4';

  // Exact slug match
  const matchedBySlug = APP_CATEGORIES.find((c) => c.slug.toLowerCase() === clean);
  if (matchedBySlug) return matchedBySlug.id;

  // Exact or contains name match
  const matchedByName = APP_CATEGORIES.find(
    (c) => c.label.toLowerCase() === clean || clean.includes(c.label.toLowerCase()) || c.label.toLowerCase().includes(clean)
  );
  if (matchedByName) return matchedByName.id;

  // Keyword heuristic
  if (clean.includes('thời trang') || clean.includes('phụ kiện') || clean.includes('fashion')) return '5';
  if (clean.includes('sách') || clean.includes('giáo trình')) return '1';
  if (clean.includes('công nghệ') || clean.includes('thiết bị') || clean.includes('laptop')) return '2';
  if (clean.includes('phòng trọ') || clean.includes('gia dụng')) return '3';
  if (clean.includes('dụng cụ') || clean.includes('thể thao')) return '4';
  if (clean.includes('xe') || clean.includes('phương tiện')) return '6';

  return 'ALL';
};

