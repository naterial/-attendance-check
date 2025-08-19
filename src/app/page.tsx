"use client";

import { useState } from "react";
import Link from 'next/link';
import { AttendanceCard } from "@/components/attendance-card";
import type { AttendanceRecord } from "@/lib/types";
import { User, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  return (
    <div className="min-h-screen bg-background font-body">
      <main className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">
            Vibrant Aging Community Centre
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A central place for team members to log their daily attendance and share quick updates.
          </p>
        </header>

        <div className="text-center mb-12">
          <Link href="/scan" passHref>
            <Button size="lg" className="h-14 text-lg">
              <QrCode className="mr-3 size-6" />
              Scan QR to Sign In
            </Button>
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold font-headline">Attendance Log</h2>
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
                <p className="text-sm text-muted-foreground mt-1">Workers can sign in using the QR code scanner.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
