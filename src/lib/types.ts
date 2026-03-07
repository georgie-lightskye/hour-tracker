export interface User {
  uid: string;
  email: string;
  role: "developer" | "manager";
  displayName: string;
}

export interface Break {
  start: Date;
  end: Date | null;
}

export interface Task {
  description: string;
  category: string;
  subtasks: string[];
  billable: boolean;
  flagged?: boolean;
  hours: number; // how many hours this task took from the session
}

export interface Entry {
  id: string;
  userId: string;
  date: Date;
  checkIn: Date;
  checkOut: Date | null;
  breaks: Break[];
  tasks: Task[];
  resources: string[];
  notes: string;
  totalHours: number;
  activeHours: number;
  billableHours: number;
  status: "in-progress" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface TimerState {
  isRunning: boolean;
  checkInTime: Date | null;
  breaks: Break[];
  currentEntryId: string | null;
}

export type DateRange = {
  start: Date;
  end: Date;
};

export type SummaryData = {
  totalHours: number;
  activeHours: number;
  billableHours: number;
  categoryBreakdown: Record<string, number>;
  dailyHours: { date: string; hours: number }[];
};
