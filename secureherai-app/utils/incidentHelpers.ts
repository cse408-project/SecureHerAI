// ==================== Incident Type Helpers ====================

export const getIncidentTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "harassment":
      return "person-off";
    case "theft":
      return "money-off";
    case "assault":
      return "pan-tool";
    case "emergency":
      return "emergency";
    case "accident":
      return "car-crash";
    default:
      return "category";
  }
};

export const getIncidentTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case "harassment":
      return "#DC2626"; // Red
    case "theft":
      return "#7C2D12"; // Brown
    case "assault":
      return "#B91C1C"; // Dark Red
    case "emergency":
      return "#EF4444"; // Bright Red for emergencies
    case "accident":
      return "#F97316"; // Orange
    default:
      return "#6B7280"; // Gray
  }
};

// ==================== Report Status Helpers ====================

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "submitted":
      return "#3B82F6"; // Blue
    case "under_review":
      return "#F59E0B"; // Amber
    case "resolved":
      return "#10B981"; // Green
    default:
      return "#6B7280"; // Gray
  }
};

// ==================== Alert Status Helpers ====================

/**
 * Get color for alert status - unified across the app
 * Use these colors consistently in map markers, alert cards, and status badges
 */
export const getAlertStatusColor = (status: string): string => {
  switch (status?.toUpperCase()) {
    case "CRITICAL":
      return "#DC2626"; // Red-600 - Most urgent
    case "ACTIVE":
      return "#F59E0B"; // Amber-500 - Requires attention
    case "ACCEPTED":
      return "#3B82F6"; // Blue-500 - Responder accepted
    case "EN_ROUTE":
      return "#8B5CF6"; // Purple-500 - Responder on the way
    case "ARRIVED":
      return "#059669"; // Emerald-600 - Responder arrived
    case "RESOLVED":
      return "#10B981"; // Green-500 - Successfully resolved
    case "CANCELED":
      return "#6B7280"; // Gray-500 - User canceled
    case "FALSE_ALARM":
      return "#F97316"; // Orange-500 - False alarm
    case "REJECTED":
      return "#EF4444"; // Red-500 - Rejected
    case "PENDING":
      return "#FBBF24"; // Amber-400 - Pending
    case "FORWARDED":
      return "#06B6D4"; // Cyan-500 - Forwarded
    default:
      return "#6B7280"; // Gray-500
  }
};

/**
 * Get Tailwind class for alert status background
 */
export const getAlertStatusBgClass = (status: string): string => {
  switch (status?.toUpperCase()) {
    case "CRITICAL":
      return "bg-red-100";
    case "ACTIVE":
      return "bg-amber-100";
    case "ACCEPTED":
      return "bg-blue-100";
    case "EN_ROUTE":
      return "bg-purple-100";
    case "ARRIVED":
      return "bg-emerald-100";
    case "RESOLVED":
      return "bg-green-100";
    case "CANCELED":
      return "bg-gray-100";
    case "FALSE_ALARM":
      return "bg-orange-100";
    case "REJECTED":
      return "bg-red-50";
    case "PENDING":
      return "bg-amber-50";
    case "FORWARDED":
      return "bg-cyan-100";
    default:
      return "bg-gray-100";
  }
};

/**
 * Get Tailwind class for alert status text
 */
export const getAlertStatusTextClass = (status: string): string => {
  switch (status?.toUpperCase()) {
    case "CRITICAL":
      return "text-red-700";
    case "ACTIVE":
      return "text-amber-700";
    case "ACCEPTED":
      return "text-blue-700";
    case "EN_ROUTE":
      return "text-purple-700";
    case "ARRIVED":
      return "text-emerald-700";
    case "RESOLVED":
      return "text-green-700";
    case "CANCELED":
      return "text-gray-700";
    case "FALSE_ALARM":
      return "text-orange-700";
    case "REJECTED":
      return "text-red-600";
    case "PENDING":
      return "text-amber-600";
    case "FORWARDED":
      return "text-cyan-700";
    default:
      return "text-gray-700";
  }
};

// ==================== Severity Helpers ====================

/**
 * Get color for alert severity level
 * CRITICAL: Life-threatening danger
 * HIGH: Serious safety threat
 * MEDIUM: Safety concern
 * LOW: General concern
 */
export const getSeverityColor = (severity: string): string => {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return "#DC2626"; // Red-600
    case "HIGH":
      return "#EA580C"; // Orange-600
    case "MEDIUM":
      return "#F59E0B"; // Amber-500
    case "LOW":
      return "#22C55E"; // Green-500
    default:
      return "#6B7280"; // Gray-500
  }
};

/**
 * Get Tailwind class for severity badge background
 */
export const getSeverityBgClass = (severity: string): string => {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return "bg-red-100";
    case "HIGH":
      return "bg-orange-100";
    case "MEDIUM":
      return "bg-amber-100";
    case "LOW":
      return "bg-green-100";
    default:
      return "bg-gray-100";
  }
};

/**
 * Get Tailwind class for severity badge text
 */
export const getSeverityTextClass = (severity: string): string => {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return "text-red-700";
    case "HIGH":
      return "text-orange-700";
    case "MEDIUM":
      return "text-amber-700";
    case "LOW":
      return "text-green-700";
    default:
      return "text-gray-700";
  }
};

/**
 * Get human-readable label for severity
 */
export const getSeverityLabel = (severity: string): string => {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return "Critical - Immediate Danger";
    case "HIGH":
      return "High Priority";
    case "MEDIUM":
      return "Medium Priority";
    case "LOW":
      return "Low Priority";
    default:
      return "Unknown Priority";
  }
};

// ==================== Visibility Helpers ====================

export const getVisibilityIcon = (visibility: string) => {
  switch (visibility) {
    case "public":
      return "public";
    case "officials_only":
      return "admin-panel-settings";
    case "private":
      return "lock";
    default:
      return "visibility";
  }
};

// ==================== Date Formatting ====================

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};
