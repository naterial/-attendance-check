
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CameraOff, Video, MapPinOff } from 'lucide-react';

const TARGET_COORDINATES = {
    latitude: 5.1054, // Temp: UCC Sam Jonah Library Latitude
    longitude: -1.2905, // Temp: UCC Sam Jonah Library Longitude
};
const MAX_DISTANCE_METERS = 5; // Approx 16 feet for precise location check
const QR_CODE_SECRET = "vibrant-aging-attendance-app:auth-v1";
const QR_READER_ELEMENT_ID = "qr-reader";

export default function ScanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [status, setStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
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

    const handleScanSuccess = (decodedText: string) => {
        if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
            if (decodedText === QR_CODE_SECRET) {
                setStatus('verifying');
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
        if (status === 'verifying') {
            verifyLocation();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);


    useEffect(() => {
        if (status !== 'scanning' || !document.getElementById(QR_READER_ELEMENT_ID)) {
            return;
        }

        const startScanner = async () => {
             // Create a new instance of the scanner
            const scanner = new Html5Qrcode(QR_READER_ELEMENT_ID, { verbose: false });
            scannerRef.current = scanner;

            try {
                // Check for camera permissions first
                 const devices = await Html5Qrcode.getCameras();
                 if (devices && devices.length) {
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
                 } else {
                     setStatus('error');
                     setErrorMessage("No camera devices found on this device.");
                 }
            } catch (err: any) {
                 setStatus('error');
                 if (err.name === 'NotAllowedError') {
                    setErrorMessage("Camera access was denied. Please enable camera permissions in your browser settings and try again.");
                 } else {
                    setErrorMessage(`Failed to start the camera. ${err.message || 'Please try again.'}`);
                 }
            }
        }
        
        startScanner();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(e => console.error("Failed to stop scanner cleanly", e));
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);


    const requestCameraAndStart = () => {
       setStatus('scanning');
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
                            setStatus('idle');
                        }}>
                            Try Again
                        </Button>
                    </div>
                );
            case 'scanning':
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
                        <p className="text-muted-foreground mb-6">Press the button to start the camera.</p>
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
