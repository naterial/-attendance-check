
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Worker, AttendanceRecord, CenterLocation } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AddWorkerForm } from '@/components/add-worker-form';
import { EditWorkerForm } from '@/components/edit-worker-form';
import { PlusCircle, Users, LogOut, QrCode, Edit, Trash2, Download, MapPin, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getWorkers, addWorker, updateWorker, deleteWorker, getAttendanceRecords, getCenterLocation, setCenterLocation as setFirestoreLocation } from '@/lib/firestore';

export default function AdminPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [isAddWorkerOpen, setAddWorkerOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
    const [centerLocation, setCenterLocation] = useState<CenterLocation | null>(null);
    const [isSettingLocation, setIsSettingLocation] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAuthenticated !== 'true') {
            router.push('/admin/login');
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [workersData, locationData] = await Promise.all([
                    getWorkers(),
                    getCenterLocation()
                ]);
                setWorkers(workersData);
                if (locationData) {
                    setCenterLocation(locationData);
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to load data from the database." });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router, toast]);
    
    const fetchWorkers = async () => {
        const workersData = await getWorkers();
        setWorkers(workersData);
    };

    const handleAddWorker = async (newWorkerData: Omit<Worker, 'id'>) => {
       try {
            await addWorker(newWorkerData);
            await fetchWorkers();
            setAddWorkerOpen(false);
            toast({ title: "Success", description: "New worker has been added." });
        } catch (error) {
            console.error("Failed to add worker:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to add worker." });
        }
    };

    const handleUpdateWorker = async (updatedWorker: Worker) => {
        try {
            await updateWorker(updatedWorker.id, updatedWorker);
            await fetchWorkers();
            setEditingWorker(null);
            toast({ title: "Success", description: "Worker details have been updated." });
        } catch (error) {
            console.error("Failed to update worker:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update worker." });
        }
    };

    const handleDeleteWorker = async (workerId: string) => {
        try {
            await deleteWorker(workerId);
            await fetchWorkers();
            toast({ title: "Success", description: "Worker has been deleted." });
        } catch (error) {
            console.error("Failed to delete worker:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to delete worker." });
        }
    };
    
    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        router.push('/admin/login');
    };

    const handleSetLocation = () => {
        setIsSettingLocation(true);
        if (!navigator.geolocation) {
            toast({
                variant: 'destructive',
                title: 'Geolocation Not Supported',
                description: 'Your browser does not support geolocation.',
            });
            setIsSettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    radius: 50, // Default radius in meters
                };
                try {
                    await setFirestoreLocation(newLocation);
                    const fetchedLocation = await getCenterLocation();
                    setCenterLocation(fetchedLocation);
                    toast({
                        title: 'Location Set!',
                        description: 'The new center location has been saved.',
                    });
                } catch (error) {
                     console.error("Failed to save location:", error);
                     toast({
                        variant: 'destructive',
                        title: 'Database Error',
                        description: "Failed to save the location.",
                    });
                } finally {
                    setIsSettingLocation(false);
                }
            },
            (error) => {
                toast({
                    variant: 'destructive',
                    title: 'Failed to Get Location',
                    description: error.message,
                });
                setIsSettingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleExportPdf = async () => {
        const records = await getAttendanceRecords();
        if (records.length === 0) {
            toast({ variant: 'destructive', title: 'No records to export.'});
            return;
        }

        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Vibrant Aging Community Centre - Attendance Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Report generated on: ${format(new Date(), 'PPP p')}`, 14, 29);

        const groupedRecords = records.reduce((acc, record) => {
            const dayKey = format(record.timestamp, 'yyyy-MM-dd');
            if (!acc[dayKey]) {
                acc[dayKey] = [];
            }
            acc[dayKey].push(record);
            return acc;
        }, {} as Record<string, AttendanceRecord[]>);

        const sortedDayKeys = Object.keys(groupedRecords).sort((a,b) => b.localeCompare(a));
        
        let startY = 40;

        sortedDayKeys.forEach(dayKey => {
            const dayRecords = groupedRecords[dayKey];
            const tableTitle = `Date: ${format(new Date(dayKey), "eeee, MMMM d, yyyy")}`;
            
            const tableBody = dayRecords.map(record => [
                record.name,
                record.role,
                record.shift,
                format(record.timestamp, 'p'),
                record.notes
            ]);

            autoTable(doc, {
                startY: startY,
                head: [['Name', 'Role', 'Shift', 'Time', 'Notes']],
                body: tableBody,
                didDrawPage: (data) => {
                    doc.setFontSize(12);
                    doc.text(tableTitle, 14, data.cursor ? data.cursor.y - 10 : 15);
                }
            });

            startY = (doc as any).lastAutoTable.finalY + 15;
        });

        doc.save(`attendance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-body p-4 md:p-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <Link href="/" passHref>
                   <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary cursor-pointer hover:underline">Admin Dashboard</h1>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                     <Button variant="outline" onClick={handleExportPdf}>
                        <Download className="mr-2" /> Export PDF
                     </Button>
                     <Link href="/qr-code" passHref>
                        <Button variant="outline">
                            <QrCode className="mr-2" /> View QR
                        </Button>
                    </Link>
                    <Button variant="ghost" onClick={handleLogout}>
                        <LogOut className="mr-2" /> Logout
                    </Button>
                </div>
            </header>
            <main className="container mx-auto px-0 space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Center Location</CardTitle>
                        <CardDescription>Set the official GPS location for attendance verification.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <Button onClick={handleSetLocation} disabled={isSettingLocation}>
                            {isSettingLocation ? <Loader2 className="mr-2 animate-spin" /> : <MapPin className="mr-2" />}
                            {isSettingLocation ? 'Fetching...' : 'Set Current Location as Center'}
                        </Button>
                        {centerLocation && centerLocation.lat ? (
                            <div className="text-sm text-muted-foreground p-2 rounded-md bg-muted">
                                <p className="font-semibold">Current Location Set:</p>
                                <p>Lat: {centerLocation.lat.toFixed(6)}, Lon: {centerLocation.lon.toFixed(6)}</p>
                                <p>Radius: {centerLocation.radius} meters</p>
                                {centerLocation.updatedAt && (
                                  <p className="text-xs mt-1">Last Updated: {format(centerLocation.updatedAt, 'PPP p')}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-destructive-foreground p-2 rounded-md bg-destructive/80">No location has been set yet.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                                <AddWorkerForm onSubmit={handleAddWorker} workers={workers} />
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {workers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden md:table-cell">Role</TableHead>
                                        <TableHead className="hidden md:table-cell">Shift</TableHead>
                                        <TableHead>PIN</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workers.map((worker) => (
                                        <TableRow key={worker.id}>
                                            <TableCell className="font-medium">{worker.name}</TableCell>
                                            <TableCell className="hidden md:table-cell">{worker.role}</TableCell>
                                            <TableCell className="hidden md:table-cell">{worker.shift}</TableCell>
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
                                                                    This action cannot be undone. This will permanently delete the worker.
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
                            workers={workers}
                            onSubmit={handleUpdateWorker}
                            onCancel={() => setEditingWorker(null)}
                         />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
