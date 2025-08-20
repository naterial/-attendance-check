
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from 'lucide-react';
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
};

export default function ScanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const hasStartedScanning = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && !hasStartedScanning.current) {
            hasStartedScanning.current = true;
            
            const html5Qrcode = new Html5Qrcode(QR_READER_ELEMENT_ID, { verbose: false });
            scannerRef.current = html5Qrcode;

            const onScanSuccess = async (decodedText: string) => {
                if (isProcessing) return;
                setIsProcessing(true);
                
                if (scannerRef.current && scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }

                if (decodedText !== QR_CODE_SECRET) {
                    setErrorMessage("Invalid QR Code. Please scan the official attendance code.");
                    setIsProcessing(false);
                    return;
                }

                try {
                    const centerLocation = await getCenterLocation();
                    if (!centerLocation || !centerLocation.lat || !centerLocation.lon || !centerLocation.radius) {
                        setErrorMessage("Center location not set. An admin must set it first.");
                        setIsProcessing(false);
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
                                setIsProcessing(false);
                            }
                        },
                        (geoError) => {
                            setErrorMessage(`Could not get location: ${geoError.message}. Please enable location services.`);
                            setIsProcessing(false);
                        },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                } catch (dbError: any) {
                    setErrorMessage(`Database error: ${dbError.message}`);
                    setIsProcessing(false);
                }
            };
            
            const onScanFailure = (error: any) => {
                // This is called frequently, only log critical errors if needed
            };

            html5Qrcode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                onScanSuccess,
                onScanFailure
            ).catch(err => {
                 setErrorMessage(`Failed to start camera: ${err.message || 'Unknown error'}`);
            });
        }
        
        return () => {
             if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => {
                    console.error("Failed to stop scanner on cleanup", err);
                });
             }
        };
    }, [isProcessing, router, toast]);
    

    const renderContent = () => {
        if (isProcessing) {
             return (
                <div className="flex flex-col items-center justify-center p-8 h-full">
                    <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
                    <h2 className="text-2xl font-bold">Verifying...</h2>
                </div>
            );
        }

        if (errorMessage) {
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
        }

        return (
            <div id={QR_READER_ELEMENT_ID} className="w-full h-full bg-black" />
        );
    };

    return (
        <div className="min-h-screen bg-background font-body flex flex-col items-center justify-center p-4">
             <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-4 left-4 z-20" 
                onClick={() => router.push('/')}
                disabled={isProcessing}
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
