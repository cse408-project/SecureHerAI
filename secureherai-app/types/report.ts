export interface Location {
  latitude: string;
  longitude: string;
}

export interface SubmitReportRequest {
  incidentType: "harassment" | "theft" | "assault" | "emergency" | "other";
  description: string;
  location?: Location;
  address?: string;
  incidentTime: string; // ISO string
  visibility: "public" | "officials_only" | "private";
  anonymous: boolean;
  alertId?: string;
  evidence?: string[]; // URLs to evidence files
  involvedParties?: string; // JSON string
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ReportSummary {
  reportId: string;
  incidentType: string;
  description: string;
  location: LocationInfo;
  incidentTime: string;
  status: string;
  visibility: string;
  anonymous: boolean;
  createdAt: string;
}

export interface ReportDetails {
  reportId: string;
  userId: string;
  alertId?: string;
  incidentType: string;
  description: string;
  location: LocationInfo;
  address?: string;
  incidentTime: string;
  status: string;
  visibility: string;
  anonymous: boolean;
  actionTaken?: string;
  involvedParties?: string;
  evidence: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GenericReportResponse {
  success: boolean;
  message?: string;
  error?: string;
  reportId?: string;
}

export interface UserReportsResponse {
  success: boolean;
  reports?: ReportSummary[];
  error?: string;
}

export interface ReportDetailsResponse {
  success: boolean;
  report?: ReportDetails;
  error?: string;
}

export interface UploadEvidenceRequest {
  reportId: string;
  evidence: string[]; // URLs to uploaded evidence files
  description?: string;
}

export interface DeleteEvidenceRequest {
  reportId: string;
  evidenceUrl: string;
}

export interface UpdateReportRequest {
  reportId: string;
  incidentType?: "harassment" | "theft" | "assault" | "emergency" | "other";
  description?: string;
  location?: Location;
  address?: string;
  incidentTime?: string;
  visibility?: "public" | "officials_only" | "private";
  anonymous?: boolean;
  actionTaken?: string;
  involvedParties?: string;
  status?: "submitted" | "under_review" | "resolved";
}
