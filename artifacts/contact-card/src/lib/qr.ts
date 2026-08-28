import QRCode from 'qrcode';

export function encodeQr(payload: string): boolean[][] {
  const qr = QRCode.create(payload, {
    errorCorrectionLevel: 'M',
  });

  return Array.from({ length: qr.modules.size }, (_, row) =>
    Array.from(
      { length: qr.modules.size },
      (_, column) => qr.modules.get(row, column) === 1,
    ),
  );
}