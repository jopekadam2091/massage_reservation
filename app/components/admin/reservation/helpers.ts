import { MONTH_NAMES } from './constants';

export const formatFullDateText = (dateStr: string, language: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const monthList = language === 'sk' ? MONTH_NAMES.sk : MONTH_NAMES.en;
  const monthText = monthList[d.getMonth()];
  return `${day}. ${monthText} ${d.getFullYear()}`;
};

export const format24hTimeText = (isoString: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', hour12: false });
};