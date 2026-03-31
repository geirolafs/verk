export function relativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function isStale(timestamp: number, thresholdDays = 30): boolean {
  const days = (Date.now() - timestamp * 1000) / (1000 * 60 * 60 * 24);
  return days > thresholdDays;
}

/** Parse YYYY-MM-DD from folder name prefix and return relative time */
export function relativeTimeFromPrefix(name: string): string {
  const match = name.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return "";
  const date = new Date(match[1]! + "T00:00:00");
  if (isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}
