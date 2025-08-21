export type WorkerRole = 'Carer' | 'Cook' | 'Cleaner' | 'Executive' | 'Volunteer';
export type Shift = 'Morning' | 'Afternoon' | 'Off Day';
export type AttendanceStatus = 'pending' | 'approved' | 'rejected';

export interface Worker {
  id: string;
  name: string;
  role: WorkerRole;
  shift: Shift;
  pin: string; // 4-digit PIN
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  name: string;
  role: WorkerRole;
  shift: Shift;
  notes: string;
  timestamp: Date;
  status: AttendanceStatus;
}
