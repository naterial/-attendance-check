
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Video, VideoOff } from 'lucide-react';
import { getCenterLocation } from '@/lib/firestore';

const QR_CODE_SECRET = "vibrant-aging-attendance-app:auth-v1";
const QR_READER_ELEMENT_ID = "qr-reader";

// Haversine formula for distance calculation
const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function ScanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'processing' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerRef = useRef<HTMLDivElement>(null);

    const cleanupScanner = useCallback(async () => {
        if (scannerRef.current) {
            const scanner = scannerRef.current;
            scannerRef.current = null;
            if (scanner.isScanning) {
                try {
                    await scanner.stop();
                } catch (e) {
                    console.warn("Error stopping scanner:", e);
                }
            }
        }
    }, []);

    useEffect(() => {
        return () => {
            cleanupScanner();
        };
    }, [cleanupScanner]);

    const startScanner = useCallback(async () => {
        if (scannerRef.current || !readerRef.current) return;

        setScanState('scanning');
        setErrorMessage('');

        try {
            const newScanner = new Html5Qrcode(QR_READER_ELEMENT_ID, { verbose: false });
            scannerRef.current = newScanner;

            await newScanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const qrboxSize = Math.floor(minEdge * 0.8);
                        return { width: qrboxSize, height: qrboxSize };
                    },
                    aspectRatio: 1.0,
                },
                async (decodedText) => {
                    // --- Scan Success ---
                    if (scannerRef.current) {
                        setScanState('processing');
                        await cleanupScanner();

                        if (decodedText !== QR_CODE_SECRET) {
                            setErrorMessage("Invalid QR Code. Please scan the official attendance code.");
                            setScanState('error');
                            return;
                        }

                        // Verify Location
                        try {
                            const centerLocation = await getCenterLocation();
                            if (!centerLocation) {
                                setErrorMessage("Center location not set. An admin must set it first.");
                                setScanState('error');
                                return;
                            }

                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    const distance = getDistanceFromLatLonInM(
                                        position.coords.latitude,
                                        position.coords.longitude,
                                        centerLocation.lat,
                                        centerLocation.lon
                                    );

                                    if (distance <= centerLocation.radius) {
                                        toast({ title: 'Location Verified!', description: 'Redirecting to attendance form.' });
                                        router.push('/attendance');
                                    } else {
                                        setErrorMessage(`You are too far from the centre. Distance: ${Math.round(distance)}m. Required: within ${centerLocation.radius}m.`);
                                        setScanState('error');
                                    }
                                },
                                (geoError) => {
                                    setErrorMessage(`Could not get location: ${geoError.message}. Please enable location services.`);
                                    setScanState('error');
                                },
                                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                            );
                        } catch (dbError: any) {
                            setErrorMessage(`Database error: ${dbError.message}`);
                            setScanState('error');
                        }
                    }
                },
                (scanError) => { 
                    // This callback is called frequently, ignore non-critical errors.
                }
            );
        } catch (err: any) {
            let message = `Failed to start camera: ${err.message || 'Unknown error'}`;
            if (err.name === 'NotAllowedError') {
                message = "Camera access was denied. Please enable camera permissions in browser settings.";
            }
            setErrorMessage(message);
            setScanState('error');
            await cleanupScanner();
        }
    }, [cleanupScanner, router, toast]);

    const renderContent = () => {
        switch (scanState) {
            case 'processing':
                return (
                    <div className="flex flex-col items-center justify-center p-8 h-full">
                        <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
                        <h2 className="text-2xl font-bold">Verifying Location...</h2>
                        <p className="text-muted-foreground">Please wait a moment.</p>
                    </div>
                );
            case 'error':
                return (
                    <div className="text-center p-8 flex flex-col justify-center items-center h-full">
                        <Alert variant="destructive" className="mb-6">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                        <Button onClick={() => setScanState('idle')}>
                            Try Again
                        </Button>
                    </div>
                );
            case 'scanning':
                return (
                    <div className="relative w-full h-full bg-black">
                       <div id={QR_READER_ELEMENT_ID} ref={readerRef} className="w-full h-full" />
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[70vw] h-[70vw] max-w-[300px] max-h-[300px] border-4 border-primary/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                       </div>
                       <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-black/60 px-3 py-1 rounded-md">
                           Align QR code within the box
                       </p>
                    </div>
                );
            case 'idle':
            default:
                 return (
                    <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                        <Video className="w-16 h-16 text-primary mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Ready to Scan</h2>
                        <p className="text-muted-foreground mb-6">Press the button to start the camera and scan the QR code for attendance.</p>
                        <Button size="lg" onClick={startScanner}>
                            Start Camera
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-background font-body flex flex-col items-center justify-center p-4">
             <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-4 left-4 z-20" 
                onClick={() => router.push('/')}
                disabled={scanState === 'processing'}
             >
                <ArrowLeft className="mr-2" />
                Back to Home
            </Button>
            <div className="w-full max-w-lg mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">Scan QR Code</h1>
                    <p className="text-muted-foreground">Point your camera at the QR code to sign in.</p>
                </div>
                
                <div className="bg-card rounded-xl shadow-lg overflow-hidden aspect-square flex items-center justify-center">
                   {renderContent()}
                </div>
            </div>
        </div>
    );
}
