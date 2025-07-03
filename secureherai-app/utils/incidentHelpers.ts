export const getIncidentTypeIcon = (type: string) => {
  switch (type) {
    case 'harassment':
      return 'person-off';
    case 'theft':
      return 'money-off';
    case 'assault':
      return 'pan-tool';
    default:
      return 'category';
  }
};

export const getIncidentTypeColor = (type: string) => {
  switch (type) {
    case 'harassment':
      return '#DC2626'; // Red
    case 'theft':
      return '#7C2D12'; // Brown
    case 'assault':
      return '#B91C1C'; // Dark Red
    default:
      return '#6B7280'; // Gray
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted':
      return '#3B82F6';
    case 'under_review':
      return '#F59E0B';
    case 'resolved':
      return '#10B981';
    default:
      return '#6B7280';
  }
};

export const getVisibilityIcon = (visibility: string) => {
  switch (visibility) {
    case 'public':
      return 'public';
    case 'officials_only':
      return 'admin-panel-settings';
    case 'private':
      return 'lock';
    default:
      return 'visibility';
  }
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
