"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Worker } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddWorkerForm } from '@/components/add-worker-form';
import { PlusCircle, Users, LogOut, QrCode } from 'lucide-react';

export default function AdminPage() {
    const router = useRouter();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [isAddWorkerOpen, setAddWorkerOpen] = useState(false);

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAuthenticated !== 'true') {
            router.push('/admin/login');
        }
        
        // In a real app, you'd fetch this from a database.
        const storedWorkers = localStorage.getItem('workers');
        if (storedWorkers) {
            setWorkers(JSON.parse(storedWorkers));
        }
    }, [router]);

    const handleAddWorker = (newWorker: Omit<Worker, 'id'>) => {
        const workerWithId = { ...newWorker, id: new Date().toISOString() };
        const updatedWorkers = [...workers, workerWithId];
        setWorkers(updatedWorkers);
        localStorage.setItem('workers', JSON.stringify(updatedWorkers));
        setAddWorkerOpen(false);
    };
    
    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        router.push('/admin/login');
    };

    return (
        <div className="min-h-screen bg-background font-body p-4">
            <header className="flex justify-between items-center mb-8">
                <Link href="/" passHref>
                   <h1 className="text-3xl font-bold font-headline text-primary cursor-pointer hover:underline">Admin Dashboard</h1>
                </Link>
                <div className="flex items-center gap-4">
                     <Link href="/qr-code" passHref>
                        <Button variant="outline">
                            <QrCode className="mr-2" /> View QR Code
                        </Button>
                    </Link>
                    <Button variant="ghost" onClick={handleLogout}>
                        <LogOut className="mr-2" /> Logout
                    </Button>
                </div>
            </header>
            <main className="container mx-auto">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Worker Management</CardTitle>
                            <CardDescription>Add, view, and manage worker details.</CardDescription>
                        </div>
                        <Dialog open={isAddWorkerOpen} onOpenChange={setAddWorkerOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2"/>
                                    Add Worker
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add a New Worker</DialogTitle>
                                </DialogHeader>
                                <AddWorkerForm onSubmit={handleAddWorker} />
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {workers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Shift</TableHead>
                                        <TableHead>4-Digit PIN</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workers.map((worker) => (
                                        <TableRow key={worker.id}>
                                            <TableCell>{worker.name}</TableCell>
                                            <TableCell>{worker.role}</TableCell>
                                            <TableCell>{worker.shift}</TableCell>
                                            <TableCell>{worker.pin}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                             <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/50">
                                <div className="flex justify-center mb-4">
                                  <div className="p-4 rounded-full bg-muted-foreground/10 text-muted-foreground">
                                      <Users className="w-8 h-8"/>
                                  </div>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground/80">No workers added yet.</h3>
                                <p className="text-sm text-muted-foreground mt-1">Click "Add Worker" to get started.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
