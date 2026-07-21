import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const SCANNER_REGION_ID = "barcode-scanner-region";

// Explicit so 1D barcodes (the "vertical lines" kind — EAN/UPC/Code128/etc.) are always
// scanned, not just QR codes.
const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF,
];

export function BarcodeScannerModal({ onDetected, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_REGION_ID, {
      formatsToSupport: SUPPORTED_FORMATS,
      verbose: false,
    });
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 140 } },
        (decodedText) => {
          if (stopped) return;
          stopped = true;
          scanner
            .stop()
            .catch(() => {})
            .finally(() => {
              scanner.clear();
              onDetected(decodedText);
            });
        },
        () => {}, // per-frame scan misses — expected constantly, ignore
      )
      .then(() => setStarting(false))
      .catch(() => {
        setStarting(false);
        setError("Couldn't access the camera. Check permissions, or enter the barcode manually instead.");
      });

    return () => {
      stopped = true;
      scanner
        .stop()
        .catch(() => {})
        .finally(() => scanner.clear());
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Scan barcode</h2>
        <div className="relative h-72 overflow-hidden rounded-md bg-neutral-900">
          <div id={SCANNER_REGION_ID} className="h-full w-full" />
          {starting && !error && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-neutral-300">
              Starting camera...
            </p>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
