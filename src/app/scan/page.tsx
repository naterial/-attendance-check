"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CameraOff, Video, MapPinOff } from 'lucide-react';

const TARGET_COORDINATES = {
    latitude: 37.7749, // Replace with Community Centre's Latitude
    longitude: -122.4194, // Replace with Community Centre's Longitude
};
const MAX_DISTANCE_METERS = 200; // Increased distance for testing
const QR_CODE_SECRET = "vibrant-aging-attendance-app:auth-v1";
const QR_READER_ELEMENT_ID = "qr-reader";

export default function ScanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [status, setStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'error'>('idle'); 
    const [errorMessage, setErrorMessage] = useState('');
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const getDistance = (coords1: GeolocationCoordinates, coords2: { latitude: number, longitude: number }) => {
        const toRad = (x: number) => x * Math.PI / 180;
        const R = 6371e3; // metres
        const dLat = toRad(coords2.latitude - coords1.latitude);
        const dLon = toRad(coords2.longitude - coords1.longitude);
        const lat1 = toRad(coords1.latitude);
        const lat2 = toRad(coords2.latitude);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleScanSuccess = async (decodedText: string) => {
        if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
            try {
                await scannerRef.current.stop();
            } catch (e) {
                console.warn("Scanner already stopped or failed to stop:", e)
            }
            if (decodedText === QR_CODE_SECRET) {
                setStatus('verifying');
                verifyLocation();
            } else {
                setStatus('error');
                setErrorMessage("Invalid QR Code. Please scan the official QR code.");
            }
        }
    };
    
    const handleScanError = (error: any) => {
      // This is called frequently, so we only log for debugging.
      // console.warn(`QR_READER_ERROR: ${error}`);
    };

    const verifyLocation = () => {
        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMessage("Geolocation is not supported by your browser. Please use a different browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const distance = getDistance(position.coords, TARGET_COORDINATES);
                if (distance <= MAX_DISTANCE_METERS) {
                    setStatus('success');
                    toast({
                        title: 'Verification Successful!',
                        description: 'Redirecting to the attendance form.',
                    });
                    router.push('/attendance');
                } else {
                    setStatus('error');
                    setErrorMessage(`You are too far from the centre. Please move closer and try again. Distance: ${Math.round(distance)}m`);
                }
            },
            (error) => {
                setStatus('error');
                let message = "Unable to retrieve your location. Please enable location services in your browser settings.";
                if (error.code === error.PERMISSION_DENIED) {
                    message = "Location access was denied. Please enable location permissions for this site in your browser settings.";
                }
                setErrorMessage(message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        const startScanner = async () => {
            if (status !== 'scanning' || hasCameraPermission !== true || !document.getElementById(QR_READER_ELEMENT_ID)) return;
    
            const scanner = new Html5Qrcode(QR_READER_ELEMENT_ID, { verbose: false });
            scannerRef.current = scanner;
    
            try {
                await scanner.start(
                    { facingMode: "environment" },
                    { 
                        fps: 10, 
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                            const qrboxSize = Math.floor(minEdge * 0.7);
                            return { width: qrboxSize, height: qrboxSize };
                        },
                    },
                    handleScanSuccess,
                    handleScanError
                );
            } catch (err) {
                 console.error("Scanner start error:", err);
                 setStatus('error');
                 setErrorMessage("Failed to start the camera. It might be in use by another application or permissions were denied.");
            }
        };

        if(status === 'scanning' && hasCameraPermission) {
            startScanner();
        }

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(e => console.error("Failed to stop scanner cleanly", e));
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, hasCameraPermission]);


    const requestCameraAndStart = async () => {
        setStatus('scanning');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            // Stop the tracks immediately to free up the camera for the library
            stream.getTracks().forEach(track => track.stop());
            setHasCameraPermission(true);
        } catch (err) {
            console.error("Camera permission error:", err);
            setHasCameraPermission(false);
            setErrorMessage("Camera access was denied. Please enable camera permissions in your browser settings and refresh the page.");
            setStatus('error');
        }
    };

    const renderContent = () => {
        switch (status) {
            case 'verifying':
                return (
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                        <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
                        <h2 className="text-2xl font-bold">Verifying Location...</h2>
                        <p className="text-muted-foreground">Please wait while we confirm you're at the center.</p>
                    </div>
                );
            case 'success':
                 return (
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                         <h2 className="text-2xl font-bold text-green-600">Success!</h2>
                        <p className="text-muted-foreground">Redirecting you now...</p>
                    </div>
                );
            case 'error':
                return (
                    <div className="text-center p-8 flex flex-col justify-center items-center h-full">
                        <Alert variant="destructive" className="mb-6">
                            {errorMessage.includes("Camera") ? <CameraOff className="w-6 h-6 mr-2"/> : <MapPinOff className="w-6 h-6 mr-2" />}
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                        <Button onClick={() => {
                            setErrorMessage('');
                            setHasCameraPermission(null);
                            setStatus('idle');
                        }}>
                            Try Again
                        </Button>
                    </div>
                );
            case 'scanning':
                if (hasCameraPermission === false) {
                     // The error state will render, this prevents flicker
                     return null;
                }
                return (
                    <div className="relative w-full h-full bg-black">
                       <div id={QR_READER_ELEMENT_ID} className="w-full h-full" />
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[250px] h-[250px] border-4 border-primary/80 rounded-lg shadow-inner" />
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
                        <p className="text-muted-foreground mb-6">Please grant camera access to begin.</p>
                        <Button size="lg" onClick={requestCameraAndStart}>
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
