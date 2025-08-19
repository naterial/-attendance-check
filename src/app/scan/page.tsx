
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Video, VideoOff } from 'lucide-react';
import { getCenterLocation } from '@/lib/firestore';

const QR_CODE_SECRET = "vibrant-aging-attendance-app:auth-v1";
const QR_READER_ELEMENT_ID = "qr-reader";
const MAX_ALLOWED_DISTANCE_METERS = 5;

const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};


export default function ScanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [status, setStatus] = useState<'idle' | 'scanning' | 'verifying' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerRef = useRef<HTMLDivElement>(null);

    const cleanupScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
            } catch (e) {
                console.warn("Scanner already stopped or failed to stop.", e);
            }
        }
        scannerRef.current = null;
    };
    
    useEffect(() => {
        return () => {
            cleanupScanner();
        };
    }, []);

    const handleScanSuccess = async (decodedText: string) => {
        if (scannerRef.current?.getState() !== Html5QrcodeScannerState.SCANNING) {
            return;
        }

        setStatus('verifying');
        await cleanupScanner();

        if (decodedText !== QR_CODE_SECRET) {
            setErrorMessage("Invalid QR Code. Please scan the official QR code.");
            setStatus('error');
            return;
        }

        try {
            const centerLocation = await getCenterLocation();
            if (!centerLocation) {
                setErrorMessage("The center's location has not been set by an admin yet.");
                setStatus('error');
                return;
            }

            if (!navigator.geolocation) {
                setErrorMessage("Geolocation is not supported by your browser.");
                setStatus('error');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;
                    const distance = getDistanceInMeters(userLat, userLon, centerLocation.lat, centerLocation.lon);
                    
                    if (distance <= MAX_ALLOWED_DISTANCE_METERS) {
                        toast({
                            title: 'Location Verified!',
                            description: 'Redirecting to the attendance form.',
                        });
                        router.push('/attendance');
                    } else {
                        setErrorMessage(`You are too far from the centre. Please move closer and try again. Distance: ${Math.round(distance)}m`);
                        setStatus('error');
                    }
                },
                (error) => {
                    setErrorMessage(`Could not get your location: ${error.message}`);
                    setStatus('error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } catch (dbError) {
             setErrorMessage("Could not retrieve the center's location from the database.");
             setStatus('error');
        }
    };

    const handleScanError = (error: any) => {
        // This is called frequently, only act on critical errors
    };

    const startScanner = async () => {
        if (scannerRef.current || !readerRef.current) return;
        
        setStatus('scanning');
        setErrorMessage('');

        const newScanner = new Html5Qrcode(QR_READER_ELEMENT_ID, { verbose: false });
        scannerRef.current = newScanner;

        try {
            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                 setErrorMessage("No camera found on this device.");
                 setStatus('error');
                 return;
            }
            
            await newScanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const qrboxSize = Math.floor(minEdge * 0.75);
                        return { width: qrboxSize, height: qrboxSize };
                    },
                },
                handleScanSuccess,
                handleScanError
            );
        } catch (err: any) {
             if (err.name === 'NotAllowedError') {
                setErrorMessage("Camera access was denied. Please enable camera permissions in your browser settings and try again.");
             } else {
                setErrorMessage(`Failed to start camera: ${err.message || 'Unknown error'}`);
             }
             setStatus('error');
             await cleanupScanner();
        }
    };


    const renderContent = () => {
        switch (status) {
            case 'verifying':
                return (
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
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
                        <Button onClick={() => setStatus('idle')}>
                            Try Again
                        </Button>
                    </div>
                );
            case 'scanning':
                return (
                    <div className="relative w-full h-full bg-black">
                       <div id={QR_READER_ELEMENT_ID} ref={readerRef} className="w-full h-full" />
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[70vw] h-[70vw] max-w-[300px] max-h-[300px] border-4 border-primary/80 rounded-lg shadow-inner" />
                       </div>
                       <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-xs bg-black/50 px-2 py-1 rounded">
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
             <Button variant="ghost" size="sm" className="absolute top-4 left-4 z-20" onClick={() => router.push('/')}>
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

    
