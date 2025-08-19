"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CameraOff } from 'lucide-react';

const TARGET_COORDINATES = {
    latitude: 37.7749, // Replace with Community Centre's Latitude
    longitude: -122.4194, // Replace with Community Centre's Longitude
};
const MAX_DISTANCE_METERS = 20;
const QR_CODE_SECRET = "VibrantAgingCommunityCentreSecret";
const QR_READER_ELEMENT_ID = "qr-reader";

export default function ScanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [status, setStatus] = useState('idle'); // idle, scanning, verifying, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [hasCameraPermission, setHasCameraPermission] = useState(true);

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
        if (status === 'scanning') {
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
      // The library calls this often, even when just searching for a QR code.
      // We are only concerned with permission errors here.
      if (error.includes('NotAllowedError') || error.includes('NotFoundError')) {
        setHasCameraPermission(false);
      }
      console.warn(`QR_READER_ERROR: ${error}`);
    };

    const verifyLocation = () => {
        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMessage("Geolocation is not supported by your browser.");
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
                    setTimeout(() => router.push('/attendance'), 1000);
                } else {
                    setStatus('error');
                    setErrorMessage(`You are too far from the centre. Please move closer and try again. Distance: ${Math.round(distance)}m`);
                }
            },
            () => {
                setStatus('error');
                setErrorMessage("Unable to retrieve your location. Please enable location services in your browser settings.");
            },
            { enableHighAccuracy: true }
        );
    };

    useEffect(() => {
      if (status !== 'scanning' || !hasCameraPermission) return;
  
      const scanner = new Html5QrcodeScanner(
          QR_READER_ELEMENT_ID,
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [] // Use all supported scan types.
          },
          /* verbose= */ false
      );
  
      scanner.render(handleScanSuccess, handleScanError);
  
      return () => {
        // Cleanup on component unmount
        if (scanner) {
          try {
            scanner.clear();
          } catch(e) {
            console.error("Failed to clear scanner", e);
          }
        }
      };
    }, [status, hasCameraPermission]);

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
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                        <Button onClick={() => {
                            setErrorMessage('');
                            setStatus('scanning');
                        }}>
                            Try Again
                        </Button>
                    </div>
                );
            case 'scanning':
            default:
                if (!hasCameraPermission) {
                     return (
                         <div className="text-center p-8 flex flex-col justify-center items-center h-full">
                            <Alert variant="destructive">
                                <CameraOff className="w-6 h-6 mr-2"/>
                                <AlertTitle>Camera Access Denied</AlertTitle>
                                <AlertDescription>Please enable camera permissions in your browser settings to use the scanner.</AlertDescription>
                            </Alert>
                         </div>
                     )
                }
                return <div id={QR_READER_ELEMENT_ID} className="w-full h-full" />;
        }
    };


    return (
        <div className="min-h-screen bg-background font-body flex flex-col items-center justify-center p-4">
             <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={() => router.push('/')}>
                <ArrowLeft className="mr-2" />
                Back to Home
            </Button>
            <div className="w-full max-w-lg mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">Scan QR Code</h1>
                    <p className="text-muted-foreground">Point your camera at the QR code to begin.</p>
                </div>
                
                <div className="bg-card rounded-xl shadow-lg overflow-hidden aspect-square">
                    {status === 'idle' ? (
                        <div className="p-12 text-center flex items-center justify-center h-full">
                            <Button size="lg" onClick={() => setStatus('scanning')}>
                                Start Scanning
                            </Button>
                        </div>
                    ) : (
                        renderContent()
                    )}
                </div>
            </div>
        </div>
    );
}
