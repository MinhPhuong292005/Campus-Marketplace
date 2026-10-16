import api from './api';

export interface ChatMessage {
  id: number;
  chatRoomId?: number;
  senderId?: number;
  sender?: 'ME' | 'PEER';
  senderName?: string;
  senderAvatar?: string;
  content?: string;
  text?: string;
  messageType?: 'TEXT' | 'IMAGE' | 'OFFER_PRICE' | 'MEETING_POINT';
  time?: string;
  createdAt?: string;
  isRead?: boolean;
  isWarning?: boolean;
  meetingPointData?: {
    name: string;
    address: string;
    hours: string;
  };
}

export interface ChatRoom {
  id: number;
  listingId?: number;
  listingTitle?: string;
  listingPrice?: number;
  listingImage?: string;
  listingType?: string;
  peerUserId: number;
  peerName: string;
  peerAvatar?: string;
  peerKarma?: number;
  peerCampus?: string;
  peerStatus?: string;
  peerBlockReason?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface AntiFraudResult {
  isSuspicious: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flaggedKeywords: string[];
  warningMessage: string;
  recommendedAction: string;
}

export interface SafeMeetingPoint {
  id: number;
  name: string;
  address: string;
  campusName: string;
  description: string;
  locationDescription?: string;
  recommendedHours: string;
  isCctvMonitored: boolean;
}

const mockMeetingPoints: SafeMeetingPoint[] = [
  {
    id: 1,
    name: 'Thư viện Tạ Quang Bửu / Thư viện Trung Tâm',
    address: 'Tầng 1 sảnh chính, có bảo vệ và camera giám sát',
    campusName: 'Khuôn viên chính',
    description: 'Không gian yên tĩnh, an ninh cao, có bàn ghế kiểm tra máy móc thiết bị',
    recommendedHours: '08:00 - 18:00 (Thứ 2 - Thứ 7)',
    isCctvMonitored: true,
  },
  {
    id: 2,
    name: 'Sảnh Lễ tân Ký túc xá (KTX B5)',
    address: 'Sảnh tòa B5 KTX Sinh viên',
    campusName: 'Khu KTX Sinh viên',
    description: 'Điểm hẹn đông người qua lại, gần phòng trực ban quản lý KTX',
    recommendedHours: '07:00 - 21:00 hàng ngày',
    isCctvMonitored: true,
  },
  {
    id: 3,
    name: 'Căng tin Trung Tâm Trường',
    address: 'Khu nhà Căng tin sinh viên cơ sở chính',
    campusName: 'Khu dịch vụ sinh viên',
    description: 'Địa điểm sáng sủa, thoải mái trò chuyện trao đổi sách vở và giáo trình',
    recommendedHours: '07:30 - 19:30 hàng ngày',
    isCctvMonitored: true,
  },
  {
    id: 4,
    name: 'Phòng tự học Chung Nhà A2',
    address: 'Tầng 2 tòa nhà A2',
    campusName: 'Khu giảng đường',
    description: 'Có ổ cắm điện, wifi trường để test laptop, thiết bị điện tử',
    recommendedHours: '08:00 - 21:00 hàng ngày',
    isCctvMonitored: true,
  },
];

export const chatService = {
  getRooms: async (): Promise<{ success: boolean; data: ChatRoom[] }> => {
    try {
      const res = await api.get<ChatRoom[]>('/student/chat/rooms');
      if (res && res.data && Array.isArray(res.data)) {
        return res;
      }
      return { success: true, data: [] };
    } catch {
      return { success: true, data: [] };
    }
  },

  getRoomMessages: async (roomId: number): Promise<{ success: boolean; data: ChatMessage[] }> => {
    try {
      const res = await api.get<ChatMessage[]>(`/student/chat/rooms/${roomId}/messages`);
      return res;
    } catch {
      return { success: false, data: [] };
    }
  },

  sendMessage: async (chatRoomId: number, content: string, messageType: string = 'TEXT'): Promise<{ success: boolean; data: ChatMessage }> => {
    return api.post<ChatMessage>('/student/chat/messages', {
      chatRoomId,
      content,
      messageType,
    });
  },

  markRoomAsRead: async (roomId: number): Promise<{ success: boolean }> => {
    try {
      return await api.patch(`/student/chat/rooms/${roomId}/read`);
    } catch {
      return { success: false };
    }
  },

  createOrGetRoom: async (peerUserId: number, listingId?: number): Promise<{ success: boolean; data: ChatRoom }> => {
    return api.post<ChatRoom>('/student/chat/rooms', {
      peerUserId,
      listingId,
    });
  },

  getSafeMeetingPoints: async (campusId?: number): Promise<{ success: boolean; data: SafeMeetingPoint[] }> => {
    try {
      const res = await api.get<SafeMeetingPoint[]>(`/student/safe-meeting-points${campusId ? `?campusId=${campusId}` : ''}`);
      return res;
    } catch {
      return { success: true, data: mockMeetingPoints };
    }
  },

  scanAntiFraud: async (content: string): Promise<{ success: boolean; data: AntiFraudResult }> => {
    try {
      const res = await api.post<AntiFraudResult>('/student/anti-fraud/scan', { content });
      return res;
    } catch {
      // Local regex simulation
      const lower = content.toLowerCase();
      const depositKeywords = ['chuyển cọc', 'đặt cọc trước', 'chuyển tiền trước', 'cọc gấp', 'gửi cọc', 'cọc 50%'];
      const phishingKeywords = ['bấm vào link', 'nhấp vào link', 'bit.ly', 'tinyurl', 'link nhận tiền'];
      const cardKeywords = ['nạp thẻ', 'thẻ cào', 'mã thẻ cào', 'nạp card'];

      const detected: string[] = [];
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      let warning = '';
      let action = 'Tiếp tục trao đổi bình thường.';

      depositKeywords.forEach((k) => {
        if (lower.includes(k)) detected.push(k);
      });
      phishingKeywords.forEach((k) => {
        if (lower.includes(k)) detected.push(k);
      });
      cardKeywords.forEach((k) => {
        if (lower.includes(k)) detected.push(k);
      });

      if (detected.length > 0) {
        riskLevel = 'HIGH';
        warning = '⚠️ CẢNH BÁO: Phát hiện dấu hiệu rủi ro (yêu cầu cọc tiền trước hoặc link lạ). Tuyệt đối không chuyển tiền cọc trước khi gặp kiểm tra đồ trực tiếp!';
        action = 'Hẹn gặp tại Điểm hẹn an toàn trong trường (Thư viện, Sảnh KTX) để kiểm tra đồ.';
      }

      return {
        success: true,
        data: {
          isSuspicious: detected.length > 0,
          riskLevel,
          flaggedKeywords: detected,
          warningMessage: warning,
          recommendedAction: action,
        },
      };
    }
  },
};
