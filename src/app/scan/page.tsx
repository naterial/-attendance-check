
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
const QR_READER_ELEMENT_ID = "qr-reader-video";

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
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const cleanupScanner = useCallback(async () => {
        if (scannerRef.current) {
            const scanner = scannerRef.current;
            if (scanner.isScanning) {
                try {
                    await scanner.stop();
                } catch (e) {
                    console.warn("Error stopping scanner:", e);
                }
            }
            scannerRef.current = null;
        }
    }, []);

    useEffect(() => {
        const getCameraPermission = async () => {
            try {
                // Ensure there's a navigator object
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setErrorMessage("Camera not supported on this browser.");
                    setScanState('error');
                    return;
                }
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            } catch (error: any) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                let message = `Failed to start camera: ${error.message || 'Unknown error'}`;
                if (error.name === 'NotAllowedError') {
                    message = "Camera access was denied. Please enable camera permissions in browser settings.";
                } else if (error.name === 'NotFoundError') {
                     message = "No suitable camera found on this device.";
                }
                setErrorMessage(message);
                setScanState('error');
            }
        };

        getCameraPermission();
        
        // Cleanup function
        return () => {
            cleanupScanner();
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cleanupScanner]);

    const startScanner = useCallback(async () => {
        if (scannerRef.current || !videoRef.current) return;
    
        setScanState('scanning');
        setErrorMessage('');
    
        try {
            const newScanner = new Html5Qrcode(QR_READER_ELEMENT_ID, { verbose: false });
            scannerRef.current = newScanner;

            const onScanSuccess = async (decodedText: string) => {
                if (scanState === 'scanning') {
                    setScanState('processing');
                    await cleanupScanner();

                    if (decodedText !== QR_CODE_SECRET) {
                        setErrorMessage("Invalid QR Code. Please scan the official attendance code.");
                        setScanState('error');
                        return;
                    }

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
            };
            
            // Attach scanner to the existing video element
            await newScanner.start(
                QR_READER_ELEMENT_ID,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                onScanSuccess,
                (scanError) => { /* This callback is called frequently, ignore non-critical errors. */ }
            );

        } catch (err: any) {
            setErrorMessage(`Failed to start scanner: ${err.message || 'Unknown error'}`);
            setScanState('error');
            await cleanupScanner();
        }
    }, [cleanupScanner, router, toast, scanState]);

    const renderContent = () => {
        switch (scanState) {
            case 'processing':
                return (
                    <div className="flex flex-col items-center justify-center p-8 h-full">
                        <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
                        <h2 className="text-2xl font-bold">Verifying...</h2>
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
                        <Button onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </div>
                );
            case 'scanning':
                return (
                    <div className="relative w-full h-full bg-black">
                       <video id={QR_READER_ELEMENT_ID} ref={videoRef} className="w-full h-full object-cover" muted playsInline />
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
                        {!hasCameraPermission ? (
                             <div className="flex flex-col items-center justify-center">
                                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                                <h2 className="text-xl font-bold">Requesting Camera...</h2>
                                <p className="text-muted-foreground mt-2">Please allow camera access in your browser.</p>
                            </div>
                        ) : (
                            <>
                                <Video className="w-16 h-16 text-primary mb-4" />
                                <h2 className="text-2xl font-bold mb-2">Ready to Scan</h2>
                                <p className="text-muted-foreground mb-6">Press the button to start the scanner.</p>
                                <Button size="lg" onClick={startScanner}>
                                    Start Scanner
                                </Button>
                            </>
                        )}
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

    