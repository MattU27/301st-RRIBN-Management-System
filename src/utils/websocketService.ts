import { toast } from 'react-hot-toast';

// Define WebSocket event types
export enum WebSocketEventType {
  ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED',
  ACCOUNT_ACTIVATED = 'ACCOUNT_ACTIVATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  ANNOUNCEMENT_CREATED = 'ANNOUNCEMENT_CREATED',
  NOTIFICATION_CREATED = 'NOTIFICATION_CREATED',
}

// Event interface
interface WebSocketEvent {
  type: WebSocketEventType;
  payload: any;
}

// Callback type for event listeners
type EventCallback = (payload: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private eventListeners: Map<WebSocketEventType, EventCallback[]> = new Map();
  private userId: string | null = null;
  private silentMode = false;
  private isConnecting = false;
  private connectionError = false;

  // Get the WebSocket URL (only call this on the client)
  private getWebSocketURL(): string {
    if (typeof window === 'undefined') {
      return '';
    }
    
    // WebSocket connection URL - using secure WebSocket if in production
    return process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/api/ws` 
      : `ws://${window.location.host}/api/ws`;
  }

  // Initialize WebSocket connection
  connect(userId: string, silent = false): void {
    // Skip if running on server
    if (typeof window === 'undefined') {
      return;
    }
    
    this.userId = userId;
    this.silentMode = silent;
    
    // Don't attempt if we're already connecting
    if (this.isConnecting) {
      return;
    }
    
    // Close existing connection if any
    if (this.socket) {
      this.socket.close();
    }

    try {
      this.isConnecting = true;
      const wsUrl = this.getWebSocketURL();
      // Create new WebSocket connection with user ID in the URL for authentication
      this.socket = new WebSocket(`${wsUrl}?userId=${userId}`);

      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      
      if (!this.silentMode) {
        console.log(`WebSocket: Connecting for user ${userId}...`);
      }
    } catch (error) {
      if (!this.silentMode) {
        console.error('WebSocket: Failed to create connection', error);
      }
      this.isConnecting = false;
      this.connectionError = true;
      this.scheduleReconnect();
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    // Skip if running on server
    if (typeof window === 'undefined') {
      return;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Clear any reconnect timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    this.userId = null;
    this.reconnectAttempts = 0;
    console.log('WebSocket: Disconnected');
  }

  // Add event listener
  addEventListener(eventType: WebSocketEventType, callback: EventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    this.eventListeners.get(eventType)?.push(callback);
  }

  // Remove event listener
  removeEventListener(eventType: WebSocketEventType, callback: EventCallback): void {
    const listeners = this.eventListeners.get(eventType);
    if (!listeners) return;
    
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  // Handle WebSocket open event
  private handleOpen(): void {
    this.isConnecting = false;
    this.connectionError = false;
    if (!this.silentMode) {
      console.log('WebSocket: Connection established');
    }
    this.reconnectAttempts = 0;
  }

  // Handle WebSocket message event
  private handleMessage(event: MessageEvent): void {
    try {
      const data: WebSocketEvent = JSON.parse(event.data);
      console.log('WebSocket: Received message', data);
      
      // Special handling for deactivation messages
      if (data.type === WebSocketEventType.ACCOUNT_DEACTIVATED) {
        console.log('WebSocket: Account deactivation event received', data.payload);
        
        // Ensure a reason is always set
        const deactivationReason = data.payload.reason || 'No reason provided by administrator';
        console.log('WebSocket: Deactivation reason:', deactivationReason);
        
        // CRITICAL: Make sure the reason is stored in sessionStorage
        if (typeof window !== 'undefined') {
          try {
            // First clear any existing reason to avoid persistence issues
            sessionStorage.removeItem('deactivationReason');
            
            // Then set the new reason
            sessionStorage.setItem('deactivationReason', deactivationReason);
            console.log(`WebSocket: Successfully stored deactivation reason in sessionStorage: "${deactivationReason}"`);
            
            // Verify it was stored correctly
            const storedReason = sessionStorage.getItem('deactivationReason');
            console.log(`WebSocket: Verified reason in sessionStorage: "${storedReason}"`);
            
            // For debugging, also set it as a global variable
            (window as any).lastDeactivationReason = deactivationReason;
            console.log('WebSocket: Also stored reason as global variable for debugging');
          } catch (error) {
            console.error('WebSocket: Error storing deactivation reason:', error);
          }
        }
        
        // Also show a toast with the reason for immediate feedback
        if (typeof window !== 'undefined') {
          try {
            toast.error(`Account deactivated: ${deactivationReason}`, {
              duration: 10000, // Longer duration so it's clearly visible
              position: 'top-center'
            });
          } catch (error) {
            console.error('WebSocket: Error showing toast notification:', error);
          }
        }
      }
      
      // Call event listeners for this event type
      const listeners = this.eventListeners.get(data.type);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(data.payload);
          } catch (error) {
            console.error('WebSocket: Error in event listener callback:', error);
          }
        });
      }
    } catch (error) {
      console.error('WebSocket: Error parsing message', error);
    }
  }

  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    this.isConnecting = false;
    
    if (!this.silentMode) {
      console.log(`WebSocket: Connection closed (${event.code}): ${event.reason}`);
    }
    
    // Try to reconnect unless it was a normal closure
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  // Handle WebSocket error
  private handleError(error: Event): void {
    this.isConnecting = false;
    this.connectionError = true;
    
    // Only log the error once, not repeatedly
    if (!this.silentMode && this.reconnectAttempts < 1) {
      // Use a more informative error message that won't clutter the console
      console.warn('WebSocket: Connection error - will retry in background. This is normal if server is not available.');
    }
    
    // Stop trying to reconnect if we've already tried several times
    if (this.reconnectAttempts >= 2) {
      this.silentMode = true;
    }
    
    // Immediately try to reconnect
    this.scheduleReconnect();
  }

  // Schedule reconnection with exponential backoff
  private scheduleReconnect(): void {
    // Skip if running on server
    if (typeof window === 'undefined') {
      return;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (!this.silentMode) {
        console.log('WebSocket: Max reconnect attempts reached');
      }
      
      // After max attempts, future reconnects will be silent
      this.silentMode = true;
      return;
    }
    
    // Clear any existing timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }
    
    // Calculate backoff delay: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    if (!this.silentMode) {
      console.log(`WebSocket: Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    }
    
    this.reconnectTimeoutId = setTimeout(() => {
      if (this.userId) {
        if (!this.silentMode) {
          console.log(`WebSocket: Attempting to reconnect...`);
        }
        this.reconnectAttempts++;
        
        // If we've had persistent errors, go into silent mode for future attempts
        if (this.connectionError && this.reconnectAttempts > 2) {
          this.silentMode = true;
        }
        
        this.connect(this.userId, this.silentMode);
      }
    }, delay);
  }
}

// Create singleton instance
const websocketService = typeof window !== 'undefined' ? new WebSocketService() : null;
export default websocketService; 