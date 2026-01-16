import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

// Event types for WebSocket messages
export interface EmergencyAlertMessage {
  alertId: number;
  victimName: string;
  victimPhone?: string;
  emergencyType: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  distanceKm: number;
  timestamp: string;
  escalationLevel: number;
  batchNumber: number;
  message?: string;
}

export interface AlertUpdateMessage {
  alertId: number;
  status: string;
  updatedBy?: string;
  timestamp: string;
}

export interface NotificationMessage {
  type:
    | "EMERGENCY_ALERT"
    | "ALERT_UPDATE"
    | "ALERT_CANCELLED"
    | "SYSTEM"
    | "RESPONDER_LOCATION"
    | "RESPONDER_UPDATE"
    | "VICTIM_LOCATION";
  payload: EmergencyAlertMessage | AlertUpdateMessage | any;
}

type MessageCallback = (message: NotificationMessage) => void;
type ConnectionCallback = (connected: boolean) => void;

/**
 * WebSocket service for real-time emergency notifications
 */
class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private messageCallbacks: Set<MessageCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 3000;
  private isConnecting: boolean = false;
  private userId: string | null = null;

  /**
   * Initialize and connect WebSocket
   */
  async connect(): Promise<boolean> {
    if (this.isConnecting || this.isConnected()) {
      console.log("WebSocket: Already connected or connecting");
      return true;
    }

    this.isConnecting = true;

    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.log("WebSocket: No auth token, cannot connect");
        this.isConnecting = false;
        return false;
      }

      // Get user ID from stored profile
      const profileStr = await AsyncStorage.getItem("user_profile");
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        this.userId = profile.id?.toString() || profile.email;
      }

      const wsUrl = api.getApiBaseUrl() + "/ws/emergency";
      console.log("WebSocket: Connecting to", wsUrl);

      this.client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          if (__DEV__) {
            console.log("WebSocket Debug:", str);
          }
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => this.onConnected(),
        onDisconnect: () => this.onDisconnected(),
        onStompError: (frame) => this.onError(frame),
        onWebSocketError: (event) => this.onWebSocketError(event),
      });

      this.client.activate();
      return true;
    } catch (error) {
      console.error("WebSocket: Connection error:", error);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Called when WebSocket connects successfully
   */
  private onConnected(): void {
    console.log("WebSocket: Connected successfully");
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Notify listeners
    this.connectionCallbacks.forEach((cb) => cb(true));

    // Subscribe to personal emergency alerts queue
    this.subscribeToEmergencyAlerts();

    // Subscribe to emergency updates (location updates, responder status)
    this.subscribeToEmergencyUpdates();

    // Subscribe to general broadcasts if needed
    this.subscribeToBroadcasts();
  }

  /**
   * Subscribe to personal emergency alerts
   */
  private subscribeToEmergencyAlerts(): void {
    if (!this.client || !this.client.connected) return;

    // User-specific emergency alerts
    const subscription = this.client.subscribe(
      "/user/queue/emergency-alerts",
      (message: IMessage) => {
        this.handleMessage(message, "EMERGENCY_ALERT");
      }
    );
    this.subscriptions.set("emergency-alerts", subscription);
    console.log("WebSocket: Subscribed to emergency alerts");
  }

  /**
   * Subscribe to emergency updates (responder location, status updates)
   * This is where victims receive responder location and vice versa
   */
  private subscribeToEmergencyUpdates(): void {
    if (!this.client || !this.client.connected) return;

    // User-specific emergency updates (location, status)
    const subscription = this.client.subscribe(
      "/user/queue/emergency-updates",
      (message: IMessage) => {
        try {
          const body = JSON.parse(message.body);
          // Route based on message type
          const type = body.type || "ALERT_UPDATE";
          this.handleMessage(message, type);
        } catch {
          this.handleMessage(message, "ALERT_UPDATE");
        }
      }
    );
    this.subscriptions.set("emergency-updates", subscription);
    console.log("WebSocket: Subscribed to emergency updates (location/status)");
  }

  /**
   * Subscribe to broadcast notifications
   */
  private subscribeToBroadcasts(): void {
    if (!this.client || !this.client.connected) return;

    // General broadcast channel for system-wide notifications
    const broadcastSub = this.client.subscribe(
      "/topic/broadcasts",
      (message: IMessage) => {
        this.handleMessage(message, "SYSTEM");
      }
    );
    this.subscriptions.set("broadcasts", broadcastSub);
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: IMessage, defaultType: string): void {
    try {
      const body = JSON.parse(message.body);
      const notification: NotificationMessage = {
        type: body.type || defaultType,
        payload: body.payload || body,
      };

      console.log("WebSocket: Received message:", notification.type);

      // Notify all registered callbacks
      this.messageCallbacks.forEach((callback) => {
        try {
          callback(notification);
        } catch (error) {
          console.error("WebSocket: Error in message callback:", error);
        }
      });
    } catch (error) {
      console.error("WebSocket: Error parsing message:", error);
    }
  }

  /**
   * Called when WebSocket disconnects
   */
  private onDisconnected(): void {
    console.log("WebSocket: Disconnected");
    this.isConnecting = false;
    this.subscriptions.clear();

    // Notify listeners
    this.connectionCallbacks.forEach((cb) => cb(false));

    // Attempt reconnection
    this.attemptReconnect();
  }

  /**
   * Handle STOMP protocol errors
   */
  private onError(frame: any): void {
    console.error("WebSocket: STOMP error:", frame.headers?.message || frame);
    this.isConnecting = false;
  }

  /**
   * Handle WebSocket errors
   */
  private onWebSocketError(event: any): void {
    console.error("WebSocket: Connection error:", event);
    this.isConnecting = false;
  }

  /**
   * Attempt to reconnect after disconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("WebSocket: Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);

    console.log(
      `WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.isConnected()) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.client) {
      // Unsubscribe from all
      this.subscriptions.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch {
          // Ignore unsubscribe errors
        }
      });
      this.subscriptions.clear();

      // Deactivate client
      this.client.deactivate();
      this.client = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    console.log("WebSocket: Disconnected by user");
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Add listener for incoming messages
   */
  addMessageListener(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  /**
   * Add listener for connection status changes
   */
  addConnectionListener(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    // Immediately notify of current status
    callback(this.isConnected());
    return () => this.connectionCallbacks.delete(callback);
  }

  /**
   * Send acknowledgment for received alert
   */
  acknowledgeAlert(alertId: number): void {
    if (!this.client || !this.client.connected) {
      console.warn("WebSocket: Cannot acknowledge, not connected");
      return;
    }

    this.client.publish({
      destination: "/app/emergency/acknowledge",
      body: JSON.stringify({ alertId, userId: this.userId }),
    });
  }

  /**
   * Send response to emergency alert
   */
  respondToAlert(alertId: number, accepted: boolean): void {
    if (!this.client || !this.client.connected) {
      console.warn("WebSocket: Cannot respond, not connected");
      return;
    }

    this.client.publish({
      destination: "/app/emergency/respond",
      body: JSON.stringify({
        alertId,
        userId: this.userId,
        accepted,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Send location update for responder (to victim)
   */
  sendLocationUpdate(
    alertId: number,
    latitude: number,
    longitude: number
  ): void {
    if (!this.client || !this.client.connected) {
      return;
    }

    this.client.publish({
      destination: "/app/emergency/location",
      body: JSON.stringify({
        alertId,
        userId: this.userId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Send victim's location update (to responders)
   * Used by victims to share their real-time location with responding helpers
   */
  sendVictimLocationUpdate(
    alertId: number,
    latitude: number,
    longitude: number
  ): void {
    if (!this.client || !this.client.connected) {
      console.warn("WebSocket: Cannot send victim location, not connected");
      return;
    }

    this.client.publish({
      destination: "/app/emergency/victim-location",
      body: JSON.stringify({
        alertId,
        userId: this.userId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      }),
    });
    console.log("WebSocket: Sent victim location update for alert", alertId);
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; reconnecting: boolean; attempts: number } {
    return {
      connected: this.isConnected(),
      reconnecting: this.isConnecting,
      attempts: this.reconnectAttempts,
    };
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
