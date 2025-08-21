
"use client";

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

const QR_CODE_VALUE = "VibrantAgingCommunityCentre";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrCodeDialog({ open, onOpenChange }: QrCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      QRCode.toDataURL(QR_CODE_VALUE, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.9,
        margin: 1,
        width: 300,
      })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error("Failed to generate QR code:", err);
        setQrCodeUrl(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
    } else {
        setQrCodeUrl(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attendance QR Code</DialogTitle>
          <DialogDescription>
            Workers can scan this code with their device camera to start the sign-in process.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-4 min-h-[300px]">
          {isLoading && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
          {!isLoading && qrCodeUrl && (
            <Image 
                src={qrCodeUrl} 
                alt="Attendance QR Code" 
                width={300} 
                height={300} 
                className="rounded-lg" 
            />
          )}
           {!isLoading && !qrCodeUrl && (
            <p className="text-destructive">Could not generate QR code.</p>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

    