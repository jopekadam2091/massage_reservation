export type DashboardProps = {
  language: string;
};

export type Client = {
  id: string;
  full_name?: string;
  email?: string;
};

export type CalendarEvent = {
  id: string;
  summary?: string;
  start?: {
    dateTime?: string;
  };
  end?: {
    dateTime?: string;
  };
};

export type DayOfWeek = {
  id: number;
  sk: string;
  en: string;
};