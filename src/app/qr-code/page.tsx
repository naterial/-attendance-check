"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QrCodePage() {
    const router = useRouter();
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

    useEffect(() => {
        const generateQrCode = async () => {
            try {
                const QRCode = await import('qrcode');
                const url = await QRCode.toDataURL("VibrantAgingCommunityCentreSecret", {
                    width: 400,
                    margin: 2,
                    color: {
                        dark: '#3B0764', // Dark purple
                        light: '#FFFFFF'
                    }
                });
                setQrCodeDataUrl(url);
            } catch (err) {
                console.error('Failed to generate QR code', err);
            }
        };

        generateQrCode();
    }, []);

    return (
        <div className="min-h-screen bg-background font-body flex flex-col items-center justify-center p-4">
             <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={() => router.push('/admin')}>
                <ArrowLeft className="mr-2" />
                Back to Admin
            </Button>
            <div className="w-full max-w-md mx-auto text-center">
                <h1 className="text-3xl font-bold mb-2 font-headline">Worker Sign-In QR Code</h1>
                <p className="text-muted-foreground mb-8">Display this for workers to scan and sign in.</p>
                <div className="bg-card rounded-xl shadow-lg overflow-hidden aspect-square flex items-center justify-center p-6">
                    {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="Attendance QR Code" />
                    ) : (
                        <p>Generating QR Code...</p>
                    )}
                </div>
            </div>
        </div>
    );
}
