import { Link } from "react-router-dom";
import { Activity, ArrowRight, BrainCircuit, Check, ChevronRight, CircleDot, Cpu, Menu, Network, ShieldCheck, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const FEATURES = [
  { icon: Zap, title: "Sub-Millisecond Execution", copy: "Route orders through a latency-aware execution layer calibrated to venue microstructure.", accent: "#00ff66", metric: "0.42 ms", label: "median decision-to-route" },
  { icon: BrainCircuit, title: "AI-Driven Backtesting", copy: "Stress-test ideas across regimes with model-assisted parameter search and realistic costs.", accent: "#36d8ff", metric: "14.8×", label: "faster research iteration" },
  { icon: Network, title: "Multi-Exchange Routing", copy: "Consolidate liquidity, control exposure, and execute with a single institutional workflow.", accent: "#a855f7", metric: "24", label: "connected liquidity venues" },
];

const INITIAL_ORDERS = [
  ["BUY", "NQZ6", "25,148.25", "4"], ["SELL", "ETH-PERP", "4,812.18", "1.8"],
  ["BUY", "ESZ6", "6,842.50", "12"], ["BUY", "BTC-USD", "92,415.20", "0.35"],
  ["SELL", "AAPL", "246.84", "50"], ["BUY", "EUR/USD", "1.10482", "100K"],
].map(function (row, index) {
  return { side: row[0], instrument: row[1], price: row[2], size: row[3], time: "09:42:11." + (412 - index * 29) };
});

const CHART = [42, 43, 45, 44, 47, 49, 48, 51, 54, 53, 56, 55, 59, 62, 60, 64, 68, 66, 71, 73, 72, 76, 78, 77, 82, 86, 84, 89, 92, 90, 95, 98];

function createOrder() {
  const templates = [["NQZ6", 25100, 70], ["ETH-PERP", 4800, 35], ["ESZ6", 6820, 35], ["BTC-USD", 92400, 85], ["AAPL", 246, 1]];
  const selected = templates[Math.floor(Math.random() * templates.length)];
  const now = new Date();
  return {
    side: Math.random() > 0.45 ? "BUY" : "SELL",
    instrument: selected[0],
    price: (selected[1] + Math.random() * selected[2]).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    size: selected[0] === "AAPL" ? "25" : selected[0] === "BTC-USD" ? "0.20" : "4",
    time: now.toLocaleTimeString("en-GB", { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0"),
  };
}

function NeuralLattice() {
  const mountRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(function () {
    let destroyed = false;
    let destroyScene = function () {};

    async function createScene() {
      const THREE = await import("three");
      const host = mountRef.current;
      if (!host || destroyed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.z = 5.5;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.appendChild(renderer.domElement);

      const group = new THREE.Group();
      scene.add(group);
      const nodes = [];
      const positions = [];
      for (let i = 0; i < 82; i += 1) {
        const y = 1 - (i / 81) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = Math.PI * (3 - Math.sqrt(5)) * i;
        const scale = 1.45 + Math.sin(i * 7.3) * 0.1;
        const point = new THREE.Vector3(Math.cos(theta) * radius * scale, y * scale, Math.sin(theta) * radius * scale);
        nodes.push(point);
        positions.push(point.x, point.y, point.z);
      }
      const pointGeometry = new THREE.BufferGeometry();
      pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const pointMaterial = new THREE.PointsMaterial({ color: 0x72ffd1, size: 0.042, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false });
      const points = new THREE.Points(pointGeometry, pointMaterial);

      const linePositions = [];
      nodes.forEach(function (node, i) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          if (node.distanceTo(nodes[j]) < 0.72 && (i + j) % 3 === 0) linePositions.push(node.x, node.y, node.z, nodes[j].x, nodes[j].y, nodes[j].z);
        }
      });
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x1bd8ff, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false });
      const lines = new THREE.LineSegments(lineGeometry, lineMaterial);

      const shellGeometry = new THREE.IcosahedronGeometry(1.62, 2);
      const shellMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff66, wireframe: true, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false });
      const shell = new THREE.Mesh(shellGeometry, shellMaterial);
      const coreGeometry = new THREE.OctahedronGeometry(0.52, 1);
      const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.48, wireframe: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      const ringOneGeometry = new THREE.TorusGeometry(1.92, 0.009, 4, 92);
      const ringOneMaterial = new THREE.MeshBasicMaterial({ color: 0x36d8ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
      const ringOne = new THREE.Mesh(ringOneGeometry, ringOneMaterial);
      ringOne.rotation.set(1.05, 0.35, -0.3);
      const ringTwoGeometry = new THREE.TorusGeometry(1.34, 0.007, 4, 76);
      const ringTwoMaterial = ringOneMaterial.clone();
      ringTwoMaterial.color.setHex(0x9b5cff);
      const ringTwo = new THREE.Mesh(ringTwoGeometry, ringTwoMaterial);
      ringTwo.rotation.set(-0.65, 0.8, 0.5);
      group.add(points, lines, shell, core, ringOne, ringTwo);

      let inViewport = true;
      let running = false;
      let frameId;
      let scrollOffset = 0;
      const resize = function () {
        const size = host.getBoundingClientRect();
        if (!size.width || !size.height) return;
        camera.aspect = size.width / size.height;
        camera.updateProjectionMatrix();
        renderer.setSize(size.width, size.height, false);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();
      const render = function (time) {
        if (!running) return;
        frameId = requestAnimationFrame(render);
        const seconds = time * 0.001;
        group.rotation.y += (pointer.current.x * 0.28 - group.rotation.y) * 0.025;
        group.rotation.x += (pointer.current.y * 0.18 - group.rotation.x) * 0.025;
        group.rotation.z = Math.sin(seconds * 0.35) * 0.05;
        group.position.y = Math.sin(seconds * 0.8) * 0.08 - scrollOffset;
        core.rotation.set(seconds * 0.7, seconds * 0.9, seconds * 0.4);
        shell.rotation.y = -seconds * 0.09;
        ringOne.rotation.z = seconds * 0.24;
        ringTwo.rotation.z = -seconds * 0.18;
        points.rotation.y = seconds * 0.08;
        renderer.render(scene, camera);
      };
      const syncAnimation = function () {
        const shouldRun = inViewport && !document.hidden;
        if (shouldRun && !running) { running = true; frameId = requestAnimationFrame(render); }
        if (!shouldRun && running) { running = false; cancelAnimationFrame(frameId); }
      };
      const viewportObserver = new IntersectionObserver(function (entries) {
        inViewport = entries[0].isIntersecting;
        syncAnimation();
      }, { threshold: 0.05 });
      const handleScroll = function () { scrollOffset = Math.min(window.scrollY * 0.00045, 0.35); };
      viewportObserver.observe(host);
      window.addEventListener("scroll", handleScroll, { passive: true });
      document.addEventListener("visibilitychange", syncAnimation);
      syncAnimation();

      destroyScene = function () {
        running = false;
        cancelAnimationFrame(frameId);
        viewportObserver.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("scroll", handleScroll);
        document.removeEventListener("visibilitychange", syncAnimation);
        [pointGeometry, lineGeometry, shellGeometry, coreGeometry, ringOneGeometry, ringTwoGeometry].forEach(function (asset) { asset.dispose(); });
        [pointMaterial, lineMaterial, shellMaterial, coreMaterial, ringOneMaterial, ringTwoMaterial].forEach(function (asset) { asset.dispose(); });
        renderer.dispose();
        renderer.domElement.remove();
      };
    }
    createScene();
    return function () { destroyed = true; destroyScene(); };
  }, []);

  return <div ref={mountRef} aria-label="Interactive neural trading network visualization" className="absolute inset-0 touch-none" onPointerMove={function (event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointer.current.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    pointer.current.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  }} onPointerLeave={function () { pointer.current = { x: 0, y: 0 }; }} />;
}

function PerformanceChart() {
  const [tick, setTick] = useState(0);
  useEffect(function () {
    const interval = window.setInterval(function () { setTick(function (value) { return (value + 1) % 7; }); }, 1800);
    return function () { window.clearInterval(interval); };
  }, []);
  const values = CHART.map(function (value, index) { return value + ((index * 5 + tick * 3) % 7) - 3; });
  const points = values.map(function (value, index) { return (index / (values.length - 1)) * 100 + "," + (100 - value); }).join(" ");
  return <div className="relative overflow-hidden rounded-2xl border border-emerald-300/15 bg-[#07120f]/85 p-4 shadow-[0_0_55px_rgba(0,255,102,0.08)] backdrop-blur-xl sm:p-5">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/75 to-transparent" />
    <div className="mb-5 flex items-start justify-between"><div><div className="mb-1 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-slate-500"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00ff66] shadow-[0_0_10px_#00ff66]" />ALPHA / LIVE</div><p className="font-mono text-sm text-slate-300">QN Global Macro</p></div><div className="text-right"><p className="font-mono text-lg font-semibold text-[#00ff66]">+{(18.42 + tick * 0.07).toFixed(2)}%</p><p className="font-mono text-[10px] text-slate-500">NET RETURN · YTD</p></div></div>
    <div className="relative h-36 overflow-hidden"><div className="absolute inset-0 bg-[linear-gradient(rgba(103,232,249,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.06)_1px,transparent_1px)] bg-[size:100%_33%,20%_100%]" /><svg className="relative h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Rising performance chart"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#00ff66" stopOpacity="0.32" /><stop offset="100%" stopColor="#00ff66" stopOpacity="0" /></linearGradient></defs><polygon points={"0,100 " + points + " 100,100"} fill="url(#chartFill)" /><polyline points={points} fill="none" stroke="#00ff66" strokeWidth="1.1" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_6px_#00ff66]" /><circle cx="100" cy={100 - values[values.length - 1]} r="2.1" fill="#d8ffe8" className="animate-pulse" /></svg></div>
    <div className="mt-3 flex justify-between font-mono text-[9px] tracking-wide text-slate-600"><span>JAN</span><span>APR</span><span>JUL</span><span>SEP</span></div>
  </div>;
}

function OrderBook() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  useEffect(function () {
    const interval = window.setInterval(function () { setOrders(function (current) { return [createOrder()].concat(current).slice(0, 6); }); }, 900);
    return function () { window.clearInterval(interval); };
  }, []);
  return <section id="order-flow" className="relative mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:pb-32">
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(115deg,rgba(9,22,20,0.92),rgba(6,11,19,0.9)_52%,rgba(24,10,38,0.82))] shadow-[0_30px_100px_rgba(0,0,0,0.38)]"><div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16 lg:p-14">
      <div><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-cyan-200"><Activity size={12} /> EXECUTION TELEMETRY</div><h2 className="max-w-md text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">See the market before the market sees you.</h2><p className="mt-5 max-w-md text-base leading-7 text-slate-400">A unified stream turns fragmented liquidity into decisions your models can act on, with every fill auditable in real time.</p><div className="mt-8 grid grid-cols-2 gap-3">{[["99.98%", "fill integrity"], ["42 μs", "median ingest"]].map(function (item) { return <div key={item[1]} className="rounded-xl border border-white/8 bg-black/20 p-4"><p className="font-mono text-lg text-cyan-200">{item[0]}</p><p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-500">{item[1]}</p></div>; })}</div></div>
      <div className="relative rounded-2xl border border-cyan-200/15 bg-[#030806]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5"><div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_80%_0%,rgba(54,216,255,0.11),transparent_38%)]" /><div className="relative flex items-center justify-between border-b border-white/8 pb-4"><div className="flex items-center gap-2"><CircleDot size={14} className="text-[#00ff66]" /><span className="font-mono text-xs text-slate-200">LIVE ORDER FLOW</span></div><span className="font-mono text-[10px] text-slate-500">STREAMING</span></div><div className="relative mt-4 grid grid-cols-[48px_1fr_1fr_48px] gap-2 border-b border-white/5 pb-2 font-mono text-[9px] tracking-[0.1em] text-slate-600 sm:grid-cols-[64px_1fr_1fr_64px]"><span>SIDE</span><span>SYMBOL</span><span>FILL PRICE</span><span className="text-right">SIZE</span></div><div className="relative h-[204px] overflow-hidden" aria-live="polite">{orders.map(function (order, index) { return <div key={order.time + "-" + index} className="grid animate-[order-in_420ms_ease-out] grid-cols-[48px_1fr_1fr_48px] gap-2 border-b border-white/[0.045] py-2.5 font-mono text-[10px] sm:grid-cols-[64px_1fr_1fr_64px] sm:text-[11px]"><span className={order.side === "BUY" ? "text-[#00ff66]" : "text-rose-400"}>{order.side}</span><span className="text-slate-300">{order.instrument}</span><span className="text-slate-400">{order.price}</span><span className="text-right text-slate-500">{order.size}</span></div>; })}</div><div className="relative mt-3 flex justify-between font-mono text-[9px] text-slate-600"><span>feed: composite/v4</span><span>09:42:11.412 UTC</span></div></div>
    </div></div>
  </section>;
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  useEffect(function () {
    const handleScroll = function () { setScrolled(window.scrollY > 20); };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return function () { window.removeEventListener("scroll", handleScroll); };
  }, []);
  const submitEmail = function (event) { event.preventDefault(); if (email.trim()) setSubmitted(true); };
  const navClass = ["fixed inset-x-0 top-0 z-50 transition-all duration-500", scrolled ? "border-b border-white/10 bg-[#030706]/85 shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl" : "border-b border-transparent"].join(" ");
  return <main className="min-h-screen overflow-x-hidden bg-[#030706] font-sans text-slate-100 selection:bg-[#00ff66]/30 selection:text-white">
    <style>{"@keyframes drift {0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-14px,0)}} @keyframes order-in {from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}"}</style>
    <nav className={navClass}><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/" className="group flex items-center gap-2.5" aria-label="QuantNova home"><span className="grid h-8 w-8 place-items-center rounded-lg border border-[#00ff66]/40 bg-[#00ff66]/10 shadow-[0_0_20px_rgba(0,255,102,0.16)]"><span className="h-2.5 w-2.5 rotate-45 bg-[#00ff66] shadow-[0_0_12px_#00ff66]" /></span><span className="text-base font-semibold tracking-[-0.04em] text-white">quant<span className="text-[#00ff66]">nova</span></span></Link><div className="hidden items-center gap-8 text-sm text-slate-400 md:flex"><a href="#features" className="transition-colors hover:text-white">Features</a><a href="#order-flow" className="transition-colors hover:text-white">Execution</a><a href="#pricing" className="transition-colors hover:text-white">Pricing</a></div><div className="hidden items-center gap-4 md:flex"><span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.08em] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-[#00ff66] shadow-[0_0_9px_#00ff66]" />SYSTEMS NOMINAL</span><Link to="/login" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">Log in</Link><Link to="/register" className="inline-flex items-center gap-2 rounded-lg border border-[#00ff66]/60 bg-[#00ff66]/5 px-4 py-2 text-xs font-semibold text-[#b9ffd6] transition-all hover:bg-[#00ff66] hover:text-[#03110a] hover:shadow-[0_0_24px_rgba(0,255,102,0.3)]">Sign up <ArrowRight size={14} /></Link></div><button type="button" className="rounded-lg border border-white/10 p-2 text-slate-300 md:hidden" onClick={function () { setMenuOpen(function (value) { return !value; }); }} aria-label="Toggle navigation">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button></div>{menuOpen && <div className="border-t border-white/10 bg-[#050a08]/95 px-5 py-5 backdrop-blur-xl md:hidden"><div className="flex flex-col gap-4 text-sm text-slate-300"><a href="#features" onClick={function () { setMenuOpen(false); }}>Features</a><a href="#order-flow" onClick={function () { setMenuOpen(false); }}>Execution</a><a href="#pricing" onClick={function () { setMenuOpen(false); }}>Pricing</a><div className="mt-1 flex items-center gap-5"><Link to="/login" onClick={function () { setMenuOpen(false); }} className="text-slate-200">Log in</Link><Link to="/register" onClick={function () { setMenuOpen(false); }} className="text-[#00ff66]">Sign up <ArrowRight className="inline" size={14} /></Link></div></div></div>}</nav>

    <section className="relative isolate overflow-hidden pt-28 sm:pt-36"><div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_75%_55%_at_68%_26%,rgba(0,255,102,0.13),transparent_58%),radial-gradient(ellipse_45%_42%_at_14%_22%,rgba(54,216,255,0.1),transparent_64%),radial-gradient(ellipse_45%_45%_at_74%_92%,rgba(168,85,247,0.1),transparent_60%)]" /><div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.23] [background-image:linear-gradient(rgba(95,255,190,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(95,255,190,0.09)_1px,transparent_1px)] [background-size:54px_54px] [mask-image:linear-gradient(to_bottom,black,transparent_83%)]" /><div className="pointer-events-none absolute left-[7%] top-32 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl [animation:drift_8s_ease-in-out_infinite]" /><div className="pointer-events-none absolute right-[14%] top-44 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl [animation:drift_10s_ease-in-out_infinite_1s]" />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 sm:px-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:gap-8 lg:pb-24"><div className="relative z-10"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00ff66]/20 bg-[#00ff66]/[0.07] px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[0.15em] text-[#9cffc1] shadow-[0_0_22px_rgba(0,255,102,0.08)]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00ff66]" />INSTITUTIONAL INTELLIGENCE, UNBUNDLED</div><h1 className="max-w-3xl text-[clamp(3rem,7vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-white">Algorithmic<br /><span className="bg-gradient-to-r from-[#c7ffda] via-[#00ff66] to-[#36d8ff] bg-clip-text text-transparent">Precision.</span><br />Institutional Yield.</h1><p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">Deploy systematic intelligence across the world’s most liquid markets. Research, execute, and compound from one decisive control plane.</p><form onSubmit={submitEmail} className="mt-8 max-w-xl rounded-xl border border-white/10 bg-white/[0.055] p-1.5 shadow-2xl backdrop-blur-xl sm:flex"><label className="sr-only" htmlFor="early-access-email">Work email</label><input id="early-access-email" value={email} onChange={function (event) { setEmail(event.target.value); setSubmitted(false); }} type="email" required placeholder="your@fund.com" className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-600" /><button type="submit" className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#00ff66] px-5 text-sm font-bold text-[#03110a] transition-transform hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(0,255,102,0.35)] sm:mt-0 sm:w-auto">Request access <ArrowRight size={15} /></button></form><p className={"mt-3 h-4 font-mono text-[10px] tracking-wide " + (submitted ? "text-[#00ff66]" : "text-slate-500")}>{submitted ? "ACCESS REQUEST SECURELY QUEUED" : "PRIVATE BETA · NO CREDIT CARD REQUIRED"}</p><div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs text-slate-400">{["SOC 2 controls", "Encrypted strategy IP", "24/5 desk support"].map(function (item) { return <span key={item} className="flex items-center gap-2"><Check size={14} className="text-[#00ff66]" />{item}</span>; })}</div></div>
        <div className="relative mx-auto h-[440px] w-full max-w-[640px] sm:h-[520px] lg:h-[570px]"><div className="absolute inset-[2%] rounded-full border border-[#00ff66]/10 bg-[#00ff66]/[0.025] blur-[1px]" /><NeuralLattice /><div className="pointer-events-none absolute left-1/2 top-[50%] h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/[0.07]" /><div className="absolute bottom-3 left-0 z-10 w-[84%] sm:bottom-6 sm:left-3"><PerformanceChart /></div><div className="absolute right-1 top-[8%] z-10 hidden rounded-xl border border-white/10 bg-[#060c0a]/75 px-3 py-2.5 shadow-xl backdrop-blur-xl sm:block"><div className="flex items-center gap-2"><Cpu size={14} className="text-violet-300" /><span className="font-mono text-[10px] text-slate-300">MODEL CONFIDENCE</span></div><p className="mt-1 font-mono text-xl text-violet-200">97.4%</p></div><div className="absolute bottom-[41%] left-1 z-10 hidden rounded-xl border border-white/10 bg-[#060c0a]/75 px-3 py-2.5 shadow-xl backdrop-blur-xl sm:block"><p className="font-mono text-[10px] text-slate-500">ROUTING EDGE</p><p className="mt-1 font-mono text-sm text-cyan-200">+18.6 bps</p></div></div></div>
      <div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" /></div>
    </section>

    <section id="features" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32"><div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-4 font-mono text-[11px] font-semibold tracking-[0.18em] text-[#00ff66]">THE QUANTNOVA ADVANTAGE</p><h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">Built for the moment between signal and certainty.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Institutional-grade infrastructure, shaped into a workflow fast enough for the individual edge.</p></div><div className="grid gap-4 md:grid-cols-3">{FEATURES.map(function (feature) { const Icon = feature.icon; return <article key={feature.title} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] sm:p-7"><div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40" style={{ background: feature.accent }} /><div className="relative"><div className="grid h-11 w-11 place-items-center rounded-xl border bg-black/20" style={{ borderColor: feature.accent + "45", color: feature.accent }}><Icon size={21} /></div><h3 className="mt-7 text-xl font-semibold tracking-[-0.04em] text-white">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{feature.copy}</p><div className="mt-8 border-t border-white/8 pt-4"><p className="font-mono text-2xl" style={{ color: feature.accent }}>{feature.metric}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.11em] text-slate-500">{feature.label}</p></div></div></article>; })}</div></section>
    <OrderBook />
    <section id="pricing" className="relative mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:pb-32"><div className="relative overflow-hidden rounded-3xl border border-[#00ff66]/20 bg-[#07110d] px-6 py-12 text-center shadow-[0_0_80px_rgba(0,255,102,0.06)] sm:px-12 sm:py-16"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,102,0.16),transparent_55%)]" /><div className="relative mx-auto max-w-2xl"><ShieldCheck className="mx-auto text-[#00ff66]" size={28} /><p className="mt-5 font-mono text-[10px] tracking-[0.2em] text-[#8affb5]">ENGINEERED FOR COMPOUNDING</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">Your next market edge is waiting.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400">Join the private beta and build on infrastructure designed to stay decisive when markets do not.</p><Link to="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#00ff66] px-6 py-3 text-sm font-bold text-[#03110a] transition-all hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(0,255,102,0.35)]">Launch QuantNova <ChevronRight size={17} /></Link></div></div></section>
    <footer className="border-t border-white/8 px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span className="font-mono">© 2026 QUANTNOVA SYSTEMS</span><span className="font-mono">MARKET DATA IS ILLUSTRATIVE · NOT INVESTMENT ADVICE</span></div></footer>
  </main>;
}
