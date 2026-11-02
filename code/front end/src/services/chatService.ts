import api from './api';
import { apiClient } from '../lib/axios';
import { PHENIKAA_SAFE_MEETING_POINTS } from '../constants/phenikaaData';

export interface ChatMessage {
  id: number;
  chatRoomId?: number;
  senderId?: number;
  sender?: 'ME' | 'PEER';
  senderName?: string;
  senderAvatar?: string;
  content?: string;
  text?: string;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'OFFER_PRICE' | 'MEETING_POINT';
  time?: string;
  createdAt?: string;
  isRead?: boolean;
  isWarning?: boolean;
  replyTo?: {
    id: number;
    senderName: string;
    text: string;
  };
  meetingPointData?: {
    name: string;
    address: string;
    hours: string;
  };
}

export interface ChatRoom {
  id: number;
  listingId?: number;
  sellerId?: number;
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

const mockMeetingPoints: SafeMeetingPoint[] = PHENIKAA_SAFE_MEETING_POINTS;

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

  uploadChatImage: async (file: File): Promise<{ success: boolean; data?: { url: string } }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<any>('/student/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res && res.data && res.data.data?.url) {
        return { success: true, data: { url: res.data.data.url } };
      }
      return { success: false };
    } catch (err) {
      // Local fallback object url if server storage unavailable
      const localUrl = URL.createObjectURL(file);
      return { success: true, data: { url: localUrl } };
    }
  },

  uploadChatMedia: async (file: File): Promise<{ success: boolean; data?: { url: string; mediaType: 'IMAGE' | 'VIDEO' } }> => {
    const isVideo = file.type.startsWith('video/');
    const mediaType: 'IMAGE' | 'VIDEO' = isVideo ? 'VIDEO' : 'IMAGE';
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<any>('/student/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res && res.data && res.data.data?.url) {
        return { success: true, data: { url: res.data.data.url, mediaType } };
      }
      return { success: false };
    } catch (err) {
      const localUrl = URL.createObjectURL(file);
      return { success: true, data: { url: localUrl, mediaType } };
    }
  },

  markRoomAsRead: async (roomId: number): Promise<{ success: boolean }> => {
    try {
      return await api.patch(`/student/chat/rooms/${roomId}/read`);
    } catch {
      return { success: false };
    }
  },

  getContacts: async (): Promise<{ success: boolean; data: any[] }> => {
    try {
      const res = await api.get<any[]>('/student/chat/contacts');
      return res;
    } catch {
      return { success: true, data: [] };
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
