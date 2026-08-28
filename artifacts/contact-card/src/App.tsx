import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  Check,
  Copy,
  Download,
  Globe2,
  HousePlus,
  Mail,
  MessageCircle,
  Phone,
  QrCode,
  Share2,
  X,
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

function drawCardPng(matrix: boolean[][]) {
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
  canvas.toBlob((blob) => { if (blob) downloadBlob(blob, 'steve-procter-contact-card.png'); }, 'image/png');
}

function Home() {
  const matrix = useMemo(() => encodeQr(VCARD), []);
  const [toast, setToast] = useState('');
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onInstallPrompt);
  }, []);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2800);
  };

  const copyVcard = async () => {
    try {
      await navigator.clipboard.writeText(VCARD);
      notify('vCard copied to clipboard');
    } catch {
      notify('Copy unavailable — download the vCard instead');
    }
  };

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      setInstallEvent(null);
    } else {
      setShowGuide(true);
    }
  };

  return (
    <main className="page-shell">
      <header className="topline">
        <span className="topline-mark" data-testid="text-card-label">Private contact card</span>
        <span className="topline-note">Keep this close</span>
      </header>

      <section className="card-stage" aria-label="Steve Procter's contact card">
        <div className="intro">
          <p className="eyebrow">A useful introduction</p>
          <h1 data-testid="text-page-title">Good work starts with a <em>conversation.</em></h1>
          <p className="intro-copy">
            Steve helps ambitious product teams make the next technical move with clarity, pace, and a steady hand.
          </p>
          <div className="intro-rule" aria-hidden="true" />
        </div>

        <article className="card" data-testid="card-contact">
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
              <a className="detail-link" data-testid="link-email" href={`mailto:${contact.email}`} aria-label={`Email ${contact.name}`}>
                <Mail size={16} strokeWidth={1.8} /><span>{contact.email}</span>
              </a>
              <a className="detail-link" data-testid="link-phone" href="tel:+447415978029" aria-label={`Call ${contact.name}`}>
                <Phone size={16} strokeWidth={1.8} /><span>{contact.phone}</span>
              </a>
              <a className="detail-link" data-testid="link-website" href="https://www.gipity.com" target="_blank" rel="noreferrer" aria-label="Visit Gipity Product Studio website">
                <Globe2 size={16} strokeWidth={1.8} /><span>{contact.website}</span>
              </a>
              <a className="detail-link" data-testid="link-whatsapp" href="https://wa.me/447415978029" target="_blank" rel="noreferrer" aria-label="Message Steve on WhatsApp">
                <MessageCircle size={16} strokeWidth={1.8} /><span>{contact.whatsapp}</span>
              </a>
            </div>
            <div className="qr-wrap">
              <div className="qr-box"><QrCodeGraphic matrix={matrix} /></div>
              <p className="qr-caption"><strong>Save Steve’s details</strong>Point your camera here. The QR has the full vCard.</p>
            </div>
            <div className="card-meta"><span>GIPITY / 2025</span><span>STEVE.PROCTER</span></div>
          </div>
        </article>
      </section>

      <section className="actions" aria-label="Card actions">
        <div className="action-copy">
          <strong>Take it with you.</strong>
          Download a crisp card image or save it to your Home Screen.
        </div>
        <div className="action-buttons">
          <button className="button primary" data-testid="button-download-png" type="button" onClick={() => drawCardPng(matrix)}>
            <Download size={15} /> Save PNG
          </button>
          <button className="button" data-testid="button-download-vcard" type="button" onClick={() => downloadBlob(new Blob([VCARD], { type: 'text/vcard;charset=utf-8' }), 'steve-procter.vcf')}>
            <ArrowDownToLine size={15} /> vCard
          </button>
          <button className="button" data-testid="button-copy-vcard" type="button" onClick={copyVcard}>
            <Copy size={15} /> Copy
          </button>
          <button className="button" data-testid="button-install-card" type="button" onClick={install}>
            <HousePlus size={15} /> Home Screen
          </button>
        </div>
      </section>

      <footer className="footerline">
        <span data-testid="text-footer-company">Gipity Product Studio</span>
        <span>Made for the moment after “hello”</span>
      </footer>

      {toast ? <div className="toast" data-testid="status-toast" role="status"><Check size={15} /> {toast}</div> : null}

      {showGuide ? (
        <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setShowGuide(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="install-title">
            <div className="modal-actions" style={{ marginTop: 0, justifyContent: 'flex-end' }}>
              <button className="modal-close" data-testid="button-close-install-guide" type="button" onClick={() => setShowGuide(false)} aria-label="Close installation guide"><X size={19} /></button>
            </div>
            <h2 id="install-title">Keep Steve close</h2>
            <p>Add this card to your iPhone Home Screen for one-tap access, even when you’re offline.</p>
            <ol>
              <li>Open this card in Safari.</li>
              <li>Tap the Share button in the toolbar.</li>
              <li>Choose <strong>Add to Home Screen</strong>, then tap Add.</li>
            </ol>
            <div className="modal-actions">
              <button className="button" data-testid="button-modal-download" type="button" onClick={() => { setShowGuide(false); drawCardPng(matrix); }}><Share2 size={15} /> Save a copy</button>
              <button className="button primary" data-testid="button-modal-done" type="button" onClick={() => setShowGuide(false)}>Got it</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default Home;