"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { AttendanceForm } from "@/components/attendance-form";
import type { AttendanceRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AttendancePage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleAddRecord = (data: Omit<AttendanceRecord, 'id' | 'timestamp'>) => {
    // In a real app, you would send this to the server/admin view.
    // For this demo, we'll just show a success message and redirect.
    console.log("New Record:", {
      ...data,
      id: new Date().toISOString(),
      timestamp: new Date(),
    });
    
    toast({
        title: "Attendance Submitted!",
        description: `Thank you, ${data.name}. Your attendance has been logged.`,
    });

    setTimeout(() => router.push('/'), 2000);
  };

  return (
    <div className="min-h-screen bg-background font-body flex items-center justify-center p-4">
       <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2" />
            Back to Home
        </Button>
      <main className="container mx-auto px-4 py-8 md:px-6 md:py-12 flex justify-center">
         <div className="w-full max-w-md">
            <AttendanceForm onSubmit={handleAddRecord} />
        </div>
      </main>
    </div>
  );
}
