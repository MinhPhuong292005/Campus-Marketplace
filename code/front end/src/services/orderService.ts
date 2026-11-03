import { reportService } from './reportService';
import { adminNotificationService } from './adminNotificationService';
import { listingService } from './listingService';

export interface PurchaseOrder {
  id: string; // e.g. 'ORD-2026-9021'
  listingId: number;
  listingTitle: string;
  listingImage: string;
  sellerId: number;
  sellerName: string;
  sellerStudentCode?: string;
  buyerId: number;
  buyerName: string;
  buyerStudentCode?: string;
  price: number;
  deposit?: number;
  transactionType?: 'SELL' | 'RENT';
  quantity?: number;
  rentalDays?: number;
  paymentMethod?: 'DIRECT' | 'CASH' | 'BANK_TRANSFER' | 'VIETQR';
  paymentStatus?: 'PAID' | 'PENDING';
  meetingPoint?: string;
  meetingDate?: string;
  meetingTime?: string;
  meetingNote?: string;
  orderDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  disputeReason?: string;
  refundAmount?: number;
  disputeDescription?: string;
  evidenceUrl?: string;
  solution?: 'REFUND_RETURN' | 'REFUND_ONLY' | 'EXCHANGE';
}

const STORAGE_KEY = 'campus_student_orders_fresh_v3';

// Xóa cache đơn hàng cũ có dữ liệu mẫu
try {
  localStorage.removeItem('campus_student_orders_v2');
  localStorage.removeItem('campus_student_orders');
} catch {}

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];

export const orderService = {
  getMyOrders: (): PurchaseOrder[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  createOrder: (payload: {
    listingId: number;
    listingTitle: string;
    listingImage: string;
    sellerId: number;
    sellerName: string;
    sellerStudentCode?: string;
    buyerId: number;
    buyerName: string;
    buyerStudentCode?: string;
    price: number;
    deposit?: number;
    transactionType?: 'SELL' | 'RENT';
    quantity?: number;
    rentalDays?: number;
    paymentMethod?: 'DIRECT' | 'CASH' | 'BANK_TRANSFER' | 'VIETQR';
    paymentStatus?: 'PAID' | 'PENDING';
    meetingPoint?: string;
    meetingDate?: string;
    meetingTime?: string;
    meetingNote?: string;
    status?: PurchaseOrder['status'];
  }): PurchaseOrder => {
    const orders = orderService.getMyOrders();
    const newOrder: PurchaseOrder = {
      id: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      listingId: payload.listingId,
      listingTitle: payload.listingTitle,
      listingImage: payload.listingImage,
      sellerId: payload.sellerId,
      sellerName: payload.sellerName,
      sellerStudentCode: payload.sellerStudentCode,
      buyerId: payload.buyerId,
      buyerName: payload.buyerName,
      buyerStudentCode: payload.buyerStudentCode,
      price: payload.price,
      deposit: payload.deposit || 0,
      transactionType: payload.transactionType,
      quantity: payload.quantity,
      rentalDays: payload.rentalDays,
      paymentMethod: payload.paymentMethod || 'DIRECT',
      paymentStatus: payload.paymentStatus || 'PENDING',
      meetingPoint: payload.meetingPoint,
      meetingDate: payload.meetingDate,
      meetingTime: payload.meetingTime,
      meetingNote: payload.meetingNote,
      orderDate: new Date().toISOString(),
      status: payload.status || 'PENDING',
    };

    const updated = [newOrder, ...orders];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('campus_orders_updated', { detail: updated }));
    return newOrder;
  },

  confirmOrder: (
    orderId: string,
    details: {
      meetingPoint: string;
      meetingDate: string;
      meetingTime: string;
      meetingNote?: string;
    }
  ): PurchaseOrder | null => {
    const list = orderService.getMyOrders();
    let updatedOrder: PurchaseOrder | null = null;
    const updated = list.map((o) => {
      if (o.id === orderId) {
        updatedOrder = {
          ...o,
          status: 'CONFIRMED' as const,
          meetingPoint: details.meetingPoint,
          meetingDate: details.meetingDate,
          meetingTime: details.meetingTime,
          meetingNote: details.meetingNote,
        };
        return updatedOrder;
      }
      return o;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('campus_orders_updated', { detail: updated }));
    return updatedOrder;
  },

  updateOrderStatus: (orderId: string, status: PurchaseOrder['status']) => {
    const list = orderService.getMyOrders();
    const updated = list.map((o) => (o.id === orderId ? { ...o, status } : o));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('campus_orders_updated', { detail: updated }));
  },

  getOrderByListingId: (listingId: number, buyerId?: number): PurchaseOrder | null => {
    const orders = orderService.getMyOrders();
    return (
      orders.find(
        (o) =>
          o.listingId === listingId &&
          (buyerId ? o.buyerId === buyerId : true) &&
          (o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'DELIVERED' || o.status === 'COMPLETED' || o.status === 'DISPUTED')
      ) || null
    );
  },

  submitDispute: async (
    orderId: string,
    payload: {
      reason: string;
      solution: 'REFUND_RETURN' | 'REFUND_ONLY' | 'EXCHANGE';
      refundAmount: number;
      description: string;
      evidenceUrl?: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    const orders = orderService.getMyOrders();
    const targetOrder = orders.find((o) => o.id === orderId);

    if (!targetOrder) {
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }

    // 1. Update local order status to DISPUTED
    const updated = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: 'DISPUTED' as const,
            disputeReason: payload.reason,
            solution: payload.solution,
            refundAmount: payload.refundAmount,
            disputeDescription: payload.description,
            evidenceUrl: payload.evidenceUrl,
          }
        : o
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. Dispatch event for UI reactivity
    window.dispatchEvent(new CustomEvent('campus_orders_updated', { detail: updated }));

    // 3. Sync to backend reports
    try {
      await reportService.createReport({
        reportedUserId: targetOrder.sellerId,
        reportedListingId: targetOrder.listingId,
        reason: 'DISPUTE_ORDER',
        description: `[Khiếu nại Đơn #${orderId}] ${payload.reason}: ${payload.description} (Yêu cầu hoàn ${payload.refundAmount.toLocaleString()} đ)`,
        evidenceUrl: payload.evidenceUrl || '',
        severity: 'HIGH',
      });
    } catch {
      // Ignore network errors
    }

    // 4. Directly push notification to Admin Notification Bell
    try {
      adminNotificationService.addNotification({
        type: 'DISPUTE',
        title: `Khiếu nại đơn mua #${orderId} - ${targetOrder.listingTitle}`,
        studentId: targetOrder.sellerId,
        studentName: targetOrder.sellerName,
        studentEmail: `${targetOrder.sellerId}@st.phenikaa-uni.edu.vn`,
        studentCode: targetOrder.sellerStudentCode,
        reportedListingId: targetOrder.listingId,
        reportedListingTitle: targetOrder.listingTitle,
        reportedListingPrice: targetOrder.price,
        reporterName: targetOrder.buyerName,
        violationReason: `Khiếu nại: ${payload.reason} - Yêu cầu hoàn ${payload.refundAmount.toLocaleString()} đ`,
        message: `Người mua đã gửi yêu cầu Trả hàng / Hoàn tiền cho đơn hàng #${orderId}.\nPhương án mong muốn: ${
          payload.solution === 'REFUND_RETURN'
            ? 'Trả hàng & Hoàn tiền 100%'
            : payload.solution === 'REFUND_ONLY'
            ? 'Hoàn tiền ngay'
            : 'Đổi hàng khác'
        }.\nNội dung chi tiết: ${payload.description}`,
        imageUrl: payload.evidenceUrl || targetOrder.listingImage,
      });
    } catch {
      // Ignore
    }

    return {
      success: true,
      message: 'Gửi yêu cầu Trả hàng / Hoàn tiền thành công! Hệ thống sẽ tiếp nhận và phản hồi sớm.',
    };
  },

  cancelDispute: (orderId: string) => {
    const list = orderService.getMyOrders();
    const updated = list.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: 'COMPLETED' as const,
            disputeReason: undefined,
            disputeDescription: undefined,
            refundAmount: undefined,
            evidenceUrl: undefined,
            solution: undefined,
          }
        : o
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('campus_orders_updated', { detail: updated }));
    return { success: true };
  },

  cancelOrder: async (orderId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const orders = orderService.getMyOrders();
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }

    // 1. Cập nhật trạng thái đơn hàng thành DISPUTED / Hủy
    const updated = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: 'DISPUTED' as const,
            disputeReason: `Đã hủy giao dịch: ${reason}`,
          }
        : o
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('campus_orders_updated', { detail: updated }));

    // 2. Tự động hồi phục lại bài đăng về trạng thái ACTIVE
    try {
      if (targetOrder.listingId) {
        await listingService.updateListingStatus(targetOrder.listingId, 'ACTIVE');
      }
    } catch {}

    return {
      success: true,
      message: 'Đã hủy đơn hàng và tự động khôi phục lại bài đăng hoạt động.',
    };
  },
};
