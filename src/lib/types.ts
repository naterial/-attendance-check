export type WorkerRole = 'Carer' | 'Cook' | 'Cleaner' | 'Executive' | 'Volunteer';
export type Shift = 'Morning' | 'Afternoon' | 'Off Day';

export interface AttendanceRecord {
  id: string;
  name: string;
  role: WorkerRole;
  shift: Shift;
  notes: string;
  timestamp: Date;
}
