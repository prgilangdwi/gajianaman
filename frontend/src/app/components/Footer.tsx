import { useEffect, useRef } from 'react';

function GajianAmanMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
      width={size} height={size} style={{ display: 'block' }}>
      <rect width="32" height="32" rx="7" fill="rgba(255,255,255,0.15)" />
      <rect x="6" y="20" width="5" height="6" rx="1" fill="#4AE54A" opacity="0.5" />
      <rect x="13.5" y="14" width="5" height="12" rx="1" fill="#4AE54A" opacity="0.75" />
      <rect x="21" y="7" width="5" height="19" rx="1" fill="#4AE54A" />
    </svg>
  );
}

const SOCIAL_ICONS = [
  {
    label: 'Telegram',
    href: 'https://t.me/GajianAmanBot',
    path: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
  },
  {
    label: 'X',
    href: '#',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.631 5.903-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    label: 'LinkedIn',
    href: '#',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    label: 'GitHub',
    href: '#',
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
];

export default function Footer() {
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const fit = () => {
      if (!svgRef.current || !textRef.current) return;
      try {
        const bbox = textRef.current.getBBox();
        svgRef.current.setAttribute('viewBox',
          `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      } catch {}
    };
    document.fonts.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .footer-wrapper {
          max-width: 1150px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 16px;
          align-items: stretch;
        }

        /* ── LEFT CARD ─────────────────────────── */
        .footer-left {
          position: relative;
          min-height: 340px;
          border-radius: 28px;
          padding: 32px;
          overflow: hidden;
          background: linear-gradient(145deg, #163D24 0%, #0D2818 55%, #0A1F12 100%);
          box-shadow: 0 12px 40px rgba(13, 40, 24, 0.35);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .footer-left::before {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: radial-gradient(ellipse at 80% 20%, rgba(74,229,74,0.18) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .footer-logo {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .footer-logo-mark {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1.5px solid rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .footer-logo-name {
          font-family: 'DM Sans', 'Manrope', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .footer-tagline-container {
          margin-top: auto;
          margin-bottom: 28px;
          position: relative;
          z-index: 1;
        }

        .footer-tagline {
          font-family: 'DM Sans', sans-serif;
          font-size: 19px;
          font-weight: 400;
          color: #fff;
          line-height: 1.45;
        }

        .footer-social-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .footer-social-label {
          font-family: 'Caveat', cursive;
          font-size: 17px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        .footer-social-icons {
          display: flex;
          flex-direction: row;
          gap: 7px;
        }

        .social-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #0e1014;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          text-decoration: none;
          flex-shrink: 0;
        }

        .social-icon:hover {
          background: #000;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.3);
        }

        .social-icon svg {
          width: 15px;
          height: 15px;
          fill: #fff;
          display: block;
        }

        /* ── RIGHT CARD ─────────────────────────── */
        .footer-right {
          background: #f0f1f5;
          border-radius: 28px;
          padding: 40px;
          overflow: visible;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }

        /* "Feeling lucky?" floating badge */
        .footer-lucky-graphic {
          position: absolute;
          top: -36px;
          right: 40px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }

        .lucky-cube {
          width: 96px;
          height: 96px;
          border-radius: 22px;
          transform: rotate(-10deg);
          background: linear-gradient(135deg, #4AE54A 0%, #1B8A1B 55%, #0D5C0D 100%);
          box-shadow:
            inset 3px 3px 8px rgba(255,255,255,0.35),
            inset -3px -3px 12px rgba(0,0,0,0.18),
            8px 14px 28px rgba(13, 92, 13, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lucky-cube-mark {
          font-family: 'DM Sans', 'Manrope', sans-serif;
          font-size: 42px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.04em;
          transform: rotate(10deg);
          text-shadow: 0 3px 6px rgba(0,0,0,0.25);
          line-height: 1;
          display: block;
          user-select: none;
        }

        .lucky-text-row {
          display: flex;
          flex-direction: row;
          gap: 6px;
          align-items: center;
          transform: rotate(-4deg);
          margin-top: 4px;
        }

        .lucky-arrow {
          width: 22px;
          height: 22px;
          color: #9ca3af;
          flex-shrink: 0;
        }

        .lucky-text {
          font-family: 'Caveat', cursive;
          font-size: 20px;
          font-weight: 600;
          color: #9ca3af;
          white-space: nowrap;
        }

        /* Nav columns */
        .footer-right-top {
          flex: 1;
        }

        .footer-nav-cols {
          display: flex;
          flex-direction: row;
          gap: 72px;
          padding-top: 8px;
        }

        .footer-col-title {
          font-family: 'Caveat', cursive;
          font-size: 24px;
          font-weight: 600;
          font-style: italic;
          color: #9ca3af;
          margin-bottom: 18px;
        }

        .footer-col a {
          display: block;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 14px;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-col a:hover {
          color: #4AE54A;
        }

        /* Bottom row */
        .footer-bottom {
          display: flex;
          flex-direction: row;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: 48px;
        }

        .footer-copyright {
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          color: #9ca3af;
        }

        .footer-cta-mini {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .footer-cta-mini h4 {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 400;
          color: #6b7280;
          line-height: 1.45;
          margin: 0;
        }

        .footer-cta-mini h4 strong {
          display: block;
          font-size: 19px;
          font-weight: 700;
          color: #111827;
        }

        .footer-subscribe-row {
          display: flex;
          flex-direction: row;
          width: 310px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }

        .footer-subscribe-row input[type="email"] {
          flex: 1;
          padding: 11px 14px;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          color: #111827;
          min-width: 0;
        }

        .footer-subscribe-row input[type="email"]::placeholder {
          color: #9ca3af;
        }

        .footer-subscribe-row button {
          padding: 11px 22px;
          background: #0D2818;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.15);
          transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
          white-space: nowrap;
        }

        .footer-subscribe-row button:hover {
          background: #163D24;
          box-shadow: 0 8px 28px rgba(0,0,0,0.38), 0 4px 12px rgba(0,0,0,0.2);
          transform: translateY(-1px);
        }

        /* ── WATERMARK ─────────────────────────── */
        .footer-watermark {
          max-width: 1150px;
          margin: -60px auto 0;
          pointer-events: none;
          user-select: none;
          position: relative;
          z-index: 0;
          line-height: 0;
        }

        .footer-watermark svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: visible;
        }

        .footer-watermark text {
          font-family: 'DM Sans', 'Manrope', sans-serif;
          font-weight: 700;
          letter-spacing: -0.03em;
          fill: rgba(0, 0, 0, 0.04);
        }

        /* ── RESPONSIVE ─────────────────────────── */
        @media (max-width: 860px) {
          .footer-wrapper {
            grid-template-columns: 1fr;
          }
          .footer-left {
            min-height: auto;
            gap: 40px;
          }
        }

        @media (max-width: 560px) {
          .footer-right {
            padding: 24px;
          }
          .footer-nav-cols {
            gap: 40px;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
          }
          .footer-subscribe-row {
            width: 100%;
          }
          .footer-lucky-graphic {
            right: 12px;
            top: -28px;
          }
          .lucky-cube {
            width: 72px;
            height: 72px;
          }
          .lucky-cube-mark {
            font-size: 32px;
          }
        }
      `}</style>

      <div className="footer-wrapper">

        {/* ── LEFT CARD ── */}
        <div className="footer-left">
          <div className="footer-logo">
            <div className="footer-logo-mark">
              <GajianAmanMark size={20} />
            </div>
            <span className="footer-logo-name">Gajian Aman</span>
          </div>

          <div className="footer-tagline-container">
            <p className="footer-tagline">
              Keuangan digital Indonesia,<br />
              <span style={{ color: 'rgba(255,255,255,0.65)' }}>powered by AI.</span>
            </p>
          </div>

          <div className="footer-social-row">
            <span className="footer-social-label">Stay in touch!</span>
            <div className="footer-social-icons">
              {SOCIAL_ICONS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                >
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT CARD ── */}
        <div className="footer-right">

          {/* Floating "Feeling lucky?" badge */}
          <div className="footer-lucky-graphic" aria-hidden="true">
            <div className="lucky-cube">
              <span className="lucky-cube-mark">G</span>
            </div>
            <div className="lucky-text-row">
              <svg
                className="lucky-arrow"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3 20 C 6 14, 10 9, 18 5"
                  stroke="currentColor" fill="none" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 5 L 12 5"
                  stroke="currentColor" fill="none" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 5 L 18 11"
                  stroke="currentColor" fill="none" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="lucky-text">Feeling lucky?</span>
            </div>
          </div>

          {/* Nav columns */}
          <div className="footer-right-top">
            <div className="footer-nav-cols">
              <div className="footer-col">
                <div className="footer-col-title">Navigation</div>
                <a href="#">Cara kerja</a>
                <a href="#">Fitur</a>
                <a href="#">Keamanan</a>
                <a href="#">Testimonial</a>
                <a href="#">FAQ</a>
              </div>
              <div className="footer-col">
                <div className="footer-col-title">Company</div>
                <a href="#">Blog</a>
                <a href="#">Tentang Kami</a>
                <a href="#">Syarat &amp; Ketentuan</a>
                <a href="#">Kebijakan Privasi</a>
              </div>
            </div>
          </div>

          {/* Bottom: copyright + CTA */}
          <div className="footer-bottom">
            <span className="footer-copyright">© 2025 Gajian Aman. All rights reserved.</span>

            <div className="footer-cta-mini">
              <h4>
                AI moves fast.<br />
                <strong>Stay ahead with Gajian Aman.</strong>
              </h4>
              <div className="footer-subscribe-row">
                <input type="email" placeholder="Enter email address" />
                <button type="button">Subscribe</button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── WATERMARK ── */}
      <div className="footer-watermark" aria-hidden="true">
        <svg
          ref={svgRef}
          viewBox="62 95 876 175"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <text
            ref={textRef}
            x="500"
            y="240"
            textAnchor="middle"
            fontSize="320"
          >
            Gajian
          </text>
        </svg>
      </div>
    </>
  );
}
