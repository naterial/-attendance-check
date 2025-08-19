
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { AttendancePinForm } from "@/components/attendance-pin-form";
import type { AttendanceRecord, Worker } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AttendancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    // In a real app, you'd fetch this from a database.
    const storedWorkers = localStorage.getItem('workers');
    if (storedWorkers) {
      setWorkers(JSON.parse(storedWorkers));
    } else {
        toast({
            variant: "destructive",
            title: "No Workers Found",
            description: "Admin needs to add workers before attendance can be taken.",
        });
        router.push('/');
    }
  }, [router, toast]);

  const handleAddRecord = (data: { workerId: string; pin: string; notes: string; }) => {
    const worker = workers.find(w => w.id === data.workerId);

    if (!worker) {
        toast({ variant: "destructive", title: "Error", description: "Selected worker not found." });
        return;
    }
    
    if (worker.pin !== data.pin) {
        toast({ variant: "destructive", title: "Invalid PIN", description: "The PIN you entered is incorrect." });
        return;
    }

    const newRecord: AttendanceRecord = {
      id: new Date().toISOString(),
      timestamp: new Date(),
      workerId: worker.id,
      name: worker.name,
      role: worker.role,
      shift: worker.shift,
      notes: data.notes,
    };
    
    const existingRecords: AttendanceRecord[] = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const updatedRecords = [...existingRecords, newRecord];
    localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));

    // Trigger storage event for other tabs
    window.dispatchEvent(new Event('storage'));
    
    toast({
        title: "Attendance Submitted!",
        description: `Thank you, ${worker.name}. Your attendance has been logged.`,
    });

    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background font-body flex items-center justify-center p-4">
       <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2" />
            Back to Home
        </Button>
      <main className="container mx-auto px-4 py-8 md:px-6 md:py-12 flex justify-center">
         <div className="w-full max-w-md">
            <AttendancePinForm workers={workers} onSubmit={handleAddRecord} />
        </div>
      </main>
    </div>
  );
}
