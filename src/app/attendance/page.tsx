
"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { AttendancePinForm } from "@/components/attendance-pin-form";
import type { AttendanceRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addAttendanceRecord, getWorkerByPin } from "@/lib/firestore";
import { Loader2 } from "lucide-react";

export default function AttendancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddRecord = async (data: { pin: string; notes?: string; }) => {
    setIsLoading(true);
    try {
        const worker = await getWorkerByPin(data.pin);

        if (!worker) {
            toast({ variant: "destructive", title: "Invalid PIN", description: "The PIN you entered is incorrect." });
            setIsLoading(false);
            return;
        }
        
        const newRecord: Omit<AttendanceRecord, 'id'> = {
          timestamp: new Date(),
          workerId: worker.id,
          name: worker.name,
          role: worker.role,
          shift: worker.shift,
          notes: data.notes || '',
          status: 'pending'
        };
        
        await addAttendanceRecord(newRecord);
        
        toast({
            title: "Attendance Submitted!",
            description: `Thank you, ${worker.name}. Your submission is pending approval.`,
        });

        router.push('/');
    } catch(error) {
        console.error("Failed to submit attendance:", error);
        toast({ variant: "destructive", title: "Database Error", description: "Could not submit your attendance." });
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body flex items-center justify-center p-4">
       <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={() => router.push('/')} disabled={isLoading}>
            <ArrowLeft className="mr-2" />
            Back to Home
        </Button>
      <main className="container mx-auto px-4 py-8 md:px-6 md:py-12 flex justify-center">
         <div className="w-full max-w-md">
            {isLoading ? (
                 <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                    <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
                    <h2 className="text-2xl font-bold">Submitting...</h2>
                </div>
            ) : (
                <AttendancePinForm onSubmit={handleAddRecord} />
            )}
        </div>
      </main>
    </div>
  );
}

    