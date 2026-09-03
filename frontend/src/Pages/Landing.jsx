import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i, x: (i * 41 + 13) % 100, y: (i * 67 + 23) % 100,
  size: (i % 3) + 1, duration: 8 + (i % 6), delay: (i * 0.35) % 5,
}));
const EASE = [0.23, 1, 0.32, 1];

/* ─── Utilities ─────────────────────────────────────────────── */
function Reveal({ children, delay = 0, y = 36 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.65, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

function Counter({ end, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let s = 0;
    const e = parseFloat(end);
    const step = (e / 1600) * 16;
    const t = setInterval(() => {
      s += step;
      if (s >= e) { setVal(e); clearInterval(t); }
      else setVal(Math.floor(s * 10) / 10);
    }, 16);
    return () => clearInterval(t);
  }, [inView, end]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Data ───────────────────────────────────────────────────── */
const PLANS = [
  {
    name: "Starter", monthlyPrice: 0, yearlyPrice: 0, badge: null,
    description: "Perfect for beginners exploring algorithmic trading.",
    color: "#64748b",
    features: ["\u20b91,00,000 virtual capital","5 active strategies","Basic backtesting (30 days)","Market analysis dashboard","Email support","Community access"],
    cta: "Get Started Free", ctaLink: "/register", highlighted: false,
  },
  {
    name: "Pro", monthlyPrice: 999, yearlyPrice: 799, badge: "Most Popular",
    description: "For serious traders who want full analytical power.",
    color: "#6366f1",
    features: ["\u20b910,00,000 virtual capital","Unlimited strategies","Full backtesting (5 years)","50+ advanced indicators","Real-time market data","Paper trading auto-execution","Priority support","Strategy performance reports"],
    cta: "Start Pro Trial", ctaLink: "/register", highlighted: true,
  },
  {
    name: "Enterprise", monthlyPrice: 3999, yearlyPrice: 2999, badge: null,
    description: "For institutions and professional trading desks.",
    color: "#8b5cf6",
    features: ["Unlimited virtual capital","Unlimited strategies","20+ years historical data","Custom indicator builder","API access & webhooks","Multi-user team accounts","Dedicated account manager","SLA 99.9% uptime","White-label option"],
    cta: "Contact Sales", ctaLink: "/register", highlighted: false,
  },
];

const TESTIMONIALS = [
  { name: "Arjun Mehta", role: "Quant Analyst, Mumbai", avatar: "AM", color: "#3b82f6", quote: "QuantNova backtesting engine is incredibly fast. I tested 10 years of NSE data in minutes. The strategy builder is intuitive even for complex multi-leg strategies.", rating: 5 },
  { name: "Priya Sharma", role: "Retail Trader, Bengaluru", avatar: "PS", color: "#8b5cf6", quote: "The paper trading feature let me practice for 3 months before going live. My win rate improved by 40%. The UI is stunning and the analytics are top-notch.", rating: 5 },
  { name: "Rahul Gupta", role: "Portfolio Manager, Delhi", avatar: "RG", color: "#06b6d4", quote: "We switched our entire research workflow to QuantNova. The team accounts and API access made integration seamless. Best investment we made this year.", rating: 5 },
  { name: "Sneha Patel", role: "Algorithm Developer, Pune", avatar: "SP", color: "#f59e0b", quote: "As a developer, the API access is a game-changer. I push signals from custom models and simulate execution instantly. Incredible platform.", rating: 5 },
];

const FAQS = [
  { q: "Is QuantNova completely free to start?", a: "Yes! Our Starter plan is permanently free with \u20b91,00,000 virtual capital, 5 strategies, and 30-day backtesting data. No credit card required." },
  { q: "What markets and instruments are supported?", a: "QuantNova supports NSE and BSE equities, F&O (futures and options), commodities, and currency pairs. We pull data from verified Indian market sources." },
  { q: "How accurate is the backtesting engine?", a: "Our backtesting accounts for slippage, brokerage costs, and capital constraints. Pro and Enterprise plans use tick-by-tick data for high-fidelity simulation." },
  { q: "Can I cancel my subscription anytime?", a: "Absolutely. Cancel anytime from your account settings. You will continue to have access until the end of your billing period with no penalties." },
  { q: "Is my trading strategy data secure?", a: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never share your strategies or trading data with third parties." },
  { q: "Do you offer a refund policy?", a: "Yes — 7-day money-back guarantee on all paid plans. Contact support within 7 days for a full refund, no questions asked." },
];

const FEATURES = [
  { icon: "📊", title: "Market Analysis", subtitle: "Real-time & Historical Data", desc: "Access NSE/BSE tick data, candlestick charts, volume profiles, and 50+ technical indicators. Overlay multiple assets.", color: "#3b82f6", points: ["Live price feeds", "OHLCV candlestick data", "Volume & OI analysis"] },
  { icon: "⚙️", title: "Strategy Builder", subtitle: "No-Code & Pro Mode", desc: "Drag-and-drop builder for beginners. Full Python script editor for professionals. Combine indicators and define entry/exit rules.", color: "#6366f1", points: ["Visual drag-and-drop builder", "Python script editor", "Conditional logic engine"] },
  { icon: "🧪", title: "Backtesting Engine", subtitle: "High-Fidelity Simulation", desc: "Run backtests on 20+ years of data in seconds. Full P&L reports, drawdown analysis, Sharpe ratio, and Monte Carlo.", color: "#8b5cf6", points: ["Walk-forward analysis", "Monte Carlo simulation", "Risk-adjusted metrics"] },
  { icon: "💰", title: "Paper Trading", subtitle: "Risk-Free Practice", desc: "Execute live simulated trades against real market data. \u20b91L–\u20b910L virtual capital. Track P&L and refine your strategy.", color: "#06b6d4", points: ["Real-time order execution", "Portfolio tracker", "Trade journal & analytics"] },
  { icon: "📈", title: "Analytics & Reports", subtitle: "Institutional-Grade Insights", desc: "Detailed performance dashboards, equity curves, sector exposure, correlation matrices, and exportable PDF/CSV reports.", color: "#22c55e", points: ["Equity curve charts", "Drawdown analysis", "PDF/CSV export"] },
  { icon: "🔔", title: "Smart Alerts", subtitle: "Never Miss a Signal", desc: "Price alerts, strategy signal notifications, and risk threshold warnings via email, SMS, or webhook to your trading system.", color: "#f59e0b", points: ["Email & SMS alerts", "Webhook integration", "Risk breach notifications"] },
];

const LOGOS = ["NSE", "BSE", "SEBI", "NSDL", "MCX", "NSE F&O"];

/* ─── Main Component ─────────────────────────────────────────── */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const SL = { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6366f1", margin: "0 0 0.75rem" };
  const ST = { fontSize: "clamp(1.85rem,3.5vw,2.85rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.12, margin: "0 0 1.1rem", color: "#f1f5f9" };
  const SS = { fontSize: "1rem", color: "#64748b", lineHeight: 1.75, margin: 0 };

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden" }}>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: EASE }}
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: scrolled ? "rgba(2,6,23,0.94)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(99,102,241,0.12)" : "1px solid transparent", transition: "all 0.3s" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0.9rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <motion.span whileHover={{ scale: 1.04 }} style={{ fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", display: "inline-block" }}>
              Quant<span style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Nova</span>
            </motion.span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", fontSize: "0.875rem" }}>
            {[["#features","Features"],["#how-it-works","How It Works"],["#pricing","Pricing"],["#testimonials","Reviews"],["#faq","FAQ"]].map(([href,lbl]) => (
              <motion.a key={href} href={href} whileHover={{ color: "#f1f5f9", y: -1 }} style={{ color: "#94a3b8", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}>{lbl}</motion.a>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link to="/login" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", color: "#94a3b8", textDecoration: "none", fontWeight: 500 }}
              onMouseEnter={e => e.target.style.color="#f1f5f9"} onMouseLeave={e => e.target.style.color="#94a3b8"}>Login</Link>
            <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
              <Link to="/register" style={{ padding: "0.55rem 1.2rem", fontSize: "0.875rem", fontWeight: 600, background: "linear-gradient(135deg,#4f46e5,#3b82f6)", color: "#fff", textDecoration: "none", borderRadius: "0.6rem", boxShadow: "0 2px 16px -4px rgba(99,102,241,0.5)", display: "inline-block", position: "relative", overflow: "hidden" }}>
                <motion.div animate={{ x: ["-100%","200%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 2 }} style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)", pointerEvents: "none" }} />
                Get Started Free
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{ position: "relative", paddingTop: "8.5rem", paddingBottom: "5rem", overflow: "hidden" }}>
        {/* Glows */}
        <motion.div animate={{ scale:[1,1.15,1], opacity:[0.12,0.22,0.12] }} transition={{ duration:10, repeat:Infinity, ease:"easeInOut" }}
          style={{ position:"absolute", top:"-10%", left:"50%", transform:"translateX(-50%)", width:"900px", height:"650px", background:"radial-gradient(ellipse,rgba(99,102,241,0.18) 0%,transparent 68%)", pointerEvents:"none" }} />
        <motion.div animate={{ scale:[1,1.15,1], opacity:[0.1,0.2,0.1] }} transition={{ duration:13, repeat:Infinity, ease:"easeInOut", delay:2 }}
          style={{ position:"absolute", bottom:"5%", right:"-8%", width:"480px", height:"480px", background:"radial-gradient(circle,#06b6d4 0%,transparent 70%)", filter:"blur(70px)", borderRadius:"50%", pointerEvents:"none" }} />
        <motion.div animate={{ scale:[1,1.15,1], opacity:[0.08,0.16,0.08] }} transition={{ duration:11, repeat:Infinity, ease:"easeInOut", delay:4 }}
          style={{ position:"absolute", top:"30%", left:"-5%", width:"380px", height:"380px", background:"radial-gradient(circle,#8b5cf6 0%,transparent 70%)", filter:"blur(70px)", borderRadius:"50%", pointerEvents:"none" }} />
        {/* Grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,102,241,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.03) 1px,transparent 1px)", backgroundSize:"60px 60px", pointerEvents:"none" }} />
        {/* Particles */}
        {PARTICLES.map(p => (
          <motion.div key={p.id} animate={{ y:[-12,12,-12], opacity:[0.1,0.4,0.1] }} transition={{ duration:p.duration, delay:p.delay, repeat:Infinity, ease:"easeInOut" }}
            style={{ position:"absolute", left:p.x+"%", top:p.y+"%", width:p.size+"px", height:p.size+"px", background:"rgba(99,102,241,0.7)", borderRadius:"50%", pointerEvents:"none" }} />
        ))}

        <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"0 1.5rem", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4rem", alignItems:"center", position:"relative" }}>
          {/* Left text */}
          <motion.div initial="hidden" animate="visible" variants={{ hidden:{}, visible:{ transition:{ staggerChildren:0.12, delayChildren:0.15 } } }}>
            <motion.div variants={{ hidden:{ opacity:0, y:20 }, visible:{ opacity:1, y:0, transition:{ duration:0.55, ease:EASE } } }}
              style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", padding:"0.38rem 0.9rem", borderRadius:"99px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.25)", color:"#a5b4fc", fontSize:"0.78rem", fontWeight:500, marginBottom:"1.25rem" }}>
              <motion.span animate={{ scale:[1,1.5,1], opacity:[1,0.5,1] }} transition={{ duration:1.8, repeat:Infinity }}
                style={{ width:"6px", height:"6px", background:"#4f46e5", borderRadius:"50%", display:"inline-block" }} />
              India's #1 AI Trading Research Platform
            </motion.div>

            <motion.h1 variants={{ hidden:{ opacity:0, y:28, filter:"blur(8px)" }, visible:{ opacity:1, y:0, filter:"blur(0px)", transition:{ duration:0.7, ease:EASE } } }}
              style={{ fontSize:"clamp(2.6rem,5vw,4.2rem)", fontWeight:900, lineHeight:1.06, letterSpacing:"-0.04em", margin:"0 0 1.35rem" }}>
              Trade Smarter.<br />
              <span style={{ background:"linear-gradient(135deg,#3b82f6 0%,#6366f1 50%,#a78bfa 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Backtest Faster.</span><br />
              Win Bigger.
            </motion.h1>

            <motion.p variants={{ hidden:{ opacity:0, y:20 }, visible:{ opacity:1, y:0, transition:{ duration:0.6, ease:EASE, delay:0.1 } } }}
              style={{ fontSize:"1.05rem", color:"#64748b", lineHeight:1.78, maxWidth:"490px", margin:"0 0 2rem" }}>
              Build, backtest, and paper-trade algorithmic strategies on NSE &amp; BSE with real market data — completely risk-free. Used by 12,000+ traders.
            </motion.p>

            <motion.div variants={{ hidden:{ opacity:0, y:20 }, visible:{ opacity:1, y:0, transition:{ duration:0.55, ease:EASE } } }}
              style={{ display:"flex", gap:"1rem", flexWrap:"wrap", marginBottom:"2.75rem" }}>
              <motion.div whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.97 }}>
                <Link to="/register" style={{ padding:"0.9rem 2rem", borderRadius:"0.75rem", fontWeight:700, fontSize:"0.95rem", background:"linear-gradient(135deg,#4f46e5 0%,#3b82f6 100%)", color:"#fff", textDecoration:"none", boxShadow:"0 4px 24px -4px rgba(99,102,241,0.55)", display:"inline-block", position:"relative", overflow:"hidden" }}>
                  <motion.div animate={{ x:["-100%","200%"] }} transition={{ duration:2.5, repeat:Infinity, ease:"linear", repeatDelay:2 }} style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)", pointerEvents:"none" }} />
                  Start Free — No Card Needed
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.97 }}>
                <a href="#pricing" style={{ padding:"0.9rem 2rem", borderRadius:"0.75rem", fontWeight:600, fontSize:"0.95rem", border:"1px solid rgba(71,85,105,0.5)", color:"#94a3b8", textDecoration:"none", background:"rgba(15,23,42,0.5)", backdropFilter:"blur(8px)", display:"inline-block" }}
                  onMouseEnter={e => { e.target.style.color="#f1f5f9"; e.target.style.borderColor="rgba(99,102,241,0.4)"; }}
                  onMouseLeave={e => { e.target.style.color="#94a3b8"; e.target.style.borderColor="rgba(71,85,105,0.5)"; }}>
                  View Pricing
                </a>
              </motion.div>
            </motion.div>

            <motion.div variants={{ hidden:{ opacity:0 }, visible:{ opacity:1, transition:{ duration:0.5 } } }}
              style={{ display:"flex", gap:"2.5rem", flexWrap:"wrap", paddingTop:"1.75rem", borderTop:"1px solid rgba(71,85,105,0.2)" }}>
              {[["12k+","Active Traders"],["₹50Cr+","Virtual Capital Traded"],["99.9%","Uptime SLA"]].map(([v,l]) => (
                <div key={l}><p style={{ fontSize:"1.5rem", fontWeight:800, color:"#f1f5f9", margin:0, letterSpacing:"-0.03em" }}>{v}</p><p style={{ fontSize:"0.75rem", color:"#475569", margin:"2px 0 0", letterSpacing:"0.04em" }}>{l}</p></div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — dashboard */}
          <motion.div initial={{ opacity:0, x:55, filter:"blur(12px)" }} animate={{ opacity:1, x:0, filter:"blur(0px)" }} transition={{ duration:0.9, delay:0.45, ease:EASE }}>
            <motion.div animate={{ y:[-7,7,-7] }} transition={{ duration:6, repeat:Infinity, ease:"easeInOut" }}
              style={{ background:"rgba(15,23,42,0.88)", backdropFilter:"blur(24px)", border:"1px solid rgba(99,102,241,0.22)", borderRadius:"1.25rem", padding:"1.4rem", boxShadow:"0 0 0 1px rgba(255,255,255,0.03),0 40px 80px -20px rgba(0,0,0,0.85),0 0 100px -20px rgba(99,102,241,0.22)" }}>

              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.1rem" }}>
                {["#ef4444","#f59e0b","#22c55e"].map(c => <span key={c} style={{ width:"10px", height:"10px", borderRadius:"50%", background:c, display:"inline-block" }} />)}
                <span style={{ marginLeft:"0.5rem", fontSize:"0.72rem", color:"#475569", background:"rgba(71,85,105,0.2)", padding:"2px 10px", borderRadius:"99px" }}>QuantNova Strategy Lab</span>
              </div>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.1rem" }}>
                <div>
                  <p style={{ fontSize:"0.65rem", color:"#475569", margin:0, letterSpacing:"0.1em", textTransform:"uppercase" }}>PORTFOLIO VALUE</p>
                  <motion.p animate={{ opacity:[0.75,1,0.75] }} transition={{ duration:3, repeat:Infinity }} style={{ fontSize:"1.65rem", fontWeight:800, color:"#f1f5f9", margin:"3px 0 0", letterSpacing:"-0.03em" }}>₹1,04,820</motion.p>
                </div>
                <motion.div animate={{ scale:[1,1.05,1] }} transition={{ duration:2, repeat:Infinity }} style={{ padding:"0.3rem 0.7rem", borderRadius:"0.45rem", background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.22)", color:"#4ade80", fontSize:"0.82rem", fontWeight:700 }}>+4.82%</motion.div>
              </div>

              <div style={{ height:"140px", borderRadius:"0.7rem", background:"rgba(2,6,23,0.65)", border:"1px solid rgba(71,85,105,0.3)", padding:"0.85rem", marginBottom:"0.9rem" }}>
                <svg viewBox="0 0 600 120" style={{ width:"100%", height:"100%" }} preserveAspectRatio="none">
                  <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
                  <motion.path d="M0,100 40,88 80,92 120,65 160,75 210,38 260,52 310,22 360,36 410,12 460,22 510,8 560,14 600,10 600,120 0,120 Z" fill="url(#cg)" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1, duration:1 }} />
                  <motion.polyline points="0,100 40,88 80,92 120,65 160,75 210,38 260,52 310,22 360,36 410,12 460,22 510,8 560,14 600,10" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }} transition={{ delay:0.8, duration:1.5, ease:"easeOut" }} />
                </svg>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", marginBottom:"0.65rem" }}>
                {[["TCS.NS","3,421","1.24",true],["RELIANCE","2,890","0.87",true],["INFY","1,654","0.32",false],["HDFC","1,812","2.11",true]].map(([t,p,c,up]) => (
                  <motion.div key={t} whileHover={{ scale:1.02 }} style={{ background:"rgba(2,6,23,0.65)", border:"1px solid rgba(71,85,105,0.28)", borderRadius:"0.6rem", padding:"0.6rem 0.75rem" }}>
                    <p style={{ fontSize:"0.62rem", color:"#475569", margin:0, letterSpacing:"0.07em" }}>{t}</p>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"3px" }}>
                      <p style={{ fontSize:"0.88rem", fontWeight:700, color:"#f1f5f9", margin:0 }}>₹{p}</p>
                      <p style={{ fontSize:"0.72rem", fontWeight:600, color:up?"#4ade80":"#f87171", margin:0 }}>{up?"+":"-"}{c}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div whileHover={{ borderColor:"rgba(99,102,241,0.35)" }} style={{ background:"rgba(2,6,23,0.65)", border:"1px solid rgba(71,85,105,0.28)", borderRadius:"0.6rem", padding:"0.7rem 0.85rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <p style={{ fontSize:"0.62rem", color:"#475569", margin:0, letterSpacing:"0.08em" }}>STRATEGY SIGNAL</p>
                  <p style={{ fontSize:"0.88rem", fontWeight:600, color:"#f1f5f9", margin:"3px 0 0" }}>EMA Crossover — NIFTY 50</p>
                </div>
                <motion.span animate={{ scale:[1,1.07,1] }} transition={{ duration:2, repeat:Infinity }} style={{ padding:"0.3rem 0.8rem", borderRadius:"0.45rem", background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.25)", color:"#4ade80", fontSize:"0.78rem", fontWeight:700 }}>BUY</motion.span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ───────────────────────────────────── */}
      <section style={{ padding:"2.5rem 1.5rem", borderTop:"1px solid rgba(71,85,105,0.12)", borderBottom:"1px solid rgba(71,85,105,0.12)", background:"rgba(15,23,42,0.3)" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <Reveal><p style={{ textAlign:"center", fontSize:"0.75rem", color:"#334155", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"1.5rem" }}>Trusted &amp; Compatible with India's Major Markets &amp; Regulators</p></Reveal>
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"2rem", flexWrap:"wrap" }}>
            {LOGOS.map((logo,i) => (
              <Reveal key={logo} delay={i*0.06}>
                <motion.div whileHover={{ scale:1.08, color:"#94a3b8" }} style={{ fontSize:"0.85rem", fontWeight:800, color:"#334155", letterSpacing:"0.12em", padding:"0.6rem 1.25rem", border:"1px solid rgba(71,85,105,0.2)", borderRadius:"0.5rem", cursor:"default", transition:"color 0.2s" }}>{logo}</motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section id="features" style={{ padding:"6.5rem 1.5rem" }}>
        <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", maxWidth:"580px", margin:"0 auto 4.5rem" }}>
              <p style={SL}>Platform Features</p>
              <h2 style={ST}>Everything You Need to Trade Algorithmically</h2>
              <p style={SS}>From data to strategy to execution — QuantNova is your complete algorithmic trading research suite.</p>
            </div>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem" }}>
            {FEATURES.map((f,i) => <Reveal key={f.title} delay={i*0.08}><FeatureCard {...f} /></Reveal>)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" style={{ padding:"6.5rem 1.5rem", background:"rgba(15,23,42,0.5)", borderTop:"1px solid rgba(71,85,105,0.12)", borderBottom:"1px solid rgba(71,85,105,0.12)" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:"4.5rem" }}>
              <p style={SL}>Simple Process</p>
              <h2 style={ST}>From Idea to Live Strategy in 4 Steps</h2>
            </div>
          </Reveal>
          <div style={{ position:"relative" }}>
            <div style={{ position:"absolute", top:"2.75rem", left:"12.5%", right:"12.5%", height:"2px", background:"linear-gradient(90deg,rgba(99,102,241,0.1),rgba(99,102,241,0.4),rgba(99,102,241,0.1))", borderRadius:"99px", zIndex:0 }} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1.5rem", position:"relative", zIndex:1 }}>
              {[
                { n:"01", icon:"💡", title:"Define Your Idea", text:"Pick a stock or index. Choose from 50+ indicators or write custom Python logic." },
                { n:"02", icon:"📡", title:"Analyze Market", text:"Study candlestick charts, volume, OI, and signals across any timeframe." },
                { n:"03", icon:"🔬", title:"Backtest Rigorously", text:"Run 20-year simulations. Get P&L, drawdown, Sharpe, and Monte Carlo results." },
                { n:"04", icon:"🚀", title:"Paper Trade Live", text:"Go live with simulated capital. Refine until you're ready for real markets." },
              ].map(({ n, icon, title, text }, i) => (
                <Reveal key={n} delay={i*0.12}><StepCard n={n} icon={icon} title={title} text={text} /></Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS ────────────────────────────────────────── */}
      <section style={{ padding:"4rem 1.5rem", background:"linear-gradient(135deg,rgba(79,70,229,0.08) 0%,rgba(6,182,212,0.04) 100%)", borderBottom:"1px solid rgba(71,85,105,0.12)" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"2rem" }}>
            {[
              { val:12000, sfx:"+", lbl:"Active Users" },
              { val:50, sfx:"+ Indicators", lbl:"Built-in Strategies" },
              { val:20, sfx:"+ Years", lbl:"Historical Data" },
              { val:99.9, sfx:"% Uptime", lbl:"Platform Reliability" },
            ].map(({ val, sfx, lbl }, i) => (
              <Reveal key={lbl} delay={i*0.1}>
                <div style={{ textAlign:"center" }}>
                  <p style={{ fontSize:"2.2rem", fontWeight:900, letterSpacing:"-0.04em", margin:"0 0 4px", background:"linear-gradient(135deg,#3b82f6,#6366f1)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                    <Counter end={val} suffix={sfx} />
                  </p>
                  <p style={{ fontSize:"0.8rem", color:"#475569", margin:0, letterSpacing:"0.04em" }}>{lbl}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────── */}
      <section id="pricing" style={{ padding:"6.5rem 1.5rem" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:"3rem" }}>
              <p style={SL}>Transparent Pricing</p>
              <h2 style={ST}>Simple Plans for Every Trader</h2>
              <p style={{ ...SS, maxWidth:"520px", margin:"0 auto 2rem" }}>Start free forever. Upgrade only when you need more power.</p>
              {/* Toggle */}
              <div style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", padding:"0.4rem", background:"rgba(15,23,42,0.8)", border:"1px solid rgba(71,85,105,0.25)", borderRadius:"99px" }}>
                <button onClick={() => setAnnual(false)} style={{ padding:"0.45rem 1.1rem", borderRadius:"99px", border:"none", cursor:"pointer", fontWeight:600, fontSize:"0.85rem", fontFamily:"inherit", background:!annual?"linear-gradient(135deg,#4f46e5,#3b82f6)":"transparent", color:!annual?"#fff":"#64748b", transition:"all 0.25s" }}>Monthly</button>
                <button onClick={() => setAnnual(true)} style={{ padding:"0.45rem 1.1rem", borderRadius:"99px", border:"none", cursor:"pointer", fontWeight:600, fontSize:"0.85rem", fontFamily:"inherit", display:"flex", alignItems:"center", gap:"0.5rem", background:annual?"linear-gradient(135deg,#4f46e5,#3b82f6)":"transparent", color:annual?"#fff":"#64748b", transition:"all 0.25s" }}>
                  Annual <span style={{ fontSize:"0.7rem", background:"rgba(34,197,94,0.15)", color:"#4ade80", border:"1px solid rgba(34,197,94,0.3)", padding:"1px 7px", borderRadius:"99px" }}>Save 20%</span>
                </button>
              </div>
            </div>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.5rem", alignItems:"stretch" }}>
            {PLANS.map((plan,i) => <Reveal key={plan.name} delay={i*0.1}><PricingCard plan={plan} annual={annual} /></Reveal>)}
          </div>
          <Reveal delay={0.3}><p style={{ textAlign:"center", fontSize:"0.82rem", color:"#334155", marginTop:"2rem" }}>All plans include 7-day money-back guarantee · No contracts · Cancel anytime</p></Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section id="testimonials" style={{ padding:"6.5rem 1.5rem", background:"rgba(15,23,42,0.45)", borderTop:"1px solid rgba(71,85,105,0.12)", borderBottom:"1px solid rgba(71,85,105,0.12)" }}>
        <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:"4rem" }}>
              <p style={SL}>Testimonials</p>
              <h2 style={ST}>Loved by Traders Across India</h2>
              <p style={{ ...SS, maxWidth:"500px", margin:"0 auto" }}>Real feedback from real traders using QuantNova every day.</p>
            </div>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1.25rem" }}>
            {TESTIMONIALS.map((t,i) => <Reveal key={t.name} delay={i*0.1}><TestimonialCard {...t} /></Reveal>)}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" style={{ padding:"6.5rem 1.5rem" }}>
        <div style={{ maxWidth:"780px", margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:"4rem" }}>
              <p style={SL}>FAQ</p>
              <h2 style={ST}>Frequently Asked Questions</h2>
            </div>
          </Reveal>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {FAQS.map((faq,i) => <Reveal key={i} delay={i*0.06}><FaqItem faq={faq} isOpen={openFaq===i} onToggle={() => setOpenFaq(openFaq===i?null:i)} /></Reveal>)}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section style={{ padding:"0 1.5rem 6.5rem" }}>
        <Reveal>
          <motion.div whileHover={{ scale:1.004 }} style={{ maxWidth:"1050px", margin:"0 auto", borderRadius:"1.5rem", padding:"4.5rem 3rem", textAlign:"center", position:"relative", overflow:"hidden", background:"linear-gradient(135deg,rgba(79,70,229,0.92) 0%,rgba(59,130,246,0.88) 100%)", border:"1px solid rgba(255,255,255,0.14)", boxShadow:"0 0 80px -10px rgba(79,70,229,0.45)" }}>
            <motion.div animate={{ rotate:[0,360] }} transition={{ duration:55, repeat:Infinity, ease:"linear" }} style={{ position:"absolute", top:"-45%", right:"-18%", width:"580px", height:"580px", background:"radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 65%)", borderRadius:"50%", pointerEvents:"none" }} />
            <motion.div animate={{ rotate:[360,0] }} transition={{ duration:40, repeat:Infinity, ease:"linear" }} style={{ position:"absolute", bottom:"-35%", left:"-12%", width:"400px", height:"400px", background:"radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 65%)", borderRadius:"50%", pointerEvents:"none" }} />
            <p style={{ fontSize:"0.78rem", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.65)", margin:"0 0 0.85rem" }}>Get Started Today</p>
            <h2 style={{ fontSize:"clamp(1.85rem,3.5vw,3.1rem)", fontWeight:900, color:"#fff", margin:"0 0 1.1rem", letterSpacing:"-0.03em", lineHeight:1.12 }}>Ready to Build Your Winning Strategy?</h2>
            <p style={{ color:"rgba(255,255,255,0.72)", fontSize:"1.05rem", margin:"0 auto 2.5rem", maxWidth:"520px", lineHeight:1.75 }}>Join 12,000+ traders. Start free with ₹1,00,000 virtual capital. No credit card, no risk.</p>
            <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
              <motion.div whileHover={{ scale:1.07, y:-2 }} whileTap={{ scale:0.97 }}>
                <Link to="/register" style={{ display:"inline-block", padding:"0.95rem 2.4rem", background:"#fff", color:"#4f46e5", borderRadius:"0.75rem", fontWeight:800, fontSize:"1rem", textDecoration:"none", boxShadow:"0 4px 24px -4px rgba(0,0,0,0.35)" }}>Create Free Account →</Link>
              </motion.div>
              <motion.div whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.97 }}>
                <a href="#pricing" style={{ display:"inline-block", padding:"0.95rem 2.4rem", background:"rgba(255,255,255,0.1)", color:"#fff", borderRadius:"0.75rem", fontWeight:700, fontSize:"1rem", textDecoration:"none", border:"1px solid rgba(255,255,255,0.25)", backdropFilter:"blur(8px)" }}>View Pricing</a>
              </motion.div>
            </div>
          </motion.div>
        </Reveal>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ borderTop:"1px solid rgba(71,85,105,0.15)", padding:"4rem 1.5rem 2.5rem" }}>
        <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", gap:"3rem", marginBottom:"3.5rem" }}>
            <div>
              <p style={{ fontSize:"1.3rem", fontWeight:900, color:"#fff", margin:"0 0 0.85rem", letterSpacing:"-0.03em" }}>
                Quant<span style={{ background:"linear-gradient(135deg,#3b82f6,#6366f1)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Nova</span>
              </p>
              <p style={{ fontSize:"0.85rem", color:"#475569", lineHeight:1.7, margin:"0 0 1.25rem", maxWidth:"260px" }}>India's leading algorithmic trading research platform. Built for traders who want to test before they invest.</p>
              <div style={{ display:"flex", gap:"0.65rem" }}>
                {["X","in","yt"].map(icon => (
                  <motion.a key={icon} href="#" whileHover={{ scale:1.12 }} style={{ width:"34px", height:"34px", borderRadius:"0.5rem", background:"rgba(71,85,105,0.2)", border:"1px solid rgba(71,85,105,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", color:"#475569", textDecoration:"none" }}>{icon}</motion.a>
                ))}
              </div>
            </div>
            {[
              { title:"Product", links:[["#features","Features"],["#pricing","Pricing"],["#how-it-works","How It Works"],["#","Changelog"],["#","Roadmap"]] },
              { title:"Company", links:[["#","About Us"],["#","Blog"],["#","Careers"],["#","Press"],["#","Contact"]] },
              { title:"Legal", links:[["#","Privacy Policy"],["#","Terms of Service"],["#","Cookie Policy"],["#","Disclaimer"],["#","Refund Policy"]] },
              { title:"Support", links:[["#","Help Center"],["#","API Docs"],["#","Community"],["#","System Status"],["#","Contact Us"]] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p style={{ fontSize:"0.78rem", fontWeight:700, color:"#64748b", letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 1.1rem" }}>{title}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                  {links.map(([href,lbl]) => (
                    <a key={lbl} href={href} style={{ fontSize:"0.875rem", color:"#475569", textDecoration:"none", transition:"color 0.2s" }}
                      onMouseEnter={e => e.target.style.color="#f1f5f9"} onMouseLeave={e => e.target.style.color="#475569"}>{lbl}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ paddingTop:"2rem", borderTop:"1px solid rgba(71,85,105,0.12)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
            <p style={{ fontSize:"0.78rem", color:"#1e293b", margin:0 }}>© 2026 QuantNova Technologies Pvt. Ltd. All rights reserved. · SEBI Registered Research Platform</p>
            <div style={{ display:"flex", gap:"1.5rem" }}>
              {["Privacy","Terms","Cookies"].map(l => <a key={l} href="#" style={{ fontSize:"0.78rem", color:"#1e293b", textDecoration:"none" }} onMouseEnter={e => e.target.style.color="#64748b"} onMouseLeave={e => e.target.style.color="#1e293b"}>{l}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */
function FeatureCard({ icon, title, subtitle, desc, color, points }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      whileHover={{ y:-6, scale:1.02 }} transition={{ type:"spring", stiffness:280, damping:22 }}
      style={{ background:hov?"rgba(15,23,42,0.95)":"rgba(15,23,42,0.7)", backdropFilter:"blur(16px)", border:"1px solid "+(hov?color+"50":"rgba(71,85,105,0.22)"), borderRadius:"1.1rem", padding:"1.75rem", height:"100%", boxSizing:"border-box", boxShadow:hov?"0 0 40px -12px "+color+"45":"none", transition:"border-color 0.3s,background 0.3s,box-shadow 0.3s" }}>
      <motion.div animate={{ scale:hov?1.12:1 }} transition={{ duration:0.2 }}
        style={{ width:"46px", height:"46px", borderRadius:"0.75rem", background:color+"18", border:"1px solid "+color+"30", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", marginBottom:"1.1rem" }}>{icon}</motion.div>
      <p style={{ fontSize:"0.68rem", fontWeight:600, color, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 0.35rem" }}>{subtitle}</p>
      <h3 style={{ fontSize:"1.05rem", fontWeight:700, color:"#f1f5f9", margin:"0 0 0.65rem", letterSpacing:"-0.01em" }}>{title}</h3>
      <p style={{ color:"#64748b", fontSize:"0.855rem", lineHeight:1.68, margin:"0 0 1.1rem" }}>{desc}</p>
      <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:"0.4rem" }}>
        {points.map(pt => <li key={pt} style={{ fontSize:"0.8rem", color:"#475569", display:"flex", alignItems:"center", gap:"0.5rem" }}><span style={{ color, fontSize:"0.7rem", fontWeight:700 }}>✓</span>{pt}</li>)}
      </ul>
      <motion.div animate={{ width:hov?"100%":"0%" }} transition={{ duration:0.3 }}
        style={{ height:"2px", background:"linear-gradient(90deg,"+color+",transparent)", borderRadius:"99px", marginTop:"1.25rem" }} />
    </motion.div>
  );
}

function StepCard({ n, icon, title, text }) {
  return (
    <motion.div whileHover={{ y:-5, borderColor:"rgba(99,102,241,0.4)" }} transition={{ type:"spring", stiffness:280, damping:22 }}
      style={{ background:"rgba(15,23,42,0.75)", backdropFilter:"blur(16px)", border:"1px solid rgba(71,85,105,0.2)", borderRadius:"1.1rem", padding:"1.75rem", position:"relative", overflow:"hidden", textAlign:"center", transition:"border-color 0.3s" }}>
      <div style={{ position:"absolute", top:"-10px", right:"-6px", fontSize:"4.5rem", fontWeight:900, color:"rgba(99,102,241,0.06)", lineHeight:1, userSelect:"none" }}>{n}</div>
      <div style={{ width:"50px", height:"50px", borderRadius:"50%", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", margin:"0 auto 1.1rem" }}>{icon}</div>
      <span style={{ display:"inline-block", fontSize:"0.68rem", fontWeight:700, color:"#6366f1", letterSpacing:"0.12em", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"99px", padding:"0.18rem 0.65rem", marginBottom:"0.75rem" }}>STEP {n}</span>
      <h3 style={{ fontSize:"1rem", fontWeight:700, color:"#f1f5f9", margin:"0 0 0.55rem" }}>{title}</h3>
      <p style={{ color:"#64748b", fontSize:"0.845rem", lineHeight:1.65, margin:0 }}>{text}</p>
    </motion.div>
  );
}

function PricingCard({ plan, annual }) {
  const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
  const { highlighted, color, badge, name, description, features, cta, ctaLink } = plan;
  return (
    <motion.div whileHover={{ y:-6, scale:1.015 }} transition={{ type:"spring", stiffness:280, damping:22 }}
      style={{ position:"relative", background:highlighted?"linear-gradient(145deg,rgba(79,70,229,0.15),rgba(15,23,42,0.95))":"rgba(15,23,42,0.78)", backdropFilter:"blur(20px)", border:highlighted?"1px solid rgba(99,102,241,0.5)":"1px solid rgba(71,85,105,0.22)", borderRadius:"1.25rem", padding:"2rem", boxShadow:highlighted?"0 0 60px -15px rgba(99,102,241,0.4)":"none", height:"100%", boxSizing:"border-box" }}>
      {badge && <div style={{ position:"absolute", top:"-13px", left:"50%", transform:"translateX(-50%)", padding:"0.25rem 1rem", background:"linear-gradient(135deg,#4f46e5,#3b82f6)", borderRadius:"99px", fontSize:"0.72rem", fontWeight:700, color:"#fff", whiteSpace:"nowrap", boxShadow:"0 2px 16px -4px rgba(99,102,241,0.6)" }}>⭐ {badge}</div>}
      <div style={{ marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.65rem", marginBottom:"0.6rem" }}>
          <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:color }} />
          <p style={{ fontSize:"0.78rem", fontWeight:700, color:"#94a3b8", margin:0, letterSpacing:"0.08em", textTransform:"uppercase" }}>{name}</p>
        </div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:"0.4rem", marginBottom:"0.65rem" }}>
          <AnimatePresence mode="wait">
            <motion.span key={price} initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:12 }} transition={{ duration:0.25 }}
              style={{ fontSize:"2.6rem", fontWeight:900, color:"#f1f5f9", letterSpacing:"-0.04em", lineHeight:1 }}>
              {price===0?"Free":"₹"+price.toLocaleString()}
            </motion.span>
          </AnimatePresence>
          {price>0 && <span style={{ fontSize:"0.82rem", color:"#475569", marginBottom:"0.4rem" }}>/mo</span>}
        </div>
        {annual && price>0 && <p style={{ fontSize:"0.75rem", color:"#4ade80", margin:"0 0 0.6rem", fontWeight:500 }}>Billed annually — Save ₹{((plan.monthlyPrice-plan.yearlyPrice)*12).toLocaleString()}/yr</p>}
        <p style={{ fontSize:"0.85rem", color:"#64748b", margin:0, lineHeight:1.6 }}>{description}</p>
      </div>
      <motion.div whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:0.97 }}>
        <Link to={ctaLink} style={{ display:"block", width:"100%", padding:"0.8rem", textAlign:"center", borderRadius:"0.75rem", fontWeight:700, fontSize:"0.9rem", textDecoration:"none", background:highlighted?"linear-gradient(135deg,#4f46e5,#3b82f6)":"rgba(71,85,105,0.2)", color:highlighted?"#fff":"#94a3b8", border:highlighted?"none":"1px solid rgba(71,85,105,0.35)", boxShadow:highlighted?"0 4px 20px -4px rgba(99,102,241,0.5)":"none", boxSizing:"border-box", position:"relative", overflow:"hidden" }}>
          {highlighted && <motion.div animate={{ x:["-100%","200%"] }} transition={{ duration:2.5, repeat:Infinity, ease:"linear", repeatDelay:1.5 }} style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.13),transparent)", pointerEvents:"none" }} />}
          {cta}
        </Link>
      </motion.div>
      <div style={{ marginTop:"1.5rem", borderTop:"1px solid rgba(71,85,105,0.15)", paddingTop:"1.5rem", display:"flex", flexDirection:"column", gap:"0.7rem" }}>
        {features.map(f => (
          <div key={f} style={{ display:"flex", alignItems:"flex-start", gap:"0.7rem" }}>
            <span style={{ color:highlighted?"#6366f1":"#4ade80", fontSize:"0.75rem", marginTop:"1px", flexShrink:0, fontWeight:700 }}>✓</span>
            <span style={{ fontSize:"0.845rem", color:"#64748b", lineHeight:1.5 }}>{f}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TestimonialCard({ name, role, avatar, color, quote, rating }) {
  return (
    <motion.div whileHover={{ y:-4 }} transition={{ type:"spring", stiffness:280, damping:22 }}
      style={{ background:"rgba(15,23,42,0.75)", backdropFilter:"blur(16px)", border:"1px solid rgba(71,85,105,0.2)", borderRadius:"1.1rem", padding:"1.75rem" }}>
      <div style={{ display:"flex", gap:"0.3rem", marginBottom:"1rem" }}>
        {Array(rating).fill(0).map((_,i) => <span key={i} style={{ color:"#f59e0b", fontSize:"0.85rem" }}>★</span>)}
      </div>
      <p style={{ fontSize:"0.925rem", color:"#94a3b8", lineHeight:1.8, margin:"0 0 1.35rem", fontStyle:"italic" }}>"{quote}"</p>
      <div style={{ display:"flex", alignItems:"center", gap:"0.85rem" }}>
        <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:color+"25", border:"2px solid "+color+"50", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.78rem", fontWeight:800, color, flexShrink:0 }}>{avatar}</div>
        <div>
          <p style={{ fontSize:"0.88rem", fontWeight:700, color:"#f1f5f9", margin:0 }}>{name}</p>
          <p style={{ fontSize:"0.75rem", color:"#475569", margin:"2px 0 0" }}>{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

function FaqItem({ faq, isOpen, onToggle }) {
  return (
    <motion.div whileHover={{ borderColor:isOpen?"rgba(99,102,241,0.4)":"rgba(99,102,241,0.2)" }}
      style={{ background:isOpen?"rgba(15,23,42,0.95)":"rgba(15,23,42,0.65)", backdropFilter:"blur(16px)", border:"1px solid "+(isOpen?"rgba(99,102,241,0.35)":"rgba(71,85,105,0.22)"), borderRadius:"0.9rem", overflow:"hidden", transition:"border-color 0.25s,background 0.25s" }}>
      <button onClick={onToggle} style={{ width:"100%", padding:"1.2rem 1.5rem", display:"flex", justifyContent:"space-between", alignItems:"center", background:"none", border:"none", cursor:"pointer", textAlign:"left", gap:"1rem" }}>
        <span style={{ fontSize:"0.95rem", fontWeight:600, color:isOpen?"#f1f5f9":"#94a3b8", transition:"color 0.2s", fontFamily:"inherit" }}>{faq.q}</span>
        <motion.span animate={{ rotate:isOpen?45:0 }} transition={{ duration:0.25 }} style={{ color:isOpen?"#6366f1":"#475569", fontSize:"1.3rem", lineHeight:1, flexShrink:0 }}>+</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="ans" initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.3, ease:[0.23,1,0.32,1] }} style={{ overflow:"hidden" }}>
            <div style={{ padding:"0 1.5rem 1.25rem" }}>
              <p style={{ fontSize:"0.9rem", color:"#64748b", lineHeight:1.8, margin:0 }}>{faq.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
