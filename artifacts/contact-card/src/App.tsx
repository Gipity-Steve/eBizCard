import { useMemo, useRef, useState } from 'react';
import {
  Check,
  Globe2,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';
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
      <rect width={dimension} height={dimension} fill="#f8f5eb" />
      {matrix.map((row, rowIndex) =>
        row.map((dark, colIndex) =>
          dark ? <rect key={`${rowIndex}-${colIndex}`} x={colIndex + quiet} y={rowIndex + quiet} width="1" height="1" fill="#142b2b" /> : null,
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

function drawQr(ctx: CanvasRenderingContext2D, matrix: boolean[][], x: number, y: number, side: number) {
  const quiet = 4;
  const unit = side / (matrix.length + quiet * 2);
  ctx.fillStyle = '#f8f5eb';
  ctx.fillRect(x, y, side, side);
  ctx.fillStyle = '#142b2b';
  matrix.forEach((row, rowIndex) => row.forEach((dark, colIndex) => {
    if (dark) ctx.fillRect(x + (colIndex + quiet) * unit, y + (rowIndex + quiet) * unit, Math.ceil(unit), Math.ceil(unit));
  }));
}

function drawCardPng(matrix: boolean[][], onSaved?: () => void) {
  const scale = 2;
  const width = 1800;
  const height = 1160;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(scale, scale);

  ctx.fillStyle = '#e8e4d8';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#173b3a';
  ctx.fillRect(122, 170, 670, 820);
  ctx.fillStyle = '#f7f4ea';
  ctx.fillRect(792, 170, 886, 820);
  ctx.fillStyle = '#c9d97a';
  ctx.font = '800 22px "Avenir Next", sans-serif';
  ctx.fillText('GIPITY PRODUCT STUDIO', 164, 222);
  ctx.strokeStyle = 'rgba(243,240,230,.6)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(200, 840, 54, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f3f0e6';
  ctx.font = '400 45px Georgia, serif';
  ctx.fillText('SP', 174, 855);
  ctx.fillStyle = '#f7f4ea';
  ctx.font = '400 75px Georgia, serif';
  ctx.fillText('Steve', 848, 275);
  ctx.fillText('Procter', 848, 350);
  ctx.fillStyle = '#b9432e';
  ctx.font = '800 21px "Avenir Next", sans-serif';
  ctx.fillText('INTERIM TECH CO-FOUNDER', 850, 405);
  ctx.strokeStyle = 'rgba(20,43,43,.18)';
  ctx.lineWidth = 1;
  [450, 520, 590, 660].forEach((lineY) => { ctx.beginPath(); ctx.moveTo(850, lineY); ctx.lineTo(1600, lineY); ctx.stroke(); });
  ctx.fillStyle = '#142b2b';
  ctx.font = '650 24px "Avenir Next", sans-serif';
  ctx.fillText(contact.email, 895, 493);
  ctx.fillText(contact.phone, 895, 563);
  ctx.fillText(contact.website, 895, 633);
  drawQr(ctx, matrix, 1380, 700, 230);
  ctx.fillStyle = '#3e5852';
  ctx.font = '700 16px "Avenir Next", sans-serif';
  ctx.fillText('SCAN TO SAVE', 1383, 960);
  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, 'steve-procter-contact-card.png');
      onSaved?.();
    }
  }, 'image/png');
}

function Home() {
  const matrix = useMemo(() => encodeQr(VCARD), []);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

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
          onClick={() => drawCardPng(matrix, () => notify('Card image saved'))}
        >
          <div className="card-side">
            <div className="brand">Gipity<br />Product Studio</div>
            <div className="monogram" aria-hidden="true">SP</div>
            <p className="side-label">Technology, thoughtfully applied</p>
          </div>
          <div className="card-main">
            <div>
              <h2 className="card-name" data-testid="text-contact-name">{contact.name}</h2>
              <p className="card-role" data-testid="text-contact-role">{contact.role}</p>
            </div>
            <div className="detail-list">
              <div className="detail-link" data-testid="link-email">
                <Mail size={16} strokeWidth={1.8} /><span>{contact.email}</span>
              </div>
              <div className="detail-link" data-testid="link-phone">
                <Phone size={16} strokeWidth={1.8} /><span>{contact.phone}</span>
              </div>
              <div className="detail-link" data-testid="link-website">
                <Globe2 size={16} strokeWidth={1.8} /><span>{contact.website}</span>
              </div>
              <div className="detail-link" data-testid="link-whatsapp">
                <MessageCircle size={16} strokeWidth={1.8} /><span>{contact.whatsapp}</span>
              </div>
            </div>
            <div className="qr-wrap">
              <div className="qr-box"><QrCodeGraphic matrix={matrix} /></div>
              <p className="qr-caption"><strong>Save Steve’s details</strong>Point your camera here. The QR has the full vCard.</p>
            </div>
            <div className="card-meta"><span>GIPITY / 2025</span><span>STEVE.PROCTER</span></div>
          </div>
        </button>
      </section>

      {toast ? <div className="toast" data-testid="status-toast" role="status"><Check size={15} /> {toast}</div> : null}
    </main>
  );
}

export default Home;