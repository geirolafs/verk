/** Parse YYYY-MM-DD from folder name prefix and return relative time (3 chars, right-aligned) */
export function relativeTimeFromPrefix(name: string): string {
  const match = name.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return "";
  const date = new Date(match[1]! + "T00:00:00");
  if (isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  let label: string;
  if (days < 7) label = `${days}d`;
  else if (days < 35) label = `${Math.floor(days / 7)}w`;
  else if (days < 365) label = `${Math.floor(days / 30)}m`;
  else label = `${Math.floor(days / 365)}y`;
  return label.padStart(3);
}
