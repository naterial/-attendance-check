"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Worker } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AddWorkerForm } from '@/components/add-worker-form';
import { EditWorkerForm } from '@/components/edit-worker-form';
import { PlusCircle, Users, LogOut, QrCode, Edit, Trash2 } from 'lucide-react';

export default function AdminPage() {
    const router = useRouter();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [isAddWorkerOpen, setAddWorkerOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAuthenticated !== 'true') {
            router.push('/admin/login');
        }
        
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

    const handleUpdateWorker = (updatedWorker: Worker) => {
        const updatedWorkers = workers.map(w => w.id === updatedWorker.id ? updatedWorker : w);
        setWorkers(updatedWorkers);
        localStorage.setItem('workers', JSON.stringify(updatedWorkers));
        setEditingWorker(null);
    };

    const handleDeleteWorker = (workerId: string) => {
        const updatedWorkers = workers.filter(w => w.id !== workerId);
        setWorkers(updatedWorkers);
        localStorage.setItem('workers', JSON.stringify(updatedWorkers));
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
                                        <TableHead>PIN</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workers.map((worker) => (
                                        <TableRow key={worker.id}>
                                            <TableCell className="font-medium">{worker.name}</TableCell>
                                            <TableCell>{worker.role}</TableCell>
                                            <TableCell>{worker.shift}</TableCell>
                                            <TableCell>****</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="icon" onClick={() => setEditingWorker(worker)}>
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="icon">
                                                                <Trash2 className="h-4 w-4" />
                                                                <span className="sr-only">Delete</span>
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete the worker
                                                                    and all associated attendance records.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteWorker(worker.id)}>
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
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

            {editingWorker && (
                 <Dialog open={!!editingWorker} onOpenChange={(isOpen) => !isOpen && setEditingWorker(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Worker Details</DialogTitle>
                        </DialogHeader>
                        <EditWorkerForm
                            worker={editingWorker}
                            onSubmit={handleUpdateWorker}
                            onCancel={() => setEditingWorker(null)}
                         />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
