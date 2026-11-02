export type UserRole = 'ROLE_STUDENT' | 'ROLE_MODERATOR' | 'ROLE_SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'BLOCKED';

export type TransactionType = 'SELL' | 'RENT' | 'GIVEAWAY' | 'SWAP';

export type ConditionStatus = 'NEW_100' | 'LIKE_NEW_99' | 'GOOD_90' | 'FAIR_70';

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'RESERVED' | 'COMPLETED' | 'DELETED' | 'ARCHIVED' | 'PENDING_APPROVAL' | 'REJECTED' | 'NEEDS_EDIT';

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
  major?: string;
  academicYear?: string;
  bio?: string;
  studentCardVerified: boolean;
  karmaScore: number;
  role: UserRole;
  status: UserStatus;
  blockReason?: string;
  suspendedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile {
  id: number;
  fullName: string;
  avatarUrl?: string;
  universityName?: string;
  campusName?: string;
  dormitory?: string;
  major?: string;
  academicYear?: string;
  bio?: string;
  phone?: string;
  studentCode?: string;
  studentCardVerified: boolean;
  karmaScore: number;
  createdAt: string;
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
  authorAvatar?: string;
  authorKarma?: number;
  authorStatus?: string;
  universityName?: string;
  campusName?: string;
  dormitory?: string;
  categoryId: number;
  categoryName?: string;
  title: string;
  description: string;
  price: number;
  transactionType: TransactionType;
  conditionStatus: ConditionStatus;
  rentalTerms?: string;
  depositAmount?: number;
  swapTarget?: string;
  status: ListingStatus;
  isRiskFlagged?: boolean;
  riskReason?: string;
  moderationReason?: string;
  moderatedAt?: string;
  images: ListingImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  code?: number;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedResult<T> {
  content?: T[];
  items?: T[];
  page?: number;
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  total?: number;
}

// ======================== SPRINT 3 TYPES ========================

export type RentalStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'RETURNED' | 'DISPUTED' | 'CANCELLED';

export interface RentalContract {
  id: number;
  listingId: number;
  listingTitle?: string;
  rentalTerms?: string;
  renterId: number;
  renterName?: string;
  renterKarma?: number;
  ownerId: number;
  ownerName?: string;
  ownerKarma?: number;
  startDate: string;
  endDate: string;
  totalRentAmount: number;
  depositAmount: number;
  proofImages: string[];
  status: RentalStatus;
  disputeReason?: string;
  meetingPoint?: string;
  meetingTime?: string;
  ownerHandoverConfirmed?: boolean;
  renterHandoverConfirmed?: boolean;
  ownerReturnConfirmed?: boolean;
  renterReturnConfirmed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OcrVerificationResult {
  fullName: string;
  studentCode: string;
  universityName: string;
  dateOfBirth?: string;
  major?: string;
  faculty?: string;
  cohort?: string;
  academicYear?: string;
  isPhenikaaStandardCard?: boolean;
  barcodeMatched?: boolean;
  confidenceScore: number;
  matched: boolean;
  autoApproved: boolean;
  karmaAwarded: number;
  message: string;
}

export type ReportReason = 'BOM_HEN' | 'HANG_GIA' | 'SCAM_COC' | 'NOI_DUNG_CAM' | 'SCAM_OR_FRAUD' | 'PROHIBITED_ITEMS' | 'OTHER' | string;
export type ReportStatus = 'PENDING' | 'OPEN' | 'RESOLVED' | 'REJECTED' | string;
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;

export interface ReportItem {
  id: number;
  reporterId: number;
  reporterName: string;
  reportedUserId?: number;
  reportedUserName?: string;
  reportedListingId?: number;
  reportedListingTitle?: string;
  rentalContractId?: number;
  reason: ReportReason;
  description: string;
  evidenceUrl?: string;
  severity: SeverityLevel;
  chatTranscript?: Array<{ sender: string; time: string; text: string }>;
  status: ReportStatus;
  adminResolution?: string;
  actionTaken?: string;
  createdAt: string;
  updatedAt: string;
}

