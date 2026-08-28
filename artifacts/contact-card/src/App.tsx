import { useMemo, useRef, useState } from 'react';
import {
  Globe2,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';
import logoSrc from '@assets/g-dot-1024_1787901439446.png';
import { encodeQr } from '@/lib/qr';

const VCARD = `BEGIN:VCARD
VERSION:3.0
N:Procter;Steve;;;
FN:Steve Procter
EMAIL:steve@gipity.com
ORG:Gipity Product Studio
TITLE:Interim Tech Co-founder
URL:https://www.gipity.com
TEL;TYPE=CELL;TYPE=VOICE;TYPE=PREF:+447415978029
URL;TYPE=WhatsApp:https://wa.me/447415978029
END:VCARD`;

const contact = {
  name: 'Steve Procter',
  role: 'Interim Tech Co-founder',
  company: 'Gipity Product Studio',
  email: 'steve@gipity.com',
  phone: '+44 7415 978029',
  website: 'www.gipity.com',
  whatsapp: 'WhatsApp',
};

function QrCodeGraphic({ matrix }: { matrix: boolean[][] }) {
  const quiet = 4;
  const dimension = matrix.length + quiet * 2;

  return (
    <svg
      aria-label="QR code containing Steve Procter's contact details"
      data-testid="img-contact-qr"
      viewBox={`0 0 ${dimension} ${dimension}`}
      role="img"
    >
      <rect width={dimension} height={dimension} fill="#f7f3e7" />
      {matrix.map((row, rowIndex) =>
        row.map((dark, colIndex) =>
          dark ? (
            <rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex + quiet}
              y={rowIndex + quiet}
              width="1"
              height="1"
              fill="#111817"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function drawQr(
  ctx: CanvasRenderingContext2D,
  matrix: boolean[][],
  x: number,
  y: number,
  side: number,
) {
  const quiet = 4;
  const unit = side / (matrix.length + quiet * 2);
  ctx.fillStyle = '#f7f3e7';
  ctx.fillRect(x, y, side, side);
  ctx.fillStyle = '#111817';
  matrix.forEach((row, rowIndex) =>
    row.forEach((dark, colIndex) => {
      if (dark) {
        ctx.fillRect(
          x + (colIndex + quiet) * unit,
          y + (rowIndex + quiet) * unit,
          Math.ceil(unit),
          Math.ceil(unit),
        );
      }
    }),
  );
}

function drawCardPng(
  matrix: boolean[][],
  logo: HTMLImageElement | null,
  onSaved?: () => void,
) {
  const scale = 2;
  const width = 1000;
  const height = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = '#f1eee3';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(70, 91, 112, .1)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#fbf8ef';
  ctx.fillRect(55, 55, 890, 1290);
  ctx.strokeStyle = 'rgba(17, 24, 23, .16)';
  ctx.strokeRect(55.5, 55.5, 889, 1289);

  if (logo?.complete && logo.naturalWidth > 0) {
    ctx.drawImage(logo, 100, 88, 92, 92);
  }
  ctx.fillStyle = '#111817';
  ctx.font = '800 30px Arial, sans-serif';
  ctx.fillText('GIPITY.', 100, 155);
  ctx.fillStyle = '#ff5d0a';
  ctx.fillText('.', 228, 155);
  ctx.fillStyle = '#526b83';
  ctx.font = '500 18px Arial, sans-serif';
  ctx.fillText('PRODUCT STUDIO', 100, 188);

  ctx.fillStyle = '#111817';
  ctx.font = '400 76px Georgia, serif';
  ctx.fillText('Steve', 100, 365);
  ctx.fillText('Procter', 100, 445);
  ctx.fillStyle = '#526b83';
  ctx.font = '700 22px Arial, sans-serif';
  ctx.fillText('INTERIM TECH CO-FOUNDER', 103, 500);

  ctx.strokeStyle = '#ff5d0a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(100, 535);
  ctx.bezierCurveTo(280, 526, 480, 545, 680, 532);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(17, 24, 23, .18)';
  ctx.lineWidth = 1;
  [625, 705, 785].forEach((lineY) => {
    ctx.beginPath();
    ctx.moveTo(100, lineY);
    ctx.lineTo(900, lineY);
    ctx.stroke();
  });
  ctx.fillStyle = '#111817';
  ctx.font = '600 24px Arial, sans-serif';
  ctx.fillText(contact.email, 145, 674);
  ctx.fillText(contact.phone, 145, 754);
  ctx.fillText(contact.website, 145, 834);

  drawQr(ctx, matrix, 300, 910, 400);
  ctx.fillStyle = '#526b83';
  ctx.font = '700 18px Arial, sans-serif';
  ctx.fillText('POINT YOUR CAMERA HERE', 300, 1350);
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const file = new File([bytes], 'steve-procter-contact-card.png', { type: 'image/png' });
  const shareData = { files: [file], title: "Steve Procter's contact card" };

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    void navigator.share(shareData).then(() => onSaved?.()).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      downloadDataUrl(dataUrl, 'steve-procter-contact-card.png');
      onSaved?.();
    });
    return;
  }

  downloadDataUrl(dataUrl, 'steve-procter-contact-card.png');
  onSaved?.();
}

function Home() {
  const matrix = useMemo(() => encodeQr(VCARD), []);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);
  const logoRef = useRef<HTMLImageElement>(null);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2800);
  };

  return (
    <main className="page-shell">
      <section className="card-stage" aria-label="Steve Procter's contact card">
        <button
          className="card card-trigger"
          data-testid="card-contact"
          type="button"
          aria-label="Save Steve Procter's contact card as a PNG image"
          onClick={() => drawCardPng(matrix, logoRef.current, () => notify('Card image ready to save'))}
        >
          <div className="card-header">
            <img ref={logoRef} className="card-logo" src={logoSrc} alt="" />
            <div className="card-brand">
              <span>Gipity<span className="orange-dot">.</span></span>
              <small>Product Studio</small>
            </div>
          </div>
          <div className="card-introduction">
            <p className="card-kicker">Your interim tech co-founder</p>
            <h1 data-testid="text-contact-name">{contact.name}</h1>
            <div className="orange-rule" aria-hidden="true" />
          </div>
          <div className="detail-list">
            <div className="detail-link" data-testid="link-email">
              <Mail size={18} strokeWidth={1.7} />
              <span>{contact.email}</span>
            </div>
            <div className="detail-link" data-testid="link-phone">
              <Phone size={18} strokeWidth={1.7} />
              <span>{contact.phone}</span>
            </div>
            <div className="detail-link" data-testid="link-website">
              <Globe2 size={18} strokeWidth={1.7} />
              <span>{contact.website}</span>
            </div>
            <div className="detail-link" data-testid="link-whatsapp">
              <MessageCircle size={18} strokeWidth={1.7} />
              <span>{contact.whatsapp}</span>
            </div>
          </div>
          <div className="qr-wrap">
            <div className="qr-box"><QrCodeGraphic matrix={matrix} /></div>
            <p className="qr-caption">
              <strong>Save Steve’s details</strong>
              Point your camera here. The QR has the full vCard.
            </p>
          </div>
          <div className="card-meta">
            <span>GIPITY / 2026</span>
            <span>STEVE.PROCTER</span>
          </div>
        </button>
      </section>

      {toast ? (
        <div className="toast" data-testid="status-toast" role="status">
          {toast}
        </div>
      ) : null}
    </main>
  );
}

export default Home;