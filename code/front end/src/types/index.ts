export type UserRole = 'ROLE_STUDENT' | 'ROLE_MODERATOR' | 'ROLE_SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export type TransactionType = 'SELL' | 'RENT' | 'GIVEAWAY' | 'SWAP';

export type ConditionStatus = 'NEW_100' | 'LIKE_NEW_99' | 'GOOD_90' | 'FAIR_70';

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'RESERVED' | 'COMPLETED' | 'DELETED';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  universityId?: number;
  universityName?: string;
  campusId?: number;
  campusName?: string;
  dormitory?: string;
  studentCode?: string;
  studentCardVerified: boolean;
  karmaScore: number;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface University {
  id: number;
  name: string;
  shortName: string;
  emailDomains: string[];
}

export interface Campus {
  id: number;
  universityId: number;
  name: string;
  location?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  parentId?: number;
}

export interface ListingImage {
  id: number;
  listingId: number;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  sortOrder: number;
}

export interface Listing {
  id: number;
  userId: number;
  authorName?: string;
  authorKarma?: number;
  universityName?: string;
  campusName?: string;
  categoryId: number;
  categoryName?: string;
  title: string;
  description: string;
  price: number;
  transactionType: TransactionType;
  conditionStatus: ConditionStatus;
  rentalTerms?: string;
  swapTarget?: string;
  status: ListingStatus;
  images: ListingImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
