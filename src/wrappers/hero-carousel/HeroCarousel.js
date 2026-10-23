import PropTypes from "prop-types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const SlideArt = ({ type }) => {
  const cx = 150, cy = 150;
  if (type === "rudraksha") return (
    <svg viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
      {[...Array(5)].map((_, face) => {
        const faceAngle = face * Math.PI * 2 / 5 - Math.PI / 2;
        const fx = cx + 72 * Math.cos(faceAngle), fy = cy + 72 * Math.sin(faceAngle);
        return (
          <g key={face}>
            <circle cx={fx} cy={fy} r="28" fill="rgba(140,30,30,0.32)" stroke="rgba(201,165,64,0.4)" strokeWidth="1.5"/>
            {[...Array(5)].map((_, l) => {
              const la = l * Math.PI * 2 / 5 - Math.PI / 2;
              return <line key={l} x1={fx} y1={fy} x2={fx + 18 * Math.cos(la)} y2={fy + 18 * Math.sin(la)} stroke="rgba(201,165,64,0.3)" strokeWidth="1"/>;
            })}
          </g>
        );
      })}
      {[128, 96, 64].map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={`rgba(201,165,64,${0.06 + (128-r)*0.0012})`} strokeWidth="1"/>
      ))}
      <circle cx={cx} cy={cy} r="38" fill="rgba(140,30,30,0.38)" stroke="rgba(201,165,64,0.5)" strokeWidth="2"/>
      {[...Array(5)].map((_, l) => {
        const la = l * Math.PI * 2 / 5 - Math.PI / 2;
        return <line key={l} x1={cx} y1={cy} x2={cx + 24 * Math.cos(la)} y2={cy + 24 * Math.sin(la)} stroke="rgba(201,165,64,0.5)" strokeWidth="1.5"/>;
      })}
      <circle cx={cx} cy={cy} r="10" fill="rgba(201,165,64,0.6)"/>
    </svg>
  );
  if (type === "mala") return (
    <svg viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
      {[...Array(21)].map((_, i) => {
        const a = i * Math.PI * 2 / 21 - Math.PI / 2;
        const r = 108;
        return <circle key={i} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r="13"
          fill="rgba(160,40,40,0.35)" stroke="rgba(201,165,64,0.45)" strokeWidth="1.5"/>;
      })}
      <circle cx={cx} cy={cy} r="108" fill="none" stroke="rgba(201,165,64,0.15)" strokeWidth="0.5"/>
      <circle cx={cx} cy={cy - 108} r="18" fill="rgba(201,165,64,0.28)" stroke="rgba(240,200,80,0.55)" strokeWidth="2"/>
      <line x1={cx} y1={cy - 90} x2={cx} y2={cy - 130} stroke="rgba(201,165,64,0.4)" strokeWidth="1.5"/>
      {[80, 56, 32].map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={`rgba(201,165,64,${0.05 + (80-r)*0.001})`} strokeWidth="0.8"/>
      ))}
      <circle cx={cx} cy={cy} r="22" fill="rgba(160,40,40,0.35)" stroke="rgba(201,165,64,0.45)" strokeWidth="1.5"/>
    </svg>
  );
  if (type === "gemstone") return (
    <svg viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
      {[128, 96, 64].map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(100,180,220,0.1)" strokeWidth="1"/>
      ))}
      {[...Array(8)].map((_, i) => {
        const a = i * Math.PI * 2 / 8;
        return <line key={i} x1={cx} y1={cy} x2={cx + 128 * Math.cos(a)} y2={cy + 128 * Math.sin(a)}
          stroke="rgba(100,180,220,0.1)" strokeWidth="0.8"/>;
      })}
      <polygon points={`${cx},${cy-80} ${cx+70},${cy-30} ${cx+70},${cy+40} ${cx},${cy+80} ${cx-70},${cy+40} ${cx-70},${cy-30}`}
        fill="rgba(60,120,200,0.18)" stroke="rgba(100,180,220,0.5)" strokeWidth="1.5"/>
      <polygon points={`${cx},${cy-80} ${cx+70},${cy-30} ${cx},${cy+10} ${cx-70},${cy-30}`}
        fill="rgba(80,150,220,0.12)" stroke="rgba(120,200,240,0.4)" strokeWidth="1"/>
      <polygon points={`${cx+70},${cy-30} ${cx+70},${cy+40} ${cx},${cy+80} ${cx},${cy+10}`}
        fill="rgba(40,100,180,0.14)" stroke="rgba(100,180,220,0.35)" strokeWidth="1"/>
      <polygon points={`${cx-70},${cy-30} ${cx},${cy+10} ${cx},${cy+80} ${cx-70},${cy+40}`}
        fill="rgba(60,130,200,0.12)" stroke="rgba(100,180,220,0.35)" strokeWidth="1"/>
      <circle cx={cx} cy={cy+10} r="6" fill="rgba(180,220,255,0.6)"/>
    </svg>
  );
  if (type === "pooja") return (
    <svg viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
      {[128, 96].map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,160,40,0.08)" strokeWidth="1"/>
      ))}
      {[...Array(12)].map((_, i) => {
        const a = i * Math.PI * 2 / 12;
        return <circle key={i} cx={cx + 128 * Math.cos(a)} cy={cy + 128 * Math.sin(a)} r="4"
          fill="rgba(255,160,40,0.3)"/>;
      })}
      <ellipse cx={cx} cy={cy+50} rx="55" ry="18" fill="rgba(201,120,20,0.35)" stroke="rgba(255,160,40,0.4)" strokeWidth="1.5"/>
      <ellipse cx={cx} cy={cy+50} rx="38" ry="10" fill="rgba(201,120,20,0.2)"/>
      <ellipse cx={cx} cy={cy+50} rx="12" ry="4" fill="rgba(255,180,60,0.5)"/>
      <path d={`M ${cx-6} ${cy+46} Q ${cx} ${cy-20} ${cx+6} ${cy+46}`} fill="rgba(255,180,40,0.55)" stroke="rgba(255,200,80,0.5)" strokeWidth="1"/>
      <path d={`M ${cx-12} ${cy+10} Q ${cx-4} ${cy-60} ${cx} ${cy-90} Q ${cx+4} ${cy-60} ${cx+12} ${cy+10}`}
        fill="rgba(255,120,20,0.45)" stroke="rgba(255,160,40,0.4)" strokeWidth="0.8"/>
      <path d={`M ${cx-6} ${cy-20} Q ${cx} ${cy-100} ${cx+6} ${cy-20}`} fill="rgba(255,200,80,0.55)" stroke="rgba(255,220,100,0.5)" strokeWidth="0.8"/>
      <circle cx={cx} cy={cy-95} r="6" fill="rgba(255,220,100,0.7)"/>
    </svg>
  );
  if (type === "offer") return (
    <svg viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
      {[...Array(16)].map((_, i) => (
        <ellipse key={i}
          cx={cx + 100 * Math.cos(i * Math.PI * 2 / 16)}
          cy={cy + 100 * Math.sin(i * Math.PI * 2 / 16)}
          rx="13" ry="34"
          fill="rgba(180,50,50,0.22)" stroke="rgba(201,80,80,0.3)" strokeWidth="0.5"
          transform={`rotate(${i * 22.5} ${cx} ${cy})`}
        />
      ))}
      {[128, 100, 72].map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none"
          stroke={`rgba(201,165,64,${0.08 + (128 - r) * 0.0015})`} strokeWidth="1"/>
      ))}
      {[...Array(8)].map((_, i) => (
        <ellipse key={i}
          cx={cx + 48 * Math.cos(i * Math.PI * 2 / 8 + Math.PI / 8)}
          cy={cy + 48 * Math.sin(i * Math.PI * 2 / 8 + Math.PI / 8)}
          rx="10" ry="23" fill="rgba(201,165,64,0.26)"
          transform={`rotate(${i * 45 + 22.5} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r="30" fill="rgba(201,165,64,0.18)"
        stroke="rgba(201,165,64,0.38)" strokeWidth="1.5"/>
      <text x={cx} y={cy + 14} textAnchor="middle"
        fontFamily="Georgia, serif" fontSize="42"
        fill="rgba(240,200,80,0.88)" fontWeight="bold">₹</text>
    </svg>
  );
  if (type === "support") return (
    <svg viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
      {[...Array(12)].map((_, i) => {
        const a = i * Math.PI * 2 / 12;
        return <circle key={i} cx={cx + 128 * Math.cos(a)} cy={cy + 128 * Math.sin(a)}
          r="4" fill="rgba(100,160,220,0.38)"/>;
      })}
      <circle cx={cx} cy={cy} r="128" fill="none" stroke="rgba(100,160,220,0.1)" strokeWidth="1"/>
      <circle cx={cx} cy={cy} r="95" fill="none" stroke="rgba(100,160,220,0.12)"
        strokeWidth="1" strokeDasharray="5 9"/>
      <path d="M 78 160 A 72 72 0 0 1 222 160" fill="none"
        stroke="rgba(120,180,255,0.4)" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="78" cy="172" r="24" fill="rgba(80,130,200,0.28)"
        stroke="rgba(120,180,255,0.38)" strokeWidth="1.5"/>
      <circle cx="222" cy="172" r="24" fill="rgba(80,130,200,0.28)"
        stroke="rgba(120,180,255,0.38)" strokeWidth="1.5"/>
      <circle cx={cx} cy="118" r="26" fill="rgba(80,130,200,0.32)"
        stroke="rgba(120,180,255,0.45)" strokeWidth="1.5"/>
      <path d={`M ${cx-36} 188 Q ${cx} 162 ${cx+36} 188`}
        fill="rgba(80,130,200,0.28)" stroke="rgba(120,180,255,0.4)" strokeWidth="1.5"/>
    </svg>
  );
  return null;
};

const PHOTO = process.env.PUBLIC_URL + "/assets/img/";

const SLIDES = [
  {
    bg: "radial-gradient(ellipse at 70% 50%, #8b3400 0%, #5a0000 45%, #300000 100%)",
    photo: PHOTO + "category/rudraksha-banner.webp",
    photoPos: "left center",
    eyebrow: "Authentic Nepali Rudraksha — Nothing Else",
    titleLine1: "Genuine Nepal-Origin",
    titleEm: "Rudraksha Beads",
    body: "We carry only Nepali Rudraksha — the most potent and sought-after in the world. Hand-chosen, energised and certified. We stake our name on every single bead.",
    wysiwyg: true,
    cta: "Explore Collection →",
    ctaTo: "/category/rudraksha",
    cta2: "Rudraksha Recommendation ↗",
    cta2To: "/rudraksha-recommendation",
  },
  {
    bg: "radial-gradient(ellipse at 70% 50%, #1a4a18 0%, #0c2808 50%, #050d03 100%)",
    photo: PHOTO + "category/category-banner.jpg",
    photoPos: "right center",
    eyebrow: "Made to Last Decades, Not Seasons",
    titleLine1: "Divine",
    titleEm: "Jaap Malas",
    body: "A mala is a companion for prayer, not jewellery. Ours are strung with care and meant to go with you — day after day, year after year.",
    cta: "Shop Malas →",
    ctaTo: "/category/mala-and-jaap-mala",
    cta2: "View Collection ↗",
    cta2To: "/category/mala-and-jaap-mala",
  },
  {
    bg: "radial-gradient(ellipse at 70% 50%, #1a2060 0%, #080f30 50%, #300010 100%)",
    photo: PHOTO + "category/sphatik-banner.webp",
    photoPos: "center center",
    eyebrow: "You Get the Lab Report, Not Just Our Word",
    titleLine1: "Genuine",
    titleEm: "Gemstones & Crystals",
    body: "We won’t sell you a stone we wouldn’t wear ourselves. Every piece is tested by a certified gemologist — original report included with your order.",
    cta: "View Gemstones →",
    ctaTo: "/category/sphatik-and-crystal",
    cta2: "See Sample Report ↗",
    cta2To: "/category/sphatik-and-crystal",
  },
  {
    bg: "radial-gradient(ellipse at 70% 50%, #b85800 0%, #7a2e00 45%, #3a0f00 100%)",
    photo: PHOTO + "category/poojaproducts-banner.jpg",
    photoPos: "right center",
    eyebrow: "Built for Daily Worship, Not Just Display",
    titleLine1: "Sacred",
    titleEm: "Pooja Essentials",
    body: "Good pooja items shouldn’t need replacing every year. We source brass and copper pieces that last — the kind your children will still use after you.",
    cta: "Shop Pooja →",
    ctaTo: "/category/poojaproducts",
    cta2: "Browse All ↗",
    cta2To: "/category/poojaproducts",
  },
  {
    bg: "radial-gradient(ellipse at 70% 50%, #8f0000 0%, #5a0000 45%, #1e0000 100%)",
    artType: "offer",
    eyebrow: "Pan-India, No Hidden Charges",
    titleLine1: "Free Shipping",
    titleEm: "on Orders Above ₹5,000",
    emFirst: true,
    body: "No fine print. Spend ₹5,000 or more and your order ships free to any address in India. We pack it well; we ship it fast.",
    cta: "Start Shopping →",
    ctaTo: "/category/rudraksha",
    cta2: "See All Products ↗",
    cta2To: "/category/rudraksha",
  },
  {
    bg: "radial-gradient(ellipse at 70% 50%, #0d2235 0%, #060e1a 50%, #1a0a05 100%)",
    artType: "support",
    eyebrow: "Real People, Real Answers",
    titleLine1: "We’re Here",
    titleEm: "Whenever You Need Us",
    body: "Unsure about a bead count, need help choosing the right gemstone, or have a question about your order? Just reach out — you’ll hear back from a real person, not a bot.",
    support: true,
    email: "support@divineshopee.in",
    phone: "+91-9368635044",
  },
];

const HeroCarousel = ({ spaceTopClass, spaceBottomClass }) => {
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const n = SLIDES.length;

  const go = useCallback(idx => setCur((idx + n) % n), [n]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setCur(c => (c + 1) % n), 5000);
    return () => clearInterval(t);
  }, [paused, n]);

  const onTouchStart = e => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
    touchX.current = null;
  };

  return (
    <div className={`hero-carousel-area ${spaceTopClass || ""} ${spaceBottomClass || ""}`}>
      <div className="container">
      <div
          className="hc-track"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`hc-slide${i === cur ? " hc-slide--active" : ""}`}
              aria-hidden={i !== cur}
            >
              <div className="hc-slide__bg" style={{ background: slide.bg }} />

              <div className="hc-slide__veil" />

              <div className="hc-art">
                {slide.photo ? (
                  <img
                    className="hc-art__photo"
                    src={slide.photo}
                    alt=""
                    aria-hidden="true"
                    style={{ objectPosition: slide.photoPos || "center" }}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ) : (
                  <SlideArt type={slide.artType} />
                )}
              </div>

              <div className="hc-text">
                <div className="hc-eyebrow">
                  <span className="hc-eyebrow__line" aria-hidden="true" />
                  {slide.eyebrow}
                </div>

                <h2 className="hc-title">
                  {slide.emFirst ? (
                    <><em>{slide.titleLine1}</em><br />{slide.titleEm}</>
                  ) : (
                    <>{slide.titleLine1}<br /><em>{slide.titleEm}</em></>
                  )}
                </h2>

                {slide.body && <p className="hc-body">{slide.body}</p>}

                {slide.wysiwyg && (
                  <div className="hc-usp">
                    <span className="hc-usp__check" aria-hidden="true">✓</span>
                    <span>
                      <strong>WYSIWYG</strong> &mdash; The exact bead in the photo ships to you. No surprises.
                    </span>
                  </div>
                )}

                {slide.support ? (
                  <div className="hc-contacts">
                    <a href={`mailto:${slide.email}`} className="hc-contact-item">
                      <span className="hc-contact-icon" aria-hidden="true">✉</span>
                      {slide.email}
                    </a>
                    <a
                      href={`tel:${slide.phone.replace(/-/g, "")}`}
                      className="hc-contact-item"
                    >
                      <span className="hc-contact-icon" aria-hidden="true">☎</span>
                      {slide.phone}
                    </a>
                  </div>
                ) : (
                  <div className="hc-actions">
                    <Link to={slide.ctaTo} className="hc-btn">
                      {slide.cta}
                    </Link>
                    {slide.cta2 && (
                      <Link to={slide.cta2To} className="hc-btn hc-btn--ghost">
                        {slide.cta2}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="hc-dots" role="tablist" aria-label="Slide navigation">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`hc-dot${i === cur ? " hc-dot--active" : ""}`}
                onClick={() => go(i)}
                role="tab"
                aria-selected={i === cur}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="hc-arrow hc-arrow--prev"
            onClick={() => go(cur - 1)}
            aria-label="Previous slide"
          >
            &#8249;
          </button>
          <button
            className="hc-arrow hc-arrow--next"
            onClick={() => go(cur + 1)}
            aria-label="Next slide"
          >
            &#8250;
          </button>
        </div>
      </div>
    </div>
  );
};

HeroCarousel.propTypes = {
  spaceTopClass:  PropTypes.string,
  spaceBottomClass: PropTypes.string,
};

export default HeroCarousel;
