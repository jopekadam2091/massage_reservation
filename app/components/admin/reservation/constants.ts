import { DayOfWeek } from './types';

export const GENERATE_24H_TIME_OPTIONS = (): string[] => {
  const times: string[] = [];
  for (let h = 8; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
};

export const TIME_OPTIONS = GENERATE_24H_TIME_OPTIONS();

export const DAYS_OF_WEEK: DayOfWeek[] = [
  { id: 1, sk: 'PO', en: 'MO' },
  { id: 2, sk: 'UT', en: 'TU' },
  { id: 3, sk: 'ST', en: 'WE' },
  { id: 4, sk: 'ŠT', en: 'TH' },
  { id: 5, sk: 'PI', en: 'FR' },
  { id: 6, sk: 'SO', en: 'SA' },
  { id: 0, sk: 'NE', en: 'SU' },
];

export const MONTH_NAMES = {
  sk: ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};