import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// K&D PLANSVISTA — architecture + construction studio
// App logic (persisted via shared storage, no login):
//   - quote requests become tracked leads with a computed cost estimate
//   - site-visit scheduler checks real availability and prevents double-booking
//   - portfolio is data-driven, editable from the studio panel
//   - studio panel is an open operations view
// Visual language: modern, high-contrast — near-black + warm off-white,
// with safety-orange as the one working accent (a real construction-site
// color, not decoration). Geometric display type, pill controls, soft
// elevation instead of hairline borders everywhere.
// ---------------------------------------------------------------------------

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`;

const PROJECT_TYPES = ["Residential design", "Commercial design", "New construction", "Renovation", "Other"];
const FINISH_TIERS = [
  { id: "standard", label: "Standard", mult: 1 },
  { id: "premium", label: "Premium", mult: 1.35 },
  { id: "luxury", label: "Luxury", mult: 1.8 },
];
const RATE_TABLE = {
  "Residential design": 15,
  "Commercial design": 20,
  "New construction": 380,
  "Renovation": 150,
  "Other": 100,
};
const RATE_UNIT = {
  "Residential design": "design fee, per sqft",
  "Commercial design": "design fee, per sqft",
  "New construction": "build cost, per sqft",
  "Renovation": "renovation cost, per sqft",
  "Other": "estimated cost, per sqft",
};
const SLOT_TIMES = ["09:00", "11:00", "13:00", "15:00"];
const LEAD_STATUSES = ["new", "contacted", "quoted", "won", "lost"];

const WHATSAPP_NUMBER = "250787845613";
function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

const SEED_PORTFOLIO = [
  { id: "p1", title: "Kacyiru Family House", type: "New construction", location: "Kacyiru, Kigali", sqft: 2600, year: 2024, description: "Two-story residence with a fenced garden and a shaded parking court.", art: "house" },
  { id: "p2", title: "Rubavu Lakeview Villa", type: "New construction", location: "Rubavu", sqft: 3800, year: 2023, description: "Elevated villa oriented toward Lake Kivu with a full-width terrace.", art: "villa" },
  { id: "p3", title: "Kimironko Retail Block", type: "Commercial design", location: "Kimironko, Kigali", sqft: 5200, year: 2022, description: "Ground-floor retail with two levels of office space above.", art: "commercial" },
  { id: "p4", title: "Gisozi Home Renovation", type: "Renovation", location: "Gisozi, Kigali", sqft: 1600, year: 2024, description: "Full interior reconfiguration and a new roof structure on an existing footprint.", art: "renovation" },
];

// Simple flat-line project illustrations. These are original stand-ins, not
// photos of real sites — swap the image slot for real project photography
// whenever it's available (see PortfolioSection for where to drop an <img>).
function ProjectArt({ kind }) {
  const stroke = "#111214";
  const fill = "#FFF1EB";
  const accent = "#FF5A1F";
  const scenes = {
    house: (
      <svg viewBox="0 0 240 140" className="w-full h-full">
        <rect width="240" height="140" fill={fill} />
        <rect x="60" y="60" width="100" height="60" fill="none" stroke={stroke} strokeWidth="2.5" />
        <path d="M52 60 L110 24 L168 60" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="95" y="85" width="20" height="35" fill="none" stroke={stroke} strokeWidth="2" />
        <rect x="130" y="75" width="16" height="16" fill="none" stroke={stroke} strokeWidth="2" />
        <rect x="140" y="20" width="6" height="20" fill={accent} />
        <line x1="30" y1="120" x2="210" y2="120" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    villa: (
      <svg viewBox="0 0 240 140" className="w-full h-full">
        <rect width="240" height="140" fill={fill} />
        <rect x="40" y="70" width="160" height="45" fill="none" stroke={stroke} strokeWidth="2.5" />
        <rect x="40" y="45" width="70" height="25" fill="none" stroke={stroke} strokeWidth="2.5" />
        <line x1="30" y1="115" x2="210" y2="115" stroke={stroke} strokeWidth="2" />
        <line x1="120" y1="115" x2="200" y2="90" stroke={accent} strokeWidth="2.5" />
        <rect x="55" y="82" width="14" height="14" fill="none" stroke={stroke} strokeWidth="1.5" />
        <rect x="80" y="82" width="14" height="14" fill="none" stroke={stroke} strokeWidth="1.5" />
        <circle cx="185" cy="55" r="8" fill="none" stroke={accent} strokeWidth="2" />
      </svg>
    ),
    commercial: (
      <svg viewBox="0 0 240 140" className="w-full h-full">
        <rect width="240" height="140" fill={fill} />
        <rect x="70" y="20" width="90" height="100" fill="none" stroke={stroke} strokeWidth="2.5" />
        {[0, 1, 2, 3].map((row) => (
          <g key={row}>
            {[0, 1, 2].map((col) => (
              <rect key={col} x={82 + col * 24} y={32 + row * 20} width="14" height="12" fill="none" stroke={stroke} strokeWidth="1.3" />
            ))}
          </g>
        ))}
        <rect x="95" y="105" width="30" height="15" fill={accent} />
        <line x1="40" y1="120" x2="200" y2="120" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    renovation: (
      <svg viewBox="0 0 240 140" className="w-full h-full">
        <rect width="240" height="140" fill={fill} />
        <rect x="55" y="55" width="130" height="60" fill="none" stroke={stroke} strokeWidth="2.5" strokeDasharray="6 4" />
        <line x1="120" y1="55" x2="120" y2="115" stroke={stroke} strokeWidth="2" />
        <rect x="75" y="70" width="24" height="24" fill="none" stroke={accent} strokeWidth="2" />
        <line x1="140" y1="70" x2="164" y2="94" stroke={accent} strokeWidth="2" />
        <line x1="164" y1="70" x2="140" y2="94" stroke={accent} strokeWidth="2" />
        <line x1="40" y1="115" x2="200" y2="115" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
  };
  return scenes[kind] || scenes.house;
}

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill="#25D366" />
      <path d="M16 8a8 8 0 0 0-6.9 12l-1.1 4 4.1-1.1A8 8 0 1 0 16 8z" fill="none" stroke="white" strokeWidth="1.4" />
      <path d="M12.5 12.7c.2-.5.5-.5.7-.5h.5c.2 0 .4 0 .6.4.2.5.7 1.6.7 1.7.1.1.1.3 0 .4-.1.2-.1.3-.3.4-.1.2-.3.3-.4.4-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.5 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1 .2-.2.3-.2.6-.1.2.1 1.5.7 1.7.8.2.1.4.2.5.3.1.2.1.9-.2 1.4-.3.6-1.5 1.1-2 1.1-.5.1-1.1.1-3.6-.9-3-1.2-4.9-4.2-5-4.4-.1-.2-1-1.3-1-2.5s.6-1.8.8-2z" fill="white" />
    </svg>
  );
}

function computeEstimate(type, sqft, finishId) {
  const rate = RATE_TABLE[type] ?? RATE_TABLE.Other;
  const tier = FINISH_TIERS.find((f) => f.id === finishId) ?? FINISH_TIERS[0];
  const base = rate * sqft * tier.mult;
  return { low: Math.round(base * 0.9), high: Math.round(base * 1.15), rate, tier };
}

function nextWeekdays(count) {
  const days = [];
  let d = new Date();
  d.setDate(d.getDate() + 1);
  while (days.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}
function fmtDate(d) { return d.toISOString().slice(0, 10); }
function fmtDateLabel(d) { return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
function money(n) { return "$" + Math.round(n).toLocaleString(); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

async function storageGet(key, fallback) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : fallback;
  } catch (e) { return fallback; }
}
async function storageSet(key, value) {
  try { await window.storage.set(key, JSON.stringify(value), true); return true; }
  catch (e) { console.error("storage set failed", key, e); return false; }
}

function Badge({ children, tone = "default" }) {
  const tones = {
    default: { background: "var(--ink-5)", color: "var(--ink)" },
    accent: { background: "var(--accent-10)", color: "var(--accent-deep)" },
    dark: { background: "rgba(255,255,255,0.1)", color: "var(--paper)" },
  };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono font-medium tracking-wide" style={tones[tone]}>
      {children}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl text-sm shadow-2xl" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      {toast}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("site");
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    (async () => {
      const [l, b, p] = await Promise.all([
        storageGet("leads", []),
        storageGet("bookings", []),
        storageGet("portfolio", null),
      ]);
      setLeads(l);
      setBookings(b);
      if (p) setPortfolio(p);
      else { setPortfolio(SEED_PORTFOLIO); await storageSet("portfolio", SEED_PORTFOLIO); }
      setLoading(false);
    })();
  }, []);

  function notify(msg) { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3200); }

  async function addLead(lead) {
    const next = [lead, ...leads];
    setLeads(next);
    await storageSet("leads", next);
  }
  async function updateLeadStatus(id, status) {
    const next = leads.map((l) => (l.id === id ? { ...l, status } : l));
    setLeads(next);
    await storageSet("leads", next);
  }
  async function addBooking(booking) {
    const fresh = await storageGet("bookings", []);
    const conflict = fresh.some((b) => b.date === booking.date && b.time === booking.time);
    if (conflict) { setBookings(fresh); return { ok: false }; }
    const next = [booking, ...fresh];
    setBookings(next);
    await storageSet("bookings", next);
    return { ok: true };
  }
  async function addPortfolioItem(item) {
    const next = [item, ...portfolio];
    setPortfolio(next);
    await storageSet("portfolio", next);
  }
  async function removePortfolioItem(id) {
    const next = portfolio.filter((p) => p.id !== id);
    setPortfolio(next);
    await storageSet("portfolio", next);
  }

  const tokens = {
    "--ink": "#111214",
    "--ink-5": "rgba(17,18,20,0.05)",
    "--ink-10": "rgba(17,18,20,0.1)",
    "--paper": "#FBFAF7",
    "--card": "#FFFFFF",
    "--muted": "#6D7075",
    "--border": "#EAE8E2",
    "--accent": "#FF5A1F",
    "--accent-deep": "#C7420E",
    "--accent-10": "rgba(255,90,31,0.12)",
    "--accent-tint": "#FFF1EB",
  };

  if (loading) {
    return (
      <div className="min-h-[400px] w-full flex items-center justify-center" style={{ background: tokens["--paper"], fontFamily: "Inter, sans-serif", color: tokens["--muted"] }}>
        <style>{FONT_IMPORT}</style>
        <p className="text-sm font-mono">Loading studio data…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ ...tokens, fontFamily: "Inter, sans-serif", color: "var(--ink)", background: "var(--paper)" }}>
      <style>{`
        ${FONT_IMPORT}
        .font-display { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.02em; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        input, select, textarea { font-family: 'Inter', sans-serif; }
        table { border-collapse: collapse; }
        .field {
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 11px 14px;
          background: var(--card);
          transition: border-color .15s ease;
          width: 100%;
        }
        .field:focus { outline: none; border-color: var(--ink); }
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          transition: box-shadow .2s ease, transform .2s ease;
        }
        .card-hover:hover {
          box-shadow: 0 12px 32px rgba(17,18,20,0.08);
          transform: translateY(-2px);
        }
        .btn-primary {
          background: var(--ink); color: var(--paper); border-radius: 999px;
          padding: 13px 24px; font-weight: 500; font-size: 14px; transition: opacity .15s ease;
        }
        .btn-primary:hover { opacity: 0.85; }
        .btn-accent {
          background: var(--accent); color: white; border-radius: 999px;
          padding: 13px 24px; font-weight: 500; font-size: 14px; transition: opacity .15s ease;
        }
        .btn-accent:hover { opacity: 0.88; }
        .btn-ghost {
          border: 1.5px solid var(--border); border-radius: 999px; padding: 13px 24px;
          font-weight: 500; font-size: 14px; transition: border-color .15s ease, background .15s ease;
        }
        .btn-ghost:hover { border-color: var(--ink); background: var(--ink-5); }
        .pill-toggle {
          border-radius: 999px; padding: 9px 16px; font-size: 13.5px; font-weight: 500;
          border: 1.5px solid var(--border); transition: all .15s ease;
        }
      `}</style>

      <Toast toast={toastMsg} />

      <header className="sticky top-0 z-30" style={{ background: "rgba(251,250,247,0.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-semibold text-xl">K&amp;D</span>
            <span className="font-mono text-[11px] tracking-[0.15em] uppercase" style={{ color: "var(--muted)" }}>PlansVista</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#portfolio" onClick={() => setView("site")} className="hover:opacity-60 transition-opacity">Portfolio</a>
            <a href="#estimate" onClick={() => setView("site")} className="hover:opacity-60 transition-opacity">Estimate</a>
            <a href="#book" onClick={() => setView("site")} className="hover:opacity-60 transition-opacity">Book a visit</a>
            <a href="#contact" onClick={() => setView("site")} className="hover:opacity-60 transition-opacity">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href={waLink("Hi K&D PlansVista, I'd like to ask about a project.")} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-2 btn-ghost" style={{ padding: "9px 16px" }}>
              <WhatsAppIcon size={16} /> WhatsApp
            </a>
            <button onClick={() => setView(view === "site" ? "studio" : "site")} className="btn-primary">
              {view === "site" ? "Studio view" : "Back to site"}
            </button>
          </div>
        </div>
      </header>

      {view === "site" && (
        <a
          href={waLink("Hi K&D PlansVista, I'd like to ask about a project.")}
          target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full shadow-2xl px-5 py-3.5"
          style={{ background: "#25D366", color: "white", fontWeight: 500, fontSize: 14 }}
        >
          <WhatsAppIcon size={20} /> Chat on WhatsApp
        </a>
      )}

      {view === "site" ? (
        <SiteView portfolio={portfolio} bookings={bookings} onAddLead={addLead} onAddBooking={addBooking} notify={notify} />
      ) : (
        <StudioView
          leads={leads} bookings={bookings} portfolio={portfolio}
          onUpdateLeadStatus={updateLeadStatus} onAddPortfolioItem={addPortfolioItem}
          onRemovePortfolioItem={removePortfolioItem} notify={notify}
        />
      )}

      <footer className="py-10" style={{ background: "var(--ink)", color: "rgba(251,250,247,0.7)" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <span className="text-xs font-mono">© 2026 K&amp;D PlansVista — design &amp; construction</span>
          <span className="text-xs font-mono">Kigali · Kabuga, Rwanda</span>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PUBLIC SITE
// ---------------------------------------------------------------------------
function SiteView({ portfolio, bookings, onAddLead, onAddBooking, notify }) {
  return (
    <>
      <section className="relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 relative grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge tone="dark"><span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)", display: "inline-block" }} />Studio · Kigali</Badge>
            <h1 className="font-display font-semibold text-5xl md:text-6xl leading-[1.02] mt-7">
              We draw it.<br />Then we build it.
            </h1>
            <p className="mt-6 text-base leading-relaxed max-w-md" style={{ color: "rgba(251,250,247,0.7)" }}>
              K&amp;D PlansVista designs buildings and builds them ourselves — one team, from the first
              floor plan to the final coat of paint.
            </p>
            <div className="mt-9 flex gap-3 flex-wrap">
              <a href="#estimate" className="btn-accent">Estimate a project</a>
              <a href="#portfolio" className="btn-ghost" style={{ borderColor: "rgba(251,250,247,0.25)", color: "var(--paper)" }}>See our work</a>
              <a href={waLink("Hi K&D PlansVista, I'd like to ask about a project.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 btn-ghost" style={{ borderColor: "rgba(251,250,247,0.25)", color: "var(--paper)" }}>
                <WhatsAppIcon size={16} /> Message us
              </a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatBlock label="years active" value="7" />
            <StatBlock label="projects built" value={String(portfolio.length + 22)} />
            <StatBlock label="avg. turnaround" value="14 wks" />
          </div>
        </div>
      </section>

      <PortfolioSection portfolio={portfolio} />
      <EstimatorSection />
      <BookingSection bookings={bookings} onAddBooking={onAddBooking} notify={notify} />
      <ContactSection onAddLead={onAddLead} notify={notify} />
    </>
  );
}

function StatBlock({ label, value }) {
  return (
    <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(251,250,247,0.06)", border: "1px solid rgba(251,250,247,0.12)" }}>
      <div className="font-display font-semibold text-3xl">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] mt-1" style={{ color: "rgba(251,250,247,0.55)" }}>{label}</div>
    </div>
  );
}

function PortfolioSection({ portfolio }) {
  return (
    <section id="portfolio" className="max-w-6xl mx-auto px-6 py-24">
      <Badge tone="accent">Portfolio</Badge>
      <h2 className="font-display font-semibold text-3xl md:text-4xl mt-4 max-w-xl">Recent work, pulled from the project record.</h2>
      <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
        Shown as illustrated concepts until real project photos are added — see the studio panel to attach photography per project.
      </p>
      <div className="grid md:grid-cols-2 gap-5 mt-8">
        {portfolio.map((p) => (
          <div key={p.id} className="card card-hover overflow-hidden">
            <div style={{ borderBottom: "1px solid var(--border)" }}>
              {p.image ? (
                <img src={p.image} alt={p.title} className="w-full h-[150px] object-cover" />
              ) : (
                <ProjectArt kind={p.art || "house"} />
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <Badge>{p.type}</Badge>
                <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>{p.year || "—"}</span>
              </div>
              <h3 className="font-display font-semibold text-xl mt-4">{p.title}</h3>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{p.location} · {p.sqft.toLocaleString()} sqft</p>
              <p className="text-sm mt-3 leading-relaxed">{p.description}</p>
            </div>
          </div>
        ))}
        {portfolio.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>No projects listed yet.</p>}
      </div>
    </section>
  );
}

function EstimatorSection() {
  const [type, setType] = useState(PROJECT_TYPES[2]);
  const [sqft, setSqft] = useState(1800);
  const [finish, setFinish] = useState("standard");
  const est = computeEstimate(type, sqft, finish);

  return (
    <section id="estimate" className="py-24" style={{ background: "var(--accent-tint)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Badge tone="accent">Estimate</Badge>
        <h2 className="font-display font-semibold text-3xl md:text-4xl mt-4 max-w-xl">Get a rough number before you get a quote.</h2>
        <p className="text-sm mt-2 max-w-lg" style={{ color: "var(--muted)" }}>
          Based on our recent project rates. Actual quotes depend on site conditions and finishes.
        </p>

        <div className="grid md:grid-cols-5 gap-8 mt-10">
          <div className="md:col-span-3 space-y-6">
            <div>
              <label className="text-xs font-mono uppercase tracking-wide" style={{ color: "var(--muted)" }}>Project type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="field mt-2">
                {PROJECT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <div className="flex justify-between">
                <label className="text-xs font-mono uppercase tracking-wide" style={{ color: "var(--muted)" }}>Size (sqft)</label>
                <span className="font-mono text-xs font-medium">{sqft.toLocaleString()}</span>
              </div>
              <input type="range" min="300" max="10000" step="50" value={sqft} onChange={(e) => setSqft(parseInt(e.target.value))} className="w-full mt-3" style={{ accentColor: "var(--accent)" }} />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wide" style={{ color: "var(--muted)" }}>Finish tier</label>
              <div className="flex gap-2 mt-2">
                {FINISH_TIERS.map((f) => (
                  <button key={f.id} onClick={() => setFinish(f.id)} className="pill-toggle" style={{
                    borderColor: finish === f.id ? "var(--ink)" : "var(--border)",
                    background: finish === f.id ? "var(--ink)" : "var(--card)",
                    color: finish === f.id ? "var(--paper)" : "var(--ink)",
                  }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 card p-7 h-fit">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>Estimated range</div>
            <div className="font-display font-semibold text-3xl mt-2">{money(est.low)} – {money(est.high)}</div>
            <div className="text-xs mt-2 font-mono" style={{ color: "var(--muted)" }}>
              ${est.rate}/sqft ({RATE_UNIT[type]}) × {est.tier.mult}x finish
            </div>
            <a href="#contact" className="btn-accent inline-block mt-6 text-center">Turn this into a quote request</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingSection({ bookings, onAddBooking, notify }) {
  const dates = nextWeekdays(10);
  const [selectedDate, setSelectedDate] = useState(fmtDate(dates[0]));
  const [selectedTime, setSelectedTime] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const takenTimes = bookings.filter((b) => b.date === selectedDate).map((b) => b.time);
  const availableTimes = SLOT_TIMES.filter((t) => !takenTimes.includes(t));

  async function handleBook() {
    setError("");
    if (!name.trim() || !phone.trim()) { setError("Enter your name and phone number."); return; }
    if (!selectedTime) { setError("Pick a time slot first."); return; }
    setSubmitting(true);
    const booking = { id: genId(), name, phone, date: selectedDate, time: selectedTime, createdAt: new Date().toISOString() };
    const res = await onAddBooking(booking);
    setSubmitting(false);
    if (!res.ok) { setError("That slot was just taken by someone else — pick another time."); setSelectedTime(null); return; }
    setConfirmed(booking);
    notify("Site visit booked.");
  }

  if (confirmed) {
    return (
      <section id="book" className="max-w-6xl mx-auto px-6 py-24">
        <div className="card p-8 max-w-lg">
          <Badge tone="accent">Confirmed</Badge>
          <h3 className="font-display font-semibold text-2xl mt-4">Site visit booked</h3>
          <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>
            {fmtDateLabel(new Date(confirmed.date))} at {confirmed.time}. We'll call {confirmed.phone} to confirm.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="book" className="max-w-6xl mx-auto px-6 py-24">
      <Badge tone="accent">Site visit</Badge>
      <h2 className="font-display font-semibold text-3xl md:text-4xl mt-4 max-w-xl">Walk the site with us.</h2>

      <div className="mt-8 flex gap-2 flex-wrap">
        {dates.map((d) => {
          const key = fmtDate(d);
          const active = selectedDate === key;
          return (
            <button key={key} onClick={() => { setSelectedDate(key); setSelectedTime(null); }} className="pill-toggle font-mono" style={{
              borderColor: active ? "var(--ink)" : "var(--border)",
              background: active ? "var(--ink)" : "var(--card)",
              color: active ? "var(--paper)" : "var(--ink)",
            }}>
              {fmtDateLabel(d)}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex gap-2 flex-wrap">
        {SLOT_TIMES.map((t) => {
          const taken = takenTimes.includes(t);
          const active = selectedTime === t;
          return (
            <button key={t} disabled={taken} onClick={() => setSelectedTime(t)} className="pill-toggle font-mono" style={{
              borderColor: active ? "var(--accent)" : "var(--border)",
              background: active ? "var(--accent)" : "var(--card)",
              color: taken ? "var(--muted)" : active ? "white" : "var(--ink)",
              textDecoration: taken ? "line-through" : "none",
              opacity: taken ? 0.5 : 1,
              cursor: taken ? "not-allowed" : "pointer",
            }}>
              {t}
            </button>
          );
        })}
        {availableTimes.length === 0 && <span className="text-sm" style={{ color: "var(--muted)" }}>No slots left this day.</span>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-7 max-w-lg">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="field" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 ..." className="field" />
      </div>
      {error && <p className="text-sm mt-3" style={{ color: "#C7420E" }}>{error}</p>}
      <button onClick={handleBook} disabled={submitting} className="btn-primary mt-6">
        {submitting ? "Booking…" : "Confirm site visit"}
      </button>
    </section>
  );
}

function ContactSection({ onAddLead, notify }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", type: PROJECT_TYPES[0], sqft: 1200, finish: "standard", message: "" });
  const [sent, setSent] = useState(null);
  const [error, setError] = useState("");

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Name, email, and a short message are required.");
      return;
    }
    const est = computeEstimate(form.type, Number(form.sqft) || 0, form.finish);
    const lead = { id: genId(), ...form, sqft: Number(form.sqft) || 0, estimateLow: est.low, estimateHigh: est.high, status: "new", createdAt: new Date().toISOString() };
    await onAddLead(lead);
    setSent(lead);
    notify("Quote request received.");
  }

  if (sent) {
    return (
      <section id="contact" className="max-w-6xl mx-auto px-6 py-24">
        <div className="card p-8 max-w-lg">
          <Badge>Ref {sent.id}</Badge>
          <h3 className="font-display font-semibold text-2xl mt-4">Request received</h3>
          <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>
            Rough estimate for this brief: {money(sent.estimateLow)} – {money(sent.estimateHigh)}. We'll follow up at {sent.email} within one business day.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-24" style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Badge tone="accent">Contact</Badge>
        <div className="flex items-center justify-between flex-wrap gap-4 mt-4">
          <h2 className="font-display font-semibold text-3xl md:text-4xl max-w-xl">Turn this into a quote request.</h2>
          <a href={waLink("Hi K&D PlansVista, I'd like to ask about a project.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 btn-ghost">
            <WhatsAppIcon size={16} /> Or message us on WhatsApp
          </a>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4 mt-10 max-w-3xl">
          <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" className="field" />
          <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="you@email.com" className="field" />
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+250 ..." className="field" />
          <select value={form.type} onChange={(e) => update("type", e.target.value)} className="field">
            {PROJECT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
          <input value={form.sqft} onChange={(e) => update("sqft", e.target.value)} type="number" min="0" placeholder="Approx. sqft" className="field" />
          <select value={form.finish} onChange={(e) => update("finish", e.target.value)} className="field">
            {FINISH_TIERS.map((f) => (<option key={f.id} value={f.id}>{f.label} finish</option>))}
          </select>
          <textarea value={form.message} onChange={(e) => update("message", e.target.value)} rows={4} placeholder="Tell us about the site, budget, and timeline" className="field md:col-span-2 resize-none" />
          {error && <p className="text-sm md:col-span-2" style={{ color: "#C7420E" }}>{error}</p>}
          <button type="submit" className="btn-accent w-fit">Send request</button>
        </form>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// STUDIO (no login — open operations view)
// ---------------------------------------------------------------------------
function StudioView({ leads, bookings, portfolio, onUpdateLeadStatus, onAddPortfolioItem, onRemovePortfolioItem, notify }) {
  const [showAddProject, setShowAddProject] = useState(false);
  const newLeadCount = leads.filter((l) => l.status === "new").length;
  const upcomingBookings = bookings
    .filter((b) => b.date >= fmtDate(new Date()))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <Badge tone="accent">Studio</Badge>
      <h2 className="font-display font-semibold text-3xl md:text-4xl mt-4">Operations</h2>

      <div className="grid sm:grid-cols-4 gap-4 mt-9">
        <MetricCard label="total leads" value={leads.length} />
        <MetricCard label="new leads" value={newLeadCount} accent />
        <MetricCard label="upcoming visits" value={upcomingBookings.length} />
        <MetricCard label="portfolio items" value={portfolio.length} />
      </div>

      <div className="mt-16">
        <h3 className="font-display font-semibold text-xl mb-5">Leads</h3>
        {leads.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No quote requests yet.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--paper)" }}>
                  {["Name", "Type", "Sqft", "Estimate", "Status", "Received"].map((h) => (
                    <th key={h} className="text-left font-mono text-[10px] uppercase tracking-wide px-4 py-3" style={{ color: "var(--muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{l.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>{l.email}</div>
                    </td>
                    <td className="px-4 py-3">{l.type}</td>
                    <td className="px-4 py-3 font-mono">{l.sqft?.toLocaleString?.() ?? "—"}</td>
                    <td className="px-4 py-3 font-mono">{money(l.estimateLow)}–{money(l.estimateHigh)}</td>
                    <td className="px-4 py-3">
                      <select value={l.status} onChange={(e) => onUpdateLeadStatus(l.id, e.target.value)} className="field" style={{ padding: "6px 10px", fontSize: 12, borderRadius: 999, width: "auto" }}>
                        {LEAD_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-16">
        <h3 className="font-display font-semibold text-xl mb-5">Upcoming site visits</h3>
        {upcomingBookings.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Nothing scheduled.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="card p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">{b.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{b.phone}</div>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="font-medium">{fmtDateLabel(new Date(b.date))}</div>
                  <div style={{ color: "var(--muted)" }}>{b.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-16">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-xl">Portfolio</h3>
          <button onClick={() => setShowAddProject((s) => !s)} className="btn-ghost" style={{ padding: "9px 18px" }}>
            {showAddProject ? "Cancel" : "Add project"}
          </button>
        </div>
        {showAddProject && (
          <AddProjectForm onAdd={async (item) => { await onAddPortfolioItem(item); setShowAddProject(false); notify("Project added to portfolio."); }} />
        )}
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {portfolio.map((p) => (
            <div key={p.id} className="card p-4 flex items-center gap-3">
              <div className="rounded-xl overflow-hidden shrink-0" style={{ width: 56, height: 56, border: "1px solid var(--border)" }}>
                {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-cover" /> : <ProjectArt kind={p.art || "house"} />}
              </div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm">{p.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{p.location} · {p.sqft.toLocaleString()} sqft {p.image ? "· photo attached" : "· illustration"}</div>
                </div>
                <button onClick={() => onRemovePortfolioItem(p.id)} className="text-xs font-mono" style={{ color: "#C7420E" }}>remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="card p-5">
      <div className="font-display font-semibold text-2xl" style={{ color: accent ? "var(--accent)" : "var(--ink)" }}>{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] mt-1" style={{ color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

const ART_OPTIONS = [
  { id: "house", label: "House" },
  { id: "villa", label: "Villa" },
  { id: "commercial", label: "Commercial" },
  { id: "renovation", label: "Renovation" },
];

function AddProjectForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState(PROJECT_TYPES[2]);
  const [location, setLocation] = useState("");
  const [sqft, setSqft] = useState("");
  const [description, setDescription] = useState("");
  const [art, setArt] = useState("house");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    if (!title.trim() || !location.trim() || !sqft) { setError("Title, location, and sqft are required."); return; }
    setError("");
    await onAdd({
      id: genId(), title, type, location, sqft: Number(sqft),
      year: new Date().getFullYear(),
      description: description || "No description provided.",
      art, image: image.trim() || null,
    });
    setTitle(""); setLocation(""); setSqft(""); setDescription(""); setImage("");
  }

  return (
    <div className="card p-5 grid sm:grid-cols-2 gap-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" className="field" />
      <select value={type} onChange={(e) => setType(e.target.value)} className="field">
        {PROJECT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
      </select>
      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="field" />
      <input value={sqft} onChange={(e) => setSqft(e.target.value)} type="number" placeholder="Sqft" className="field" />
      <select value={art} onChange={(e) => setArt(e.target.value)} className="field">
        {ART_OPTIONS.map((a) => (<option key={a.id} value={a.id}>{a.label} illustration</option>))}
      </select>
      <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Real photo URL (optional)" className="field" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" rows={2} className="field sm:col-span-2 resize-none" />
      {error && <p className="text-sm sm:col-span-2" style={{ color: "#C7420E" }}>{error}</p>}
      <p className="text-xs sm:col-span-2" style={{ color: "var(--muted)" }}>Leave the photo URL blank to use a placeholder illustration until real project photography is available.</p>
      <button onClick={submit} className="btn-primary w-fit sm:col-span-2">Save project</button>
    </div>
  );
}
