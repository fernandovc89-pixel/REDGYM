import { useState, useEffect, useRef } from "react";
import { authService, gymService, requestService } from "./supabase.js";

// -- PERSISTENT STORAGE --------------------------------------------------------
const db = {
get(key) {
try {
const val = localStorage.getItem(key);
return val ? JSON.parse(val) : [];
} catch { return []; }
},
save(key, data) {
try {
localStorage.setItem(key, JSON.stringify(data));
} catch(e) { console.error("Storage error:", e); }
}
};

const theme = {
bg: "#0a0a0a", card: "#111111", cardBorder: "#1e1e1e",
accent: "#e63946", accentDark: "#b02a35", accentGlow: "rgba(230,57,70,0.18)",
gold: "#f4a261", text: "#f0f0f0", muted: "#888", green: "#2ec27e", blue: "#4dabf7",
};

const plans = [
{ id: "estandar", name: "Estándar", price: 800, visits: 12, extraVisit: 57, gymShare: 680, appShare: 120, color: theme.blue,
perks: ["12 visitas/mes", "Acceso a todos los gyms", "Check-in por QR", "Historial de visitas", "Visita extra: $57 c/u"] },
{ id: "premium", name: "Premium", price: 1400, visits: 20, extraVisit: 60, gymShare: 1190, appShare: 210, color: theme.accent,
perks: ["20 visitas/mes", "Acceso a todos los gyms", "Check-in por QR", "Historial de visitas", "Prioridad en horarios pico", "Clases premium incluidas", "Asesoría personalizada", "Visita extra: $60 c/u"] },
];

const mockVisits = []; const mockVisitsOld = [
{ date: "12 Jul 2025", gym: "PowerGym Chalco", time: "07:30 AM", plan: "Estándar" },
{ date: "10 Jul 2025", gym: "FitZone Valle", time: "06:15 PM", plan: "Estándar" },
{ date: "08 Jul 2025", gym: "PowerGym Chalco", time: "08:00 AM", plan: "Estándar" },
{ date: "05 Jul 2025", gym: "EliteBody Center", time: "05:30 PM", plan: "Estándar" },
{ date: "03 Jul 2025", gym: "PowerGym Chalco", time: "07:45 AM", plan: "Estándar" },
{ date: "01 Jul 2025", gym: "FitZone Valle", time: "09:00 AM", plan: "Estándar" },
{ date: "28 Jun 2025", gym: "PowerGym Chalco", time: "07:30 AM", plan: "Estándar" },
{ date: "25 Jun 2025", gym: "EliteBody Center", time: "06:00 PM", plan: "Estándar" },
];

const initialGyms = [
{ id: 1, name: "Gym Paraje Altamirano", code: "GYM001", address: "Paraje Altamirano, 56609 México, Méx.", phone: "", hours: "", status: "active", visits: 0, email: "", color: "#e63946", rating: 5.0, distance: "...", lat: 19.2680, lng: -98.9650 },
];

const initialRequests = [
{ id: 4, name: "IronFit Gym", address: "Calle Juárez #22, Chalco", phone: "55 3333 2222", hours: "6:00 AM - 10:00 PM", email: "iron@gym.com", status: "pending", date: "15 Jul 2025" },
{ id: 5, name: "MaxForce Center", address: "Av. Hidalgo #55, Valle de Chalco", phone: "55 7777 8888", hours: "5:00 AM - 11:00 PM", email: "max@gym.com", status: "pending", date: "14 Jul 2025" },
];

function DumbbellIcon({ size = 22, color = "#fff" }) {
return (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
<rect x="1" y="8" width="3" height="8" rx="1.5" fill={color}/>
<rect x="4" y="9.5" width="2" height="5" rx="1" fill={color}/>
<rect x="6" y="11" width="12" height="2" rx="1" fill={color}/>
<rect x="18" y="9.5" width="2" height="5" rx="1" fill={color}/>
<rect x="20" y="8" width="3" height="8" rx="1.5" fill={color}/>
</svg>
);
}

function Logo({ size = 28 }) {
return (
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<div style={{ width: size * 1.2, height: size * 1.2, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, borderRadius: size * 0.3, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${theme.accentGlow}` }}>
<DumbbellIcon size={size * 0.7} color="#fff" />
</div>
<span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: size * 0.9, color: theme.text, letterSpacing: 2 }}>RedGym</span>
</div>
);
}

function Badge({ children, color }) {
return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{children}</span>;
}

function Btn({ children, onClick, variant = "primary", style = {}, disabled }) {
const base = { border: "none", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, transition: "all 0.2s", opacity: disabled ? 0.5 : 1, ...style };
if (variant === "ghost") return <button onClick={onClick} disabled={disabled} style={{ ...base, background: "transparent", color: theme.muted, padding: "10px 16px", border: `1px solid ${theme.cardBorder}` }}>{children}</button>;
if (variant === "outline") return <button onClick={onClick} disabled={disabled} style={{ ...base, background: "transparent", color: theme.accent, padding: "10px 20px", border: `1.5px solid ${theme.accent}` }}>{children}</button>;
return <button onClick={onClick} disabled={disabled} style={{ ...base, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, color: "#fff", padding: "12px 24px", boxShadow: `0 4px 20px ${theme.accentGlow}` }}>{children}</button>;
}

function Card({ children, style = {}, onClick }) {
return <div onClick={onClick} style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 16, padding: 20, ...style }}>{children}</div>;
}

function BottomNav({ active, onNavigate }) {
return (
<div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: theme.card, borderTop: `1px solid ${theme.cardBorder}`, display: "flex", padding: "10px 0 16px" }}>
{[{ icon: "home", label: "Inicio", id: "dashboard" }, { icon: "gym️", label: "Gyms", id: "gyms" }, { icon: "📱", label: "Check-in", id: "checkin" }, { icon: "chart", label: "Historial", id: "history" }, { icon: "user", label: "Perfil", id: "profile" }].map(n => (
<div key={n.id} onClick={() => onNavigate(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
<span style={{ fontSize: 20 }}>{n.icon}</span>
<span style={{ fontSize: 10, color: active === n.id ? theme.accent : theme.muted, fontWeight: active === n.id ? 700 : 400 }}>{n.label}</span>
</div>
))}
</div>
);
}

function SplashScreen({ onLogin, onRegister }) {
return (
<div style={{ minHeight: "100vh", background: theme.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
<div style={{ position: "absolute", width: 400, height: 400, background: `radial-gradient(circle, ${theme.accentGlow} 0%, transparent 70%)`, top: "10%", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />
<div style={{ textAlign: "center", zIndex: 1, maxWidth: 360, width: "100%" }}>
<div style={{ width: 80, height: 80, margin: "0 auto 16px", background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px ${theme.accentGlow}` }}>
<DumbbellIcon size={44} color="#fff" />
</div>
<h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, color: theme.text, margin: 0, letterSpacing: 4, lineHeight: 1 }}>REDGYM</h1>
<p style={{ color: theme.accent, fontSize: 13, letterSpacing: 3, fontWeight: 600, marginTop: 6 }}>TU RED DE GIMNASIOS</p>
<p style={{ color: theme.muted, fontSize: 15, lineHeight: 1.6, margin: "24px 0 40px" }}>Un plan. Múltiples gimnasios.<br />Entrena donde quieras, cuando quieras.</p>
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
<Btn onClick={onLogin} style={{ width: "100%", padding: "14px" }}>Iniciar Sesión</Btn>
<Btn onClick={onRegister} variant="outline" style={{ width: "100%", padding: "14px" }}>Crear Cuenta</Btn>
</div>
<p style={{ color: theme.muted, fontSize: 12, marginTop: 32 }}>¿Eres dueño de un gimnasio? <span style={{ color: theme.accent, cursor: "pointer" }} onClick={onLogin}>Regístrate aquí →</span></p>
</div>
</div>
);
}

function LoginScreen({ onLogin, onBack, onSwitch }) {
const [email, setEmail] = useState("");
const [pass, setPass] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const inp = { background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 10, padding: "12px 16px", color: theme.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" };

const handleLogin = async () => {
if (!email || !pass) { setError("Ingresa tu correo y contraseña"); return; }
setLoading(true); setError("");
const res = await authService.login(email, pass);
if (res.error) { setError(res.error); setLoading(false); return; }
onLogin("user", res.user);
setLoading(false);
};

return (
<div style={{ minHeight: "100vh", background: theme.bg, padding: 24, display: "flex", flexDirection: "column" }}>
<button onClick={onBack} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: 22, alignSelf: "flex-start", marginBottom: 24 }}>←</button>
<div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 360, margin: "0 auto", width: "100%" }}>
<Logo size={32} />
<h2 style={{ color: theme.text, fontFamily: "'Bebas Neue', cursive", fontSize: 32, letterSpacing: 2, margin: "16px 0 4px" }}>BIENVENIDO</h2>
<p style={{ color: theme.muted, fontSize: 14, marginBottom: 28 }}>Ingresa a tu cuenta</p>


    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" style={inp} />
      <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="Contraseña" style={inp} />
    </div>
    {error && <p style={{ color: theme.accent, fontSize: 13, margin: "10px 0 0", textAlign: "center" }}>{error}</p>}
    <Btn onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "14px", marginTop: 16 }}>{loading ? "Verificando..." : "Entrar"}</Btn>
    <p style={{ color: theme.muted, fontSize: 13, textAlign: "center", marginTop: 20 }}>¿No tienes cuenta? <span style={{ color: theme.accent, cursor: "pointer" }} onClick={onSwitch}>Regístrate</span></p>
  </div>
</div>


);
}

function RegisterScreen({ onRegister, onBack }) {
const [step, setStep] = useState(1);
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [pass, setPass] = useState("");
const [selectedPlan, setSelectedPlan] = useState(null);
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const inp = { background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 10, padding: "12px 16px", color: theme.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" };

const handleRegister = async () => {
if (!selectedPlan || !name || !email || !pass) return;
setLoading(true); setError("");
const res = await authService.register(name, email, pass);
if (res.error) { setError(res.error); setLoading(false); return; }
onRegister(selectedPlan, res.user);
setLoading(false);
};
return (
<div style={{ minHeight: "100vh", background: theme.bg, padding: 24, display: "flex", flexDirection: "column" }}>
<button onClick={step === 1 ? onBack : () => setStep(1)} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: 22, alignSelf: "flex-start", marginBottom: 16 }}>←</button>
<div style={{ maxWidth: 400, margin: "0 auto", width: "100%" }}>
<Logo size={28} />
<div style={{ display: "flex", gap: 8, margin: "16px 0 24px" }}>
{[1, 2].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? theme.accent : theme.cardBorder }} />)}
</div>
{step === 1 ? (
<>
<h2 style={{ color: theme.text, fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 2, margin: "0 0 4px" }}>CREAR CUENTA</h2>
<p style={{ color: theme.muted, fontSize: 13, marginBottom: 24 }}>Paso 1 de 2 — Datos personales</p>
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
<input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" style={inp} />
<input value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" style={inp} />
<input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="Contraseña" style={inp} />
</div>
<Btn onClick={() => setStep(2)} style={{ width: "100%", padding: "14px", marginTop: 20 }} disabled={!name || !email || !pass}>Continuar →</Btn>
</>
) : (
<>
<h2 style={{ color: theme.text, fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 2, margin: "0 0 4px" }}>ELIGE TU PLAN</h2>
<p style={{ color: theme.muted, fontSize: 13, marginBottom: 20 }}>Paso 2 de 2 — Selecciona tu membresía</p>
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
{plans.map(p => (
<div key={p.id} onClick={() => setSelectedPlan(p.id)} style={{ background: selectedPlan === p.id ? p.color + "15" : theme.card, border: `2px solid ${selectedPlan === p.id ? p.color : theme.cardBorder}`, borderRadius: 14, padding: 16, cursor: "pointer" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<div>
<span style={{ color: p.color, fontWeight: 800, fontSize: 16 }}>{p.name}</span>
<p style={{ color: theme.muted, fontSize: 12, margin: "4px 0 0" }}>{p.visits} visitas/mes · Extra: ${p.extraVisit}/visita</p>
</div>
<div style={{ textAlign: "right" }}>
<span style={{ color: theme.text, fontWeight: 800, fontSize: 20 }}>${p.price}</span>
<p style={{ color: theme.muted, fontSize: 11, margin: 0 }}>/mes</p>
</div>
</div>
</div>
))}
</div>
{error && <p style={{ color: theme.accent, fontSize: 13, margin: "8px 0 0", textAlign: "center" }}>{error}</p>}
<Btn onClick={handleRegister} disabled={!selectedPlan || loading} style={{ width: "100%", padding: "14px", marginTop: 12 }}>{loading ? "Creando cuenta..." : "Continuar →"}</Btn>
</>
)}
</div>
</div>
);
}

function UserDashboard({ onNavigate, onLogout, user }) {
const plan = plans[0];
const usedVisits = 0;
const pct = (usedVisits / plan.visits) * 100;
return (
<div style={{ minHeight: "100vh", background: theme.bg, paddingBottom: 80 }}>
<div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<Logo size={24} />
<div onClick={() => onNavigate("profile")} style={{ width: 36, height: 36, borderRadius: "50%", background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 700, color: "#fff" }}>{(user?.user_metadata?.name || user?.email || "U")[0].toUpperCase()}</div>
</div>
<div style={{ padding: "20px 20px 0" }}>
<p style={{ color: theme.muted, fontSize: 13, margin: 0 }}>Hola de nuevo,</p>
<h2 style={{ color: theme.text, fontSize: 22, fontWeight: 800, margin: "2px 0 20px" }}>{user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuario"}</h2>
<Card style={{ background: `linear-gradient(135deg, #1a0a0c, #1e0e10)`, border: `1px solid ${theme.accent}33`, marginBottom: 16 }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
<div><Badge color={plan.color}>Plan {plan.name}</Badge><p style={{ color: theme.muted, fontSize: 12, margin: "8px 0 0" }}>Vence el 31 de julio</p></div>
<span style={{ color: theme.text, fontWeight: 800, fontSize: 22 }}>${plan.price}<span style={{ fontSize: 12, color: theme.muted, fontWeight: 400 }}>/mes</span></span>
</div>
<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
<span style={{ color: theme.muted, fontSize: 12 }}>Visitas usadas</span>
<span style={{ color: theme.text, fontSize: 12, fontWeight: 700 }}>{usedVisits} / {plan.visits}</span>
</div>
<div style={{ background: theme.cardBorder, borderRadius: 4, height: 6, marginBottom: 6 }}>
<div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${theme.accent}, ${theme.gold})`, borderRadius: 4 }} />
</div>
<p style={{ color: theme.muted, fontSize: 11, margin: 0 }}>{plan.visits - usedVisits} visitas restantes este mes</p>
</Card>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
<Card style={{ textAlign: "center", cursor: "pointer", padding: 16 }} onClick={() => onNavigate("checkin")}>
<div style={{ fontSize: 28, marginBottom: 8 }}>📱</div>
<p style={{ color: theme.text, fontWeight: 700, fontSize: 13, margin: 0 }}>Check-in QR</p>
<p style={{ color: theme.muted, fontSize: 11, margin: "4px 0 0" }}>Escanear gym</p>
</Card>
<Card style={{ textAlign: "center", cursor: "pointer", padding: 16 }} onClick={() => onNavigate("gyms")}>
<div style={{ fontSize: 28, marginBottom: 8 }}>gym️</div>
<p style={{ color: theme.text, fontWeight: 700, fontSize: 13, margin: 0 }}>Mis Gyms</p>
<p style={{ color: theme.muted, fontSize: 11, margin: "4px 0 0" }}>Ver red disponible</p>
</Card>
</div>
<h3 style={{ color: theme.text, fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Visitas recientes</h3>
<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
{mockVisits.slice(0, 3).map((v, i) => (
<Card key={i} style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<div style={{ width: 36, height: 36, borderRadius: 10, background: theme.green + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✓</div>
<div>
<p style={{ color: theme.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{v.gym}</p>
<p style={{ color: theme.muted, fontSize: 11, margin: "2px 0 0" }}>{v.time}</p>
</div>
</div>
<span style={{ color: theme.muted, fontSize: 12 }}>{v.date}</span>
</Card>
))}
</div>
</div>
<BottomNav active="dashboard" onNavigate={onNavigate} />
</div>
);
}

function CheckinScreen({ onNavigate, gyms }) {
const [done, setDone] = useState(false);
const [code, setCode] = useState("");
const [error, setError] = useState("");
const [gymName, setGymName] = useState("");

const handleCheckin = () => {
  if (!code.trim()) { setError("Ingresa el codigo del gimnasio"); return; }
  const gym = gyms.find(g => g.code && g.code.toUpperCase() === code.toUpperCase().trim());
  if (!gym) { setError("Codigo incorrecto. Pidelo al gimnasio."); return; }
  setGymName(gym.name);
  setDone(true);
};

return (
<div style={{ minHeight: "100vh", background: theme.bg, display: "flex", flexDirection: "column", paddingBottom: 80 }}>
<button onClick={() => onNavigate("dashboard")} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: 22, margin: 24, alignSelf: "flex-start" }}>←</button>
<div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px" }}>
{done ? (
<>
<div style={{ width: 100, height: 100, borderRadius: "50%", background: theme.green + "22", border: "3px solid " + theme.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, marginBottom: 20 }}>✓</div>
<h2 style={{ color: theme.text, fontFamily: "'Bebas Neue', cursive", fontSize: 32, letterSpacing: 2, margin: "0 0 8px" }}>CHECK-IN EXITOSO</h2>
<p style={{ color: theme.muted, fontSize: 14, marginBottom: 8 }}>{gymName}</p>
<Badge color={theme.green}>Visita registrada</Badge>
<Btn onClick={() => onNavigate("dashboard")} style={{ marginTop: 32, padding: "12px 32px" }}>Volver al inicio</Btn>
</>
) : (
<>
<h2 style={{ color: theme.text, fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 2, margin: "0 0 8px" }}>CHECK-IN</h2>
<p style={{ color: theme.muted, fontSize: 14, marginBottom: 8 }}>Ingresa el codigo del gimnasio</p>
<p style={{ color: theme.muted, fontSize: 12, marginBottom: 32 }}>El codigo lo proporciona el gimnasio al llegar</p>
<div style={{ width: 220, height: 220, border: "2px solid " + theme.accent, borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: theme.card, marginBottom: 24, padding: 20 }}>
<p style={{ color: theme.muted, fontSize: 12, margin: "0 0 16px" }}>Codigo del gimnasio</p>
<input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ej. GYM001" maxLength={10} style={{ width: "100%", background: theme.bg, border: "2px solid " + theme.accent, borderRadius: 10, padding: "12px", color: theme.text, fontSize: 22, fontWeight: 800, textAlign: "center", outline: "none", letterSpacing: 4, boxSizing: "border-box" }} />
{error && <p style={{ color: theme.accent, fontSize: 12, margin: "12px 0 0" }}>{error}</p>}
</div>
<Btn onClick={handleCheckin} style={{ padding: "14px 32px", width: "100%" }}>Confirmar Check-in</Btn>
</>
)}
</div>
<BottomNav active="checkin" onNavigate={onNavigate} />
</div>
);
}

function getDistance(lat1, lng1, lat2, lng2) {
const R = 6371;
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLng = (lng2 - lng1) * Math.PI / 180;
const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) * Math.sin(dLng/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
const d = R * c;
return d < 1 ? (d * 1000).toFixed(0) + " m" : d.toFixed(1) + " km";
}

function GymsScreen({ onNavigate, gyms }) {
const [view, setView] = useState("map");
const [selected, setSelected] = useState(null);
const [search, setSearch] = useState("");
const [userLoc, setUserLoc] = useState(null);

useEffect(() => {
if (navigator.geolocation) {
navigator.geolocation.getCurrentPosition(
pos => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
() => {}, { timeout: 8000 }
);
}
}, []);

const activeGyms = gyms.filter(g => g.status === "active");
const gymsWithDist = activeGyms.map(g => ({
...g,
distance: (userLoc && g.lat && g.lng) ? getDistance(userLoc.lat, userLoc.lng, g.lat, g.lng) : "—"
}));
const filtered = gymsWithDist.filter(g =>
g.name.toLowerCase().includes(search.toLowerCase()) ||
g.address.toLowerCase().includes(search.toLowerCase())
);
const selectedGym = filtered.find(g => g.id === selected);

// SVG map projection helpers
const mapGyms = gymsWithDist.filter(g => g.lat && g.lng);
const lats = mapGyms.map(g => g.lat);
const lngs = mapGyms.map(g => g.lng);
const minLat = Math.min(...lats, userLoc?.lat || 999) - 0.015;
const maxLat = Math.max(...lats, userLoc?.lat || -999) + 0.015;
const minLng = Math.min(...lngs, userLoc?.lng || 999) - 0.02;
const maxLng = Math.max(...lngs, userLoc?.lng || -999) + 0.02;
const toX = (lng) => ((lng - minLng) / (maxLng - minLng)) * 340 + 10;
const toY = (lat) => ((maxLat - lat) / (maxLat - minLat)) * 220 + 10;

const gymColors = ["#e63946", "#4dabf7", "#2ec27e", "#f4a261", "#9b59b6"];

return (
<div style={{ minHeight: "100vh", background: theme.bg, paddingBottom: 80 }}>
{/* Header */}
<div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", gap: 16 }}>
<button onClick={() => onNavigate("dashboard")} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: 22 }}>←</button>
<h2 style={{ color: theme.text, fontFamily: "'Bebas Neue', cursive", fontSize: 26, letterSpacing: 2, margin: 0, flex: 1 }}>RED DE GIMNASIOS</h2>
<div style={{ display: "flex", background: theme.card, borderRadius: 8, padding: 3, border: `1px solid ${theme.cardBorder}` }}>
{[{ id: "map", icon: "🗺️" }, { id: "list", icon: "☰" }].map(t => (
<button key={t.id} onClick={() => setView(t.id)} style={{ padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer", background: view === t.id ? theme.accent : "transparent", color: view === t.id ? "#fff" : theme.muted, fontSize: 14 }}>{t.icon}</button>
))}
</div>
</div>


  {/* GPS status */}
  <div style={{ padding: "0 20px 8px" }}>
    <Badge color={userLoc ? theme.green : theme.muted}>
      {userLoc ? "pin Ubicación activa — distancias reales" : "pin Activa tu GPS para ver distancias"}
    </Badge>
  </div>

  {/* Search */}
  <div style={{ padding: "0 20px 12px" }}>
    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar gimnasio..."
      style={{ width: "100%", background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 10, padding: "11px 16px", color: theme.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
  </div>

  {view === "map" ? (
    <div>
      {/* SVG Map */}
      <div style={{ margin: "0 20px", borderRadius: 16, overflow: "hidden", border: `1px solid ${theme.cardBorder}`, background: "#1a2a1a", position: "relative" }}>
        <svg width="100%" viewBox="0 0 360 240" style={{ display: "block" }}>
          {/* Background */}
          <rect width="360" height="240" fill="#1a2a1a" />
          {/* Grid lines */}
          {[0,1,2,3,4].map(i => (
            <line key={"h"+i} x1="0" y1={48*i} x2="360" y2={48*i} stroke="#ffffff08" strokeWidth="1"/>
          ))}
          {[0,1,2,3,4,5,6].map(i => (
            <line key={"v"+i} x1={60*i} y1="0" x2={60*i} y2="240" stroke="#ffffff08" strokeWidth="1"/>
          ))}
          {/* Roads simulation */}
          <path d={`M 0 ${toY((minLat+maxLat)/2)} L 360 ${toY((minLat+maxLat)/2)}`} stroke="#ffffff15" strokeWidth="3"/>
          <path d={`M ${toX((minLng+maxLng)/2)} 0 L ${toX((minLng+maxLng)/2)} 240`} stroke="#ffffff15" strokeWidth="3"/>

          {/* User location */}
          {userLoc && (
            <g>
              <circle cx={toX(userLoc.lng)} cy={toY(userLoc.lat)} r="16" fill="#4dabf720"/>
              <circle cx={toX(userLoc.lng)} cy={toY(userLoc.lat)} r="8" fill="#4dabf740"/>
              <circle cx={toX(userLoc.lng)} cy={toY(userLoc.lat)} r="5" fill="#4dabf7"/>
              <circle cx={toX(userLoc.lng)} cy={toY(userLoc.lat)} r="5" fill="none" stroke="#fff" strokeWidth="1.5"/>
            </g>
          )}

          {/* Gym markers */}
          {mapGyms.map((g, i) => {
            const cx = toX(g.lng);
            const cy = toY(g.lat);
            const col = g.color || gymColors[i % gymColors.length];
            const isSel = selected === g.id;
            return (
              <g key={g.id} onClick={() => setSelected(selected === g.id ? null : g.id)} style={{ cursor: "pointer" }}>
                <circle cx={cx} cy={cy} r={isSel ? 22 : 18} fill={col + "33"}/>
                <circle cx={cx} cy={cy} r={isSel ? 16 : 13} fill={col} stroke={isSel ? "#fff" : col} strokeWidth={isSel ? 2 : 0}/>
                <text x={cx} y={cy+5} textAnchor="middle" fontSize="13">gym️</text>
                <rect x={cx-28} y={cy-36} width="56" height="18" rx="9" fill="#000000cc"/>
                <text x={cx} y={cy-24} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">
                  {g.name.length > 12 ? g.name.slice(0,12)+"..." : g.name}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          {userLoc && (
            <g>
              <circle cx="18" cy="222" r="5" fill="#4dabf7"/>
              <text x="26" y="226" fontSize="9" fill="#888">Tu ubicación</text>
            </g>
          )}
        </svg>

        {/* Map attribution */}
        <div style={{ position: "absolute", bottom: 6, right: 8 }}>
          <span style={{ color: "#ffffff44", fontSize: 9 }}>RedGym Maps</span>
        </div>
      </div>

      {/* Selected gym card */}
      {selectedGym && (
        <div style={{ margin: "12px 20px 0" }}>
          <Card style={{ border: `1px solid ${selectedGym.color || theme.accent}44`, background: (selectedGym.color || theme.accent) + "10" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: (selectedGym.color || theme.accent) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>gym️</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ color: theme.text, fontWeight: 700, fontSize: 14, margin: 0 }}>{selectedGym.name}</p>
                  <Badge color={theme.gold}>star {selectedGym.rating}</Badge>
                </div>
                <p style={{ color: theme.muted, fontSize: 12, margin: "4px 0 2px" }}>pin {selectedGym.address}</p>
                {selectedGym.hours && <p style={{ color: theme.muted, fontSize: 12, margin: "0 0 8px" }}>clock {selectedGym.hours}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  <Badge color={theme.green}>✓ Disponible</Badge>
                  {selectedGym.distance !== "—" && <Badge color={selectedGym.color || theme.accent}>📏 {selectedGym.distance}</Badge>}
                </div>
              </div>
            </div>
            <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedGym.name + " " + selectedGym.address)}`, "_blank")}
              style={{ width: "100%", marginTop: 12, padding: "10px", background: (selectedGym.color || theme.accent) + "22", border: `1px solid ${(selectedGym.color || theme.accent)}44`, borderRadius: 8, color: selectedGym.color || theme.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              pin Abrir en Google Maps →
            </button>
          </Card>
        </div>
      )}

      {/* Gym list */}
      <div style={{ padding: "12px 20px 0" }}>
        <p style={{ color: theme.muted, fontSize: 12, margin: "0 0 10px" }}>Toca un pin o selecciona un gimnasio</p>
        {filtered.map((g, i) => (
          <Card key={g.id} onClick={() => setSelected(selected === g.id ? null : g.id)}
            style={{ padding: "12px 14px", cursor: "pointer", marginBottom: 8, border: `1px solid ${selected === g.id ? (g.color || theme.accent) : theme.cardBorder}`, background: selected === g.id ? (g.color || theme.accent) + "10" : theme.card }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: (g.color || gymColors[i % gymColors.length]) + "22", border: `1px solid ${(g.color || gymColors[i % gymColors.length])}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: g.color || gymColors[i % gymColors.length], fontSize: 12 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: theme.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{g.name}</p>
                <p style={{ color: theme.muted, fontSize: 11, margin: "1px 0 0" }}>
                  {g.distance !== "—" ? `📏 ${g.distance} · ` : ""}star {g.rating}
                </p>
              </div>
              <Badge color={theme.green}>Abierto</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  ) : (
    <div style={{ padding: "0 20px" }}>
      {filtered.map(g => (
        <Card key={g.id} style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: (g.color || theme.accent) + "22", border: `1px solid ${(g.color || theme.accent)}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>gym️</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <p style={{ color: theme.text, fontWeight: 700, fontSize: 14, margin: 0 }}>{g.name}</p>
                <Badge color={theme.gold}>star {g.rating}</Badge>
              </div>
              <p style={{ color: theme.muted, fontSize: 12, margin: "4px 0 2px" }}>pin {g.address}</p>
              {g.hours && <p style={{ color: theme.muted, fontSize: 12, margin: "0 0 8px" }}>clock {g.hours} {g.distance !== "—" ? `· 📏 ${g.distance}` : ""}</p>}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Badge color={theme.green}>Disponible</Badge>
                <span onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.name + " " + g.address)}`, "_blank")}
                  style={{ color: theme.blue, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Ver en Maps →</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )}
  <BottomNav active="gyms" onNavigate={onNavigate} />
</div>


);
}

function HistoryScreen({ onNavigate }) {
const gymCount = mockVisits.reduce((acc, v) => { acc[v.gym] = (acc[v.gym] || 0) + 1; return acc; }, {});
const topGym = Object.entries(gymCount).sort((a, b) => b[1] - a[1])[0] || ["Sin visitas", 0];
const barColors = [theme.blue, theme.green, theme.gold];
return (
<div style={{ minHeight: "100vh", background: theme.bg, paddingBottom: 90 }}>
<div style={{ padding: "20px 20px 0" }}>
<Logo size={24} />
<h2 style={{ color: theme.text, fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 2, margin: "16px 0 4px" }}>MI HISTORIAL</h2>
<p style={{ color: theme.muted, fontSize: 13, marginBottom: 20 }}>Todas tus visitas registradas</p>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
{[{ label: "Este mes", value: String(mockVisits.filter(v => new Date(v.date).getMonth() === new Date().getMonth()).length), icon: "cal", color: theme.blue }, { label: "Total", value: String(mockVisits.length), icon: "gym️", color: theme.green }, { label: "Favorito", value: topGym[0].split(" ")[0], icon: "star", color: theme.gold }].map((s, i) => (
<Card key={i} style={{ padding: 12, textAlign: "center" }}>
<div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
<p style={{ color: s.color, fontWeight: 800, fontSize: i === 2 ? 11 : 20, margin: 0 }}>{s.value}</p>
<p style={{ color: theme.muted, fontSize: 10, margin: "2px 0 0" }}>{s.label}</p>
</Card>
))}
</div>
<Card style={{ marginBottom: 20 }}>
<p style={{ color: theme.text, fontWeight: 700, fontSize: 13, margin: "0 0 12px" }}>Visitas por gimnasio</p>
{Object.entries(gymCount).map(([gym, count], i) => (
<div key={i} style={{ marginBottom: 10 }}>
<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
<span style={{ color: theme.muted, fontSize: 12 }}>{gym}</span>
<span style={{ color: theme.text, fontSize: 12, fontWeight: 700 }}>{count} visitas</span>
</div>
<div style={{ background: theme.cardBorder, borderRadius: 4, height: 6 }}>
<div style={{ width: `${(count / mockVisits.length) * 100}%`, height: "100%", background: barColors[i] || theme.blue, borderRadius: 4 }} />
</div>
</div>
))}
</Card>
<p style={{ color: theme.text, fontWeight: 700, fontSize: 13, margin: "0 0 12px" }}>Todas las visitas</p>
<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
{mockVisits.map((v, i) => (
<Card key={i} style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<div style={{ width: 38, height: 38, borderRadius: 10, background: theme.green + "20", border: `1px solid ${theme.green}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✓</div>
<div>
<p style={{ color: theme.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{v.gym}</p>
<p style={{ color: theme.muted, fontSize: 11, margin: "2px 0 0" }}>{v.time}</p>
</div>
</div>
<span style={{ color: theme.muted, fontSize: 11 }}>{v.date}</span>
</Card>
))}
</div>
</div>
<BottomNav active="history" onNavigate={onNavigate} />
</div>
);
}

function ProfileScreen({ onNavigate, onLogout, user }) {
const plan = plans[0];
const [notif, setNotif] = useState(true);
return (
<div style={{ minHeight: "100vh", background: theme.bg, paddingBottom: 90 }}>
<div style={{ padding: "20px 20px 0" }}>
<Logo size={24} />
<div style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0 24px" }}>
<div style={{ width: 68, height: 68, borderRadius: "50%", background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 28, color: "#fff", boxShadow: `0 0 20px ${theme.accentGlow}` }}>{(user?.user_metadata?.name || user?.email || "U")[0].toUpperCase()}</div>
<div>
<h2 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: 0 }}>{user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuario"}</h2>
<p style={{ color: theme.muted, fontSize: 13, margin: "4px 0 6px" }}>{user?.email || ""}</p>
<Badge color={plan.color}>Plan {plan.name}</Badge>
</div>
</div>
<Card style={{ marginBottom: 16, background: `linear-gradient(135deg, #0d1520, #101a24)`, border: `1px solid ${theme.blue}33` }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
<p style={{ color: theme.text, fontWeight: 700, fontSize: 14, margin: 0 }}>Mi membresía</p>
<Btn variant="outline" style={{ padding: "6px 14px", fontSize: 12 }}>Cambiar plan</Btn>
</div>
<div style={{ display: "flex", justifyContent: "space-between" }}>
{[{ label: "Plan", value: plan.name }, { label: "Precio", value: `$${plan.price}/mes` }, { label: "Vence", value: "31 Jul" }].map((d, i) => (
<div key={i}>
<p style={{ color: theme.muted, fontSize: 11, margin: 0 }}>{d.label}</p>
<p style={{ color: theme.text, fontSize: 13, fontWeight: 700, margin: "2px 0 0" }}>{d.value}</p>
</div>
))}
</div>
</Card>
<p style={{ color: theme.text, fontWeight: 700, fontSize: 13, margin: "0 0 12px" }}>Configuración</p>
<Card style={{ marginBottom: 16 }}>
{[
{ icon: "bell", label: "Notificaciones", sub: "Recordatorios y alertas", action: <div onClick={() => setNotif(!notif)} style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", background: notif ? theme.accent : theme.cardBorder, position: "relative" }}><div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: notif ? 23 : 3, transition: "all 0.3s" }} /></div> },
{ icon: "lock", label: "Cambiar contraseña", sub: "Actualiza tu acceso", action: <span style={{ color: theme.muted, fontSize: 18 }}>›</span> },
{ icon: "card", label: "Método de pago", sub: "MercadoPago vinculado", action: <span style={{ color: theme.muted, fontSize: 18 }}>›</span> },
{ icon: "doc", label: "Términos y privacidad", sub: "Políticas de uso", action: <span style={{ color: theme.muted, fontSize: 18 }}>›</span> },
].map((item, i, arr) => (
<div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${theme.cardBorder}` : "none" }}>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<span style={{ fontSize: 20 }}>{item.icon}</span>
<div>
<p style={{ color: theme.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{item.label}</p>
<p style={{ color: theme.muted, fontSize: 11, margin: "1px 0 0" }}>{item.sub}</p>
</div>
</div>
{item.action}
</div>
))}
</Card>
<p style={{ color: theme.text, fontWeight: 700, fontSize: 13, margin: "0 0 12px" }}>Mi actividad</p>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
{[{ label: "Visitas totales", value: "8", icon: "gym️", color: theme.green }, { label: "Gyms visitados", value: "3", icon: "pin", color: theme.blue }, { label: "Meses activo", value: "1", icon: "cal", color: theme.gold }, { label: "Visitas este mes", value: "5/12", icon: "chart", color: theme.accent }].map((s, i) => (
<Card key={i} style={{ padding: 14 }}>
<div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
<p style={{ color: s.color, fontWeight: 800, fontSize: 18, margin: 0 }}>{s.value}</p>
<p style={{ color: theme.muted, fontSize: 11, margin: "2px 0 0" }}>{s.label}</p>
</Card>
))}
</div>
<button onClick={onLogout} style={{ width: "100%", padding: "14px", border: `1px solid ${theme.accent}44`, borderRadius: 10, background: "transparent", color: theme.accent, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Cerrar sesión</button>
</div>
<BottomNav active="profile" onNavigate={onNavigate} />
</div>
);
}

function GymDashboard({ onLogout }) {
const planColor = { "Estándar": theme.blue, "Premium": theme.accent };
const todayVisits = [{ name: "Fernando G.", plan: "Estándar", time: "07:30 AM" }, { name: "María L.", plan: "Premium", time: "08:15 AM" }, { name: "Carlos R.", plan: "Estándar", time: "09:00 AM" }, { name: "Ana P.", plan: "Premium", time: "10:30 AM" }];
return (
<div style={{ minHeight: "100vh", background: theme.bg, paddingBottom: 30 }}>
<div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<Logo size={24} />
<Btn onClick={onLogout} variant="ghost" style={{ padding: "8px 14px", fontSize: 12 }}>Salir</Btn>
</div>
<div style={{ padding: "20px 20px 0" }}>
<p style={{ color: theme.muted, fontSize: 13, margin: 0 }}>Panel de</p>
<h2 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: "2px 0 20px" }}>PowerGym Chalco gym️</h2>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
{[{ label: "Visitas hoy", value: "4", icon: "users", color: theme.blue }, { label: "Ingresos hoy", value: "$236", icon: "money", color: theme.green }, { label: "Este mes", value: "47 visitas", icon: "cal", color: theme.gold }, { label: "Mes actual", value: "$2,773", icon: "trend", color: theme.accent }].map((s, i) => (
<Card key={i} style={{ padding: 14 }}>
<div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
<p style={{ color: s.color, fontWeight: 800, fontSize: 18, margin: 0 }}>{s.value}</p>
<p style={{ color: theme.muted, fontSize: 11, margin: "2px 0 0" }}>{s.label}</p>
</Card>
))}
</div>
<h3 style={{ color: theme.text, fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Visitas de hoy</h3>
<div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
{todayVisits.map((v, i) => (
<Card key={i} style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<div style={{ width: 36, height: 36, borderRadius: "50%", background: theme.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: theme.accent, fontSize: 13 }}>{v.name.charAt(0)}</div>
<div>
<p style={{ color: theme.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{v.name}</p>
<p style={{ color: theme.muted, fontSize: 11, margin: "2px 0 0" }}>{v.time}</p>
</div>
</div>
<Badge color={planColor[v.plan]}>{v.plan}</Badge>
</Card>
))}
</div>
<Card style={{ textAlign: "center", padding: 24 }}>
<p style={{ color: theme.muted, fontSize: 12, margin: "0 0 12px" }}>Código QR del gimnasio</p>
<div style={{ width: 120, height: 120, margin: "0 auto", background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>qr</div>
<p style={{ color: theme.muted, fontSize: 11, margin: "12px 0 0" }}>Los usuarios escanean este código al llegar</p>
</Card>
</div>
</div>
);
}

function AdminDashboard({ onLogout, gyms: savedGyms, setGyms: setSavedGyms }) {
const [adminTab, setAdminTab] = useState("overview");
const [showAddGym, setShowAddGym] = useState(false);
const [gymForm, setGymForm] = useState({ name: "", address: "", phone: "", hours: "", email: "", coords: "" });
const [requests, setRequests] = useState(initialRequests);
useEffect(() => {
const saved = db.get("redgym-solicitudes");
if (Array.isArray(saved) && saved.length > 0) setRequests(saved);
}, []);
const [confirmDelete, setConfirmDelete] = useState(null);
const [toast, setToast] = useState(null);

const showToast = (msg, color = theme.green) => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };
const handleAddGym = async () => {
if (!gymForm.name || !gymForm.address) return;
let lat = null, lng = null;
if (gymForm.coords && gymForm.coords.includes(",")) {
const parts = gymForm.coords.split(",").map(s => parseFloat(s.trim()));
if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) { lat = parts[0]; lng = parts[1]; }
}
showToast("wait Guardando...", theme.gold);
const res = await gymService.add({ name: gymForm.name, address: gymForm.address, phone: gymForm.phone, email: gymForm.email, hours: gymForm.hours, lat, lng });
if (res.error) { showToast("❌ " + res.error, "#ff4444"); return; }
const updated = [...savedGyms, res.gym];
setSavedGyms(updated);
db.save("redgym-gimnasios", updated);
setGymForm({ name: "", address: "", phone: "", hours: "", email: "", coords: "" });
setShowAddGym(false);
showToast(lat ? "✅ Gimnasio guardado con ubicación" : "✅ Gimnasio guardado");
};
const handleApprove = async (req) => {
const res = await gymService.add({ name: req.name, address: req.address, phone: req.phone, email: req.email, hours: req.hours });
if (!res.error) {
const updatedGyms = [...savedGyms, res.gym];
setSavedGyms(updatedGyms);
db.save("redgym-gimnasios", updatedGyms);
}
await requestService.delete(req.id);
const updatedReqs = requests.filter(r => r.id !== req.id);
setRequests(updatedReqs);
db.save("redgym-solicitudes", updatedReqs);
showToast("✅ " + req.name + " aprobado");
};
const handleReject = (req) => {
const updatedReqs = requests.filter(r => r.id !== req.id);
setRequests(updatedReqs);
db.save("redgym-solicitudes", updatedReqs);
showToast("❌ " + req.name + " rechazado", theme.accent);
};
const handleToggle = async (id) => {
const gym = savedGyms.find(g => g.id === id);
const newStatus = gym.status === "active" ? "inactive" : "active";
await gymService.update(id, { status: newStatus });
const updated = savedGyms.map(g => g.id === id ? { ...g, status: newStatus } : g);
setSavedGyms(updated);
db.save("redgym-gimnasios", updated);
};

const inp = { width: "100%", background: theme.bg, border: `1px solid ${theme.cardBorder}`, borderRadius: 10, padding: "11px 14px", color: theme.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

return (
<div style={{ minHeight: "100vh", background: theme.bg, paddingBottom: 30 }}>
{toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.color, color: "#fff", padding: "10px 20px", borderRadius: 20, fontSize: 13, fontWeight: 700, zIndex: 100, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>{toast.msg}</div>}
<div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<Logo size={24} />
<Btn onClick={onLogout} variant="ghost" style={{ padding: "8px 14px", fontSize: 12 }}>Salir</Btn>
</div>
<div style={{ padding: "16px 20px 0" }}>
<p style={{ color: theme.muted, fontSize: 13, margin: 0 }}>Panel de</p>
<h2 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: "2px 0 16px" }}>Administrador ⚙️</h2>
<div style={{ display: "flex", background: theme.card, borderRadius: 10, padding: 4, marginBottom: 20, border: `1px solid ${theme.cardBorder}`, gap: 4 }}>
{[{ id: "overview", label: "Resumen", icon: "chart" }, { id: "gyms", label: "Gyms", icon: "gym️" }, { id: "requests", label: requests.length > 0 ? "Solicitudes (" + requests.length + ")" : "Solicitudes", icon: "📋" }].map(t => (
<button key={t.id} onClick={() => setAdminTab(t.id)} style={{ flex: 1, padding: "8px 4px", border: "none", borderRadius: 8, cursor: "pointer", background: adminTab === t.id ? theme.accent : "transparent", color: adminTab === t.id ? "#fff" : theme.muted, fontSize: 11, fontWeight: 700 }}>{t.icon} {t.label}</button>
))}
</div>


    {adminTab === "overview" && (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[{ label: "Usuarios activos", value: "128", icon: "users", color: theme.blue }, { label: "Gyms en la red", value: String(savedGyms.filter(g => g.status === "active").length), icon: "gym️", color: theme.green }, { label: "Visitas este mes", value: "1,247", icon: "cal", color: theme.gold }, { label: "Ingresos app (15%)", value: "$19,440", icon: "money", color: theme.accent }].map((s, i) => (
            <Card key={i} style={{ padding: 14 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <p style={{ color: s.color, fontWeight: 800, fontSize: 18, margin: 0 }}>{s.value}</p>
              <p style={{ color: theme.muted, fontSize: 11, margin: "2px 0 0" }}>{s.label}</p>
            </Card>
          ))}
        </div>
        <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Usuarios por plan</h3>
        {[{ plan: "Estándar", users: 89, color: theme.blue, revenue: "$71,200" }, { plan: "Premium", users: 39, color: theme.accent, revenue: "$54,600" }].map((p, i) => (
          <Card key={i} style={{ marginBottom: 8, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Badge color={p.color}>{p.plan}</Badge>
              <span style={{ color: theme.text, fontWeight: 700, fontSize: 13 }}>{p.revenue}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: theme.muted, fontSize: 12 }}>{p.users} usuarios</span>
              <span style={{ color: theme.muted, fontSize: 12 }}>{Math.round(p.users / 128 * 100)}%</span>
            </div>
            <div style={{ background: theme.cardBorder, borderRadius: 4, height: 4 }}>
              <div style={{ width: (p.users / 128 * 100) + "%", height: "100%", background: p.color, borderRadius: 4 }} />
            </div>
          </Card>
        ))}
      </>
    )}

    {adminTab === "gyms" && (
      <>
        <Btn onClick={() => setShowAddGym(!showAddGym)} style={{ width: "100%", marginBottom: 16, padding: "12px" }}>{showAddGym ? "x Cancelar" : "+ Agregar Gimnasio"}</Btn>
        {showAddGym && (
          <Card style={{ marginBottom: 16, border: `1px solid ${theme.accent}33` }}>
            <p style={{ color: theme.text, fontWeight: 700, fontSize: 14, margin: "0 0 14px" }}>Nuevo Gimnasio</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ key: "name", ph: "Nombre del gimnasio *" }, { key: "address", ph: "Dirección completa *" }, { key: "phone", ph: "Teléfono de contacto" }, { key: "email", ph: "Correo electrónico" }, { key: "hours", ph: "Horario (ej. 5:00 AM - 11:00 PM)" }].map(f => (
                <input key={f.key} value={gymForm[f.key]} onChange={e => setGymForm({ ...gymForm, [f.key]: e.target.value })} placeholder={f.ph} style={inp} />
              ))}
              <div>
                <input value={gymForm.coords} onChange={e => setGymForm({ ...gymForm, coords: e.target.value })} placeholder="Coordenadas (ej. 19.2680, -98.9650)" style={inp} />
                <p style={{ color: theme.muted, fontSize: 11, margin: "6px 0 0", lineHeight: 1.5 }}>
                  pin Para obtener coordenadas: abre Google Maps → mantén presionado el lugar → copia los números que aparecen (ej. 19.2680, -98.9650)
                </p>
              </div>
              <Btn onClick={handleAddGym} disabled={!gymForm.name || !gymForm.address} style={{ padding: "12px" }}>✓ Guardar Gimnasio</Btn>
            </div>
          </Card>
        )}
        <p style={{ color: theme.muted, fontSize: 12, margin: "0 0 10px" }}>{savedGyms.length} gimnasios en la red</p>
        {savedGyms.map(g => (
          <Card key={g.id} style={{ marginBottom: 10, padding: 14, border: `1px solid ${g.status === "active" ? theme.green + "33" : theme.cardBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: theme.text, fontWeight: 700, fontSize: 14, margin: 0 }}>{g.name}</p>
                <p style={{ color: theme.muted, fontSize: 11, margin: "3px 0 2px" }}>pin {g.address}</p>
                {g.phone && <p style={{ color: theme.muted, fontSize: 11, margin: "1px 0" }}>📞 {g.phone}</p>}
                {g.hours && <p style={{ color: theme.muted, fontSize: 11, margin: "1px 0" }}>clock {g.hours}</p>}
              </div>
              <Badge color={g.status === "active" ? theme.green : theme.muted}>{g.status === "active" ? "Activo" : "Inactivo"}</Badge>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${theme.cardBorder}` }}>
              <span style={{ color: theme.muted, fontSize: 12 }}>chart {g.visits} visitas este mes</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleToggle(g.id)} style={{ padding: "5px 12px", border: `1px solid ${g.status === "active" ? theme.accent + "55" : theme.green + "55"}`, borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 700, color: g.status === "active" ? theme.accent : theme.green }}>{g.status === "active" ? "Desactivar" : "Activar"}</button>
                {confirmDelete === g.id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={async () => { await gymService.delete(g.id); const updated = savedGyms.filter(x => x.id !== g.id); setSavedGyms(updated); db.save("redgym-gimnasios", updated); setConfirmDelete(null); showToast("🗑 Gimnasio eliminado", theme.accent); }} style={{ padding: "5px 10px", border: "none", borderRadius: 8, background: "#ff444422", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#ff4444" }}>✓ Sí</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ padding: "5px 10px", border: "none", borderRadius: 8, background: theme.cardBorder, cursor: "pointer", fontSize: 11, fontWeight: 700, color: theme.muted }}>No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(g.id)} style={{ padding: "5px 12px", border: "1px solid #ff444433", borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#ff4444" }}>🗑 Borrar</button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </>
    )}

    {adminTab === "requests" && (
      requests.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <p style={{ color: theme.text, fontWeight: 700, margin: 0 }}>Sin solicitudes pendientes</p>
          <p style={{ color: theme.muted, fontSize: 13, margin: "4px 0 0" }}>Todas revisadas</p>
        </Card>
      ) : (
        <>
          <p style={{ color: theme.muted, fontSize: 12, margin: "0 0 12px" }}>{requests.length} solicitudes esperando aprobación</p>
          {requests.map(r => (
            <Card key={r.id} style={{ marginBottom: 12, padding: 14, border: `1px solid ${theme.gold}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <p style={{ color: theme.text, fontWeight: 700, fontSize: 14, margin: 0 }}>{r.name}</p>
                  <p style={{ color: theme.muted, fontSize: 11, margin: "3px 0 1px" }}>pin {r.address}</p>
                  <p style={{ color: theme.muted, fontSize: 11, margin: "1px 0" }}>📞 {r.phone}</p>
                  <p style={{ color: theme.muted, fontSize: 11, margin: "1px 0" }}>✉️ {r.email}</p>
                  <p style={{ color: theme.muted, fontSize: 11, margin: "1px 0" }}>clock {r.hours}</p>
                </div>
                <Badge color={theme.gold}>Pendiente</Badge>
              </div>
              <p style={{ color: theme.muted, fontSize: 11, margin: "0 0 10px" }}>Recibida: {r.date}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleApprove(r)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: theme.green + "22", color: theme.green, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>✓ Aprobar</button>
                <button onClick={() => handleReject(r)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: theme.accent + "22", color: theme.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>x Rechazar</button>
              </div>
            </Card>
          ))}
        </>
      )
    )}
  </div>
</div>


);
}

export default function RedGymApp() {
const [screen, setScreen] = useState("splash");
const [gyms, setGyms] = useState([]);
const [loading, setLoading] = useState(true);
const [currentUser, setCurrentUser] = useState(null);
const nav = (s) => setScreen(s);

// Secret access for admin and gym panels
const secretRole = (() => {
const hash = window.location.hash;
if (hash === "#admin-redgym-2025") return "admin";
if (hash === "#gym-redgym-2025") return "gym";
return null;
})();

const handleLogin = (role, user) => {
if (user) setCurrentUser(user);
setScreen(role === "gym" ? "gym" : role === "admin" ? "admin" : "dashboard");
};

const handleLogout = async () => {
await authService.logout();
setCurrentUser(null);
setScreen("splash");
};

const loadGyms = async () => {
try {
const data = await gymService.getAll();
setGyms(data.length > 0 ? data : initialGyms);
} catch(e) {
// fallback to localStorage if Supabase fails
const saved = db.get("redgym-gimnasios");
setGyms(Array.isArray(saved) && saved.length > 0 ? saved : initialGyms);
}
setLoading(false);
};

useEffect(() => {
loadGyms();
authService.getSession().then(user => { if (user) setCurrentUser(user); });
if (secretRole) setScreen(secretRole);
}, []);
return (
<>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700;800&display=swap'); * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; } body { margin: 0; background: #0a0a0a; } input::placeholder { color: #555; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }`}</style>
<div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh" }}>
{loading && <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}><div style={{ width: 60, height: 60, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center" }}><DumbbellIcon size={32} color="#fff" /></div><p style={{ color: theme.muted, fontSize: 14 }}>Cargando RedGym...</p></div>}
{!loading && screen === "splash"    && <SplashScreen onLogin={() => setScreen("login")} onRegister={() => setScreen("register")} />}
{!loading && screen === "login"     && <LoginScreen onLogin={handleLogin} onBack={() => setScreen("splash")} onSwitch={() => setScreen("register")} />}
{!loading && screen === "register"  && <RegisterScreen onRegister={(plan, user) => handleLogin("user", user)} onBack={() => setScreen("splash")} />}
{!loading && screen === "dashboard" && <UserDashboard onNavigate={nav} onLogout={handleLogout} user={currentUser} />}
{!loading && screen === "checkin"   && <CheckinScreen onNavigate={nav} gyms={gyms} />}
{!loading && screen === "gyms"      && <GymsScreen onNavigate={nav} gyms={gyms.filter(g => g.status === "active")} />}
{!loading && screen === "history"   && <HistoryScreen onNavigate={nav} />}
{!loading && screen === "profile"   && <ProfileScreen onNavigate={nav} onLogout={handleLogout} user={currentUser} />}
{!loading && screen === "gym"       && <GymDashboard onLogout={handleLogout} />}
{!loading && screen === "admin"     && <AdminDashboard onLogout={handleLogout} gyms={gyms} setGyms={setGyms} />}
</div>
</>
);
}
