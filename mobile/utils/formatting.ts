export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${Math.round(distance * 10) / 10}km`;
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return d.toLocaleDateString();
  }
};

export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatFullDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString([], { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const formatInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

export const formatHobbies = (hobbies: Array<{ name: string }>): string => {
  if (hobbies.length === 0) return 'No hobbies';
  if (hobbies.length === 1) return hobbies[0].name;
  if (hobbies.length === 2) return hobbies.map(h => h.name).join(' and ');
  return `${hobbies.slice(0, -1).map(h => h.name).join(', ')} and ${hobbies[hobbies.length - 1].name}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatLocation = (country?: string, city?: string): string => {
  if (!country && !city) return 'Location not set';
  if (country && city) return `${city}, ${country}`;
  return country || city || 'Location not set';
};
