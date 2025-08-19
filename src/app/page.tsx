"use client";

import { useState } from "react";
import { AttendanceForm } from "@/components/attendance-form";
import { AttendanceCard } from "@/components/attendance-card";
import type { AttendanceRecord } from "@/lib/types";
import { User } from "lucide-react";

const initialRecords: AttendanceRecord[] = [
  {
    id: '1',
    name: 'Ada Lovelace',
    role: 'Carer',
    shift: 'Morning',
    notes: 'Assisted residents with morning routines.',
  },
  {
    id: '2',
    name: 'Grace Hopper',
    role: 'Cook',
    shift: 'Afternoon',
    notes: 'Prepared lunch and dinner for the residents.',
  },
    {
    id: '3',
    name: 'Hedy Lamarr',
    role: 'Cleaner',
    shift: 'Morning',
    notes: 'Cleaned the common areas and resident rooms.',
  },
];


export default function Home() {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);

  const handleAddRecord = (data: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...data,
      id: new Date().toISOString() + Math.random(),
    };
    setRecords(prev => [newRecord, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <main className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">
            Community Home Attendance
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A central place for team members to log their daily attendance and share quick updates.
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-1 lg:sticky lg:top-8">
            <AttendanceForm onSubmit={handleAddRecord} />
          </div>
          
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold font-headline">Log</h2>
              <span className="text-sm font-medium bg-muted text-muted-foreground rounded-full px-3 py-1">{records.length} Records</span>
            </div>
            {records.length > 0 ? (
              <div className="space-y-4">
                {records.map((record) => (
                  <AttendanceCard key={record.id} record={record} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/50">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-muted-foreground/10 text-muted-foreground">
                        <User className="w-8 h-8"/>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground/80">No attendance records yet.</h3>
                  <p className="text-sm text-muted-foreground mt-1">Fill out the form to add the first one!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
