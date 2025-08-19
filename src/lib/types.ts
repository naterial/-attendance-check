export type TeamCategory = 'Frontend' | 'Backend' | 'Full Stack';

export interface AttendanceRecord {
  id: string;
  name: string;
  team: TeamCategory;
  notes: string;
}
