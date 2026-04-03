import { useState, useRef, useEffect } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";
import Dashboard from "./Dashboard.jsx";

// ── SUPABASE CONFIG ────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON;

const sb = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_ANON,
      "Authorization": `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const CATS = ["All","Corporate","Commercial","Character","Audiobook","E-Learning","Female","Male","IVR & On Hold","Jingle","Retail"];
const accent = "#FF3D57";
const GENDER_FILTERS = new Set(["Male", "Female"]);
const NAV_ITEMS = [
  { label: "Male Talent", type: "filter", value: "Male" },
  { label: "Female Talent", type: "filter", value: "Female" },
  { label: "Have You Heard?", type: "section", value: "newsletter" },
  { label: "About", type: "section", value: "about" },
  { label: "Studio Links", type: "section", value: "footer" },
];
const FOOTER_LINKS = ["Male Talent","Female Talent","Have You Heard?","About BrisVO","Studio Links","Rate Card","Disclaimer","Terms"];
const OFFER_ITEMS = [
  ["🎙","Find talent fast","Browse professional voices — filter by style, gender, accent"],
  ["▶","Hear before you hire","Up to 6 demo reels per artist, stream instantly"],
  ["✉","Book with ease","Direct enquiry form on every profile"],
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function logAuthError(context, error) {
  if (import.meta.env.DEV) {
    console.error(context, error);
  }
}

function buildAuthStatus(tone, message) {
  return { tone, message };
}

function detectRecoveryModeFromLocation() {
  if (typeof window === "undefined") return false;

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(window.location.search);

  return hashParams.get("type") === "recovery" || searchParams.get("type") === "recovery";
}

function clearRecoveryParamsFromLocation() {
  if (typeof window === "undefined") return;

  const nextUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState({}, document.title, nextUrl);
}

function getPasswordResetRedirectUrl() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${window.location.pathname}`;
}

function AuthStatusMessage({ status }) {
  if (!status?.message) return null;

  return (
    <p
      className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
        status.tone === "error"
          ? "border-[#ff7a8b]/40 bg-[#2a1117] text-[#ffb1bc]"
          : "border-[#00c48c]/30 bg-[#00c48c]/10 text-[#b6ffe7]"
      }`}
    >
      {status.message}
    </p>
  );
}

function sortDemos(demos = []) {
  return [...demos].sort((left, right) => {
    const sortOrderDelta = (left.sort_order ?? 0) - (right.sort_order ?? 0);
    if (sortOrderDelta !== 0) return sortOrderDelta;
    return (left.id ?? 0) - (right.id ?? 0);
  });
}

function shuffleArtists(items = []) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

// ── HELPERS ────────────────────────────────────────────────────
function Avatar({ name, colour, size=180 }) {
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{width:"100%",height:"100%",background:`linear-gradient(145deg,${colour},${colour}cc)`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:4}}>
      <div style={{fontSize:size/3,fontWeight:900,color:"rgba(255,255,255,0.9)",fontFamily:"Georgia,serif",lineHeight:1}}>{initials}</div>
      <div style={{fontSize:Math.max(9,size/14),fontWeight:700,color:"rgba(255,255,255,0.5)",letterSpacing:2,textTransform:"uppercase",fontFamily:"Montserrat,sans-serif"}}>{name.split(" ")[0]}</div>
    </div>
  );
}

function AuthField({ id, label, type="text", value, onChange, error, autoComplete, placeholder }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`block w-full rounded-2xl border px-4 py-3 text-sm text-white transition placeholder:text-white/32 focus:outline-none focus:ring-4 ${
          error
            ? "border-[#ff7a8b] bg-[#2a1117] focus:border-[#ff7a8b] focus:ring-[#ff3d57]/15"
            : "border-white/10 bg-black/28 focus:border-[#ff3d57]/80 focus:ring-[#ff3d57]/12"
        }`}
      />
      {error&&(
        <p id={`${id}-error`} className="text-sm text-[#ff9daa]">
          {error}
        </p>
      )}
    </div>
  );
}

function AuthScene({ eyebrow, title, copy, panelTitle, panelCopy, onBack, backLabel = "Back to Home", children }) {
  const authHighlights = [
    ["Independent talent", "Local voices, direct booking, no generic portal flow."],
    ["Studio ready", "A BrisVO sign-in is built for working artists and working sessions."],
    ["Collective access", "Built for the BrisVO collective and the artists who keep sessions moving."],
  ];

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050505] text-white">
      {[
        { background: "#FF3D57", left: "8%", top: "-8%" },
        { background: "#7C3AED", left: "72%", top: "8%" },
        { background: "#00C48C", left: "18%", top: "74%" },
      ].map((glow, index)=>(
        <div
          key={index}
          className="pointer-events-none absolute h-72 w-72 rounded-full blur-3xl"
          style={{ ...glow, opacity: 0.22 }}
        />
      ))}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)] lg:items-center">
          <section className="max-w-2xl">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="brand-mark brand-mark--large">
                Bris<span style={{color:accent}}>VO</span>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="site-button site-button--ghost site-button--compact"
              >
                {backLabel}
              </button>
            </div>
            <div className="mb-8">
              <div className="section-eyebrow">{eyebrow}</div>
              <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/68 sm:text-base">
                {copy}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {authHighlights.map(([heading,text])=>(
                <div key={heading} className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff93a4]">
                    {heading}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/62">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="relative">
            <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top,_rgba(255,61,87,0.25),transparent_55%)] blur-2xl"/>
            <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-white/[0.06] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"/>
              <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-[#FF3D57]/18 blur-3xl"/>
              <div className="relative">
                <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#ff95a5]">
                  {panelTitle}
                </div>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/66">
                  {panelCopy}
                </p>
                <div className="mt-8">{children}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function ArtistLoginView({ onBack, onSwitch, onForgotPassword, onLogin, loginPending }) {
  const [form, setForm] = useState({ email:"", password:"" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(buildAuthStatus("", ""));

  const updateField = key => e => {
    const value = e.target.value;
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => (current[key] ? { ...current, [key]: "" } : current));
    setStatus(buildAuthStatus("", ""));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const nextErrors = {};
    const email = form.email.trim();

    if (!email) nextErrors.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) nextErrors.email = "Enter a valid email address.";

    if (!form.password) nextErrors.password = "Password is required.";
    else if (form.password.length < MIN_PASSWORD_LENGTH) nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus(buildAuthStatus("success", "Signing you in…"));

    const { error } = await onLogin(email, form.password);

    if (error) {
      setStatus(buildAuthStatus("error", "We couldn't sign you in. Check your email and password, then try again."));
    }
  };

  return (
    <AuthScene
      eyebrow="Artist Login"
      title="Welcome back to the BrisVO collective."
      copy="Sign in to access your artist-side space. The same straightforward BrisVO approach applies here too: professional, local, and easy to work with."
      panelTitle="Artist Sign-In"
      panelCopy="Use your email and password to enter the BrisVO artist area."
      onBack={onBack}
      backLabel="Back to Home"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthField
          id="login-email"
          label="Email"
          type="email"
          value={form.email}
          onChange={updateField("email")}
          autoComplete="email"
          placeholder="artist@brisvo.com.au"
          error={errors.email}
        />
        <AuthField
          id="login-password"
          label="Password"
          type="password"
          value={form.password}
          onChange={updateField("password")}
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password}
        />

        <div className="flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => onForgotPassword(form.email.trim())}
            className="cursor-pointer bg-transparent p-0 text-white/54 transition hover:text-[#ff93a4]"
          >
            Forgot password?
          </button>
          <span className="text-white/35">Artist access</span>
        </div>

        <button
          type="submit"
          disabled={loginPending}
          className="site-button site-button--primary site-button--full"
          style={{ "--button-color": accent, "--button-shadow": `${accent}44`, opacity: loginPending ? 0.7 : 1 }}
        >
          {loginPending ? "Signing In…" : "Sign In"}
        </button>
      </form>

      <div aria-live="polite" className="mt-5 min-h-6">
        <AuthStatusMessage status={status} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/56">
        Need access to BrisVO artist tools?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="cursor-pointer bg-transparent p-0 font-semibold text-[#ff93a4] transition hover:text-white"
        >
          Create one here
        </button>
      </div>
    </AuthScene>
  );
}

function ArtistForgotPasswordView({ onBack, onSubmit, pending, initialEmail = "" }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(buildAuthStatus("", ""));

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = async event => {
    event.preventDefault();
    const nextEmail = email.trim();

    setError("");
    setStatus(buildAuthStatus("", ""));

    if (!nextEmail) {
      setError("Email is required.");
      return;
    }

    if (!EMAIL_RE.test(nextEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setStatus(buildAuthStatus("success", "Sending reset instructions…"));
    const { error: requestError } = await onSubmit(nextEmail);

    if (requestError) {
      setStatus(buildAuthStatus("error", "We couldn't send password reset instructions right now. Please try again."));
      return;
    }

    setStatus(buildAuthStatus("success", "If that email is linked to a BrisVO artist account, reset instructions are on the way."));
  };

  return (
    <AuthScene
      eyebrow="Password Reset"
      title="Reset your BrisVO password."
      copy="Enter your email and we'll send a secure password reset link back to this BrisVO sign-in flow."
      panelTitle="Forgot Password"
      panelCopy="Use the same email address you sign in with. Reset instructions will only go to the account owner."
      onBack={onBack}
      backLabel="Back to Login"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthField
          id="forgot-password-email"
          label="Email"
          type="email"
          value={email}
          onChange={event => {
            setEmail(event.target.value);
            setError("");
            setStatus(buildAuthStatus("", ""));
          }}
          autoComplete="email"
          placeholder="artist@brisvo.com.au"
          error={error}
        />

        <button
          type="submit"
          disabled={pending}
          className="site-button site-button--primary site-button--full"
          style={{ "--button-color": accent, "--button-shadow": `${accent}44`, opacity: pending ? 0.7 : 1 }}
        >
          {pending ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      <div aria-live="polite" className="mt-5 min-h-6">
        <AuthStatusMessage status={status} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/56">
        Remembered it?{" "}
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer bg-transparent p-0 font-semibold text-[#ff93a4] transition hover:text-white"
        >
          Back to login
        </button>
      </div>
    </AuthScene>
  );
}

function ArtistResetPasswordView({ onBackToLogin, onRequestNewLink, onSubmit, pending, recoveryReady }) {
  const [form, setForm] = useState({ password:"", confirmPassword:"" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(buildAuthStatus("", ""));
  const [completed, setCompleted] = useState(false);

  const updateField = key => event => {
    const value = event.target.value;
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => (current[key] ? { ...current, [key]: "" } : current));
    setStatus(buildAuthStatus("", ""));
  };

  const handleSubmit = async event => {
    event.preventDefault();

    if (!recoveryReady) {
      setStatus(buildAuthStatus("error", "This password reset link is no longer available. Request a new one and try again."));
      return;
    }

    const nextErrors = {};

    if (!form.password) nextErrors.password = "Password is required.";
    else if (form.password.length < MIN_PASSWORD_LENGTH) nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

    if (!form.confirmPassword) nextErrors.confirmPassword = "Please confirm your password.";
    else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Passwords do not match.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus(buildAuthStatus("success", "Updating your password…"));
    const { error } = await onSubmit(form.password);

    if (error) {
      setStatus(buildAuthStatus("error", "We couldn't update your password right now. Request a new reset link and try again."));
      return;
    }

    setCompleted(true);
    setStatus(buildAuthStatus("success", "Your password has been updated. Sign in with your new password when you're ready."));
    setForm({ password: "", confirmPassword: "" });
    setErrors({});
  };

  return (
    <AuthScene
      eyebrow="Set New Password"
      title="Choose a new password for BrisVO."
      copy="This reset session is temporary. Set your new password now, then return to sign in."
      panelTitle="Reset Password"
      panelCopy="Use at least eight characters and confirm the new password before you continue."
      onBack={onBackToLogin}
      backLabel="Back to Login"
    >
      {recoveryReady ? (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <AuthField
            id="reset-password"
            label="New Password"
            type="password"
            value={form.password}
            onChange={updateField("password")}
            autoComplete="new-password"
            placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
            error={errors.password}
          />
          <AuthField
            id="reset-confirm-password"
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={updateField("confirmPassword")}
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            error={errors.confirmPassword}
          />

          <button
            type="submit"
            disabled={pending || completed}
            className="site-button site-button--primary site-button--full"
            style={{ "--button-color": accent, "--button-shadow": `${accent}44`, opacity: pending || completed ? 0.7 : 1 }}
          >
            {pending ? "Updating…" : completed ? "Password Updated" : "Update Password"}
          </button>
        </form>
      ) : (
        <div className="rounded-[24px] border border-[#ff7a8b]/30 bg-[#2a1117] px-5 py-4 text-sm leading-6 text-[#ffb1bc]">
          This password reset link is no longer valid. Request a new one to continue.
        </div>
      )}

      <div aria-live="polite" className="mt-5 min-h-6">
        <AuthStatusMessage status={status} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/56">
        {completed ? "Ready to continue?" : "Need a fresh reset link?"}{" "}
        <button
          type="button"
          onClick={completed ? onBackToLogin : onRequestNewLink}
          className="cursor-pointer bg-transparent p-0 font-semibold text-[#ff93a4] transition hover:text-white"
        >
          {completed ? "Back to login" : "Request another reset email"}
        </button>
      </div>
    </AuthScene>
  );
}

function ArtistRegisterView({ onBack, onSwitch }) {
  const [form, setForm] = useState({ fullName:"", email:"", password:"", confirmPassword:"" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");

  const updateField = key => e => {
    const value = e.target.value;
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => (current[key] ? { ...current, [key]: "" } : current));
    setStatus("");
  };

  const handleSubmit = e => {
    e.preventDefault();
    const nextErrors = {};
    const fullName = form.fullName.trim();
    const email = form.email.trim();

    if (!fullName) nextErrors.fullName = "Full name is required.";
    if (!email) nextErrors.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) nextErrors.email = "Enter a valid email address.";

    if (!form.password) nextErrors.password = "Password is required.";
    else if (form.password.length < MIN_PASSWORD_LENGTH) nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

    if (!form.confirmPassword) nextErrors.confirmPassword = "Please confirm your password.";
    else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Passwords do not match.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("This sign-up is a frontend preview only. Your details were not sent anywhere.");
  };

  return (
    <AuthScene
      eyebrow="Artist Sign Up"
      title="Join Queensland's voice collective."
      copy="Create your BrisVO artist account details below. This space is designed for professional local talent who want to be easy to find, easy to brief, and ready to deliver."
      panelTitle="Artist Registration"
      panelCopy="For BrisVO artists and invited talent. Account approvals and live sign-up are still to come."
      onBack={onBack}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthField
          id="register-full-name"
          label="Full Name"
          value={form.fullName}
          onChange={updateField("fullName")}
          autoComplete="name"
          placeholder="Your full name"
          error={errors.fullName}
        />
        <AuthField
          id="register-email"
          label="Email"
          type="email"
          value={form.email}
          onChange={updateField("email")}
          autoComplete="email"
          placeholder="artist@brisvo.com.au"
          error={errors.email}
        />
        <AuthField
          id="register-password"
          label="Password"
          type="password"
          value={form.password}
          onChange={updateField("password")}
          autoComplete="new-password"
          placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
          error={errors.password}
        />
        <AuthField
          id="register-confirm-password"
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={updateField("confirmPassword")}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
        />

        <p className="text-sm leading-6 text-white/52">
          For BrisVO artists and invited talent only.
        </p>

        <button
          type="submit"
          className="site-button site-button--primary site-button--full"
          style={{ "--button-color": accent, "--button-shadow": `${accent}44` }}
        >
          Create Account
        </button>
      </form>

      <div aria-live="polite" className="mt-5 min-h-6">
        {status&&(
          <p className="rounded-2xl border border-[#00c48c]/30 bg-[#00c48c]/10 px-4 py-3 text-sm leading-6 text-[#b6ffe7]">
            {status}
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/56">
        Already part of the collective?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="cursor-pointer bg-transparent p-0 font-semibold text-[#ff93a4] transition hover:text-white"
        >
          Go to login
        </button>
      </div>
    </AuthScene>
  );
}

// ── AUDIO PLAYER ──────────────────────────────────────────────
function DemoRow({ demo, colour, activeId, onActivate }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  const [cur, setCur] = useState("0:00");
  const [dur, setDur] = useState(null);
  const fmt = s => { if(!s||isNaN(s)) return null; const m=Math.floor(s/60),sec=Math.floor(s%60); return `${m}:${sec.toString().padStart(2,"0")}`; };
  useEffect(() => {
    if (activeId !== demo.file_url) {
      ref.current?.pause();
    }
  }, [activeId, demo.file_url]);
  const toggle = () => {
    const a=ref.current; if(!a) return;
    onActivate(demo.file_url);
    if(playing){a.pause();setPlaying(false);}else{a.play().catch(()=>{});setPlaying(true);}
  };
  return (
    <div style={{border:`2px solid ${colour}33`,borderRadius:10,marginBottom:8,overflow:"hidden",background:"#fff"}}>
      <audio ref={ref} src={demo.file_url}
        onTimeUpdate={e=>{const a=e.target;setPct(a.duration?(a.currentTime/a.duration)*100:0);setCur(fmt(a.currentTime)||"0:00");}}
        onLoadedMetadata={e=>setDur(fmt(e.target.duration))}
        onPause={()=>setPlaying(false)}
        onEnded={()=>{setPlaying(false);setPct(0);setCur("0:00");}}
      />
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",background:playing?colour+"18":"transparent"}} onClick={toggle}>
        <button onClick={e=>{e.stopPropagation();toggle();}}
          style={{width:36,height:36,borderRadius:"50%",background:playing?colour:"#f0f0f0",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:playing?"#fff":"#444",flexShrink:0,transition:"all .2s",fontWeight:700}}>
          {playing?"⏸":"▶"}
        </button>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:"#111"}}>{demo.name}</div>
          <div style={{fontSize:11,color:"#888",marginTop:2}}>{playing?`${cur}${dur?` / ${dur}`:""}`:dur||"click to load"}</div>
        </div>
      </div>
      {(playing||pct>0)&&(
        <div style={{padding:"0 14px 10px"}}>
          <div style={{position:"relative",height:5,background:"#eee",borderRadius:3,cursor:"pointer"}}
            onClick={e=>{const a=ref.current;if(!a?.duration)return;const r=e.currentTarget.getBoundingClientRect();a.currentTime=((e.clientX-r.left)/r.width)*a.duration;}}>
            <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${pct}%`,background:colour,borderRadius:3,transition:"width .1s"}}/>
          </div>
          <div style={{fontSize:10,color:"#aaa",marginTop:4}}>{cur}{dur?` / ${dur}`:""}</div>
        </div>
      )}
    </div>
  );
}

// ── TALENT CARD ────────────────────────────────────────────────
function TalentCard({ talent, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  const colour = talent.brand_color || "#FF3D57";
  return (
    <button
      type="button"
      className="talent-card"
      onClick={onClick}
      style={{ "--talent-color": colour, "--talent-shadow": `${colour}55` }}
    >
      <div className="talent-card__media">
        {imgErr?<Avatar name={talent.name} colour={colour} size={200}/>:
          <img src={talent.photo_url} alt={talent.name} onError={()=>setImgErr(true)}
            className="talent-card__image"
            style={{objectPosition:"top center"}}
          />
        }
      </div>
      {!imgErr&&<div className="talent-card__tint"/>}
      <div className="talent-card__gradient"/>
      <div className="talent-card__accent"/>
      {talent.demos?.length>0&&(
        <div className="talent-card__badge">
          {talent.demos.length}🎙
        </div>
      )}
      <div className="talent-card__meta">
        <div className="talent-card__name">{talent.name}</div>
        <div className="talent-card__tags">
          {(talent.categories||[]).slice(0,2).map(c=>(
            <span key={c} className="talent-card__tag">{c}</span>
          ))}
        </div>
      </div>
    </button>
  );
}

// ── TALENT MODAL ──────────────────────────────────────────────
function TalentModal({ talent, onClose }) {
  const [activeDemo, setActiveDemo] = useState(null);
  const [imgErr, setImgErr] = useState(false);
  const [enqForm, setEnqForm] = useState({name:"",email:"",company:"",project_type:"",message:""});
  const [enqSent, setEnqSent] = useState(false);
  const [enqLoading, setEnqLoading] = useState(false);
  const colour = talent.brand_color || "#FF3D57";

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submitEnquiry = async () => {
    if(!enqForm.name||!enqForm.email||!enqForm.message) return;
    setEnqLoading(true);
    try {
      await sb("enquiries", {
        method:"POST",
        body: JSON.stringify({ artist_id: talent.id, sender_name: enqForm.name, sender_email: enqForm.email, sender_company: enqForm.company, project_type: enqForm.project_type, message: enqForm.message }),
        prefer: "return=minimal",
      });
      setEnqSent(true);
    } catch(e) { console.error(e); }
    setEnqLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div
        className="modal-panel modal-form"
        style={{ "--modal-color": colour, "--modal-shadow": `${colour}55`, "--field-focus": colour }}
      >
        <button type="button" className="modal-close" onClick={onClose} style={{borderColor: colour}}>✕</button>
        <div className="modal-header">
          <div className="modal-media">
            {imgErr?<div className="modal-media__fallback"><Avatar name={talent.name} colour={colour} size={240}/></div>:
              <img src={talent.photo_url} alt={talent.name} onError={()=>setImgErr(true)}
                className="modal-media__image"
                style={{objectPosition:"top center"}}
              />
            }
            <div className="modal-media__accent"/>
          </div>
          <div className="modal-hero" style={{background:`linear-gradient(135deg,${colour}ee,${colour}aa)`}}>
            <div className="modal-chip-list">
              {(talent.categories||[]).map(c=>(
                <span key={c} className="modal-chip">{c}</span>
              ))}
            </div>
            <h2 className="modal-title">{talent.name}</h2>
            <div className="modal-subtitle">{talent.gender} · Australian Voice Artist</div>
            {talent.demos?.length>0&&(
              <div className="modal-demo-pill">
                🎙 {talent.demos.length} demo reel{talent.demos.length>1?"s":""}
              </div>
            )}
          </div>
        </div>
        <div className="modal-body">
          {talent.bio&&(
            <div className="modal-section">
              <div className="section-label" style={{color: colour}}>About</div>
              <p className="modal-copy">{talent.bio}</p>
            </div>
          )}
          {talent.demos?.length>0&&(
            <div className="modal-section">
              <div className="section-label" style={{color: colour}}>Demo Reels</div>
              {talent.demos.map((d,i)=><DemoRow key={i} demo={d} colour={colour} activeId={activeDemo} onActivate={setActiveDemo}/>)}
            </div>
          )}
          <div className="modal-form-section">
            <div className="section-label" style={{color: colour}}>Enquire About This Artist</div>
            {enqSent?(
              <div className="modal-success" style={{background:`${colour}11`,borderColor:`${colour}44`}}>
                <div className="modal-success__icon">✅</div>
                <div className="modal-success__title">Message sent!</div>
                <div className="modal-success__text">We've received your enquiry and will be in touch shortly.</div>
              </div>
            ):(
              <div className="form-grid form-grid--two modal-form-grid">
                {[["Name *","name","text","Your name"],["Email *","email","email","your@email.com"],["Company","company","text","Your company"],["Project Type","project_type","text","e.g. TVC, Radio, Corporate"]].map(([lbl,k,type,ph])=>(
                  <div key={k} className="form-field">
                    <label className="field-label">{lbl}</label>
                    <input
                      type={type}
                      value={enqForm[k]}
                      onChange={e=>setEnqForm(f=>({...f,[k]:e.target.value}))}
                      placeholder={ph}
                      className="field-input"
                    />
                  </div>
                ))}
                <div className="form-field form-span-full">
                  <label className="field-label">Message *</label>
                  <textarea
                    value={enqForm.message}
                    onChange={e=>setEnqForm(f=>({...f,message:e.target.value}))}
                    placeholder="Tell us about your project…"
                    className="field-input field-textarea"
                  />
                </div>
                <div className="form-span-full">
                  <button
                    type="button"
                    onClick={submitEnquiry}
                    disabled={enqLoading}
                    className="site-button site-button--primary site-button--full"
                    style={{ "--button-color": colour, "--button-shadow": `${colour}44`, opacity: enqLoading ? 0.7 : 1 }}
                  >
                    {enqLoading?"Sending…":"Send Enquiry"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── NEWSLETTER ────────────────────────────────────────────────
function NewsletterSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if(!name.trim()||!email.trim()) return;
    setLoading(true);
    try {
      await sb("subscribers", { method:"POST", body: JSON.stringify({name:name.trim(), email:email.trim()}), prefer:"return=minimal" });
      setSubmitted(true);
    } catch {
      // May fail if email already subscribed — still show success
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <section id="newsletter" className="newsletter-section anchor-target">
      {["#7C3AED","#FF3D57","#00C48C"].map((c,i)=>(
        <div
          key={i}
          className="newsletter-section__glow"
          style={{background:c,left:i===0?"5%":i===1?"55%":"30%",top:i===0?"-10%":i===1?"20%":"50%"}}
        />
      ))}
      <div className="newsletter-section__inner content-shell content-shell--narrow">
        <div className="section-eyebrow">Stay Connected</div>
        <h3 className="newsletter-section__title">Sign up to our newsletter</h3>
        <p className="newsletter-section__copy">Stay up to date with the latest news, special events, membership opportunities, and promotions.</p>
        {submitted?(
          <div className="newsletter-success">
            <div className="newsletter-success__icon">✅</div>
            <div className="newsletter-success__title">You're on the list!</div>
            <div className="newsletter-success__text">Thanks {name.split(" ")[0]} — we'll be in touch with all things BrisVO.</div>
          </div>
        ):(
          <div className="newsletter-form">
            <div className="form-grid form-grid--two newsletter-form-grid">
              {[["Your Name",name,setName,"text"],["Email Address",email,setEmail,"email"]].map(([ph,val,set,type])=>(
                <input key={ph} type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                  onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                  className="field-input field-input--dark"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="site-button site-button--primary site-button--full"
              style={{ "--button-color": accent, "--button-shadow": `${accent}44`, opacity: loading ? 0.7 : 1 }}
            >
              {loading?"Signing up…":"Sign Up"}
            </button>
            <p className="newsletter-form__hint">No spam. Unsubscribe anytime.</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState(() => (detectRecoveryModeFromLocation() ? "reset-password" : "home"));
  const [session, setSession] = useState(null);
  const [artistProfile, setArtistProfile] = useState(null);
  const [artistLoading, setArtistLoading] = useState(false);
  const [artistError, setArtistError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [resetRecoveryReady, setResetRecoveryReady] = useState(() => detectRecoveryModeFromLocation());
  const [authEmailPrefill, setAuthEmailPrefill] = useState("");

  // Session setup: read the initial Supabase session on mount.
  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        logAuthError("Session check error:", error);
        return;
      }

      if (!active) return;
      setSession(data.session);

      if (detectRecoveryModeFromLocation()) {
        setResetRecoveryReady(true);
        setView("reset-password");
        return;
      }

      if (!data.session) {
        setView("home");
      }
    };

    syncSession();

    // Auth listener: keep session state in sync with login/logout changes.
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      setSession(nextSession);

      if (event === "PASSWORD_RECOVERY" || detectRecoveryModeFromLocation()) {
        setResetRecoveryReady(true);
        setView("reset-password");
        return;
      }

      if (!nextSession) {
        setView("home");
        setSelected(null);
        setMenuOpen(false);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchArtistsData = async () => {
    const data = await sb("artists?select=*,demos(*)&order=sort_order.asc&is_published=eq.true");
    data.forEach(a => {
      if (a.demos) a.demos = sortDemos(a.demos);
    });
    return data;
  };

  const handleArtistProfileChange = nextProfile => {
    if (!nextProfile) {
      setArtistProfile(null);
      return;
    }

    const normalisedProfile = {
      ...nextProfile,
      demos: Array.isArray(nextProfile.demos) ? sortDemos(nextProfile.demos) : [],
    };

    setArtistProfile(normalisedProfile);
    setArtists(current =>
      current.map(artist =>
        artist.id === normalisedProfile.id
          ? {
              ...artist,
              ...normalisedProfile,
            }
          : artist,
      ),
    );
  };

  const handleLogin = async (email, password) => {
    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logAuthError("Login error:", error);
        return { data, error };
      }

      setSession(data.session);
      setView("home");
      return { data, error: null };
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async email => {
    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl(),
      });

      if (error) {
        logAuthError("Forgot password request failed:", error);
      }

      return { data, error };
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async password => {
    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({ password });

      if (error) {
        logAuthError("Password reset update failed:", error);
      }

      return { data, error };
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout handler: sign out and return the app to the landing page state.
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      logAuthError("Logout error:", error);
      return;
    }

    setSession(null);
    setArtistProfile(null);
    setArtistError("");
    setArtistLoading(false);
    setView("home");
    setSelected(null);
    setMenuOpen(false);
    setResetRecoveryReady(false);
    clearRecoveryParamsFromLocation();
  };

  const handleRequestAnotherReset = () => {
    clearRecoveryParamsFromLocation();
    setResetRecoveryReady(false);
    setAuthEmailPrefill(session?.user?.email || authEmailPrefill);
    setView("forgot-password");
  };

  const handleBackToLogin = async () => {
    clearRecoveryParamsFromLocation();
    setResetRecoveryReady(false);

    if (session) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logAuthError("Reset flow sign out failed:", error);
      }
    }

    setSession(null);
    setView("login");
  };

  useEffect(() => {
    let cancelled = false;

    const initArtists = async () => {
      try {
        const data = await fetchArtistsData();
        if (!cancelled) setArtists(shuffleArtists(data));
      } catch(e) {
        if (!cancelled) console.error("Failed to load artists:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initArtists();

    return () => {
      cancelled = true;
    };
  }, []);
  // Artist fetch: load the profile row that belongs to the logged-in artist.
  useEffect(() => {
    let cancelled = false;

    const loadArtistProfile = async () => {
      if (!session?.user?.id) {
        setArtistProfile(null);
        setArtistError("");
        setArtistLoading(false);
        return;
      }

      setArtistLoading(true);
      setArtistError("");

      const { data, error } = await supabase
        .from("artists")
        .select("*, demos(*)")
        .eq("owner_id", session.user.id)
        .single();

      if (cancelled) return;

      if (error) {
        if (error.code === "PGRST116") {
          setArtistProfile(null);
          setArtistError("");
        } else {
          console.error("Artist profile fetch error:", error.message);
          setArtistProfile(null);
          setArtistError("We couldn't load your artist profile right now.");
        }

        setArtistLoading(false);
        return;
      }

      setArtistProfile({
        ...data,
        demos: Array.isArray(data?.demos) ? sortDemos(data.demos) : [],
      });
      setArtistLoading(false);
    };

    loadArtistProfile();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);
  useEffect(() => {
    document.body.classList.toggle("body-lock", view==="home" && (menuOpen || Boolean(selected)));
    return () => document.body.classList.remove("body-lock");
  }, [menuOpen, selected, view]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = e => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 1024) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  const filtered = artists.filter(t => {
    const categories = Array.isArray(t.categories) ? t.categories : [];
    const gender = typeof t.gender === "string" ? t.gender.trim().toLowerCase() : "";
    const isGenderFilter = GENDER_FILTERS.has(filter);
    const mc = filter === "All"
      || (isGenderFilter
        ? gender === filter.toLowerCase() || categories.includes(filter)
        : categories.includes(filter));
    const ms = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });
  const scrollToSection = id => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const handleNavSelect = item => {
    setMenuOpen(false);
    if (item.type === "filter") {
      setFilter(item.value);
      setSearch("");
      scrollToSection("artists");
      return;
    }
    scrollToSection(item.value);
  };
  const handleViewSelect = nextView => {
    setView(nextView);
    setMenuOpen(false);
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Dashboard conditional rendering: authenticated users go straight to the dashboard.
  if (session && view !== "reset-password") {
    return (
      <Dashboard
        session={session}
        user={session?.user ?? null}
        artistProfile={artistProfile}
        artistLoading={artistLoading}
        artistError={artistError}
        onArtistProfileChange={handleArtistProfileChange}
        onLogout={handleLogout}
      />
    );
  }

  if (loading && view==="home") return (
    <div className="loading-screen">
      <div className="brand-mark brand-mark--large">Bris<span style={{color:accent}}>VO</span></div>
      <div className="loading-screen__label">Loading talent…</div>
      <div className="loading-screen__spinner" style={{borderTopColor: accent}}/>
    </div>
  );

  if (view==="login") {
    return (
      <ArtistLoginView
        onBack={()=>handleViewSelect("home")}
        onSwitch={()=>handleViewSelect("register")}
        onForgotPassword={email => {
          setAuthEmailPrefill(email);
          handleViewSelect("forgot-password");
        }}
        onLogin={handleLogin}
        loginPending={authLoading}
      />
    );
  }

  if (view==="forgot-password") {
    return (
      <ArtistForgotPasswordView
        onBack={() => handleViewSelect("login")}
        onSubmit={handleForgotPassword}
        pending={authLoading}
        initialEmail={authEmailPrefill}
      />
    );
  }

  if (view==="reset-password") {
    return (
      <ArtistResetPasswordView
        onBackToLogin={handleBackToLogin}
        onRequestNewLink={handleRequestAnotherReset}
        onSubmit={handleResetPassword}
        pending={authLoading}
        recoveryReady={resetRecoveryReady || Boolean(session)}
      />
    );
  }

  if (view==="register") {
    return (
      <ArtistRegisterView
        onBack={()=>handleViewSelect("home")}
        onSwitch={()=>handleViewSelect("login")}
      />
    );
  }

  return (
    <div className="app-shell">
      <nav className="site-nav">
        <div className="site-nav__bar">
          <div className="site-nav__left">
            <div className="brand-mark brand-mark--medium">Bris<span style={{color:accent}}>VO</span></div>
            <div className="site-nav__links">
              {NAV_ITEMS.map(item=>(
                <button type="button" key={item.label} className="nav-link" onClick={()=>handleNavSelect(item)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="site-nav__actions">
            <div className="site-nav__status">
              <div
                className="site-nav__status-dot"
                style={{
                  background: artists.length>0?"#00C48C":"#FFB400",
                  boxShadow: artists.length>0?"0 0 6px #00C48C":"0 0 6px #FFB400",
                }}
              />
              <span className="site-nav__status-text">{artists.length>0?`${artists.length} artists live`:"DB empty"}</span>
            </div>
            <button
              type="button"
              onClick={()=>handleViewSelect("login")}
              className="site-button site-button--ghost site-button--compact site-nav__login"
            >
              Artist Login
            </button>
            <button
              type="button"
              onClick={()=>handleViewSelect("register")}
              className="site-button site-button--primary site-button--compact"
              style={{ "--button-color": accent, "--button-shadow": `${accent}44` }}
            >
              Join BrisVO
            </button>
            <button
              type="button"
              className={`site-nav__toggle${menuOpen ? " is-open" : ""}`}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(open => !open)}
            >
              <span className="sr-only">{menuOpen ? "Close navigation menu" : "Open navigation menu"}</span>
              <span className="site-nav__toggle-line site-nav__toggle-line--top"/>
              <span className="site-nav__toggle-line site-nav__toggle-line--middle"/>
              <span className="site-nav__toggle-line site-nav__toggle-line--bottom"/>
            </button>
          </div>
        </div>
        <div id="mobile-navigation" className={`mobile-nav${menuOpen ? " is-open" : ""}`}>
          <div className="mobile-nav__inner">
            {NAV_ITEMS.map(item=>(
              <button type="button" key={item.label} className="nav-link mobile-nav__link" onClick={()=>handleNavSelect(item)}>
                {item.label}
              </button>
            ))}
            <div className="mobile-nav__meta">
              <div className="mobile-nav__status">
                <div
                  className="site-nav__status-dot"
                  style={{
                    background: artists.length>0?"#00C48C":"#FFB400",
                    boxShadow: artists.length>0?"0 0 6px #00C48C":"0 0 6px #FFB400",
                  }}
                />
                <span className="site-nav__status-text">{artists.length>0?`${artists.length} artists live`:"DB empty"}</span>
              </div>
              <button
                type="button"
                onClick={()=>handleViewSelect("login")}
                className="site-button site-button--ghost site-button--compact mobile-nav__login"
              >
                Artist Login
              </button>
              <button
                type="button"
                onClick={()=>handleViewSelect("register")}
                className="site-button site-button--primary site-button--compact"
                style={{ "--button-color": accent, "--button-shadow": `${accent}44` }}
              >
                Join BrisVO
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        {["#FF3D57","#7C3AED","#00C48C","#FF6B1A"].map((c,i)=>(
          <div
            key={i}
            className="hero-section__glow"
            style={{background:c,left:i===0?"3%":i===1?"68%":i===2?"38%":"15%",top:i===0?"-5%":i===1?"-15%":i===2?"35%":"55%"}}
          />
        ))}
        <div className="hero-section__content">
          <div className="section-eyebrow">Brisbane Voice Artists</div>
          <h1 className="hero-section__title">making waves</h1>
          <div className="hero-section__subtitle">since 1996</div>
          <p className="hero-section__copy">Queensland's premier collection of professional voice talent — commercial, corporate, character, and beyond.</p>
        </div>
      </section>

      <div className="filter-bar">
        <div className="filter-bar__inner">
          <div className="filter-bar__tabs">
            {CATS.map(c=>(
              <button
                type="button"
                key={c}
                onClick={()=>setFilter(c)}
                className={`filter-pill${filter===c ? " is-active" : ""}`}
                style={filter===c ? { "--pill-color": accent } : undefined}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search artists…"
            className="filter-search"
          />
        </div>
      </div>

      <section id="artists" className="artist-grid-section anchor-target">
        <div className="content-shell content-shell--wide">
          {artists.length===0?(
            <div className="empty-state">
              <div className="empty-state__icon">🎙</div>
              <div className="empty-state__title">No artists yet</div>
              <div className="empty-state__text">No published artists are available right now.</div>
            </div>
          ):(
            <div className="talent-grid">
              {filtered.map(t=>(
                <TalentCard key={t.id} talent={t} onClick={()=>setSelected(t)}/>
              ))}
            </div>
          )}
          {filtered.length===0&&artists.length>0&&(
            <div className="empty-state empty-state--compact">No artists found.</div>
          )}
        </div>
      </section>

      <section id="about" className="about-section anchor-target">
        <div className="about-section__hero">
          {["#FF3D57","#7C3AED"].map((c,i)=>(
            <div
              key={i}
              className="about-section__glow"
              style={{background:c,left:i===0?"-5%":"60%",top:i===0?"10%":"-20%"}}
            />
          ))}
          <div className="about-section__hero-inner content-shell">
            <div className="section-eyebrow">About BrisVO</div>
            <h2 className="about-section__title">The voices in your head<br/>are close to hand</h2>
          </div>
        </div>
        <div className="about-section__grid content-shell">
          <div>
            <div className="section-label" style={{color: accent}}>Who We Are</div>
            <p className="about-section__lede">BrisVO is not a company nor an agent, but a <strong style={{color:"#fff"}}>collective</strong> — a pool of reliable, accessible, independent voice-over talent of the highest calibre.</p>
            <p className="about-section__copy">The initiative was established in 1996 to highlight the best of Brisbane-based voice talent and become the go-to place to assist the people who hire us. We strive not only to foster excellence in our industry, but make finding, quoting and booking talent as simple as possible.</p>
            <p className="about-section__copy">As local, professional voice-over artists, we are very proud of what we do. Let us know how BrisVO can help you bring your ideas to life.</p>
          </div>
          <div>
            <div className="section-label" style={{color: accent}}>What We Offer</div>
            <p className="about-section__copy">All BrisVO talent can accept your brief, analyse your script, respond to direction and come up with the goods — without wasting valuable studio time, letting you get on with the job.</p>
            <p className="about-section__quote" style={{borderLeftColor: accent}}>"We'd love to speak for you, giving voice to your client's project in a professional manner that will leave both you &amp; your client delighted with the result."</p>
            <div className="about-section__offers">
              {OFFER_ITEMS.map(([icon,title,desc])=>(
                <div key={title} className="about-section__offer">
                  <span className="about-section__offer-icon">{icon}</span>
                  <div>
                    <div className="about-section__offer-title">{title}</div>
                    <div className="about-section__offer-text">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="about-section__cta">
          <div className="content-shell about-section__cta-inner">
            <p className="about-section__cta-copy">Ready to be heard? Join Queensland's finest voice collective.</p>
            <button
              type="button"
              onClick={()=>handleViewSelect("register")}
              className="site-button site-button--primary"
              style={{ "--button-color": accent, "--button-shadow": `${accent}44` }}
            >
              Join as an Artist
            </button>
          </div>
        </div>
      </section>

      <NewsletterSection/>

      <footer id="footer" className="site-footer anchor-target">
        <div className="site-footer__inner content-shell">
          <div className="brand-mark brand-mark--small">Bris<span style={{color:accent}}>VO</span></div>
          <div className="site-footer__links">
            {FOOTER_LINKS.map(label=>(
              <span key={label} className="footer-link">{label}</span>
            ))}
          </div>
          <p className="site-footer__copy">©2025 BrisVO. All rights reserved.</p>
        </div>
      </footer>

      {selected&&<TalentModal talent={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}
