/**
 * WebSocket client manager with Exponential Backoff Reconnection & Heartbeat
 * Resolves [BUG-02]: Sửa lỗi mất kết nối WebSocket khi đổi mạng từ Wi-Fi trường sang 4G
 */
export class ChatSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000; // 1 second
  private maxDelay = 30000; // 30 seconds
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  private isExplicitlyClosed = false;

  constructor(url: string = 'ws://localhost:8080/ws-chat') {
    this.url = url;
    this.setupNetworkListeners();
  }

  public connect() {
    this.isExplicitlyClosed = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Kết nối thành công tới:', this.url);
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('status', { status: 'CONNECTED' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
        } catch {
          // Plain text frame
          this.emit('message', event.data);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.emit('status', { status: 'DISCONNECTED' });
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.warn('[WebSocket] Lỗi kết nối:', error);
        this.emit('status', { status: 'ERROR' });
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Đã vượt quá số lần thử kết nối lại tối đa');
      this.emit('status', { status: 'FAILED' });
      return;
    }

    // Exponential Backoff: delay = min(maxDelay, baseDelay * 2^attempts)
    const delay = Math.min(
      this.maxDelay,
      this.baseDelay * Math.pow(2, this.reconnectAttempts)
    );
    this.reconnectAttempts++;

    console.log(`[WebSocket] Thử kết nối lại lần ${this.reconnectAttempts} sau ${delay}ms...`);
    this.emit('status', { status: 'RECONNECTING', attempt: this.reconnectAttempts, delay });

    setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    // Heartbeat ping every 25 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      // Reconnect immediately when user switches Wi-Fi to 4G or network is back online
      window.addEventListener('online', () => {
        console.log('[WebSocket] Mạng đã hoạt động trở lại, kết nối ngay lập tức...');
        this.reconnectAttempts = 0;
        this.connect();
      });

      window.addEventListener('offline', () => {
        console.warn('[WebSocket] Mất kết nối internet');
        this.emit('status', { status: 'OFFLINE' });
      });
    }
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }

  public on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) return;
    const filtered = this.listeners.get(event)!.filter((cb) => cb !== callback);
    this.listeners.set(event, filtered);
  }

  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((cb) => cb(data));
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const chatSocket = new ChatSocketClient();
