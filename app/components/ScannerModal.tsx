'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerModalProps {
  onScanSuccess: (profileId: string) => void;
  onClose: () => void;
}

export default function ScannerModal({ onScanSuccess, onClose }: ScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const containerId = 'qr-reader';

  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        await navigator.permissions.query({ name: 'camera' as PermissionName });
        startScanner();
      } catch (err) {
        setError('Nepodarilo sa požiadať o povolenie kamery: ' + err);
      }
    };

    const startScanner = () => {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            scanner.stop()
              .then(() => {
                onScanSuccess(decodedText);
              })
              .catch((err) => {
                console.error('Error stopping scanner:', err);
                onScanSuccess(decodedText);
              });
          },
          () => {}
        )
        .catch((err) => {
          setError('Nepodarilo sa spustiť kameru: ' + err);
        });
    };

    requestCameraPermission();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScanSuccess]);

  const handleClose = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {}).finally(() => onClose());
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Naskenuj kartičku</h2>
          <button
            onClick={handleClose}
            className="text-white text-2xl leading-none px-2 hover:opacity-80"
          >
            ×
          </button>
        </div>

        <div id={containerId} className="rounded-2xl overflow-hidden bg-black aspect-square border border-white/10" />

        {error && (
          <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
        )}

        <p className="text-white/60 text-xs text-center mt-4">
          Namier kameru na QR kód na profile klienta
        </p>
      </div>
    </div>
  );
}