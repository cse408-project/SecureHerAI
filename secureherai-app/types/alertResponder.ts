export interface AlertResponder {
  alertId: string;
  responderId: string;
  status: 'accepted' | 'en_route' | 'arrived' | 'resolved';
  acceptedAt: string;
  eta?: string;
}
export interface CreateResponderRequest {
  alertId: string;
  responderId: string;
}

export interface UpdateResponderStatusRequest {
  alertId: string;
  responderId: string;
  status: 'accepted' | 'en_route' | 'arrived' | 'resolved';
  eta?: string;
}
export interface ResponderDetails {
  alertId: string;
  responderId: string;
  responderName: string;
  status: 'accepted' | 'en_route' | 'arrived' | 'resolved';
  acceptedAt: string;
  updatedAt: string;
  eta?: string;
  userDetails?: {
    userId: string;
    name: string;
    phone: string;
    email?: string;
  };
}