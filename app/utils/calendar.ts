export const getDateKey = (year: number, month: number, day: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const isValidSlotDuration = (availableMinutes: number, duration: number): boolean => {
  if (availableMinutes < duration) return false;
  const leftoverMinutes = availableMinutes - duration;
  if (leftoverMinutes < 30) return true;
  return leftoverMinutes >= 25;
};