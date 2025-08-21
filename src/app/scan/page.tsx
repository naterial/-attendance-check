
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner, Html5QrcodeError } from 'html5-qrcode';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Video, VideoOff, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const QR_CODE_VALUE = "VibrantAgingCommunityCentre";

type ScanState = 'idle' | 'scanning' | 'verifying' | 'success' | 'error';

export default function ScanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    const handleBack = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(err => console.error("Failed to clear scanner:", err));
        }
        router.push('/');
    };

    useEffect(() => {
        // Delay initialization to allow page transition
        const timer = setTimeout(() => {
            if (scanState === 'idle') {
                setScanState('scanning');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [scanState]);


    useEffect(() => {
        if (scanState !== 'scanning' || scannerRef.current) {
            return;
        }

        const onScanSuccess = (decodedText: string) => {
            if (scanState === 'verifying' || scanState === 'success') return;
            
            setScanState('verifying');
            scannerRef.current?.pause(true);

            if (decodedText === QR_CODE_VALUE) {
                toast({
                    title: "QR Code Verified!",
                    description: "Please enter your PIN to complete sign-in.",
                });
                setScanState('success');
                if (scannerRef.current) {
                   scannerRef.current.clear().catch(err => console.error("Failed to clear scanner on success:", err));
                }
                router.push('/attendance');
            } else {
                toast({
                    variant: "destructive",
                    title: "Invalid QR Code",
                    description: "Please scan the official centre QR code.",
                });
                setScanState('scanning');
                scannerRef.current?.resume();
            }
        };

        const onScanError = (error: Html5QrcodeError) => {
            // This callback is called frequently, so we don't log every error.
            // We only care about permission errors here.
             if (error.name.includes("NotAllowedError") || error.name.includes("PERMISSION_DENIED")) {
                setHasCameraPermission(false);
                setScanState('error');
             }
        };
        
        try {
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    rememberLastUsedCamera: true,
                    supportedScanTypes: [], // Use all available scan types
                },
                false // verbose
            );

            scanner.render(onScanSuccess, onScanError);
            scannerRef.current = scanner;
            setHasCameraPermission(true);

        } catch (error: any) {
            console.error("Scanner Initialization Error:", error);
            setHasCameraPermission(false);
            setScanState('error');
            toast({
                variant: 'destructive',
                title: 'Camera Error',
                description: 'Could not initialize the camera. Please check permissions and try again.',
            });
        }


        // Cleanup function
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Cleanup failed:", err));
                scannerRef.current = null;
            }
        };
    }, [scanState, router, toast]);

    const renderContent = () => {
        switch (scanState) {
            case 'verifying':
            case 'success':
                return (
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                        <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
                        <h2 className="text-2xl font-bold">{scanState === 'verifying' ? 'Verifying...' : 'Success!'}</h2>
                        <p className="text-muted-foreground">{scanState === 'verifying' ? 'Checking the QR code.' : 'Redirecting you now...'}</p>
                    </div>
                );
            case 'error':
                 return (
                     <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                         <VideoOff className="w-16 h-16 text-destructive mb-4" />
                         <h2 className="text-2xl font-bold">Camera Access Denied</h2>
                         <p className="text-muted-foreground mt-2 max-w-sm">
                             To sign in, this app needs permission to use your camera. Please enable camera access in your browser settings for this site.
                         </p>
                         <Button onClick={() => window.location.reload()} className="mt-6">Retry</Button>
                     </div>
                 );
            case 'idle':
            case 'scanning':
            default:
                return (
                    <>
                        <CardHeader>
                            <CardTitle className="font-headline">Scan QR Code</CardTitle>
                            <CardDescription>Position the official QR code inside the frame to sign in.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div id="qr-reader" className="w-full rounded-lg overflow-hidden border"></div>
                             {hasCameraPermission === false && (
                                <Alert variant="destructive" className="mt-4">
                                    <VideoOff className="h-4 w-4" />
                                    <AlertTitle>Camera Permission Needed</AlertTitle>
                                    <AlertDescription>
                                        Please allow camera access to scan the QR code.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </>
                );
        }
    };


    return (
        <div className="min-h-screen bg-background font-body flex items-center justify-center p-4">
            <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={handleBack}>
                <ArrowLeft className="mr-2" />
                Back to Home
            </Button>
            <main className="container mx-auto px-4 py-8 md:px-6 md:py-12 flex justify-center">
                <div className="w-full max-w-md">
                    <Card className="shadow-lg">
                        {renderContent()}
                    </Card>
                </div>
            </main>
        </div>
    );
}


    