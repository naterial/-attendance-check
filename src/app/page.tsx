
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { AttendanceCard } from "@/components/attendance-card";
import type { AttendanceRecord } from "@/lib/types";
import { User, LogIn, ShieldCheck, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parse } from "date-fns";
import { onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "attendanceRecords"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedRecords = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as any).toDate()
            } as AttendanceRecord;
        });
        setRecords(fetchedRecords);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching real-time records:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const groupedRecords = records.reduce((acc, record) => {
      const dayKey = format(record.timestamp, 'yyyy-MM-dd');
      if (!acc[dayKey]) {
          acc[dayKey] = [];
      }
      acc[dayKey].push(record);
      acc[dayKey].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  const sortedDayKeys = Object.keys(groupedRecords).sort((a,b) => b.localeCompare(a));


  return (
    <div className="min-h-screen bg-background font-body">
      <header className="absolute top-4 right-4 z-10">
          <Link href="/admin" passHref>
            <Button variant="outline">
              <ShieldCheck className="mr-2" />
              Admin
            </Button>
          </Link>
        </header>
      <main className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <header className="text-center mb-10 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-bold font-headline text-primary mb-2">
            Vibrant Aging Community Centre
          </h1>
          <p className="text-md md:text-lg text-muted-foreground max-w-2xl mx-auto">
            A central place for team members to log their daily attendance.
          </p>
        </header>

        <div className="text-center mb-10 md:mb-12">
          <Link href="/scan" passHref>
            <Button size="lg" className="h-12 text-md md:h-14 md:text-lg">
              <ScanLine className="mr-3 size-5 md:size-6" />
              Scan to Sign In
            </Button>
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl md:text-3xl font-bold font-headline">Attendance Log</h2>
             <span className="text-sm font-medium bg-muted text-muted-foreground rounded-full px-3 py-1">{records.length} Total</span>
           </div>
          {isLoading ? (
             <div className="flex justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
          ) : records.length > 0 ? (
            <div className="space-y-8">
              {sortedDayKeys.map((dayKey) => (
                <div key={dayKey}>
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-lg md:text-xl font-bold font-headline">
                        {format(parse(dayKey, 'yyyy-MM-dd', new Date()), "eeee, MMMM d")}
                    </h3>
                    <div className="flex-grow border-t border-dashed"></div>
                  </div>
                  <div className="space-y-4">
                    {groupedRecords[dayKey].map((record) => (
                      <AttendanceCard key={record.id} record={record} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 md:py-20 border-2 border-dashed rounded-lg bg-muted/50">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-muted-foreground/10 text-muted-foreground">
                      <User className="w-8 h-8"/>
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-foreground/80">No attendance records yet.</h3>
                <p className="text-sm text-muted-foreground mt-1 px-2">Workers can mark their attendance to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

    