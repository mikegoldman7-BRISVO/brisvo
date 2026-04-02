import { useState, useRef, useEffect } from "react";
import "./App.css";

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

// ── SEED DATA — used to populate Supabase if empty ────────────
const PROXY = "https://corsproxy.io/?";
const BASE = "https://www.brisvo.com/wp-content/uploads";
const p = url => `${PROXY}${encodeURIComponent(url)}`;

const PALETTE = [
  "#FF3D57","#FF6B1A","#FFB400","#00C48C","#00B4D8",
  "#7C3AED","#F72585","#06D6A0","#FF4D6D","#4361EE",
  "#FB5607","#3A86FF","#8338EC","#FF006E","#00B4D8",
  "#06D6A0","#FF3D57","#FFB400","#7C3AED","#F72585",
  "#4CC9F0","#FF6B1A","#00C48C","#3A86FF","#FF4D6D",
  "#8338EC","#FB5607","#FF006E","#4361EE","#06D6A0","#FF3D57",
];

const SEED_ARTISTS = [
  { name:"Thomas Murray",   slug:"thomas-murray",   gender:"Male",   brand_color:"#FF3D57", categories:["Male","Corporate","Commercial"], photo_url:p(`${BASE}/2021/08/Tom-Murray-1-B_W.jpg`), bio:"Award-winning sound producer and voiceover artist with over 15 years industry experience. Tom has worked for The Australian Radio Network, 4BC, and Nova Entertainment. Co-hosted the Sunday morning breakfast show on Nova 106.9.", sort_order:1 },
  { name:"Jackie Bowker",   slug:"jackie-bowker",   gender:"Female", brand_color:"#FF6B1A", categories:["Female","Commercial","Corporate","Character"], photo_url:p(`${BASE}/2025/04/Jackie-Bowker%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Think of her voice as your Swiss Army knife — versatile enough to tackle any style. Clients include Rio Tinto, Bonds Australia, Volkswagen, ANZ Bank, Cancer Council, Medibank, Spotify and The Australian Open.", sort_order:2 },
  { name:"Fotene Maroulis", slug:"fotene-maroulis", gender:"Female", brand_color:"#FFB400", categories:["Female","Corporate","E-Learning","Commercial"], photo_url:p(`${BASE}/2022/07/Fontene-Maroulis-BrisVO-Voice-Artist-768x1143.jpg`), bio:"Originally from New Zealand, Fotene's love of music and performance contributes to the warmth in her natural speaking tone. Campaigns include Michael Hill, The Iconic, Bisolvon, Otrivin and Sun Super.", sort_order:3 },
  { name:"Liz Buchanan",    slug:"liz-buchanan",    gender:"Female", brand_color:"#00C48C", categories:["Female","Commercial","Audiobook","E-Learning"], photo_url:p(`${BASE}/2021/08/Liz-Buchannan-BW.jpg`), bio:"Theatre and TV actor and trained singer with over a decade of VO work. Clients include Lite n' Easy, Suncorp, Goodstart Early Learning, NRMA and Triple P Online. Also the voice of an alien telepath in 'Space Chickens in Space'.", sort_order:4 },
  { name:"Hugh Parker",     slug:"hugh-parker",     gender:"Male",   brand_color:"#00B4D8", categories:["Male","Character","Commercial","Corporate"], photo_url:p(`${BASE}/2021/08/Hugh-Parker_.jpg`), bio:"Actor, writer and teacher with an acute ear for the most engaging delivery. London recording studios were his second home. He excels at straight, comedic, tone-filled and humble voice work.", sort_order:5 },
  { name:"Robert Coleby",   slug:"robert-coleby",   gender:"Male",   brand_color:"#7C3AED", categories:["Male","Corporate","Commercial","Character"], photo_url:p(`${BASE}/2021/08/Robert-Colby-B_w.jpg`), bio:"London-trained actor with over 83 film and TV productions and 45 plays. Voice of Darwin in QTC's 'The Wider Earth' and a series regular in 'The Queen of Oz' for the BBC.", sort_order:6 },
  { name:"Chris Crickmay",  slug:"chris-crickmay",  gender:"Male",   brand_color:"#F72585", categories:["Male","Character","Commercial","E-Learning","Corporate"], photo_url:p(`${BASE}/2022/07/Chris-Crickmay-BrisVO-B_W-768x1143.jpg`), bio:"Award-winning Australian voice talent. Clients include ANZ, Commonwealth Bank, Subaru, Toyota, BP, Dan Murphy's, KFC, Mazda, BMW, Triple J and the Gold Coast Suns.", sort_order:7 },
  { name:"Walter Williams", slug:"walter-williams", gender:"Male",   brand_color:"#06D6A0", categories:["Male","Corporate","Commercial","Audiobook","Character","Retail"], photo_url:p(`${BASE}/2023/10/Walter-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-B_W-768x1143.jpg`), bio:"'The Voice' people rely on. Walt has narrated nine seasons of 'Industry Leaders' on Foxtel. Clients include BHP, Cadbury, Jack Daniels, Jaguar, LG, McDonald's McCafe, Mercedes Benz, Rio Tinto, Westpac and Yamaha.", sort_order:8 },
  { name:"Andrea Moor",     slug:"andrea-moor",     gender:"Female", brand_color:"#FF4D6D", categories:["Female","Corporate","Commercial","Character"], photo_url:p(`${BASE}/2021/08/Andrea-Moor-Brisvo-Website-Hero-Head-shots-768x1143.jpg`), bio:"Known for her sophisticated voice of reason, perfect for luxury real estate and financial products. National profile as a stage and screen actor with a warm, sensual honeyed voice.", sort_order:9 },
  { name:"Nelle Lee",       slug:"nelle-lee",       gender:"Female", brand_color:"#4361EE", categories:["Female","Commercial","Character","Jingle"], photo_url:p(`${BASE}/2021/08/Nelle-Lee-%E2%80%A2-Brisvo-Website-Hero-Head-shots-768x1143.jpg`), bio:"Energetic, youthful vocal quality with extensive theatre and film history. Natural comic timing and a bright vibrant feel. Clients include Telstra, Griffith, Subway and Oz Lotto.", sort_order:10 },
  { name:"Brie Jurss",      slug:"brie-jurss",      gender:"Female", brand_color:"#FB5607", categories:["Female","Commercial","E-Learning","Corporate","Retail"], photo_url:p(`${BASE}/2022/09/Brie-Jurss-Brisvo-Website-Hero-Head-shots-1-768x1143.jpg`), bio:"Bright, natural tone bursting with energy and kindness. Relatable yet trustworthy. Clients include Flight Centre, Suncorp Group, The Lott and University of Sunshine Coast.", sort_order:11 },
  { name:"Michael Goldman", slug:"michael-goldman", gender:"Male",   brand_color:"#3A86FF", categories:["Male","Commercial","Corporate","Character"], photo_url:p(`${BASE}/2021/08/Mike-Goldman-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"One of the founders of BrisVO. Voice artist since the 1990s, learning the ropes from his father Grant Goldman. Now used by some of the biggest brands in the world for his instinctual ability to follow direction and interpret a script.", sort_order:12 },
  { name:"Thomas Larkin",   slug:"thomas-larkin",   gender:"Male",   brand_color:"#8338EC", categories:["Male","Audiobook","Character","Corporate","Commercial"], photo_url:p(`${BASE}/2021/08/Thomas-Larkin-B_W.jpg`), bio:"VCA graduate. Screen credits include Baz Luhrmann's Elvis (2022) and animated feature Combat Wombat opposite Deborah Mailman. Recipient of the Brisbane City Council Lord Mayor's Young and Emerging Artists Fellowship.", sort_order:13 },
  { name:"Megan Shapcott",  slug:"megan-shapcott",  gender:"Female", brand_color:"#FF006E", categories:["Female","E-Learning","Corporate","Commercial"], photo_url:p(`${BASE}/2021/08/Megan-Shapcott-1.jpg`), bio:"Clear, articulate and approachable — a go-to for e-learning, corporate narration and commercial work throughout Australia.", sort_order:14 },
  { name:"Leon Murray",     slug:"leon-murray",     gender:"Male",   brand_color:"#00B4D8", categories:["Male","Corporate","Commercial","Retail","IVR & On Hold"], photo_url:p(`${BASE}/2021/08/Leon-Murray-BrisVO-Artist.jpg`), bio:"'Voice of Big Brother' on Network TEN (2008) and Nine Network (2012–2014). Clients include BMW, McDonald's, Suncorp, Hewlett Packard, Crown, Watpac and Expedia.", sort_order:15 },
  { name:"Ashlee Lollback", slug:"ashlee-lollback", gender:"Female", brand_color:"#06D6A0", categories:["Female","Commercial","Retail","Corporate"], photo_url:p(`${BASE}/2025/04/Ashlee-Lollback-2-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Fresh, contemporary sound for retail and commercial productions. Natural warmth and approachable energy that clients love.", sort_order:16 },
  { name:"Digby Gillings",  slug:"digby-gillings",  gender:"Male",   brand_color:"#FF3D57", categories:["Male","Commercial","Character","Corporate"], photo_url:p(`${BASE}/2021/08/Digby-Gilling.jpg`), bio:"Old head on young shoulders — a genuine radio veteran with a natural gift for storytelling.", sort_order:17 },
  { name:"Paul Davies",     slug:"paul-davies",     gender:"Male",   brand_color:"#FFB400", categories:["Male","Corporate","IVR & On Hold","Commercial"], photo_url:p(`${BASE}/2022/11/Paul-Davies%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Polished, professional reads every time. Warm authority trusted for corporate messaging, IVR and radio campaigns throughout Australia.", sort_order:18 },
  { name:"Ross Newth",      slug:"ross-newth",      gender:"Male",   brand_color:"#7C3AED", categories:["Male","Commercial","Corporate"], photo_url:p(`${BASE}/2025/05/Ross-Newth-%E2%80%A2-Brisvo-Website-Hero-Head-shots-768x1143.jpg`), bio:"Fresh, modern sound for commercial and corporate productions. Versatile, reliable and always on brief.", sort_order:19 },
  { name:"Steven Grives",   slug:"steven-grives",   gender:"Male",   brand_color:"#F72585", categories:["Male","Corporate","Audiobook","Commercial"], photo_url:p(`${BASE}/2021/08/Steven-Grives-1-B_W.jpg`), bio:"Accomplished actor and voice artist whose screen and stage experience informs every recording.", sort_order:20 },
  { name:"LJ Stockwell",    slug:"lj-stockwell",    gender:"Female", brand_color:"#4CC9F0", categories:["Female","Commercial","E-Learning","Corporate"], photo_url:p(`${BASE}/2023/06/LJ-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Friendly, approachable tone that has made her a favourite for e-learning and consumer-facing campaigns.", sort_order:21 },
  { name:"Emily Dickson",   slug:"emily-dickson",   gender:"Female", brand_color:"#FF6B1A", categories:["Female","Commercial","Retail","E-Learning"], photo_url:p(`${BASE}/2022/07/Emily-Dickson-BrisVO-Voice-Artist-B_W-768x1143.jpg`), bio:"Bright, engaging voice perfect for retail, commercial and lifestyle productions.", sort_order:22 },
  { name:"Jennifer Mary",   slug:"jennifer-mary",   gender:"Female", brand_color:"#00C48C", categories:["Female","Corporate","IVR & On Hold","Commercial"], photo_url:p(`${BASE}/2021/08/Jennifer-Mary-1-B_W.jpg`), bio:"Warm professionalism shining through in every corporate and IVR recording.", sort_order:23 },
  { name:"Helen Cassidy",   slug:"helen-cassidy",   gender:"Female", brand_color:"#3A86FF", categories:["Female","Audiobook","Corporate","Commercial"], photo_url:p(`${BASE}/2025/04/Helen-Cassidy-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Elegance and depth in audiobook narration and premium corporate productions.", sort_order:24 },
  { name:"Todd MacDonald",  slug:"todd-macdonald",  gender:"Male",   brand_color:"#8338EC", categories:["Male","Commercial","Character","Corporate"], photo_url:p(`${BASE}/2023/11/Todd-Macdonald%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Distinctive voice with natural authority equally effective for comedy and drama.", sort_order:25 },
  { name:"Todd Levi",       slug:"todd-levi",       gender:"Male",   brand_color:"#FB5607", categories:["Male","Corporate","Commercial","IVR & On Hold"], photo_url:p(`${BASE}/2023/01/TODD-LEVI-1%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Confidence and clarity in every read. Equally comfortable in the boardroom or the booth.", sort_order:26 },
  { name:"Marcus Oborn",    slug:"marcus-oborn",    gender:"Male",   brand_color:"#FF006E", categories:["Male","Commercial","Jingle","Corporate"], photo_url:p(`${BASE}/2025/04/Marcus-Oborn-%E2%80%A2-Brisvo-Website-Hero-Head-shots-768x1143.jpg`), bio:"Warm, energetic delivery that makes him a standout for commercial and jingle work.", sort_order:27 },
  { name:"Teresa Lim",      slug:"teresa-lim",      gender:"Female", brand_color:"#4361EE", categories:["Female","Corporate","E-Learning","Commercial"], photo_url:p(`${BASE}/2021/08/Teresa-Lim-1-B_W.jpg`), bio:"Clear, composed delivery perfect for multilingual corporate and e-learning content.", sort_order:28 },
  { name:"Damien Garvey",   slug:"damien-garvey",   gender:"Male",   brand_color:"#06D6A0", categories:["Male","Character","Audiobook","Corporate"], photo_url:p(`${BASE}/2022/03/Damien-Garvey-BrisVO-Voice-Actor-B_W-768x1143.jpg`), bio:"Respected actor and voice artist spanning drama, comedy and documentary with equal distinction.", sort_order:29 },
  { name:"Mikee Joaquin",   slug:"mikee-joaquin",   gender:"Male",   brand_color:"#FF3D57", categories:["Male","Character","E-Learning","Commercial"], photo_url:p(`${BASE}/2021/08/Mikee-Joaquin-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Loads of creative flair. His unique, quirky style landed him work for Crayola, Colgate-Palmolive — and the role of Dipsy, the green Teletubby.", sort_order:30 },
  { name:"Tony Bellette",   slug:"tony-bellette",   gender:"Male",   brand_color:"#FFB400", categories:["Male","Corporate","Commercial","IVR & On Hold"], photo_url:p(`${BASE}/2021/08/Tony-Billette-1-B_W.jpg`), bio:"Commanding voice trusted by major brands for decades of corporate and commercial work.", sort_order:31 },
];

const SEED_DEMOS = {
  "thomas-murray":   [{name:"Current Demo Reel 2025",file_url:`${BASE}/2025/11/Thomas-Murray-Prod-Reel-2025.mp3`,sort_order:0},{name:"VO Reel 2023",file_url:`${BASE}/2023/05/TOM-MURRAY-2023-VO-REEL.mp3`,sort_order:1}],
  "jackie-bowker":   [{name:"Compilation Reel",file_url:`${BASE}/2025/04/Jackie-Bowker-VO-Demo-Compilation-V2-with-music.mp3`,sort_order:0},{name:"Commercial Reel",file_url:`${BASE}/2025/04/Jackie-Bowker-VO-Demo-Commercial-music.mp3`,sort_order:1},{name:"Corporate Reel",file_url:`${BASE}/2025/04/Jackie-Bowker-CorporateReel.Music_.NoSlate.mp3`,sort_order:2}],
  "fotene-maroulis": [{name:"Voice Reel",file_url:`${BASE}/2022/07/01-FoteneMaroulis_VO_Demo_2min.mp3`,sort_order:0}],
  "liz-buchanan":    [{name:"Voice Over Demos",file_url:`${BASE}/2021/08/Liz-Buchanan-KAMvoices-1.mp3`,sort_order:0},{name:"Narration & E-Learning",file_url:`${BASE}/2021/08/Liz-Buchanan-KAMvoices-Narration-1.mp3`,sort_order:1},{name:"US Accent",file_url:`${BASE}/2021/08/Amway-edit-fade-up-1.wav`,sort_order:2}],
  "hugh-parker":     [{name:"Compilation",file_url:`${BASE}/2021/08/HughCompilationV3.mp3`,sort_order:0}],
  "robert-coleby":   [{name:"Voice Demo",file_url:`${BASE}/2021/08/Robert-Coleby-Voice-Demo.mp3`,sort_order:0}],
  "chris-crickmay":  [{name:"Sample Montage",file_url:`${BASE}/2024/02/Chris-Crickmay-JAN-sample-montage.mp3`,sort_order:0},{name:"TV & Radio Reel",file_url:`${BASE}/2022/07/CRICKERS-TV-RADIO-READS.mp3`,sort_order:1},{name:"Characters & Accents",file_url:`${BASE}/2022/07/Chris-Crickmay-CHARACTERS-ACCENTS-AND-ANIMATION_02.mp3`,sort_order:2},{name:"E-Learning & Corporate",file_url:`${BASE}/2022/07/Chris-Crickmay-ELEARNING-AND-CORPORATE-NARRATION.mp3`,sort_order:3},{name:"Intimate Reads",file_url:`${BASE}/2022/07/Chris-Crickmay-INTIMATE-READS.mp3`,sort_order:4}],
  "walter-williams": [{name:"Commercial Demo",file_url:`${BASE}/2021/08/Walts-Commercial-Demo-2020.mp3`,sort_order:0},{name:"Natural Demo",file_url:`${BASE}/2021/08/Walts-Natural-Demo-2020.mp3`,sort_order:1},{name:"Corporate Demo",file_url:`${BASE}/2021/08/Walts-Corporate-Demo.mp3`,sort_order:2},{name:"Retail Demo",file_url:`${BASE}/2021/08/Walts-Retail-Demo.mp3`,sort_order:3},{name:"Animation Demo",file_url:`${BASE}/2021/08/Walts-Animation-Demo-2019.mp3`,sort_order:4},{name:"Narration Demo",file_url:`${BASE}/2021/08/Walts-Narration-Demo-2020.mp3`,sort_order:5}],
  "andrea-moor":     [{name:"Voice Demo",file_url:`${BASE}/2023/11/Andrea-Moor-Voice-Demo-17112023-10.58-am.mp3`,sort_order:0}],
  "nelle-lee":       [{name:"Voice Over Demo",file_url:`${BASE}/2021/08/NelleLee-A1Compilation.mp3`,sort_order:0}],
  "brie-jurss":      [{name:"Demo Reel",file_url:`${BASE}/2021/08/Demo-Reel-Brie-Jurss-1.mp3`,sort_order:0}],
  "michael-goldman": [{name:"VO Demo 2021",file_url:`${BASE}/2021/10/Mike-Goldmans-Demo-2021.mp3`,sort_order:0},{name:"TV Promos 2023",file_url:`${BASE}/2023/03/Mike-Goldman-TV-Promos-2023.mp3`,sort_order:1},{name:"Character Reel",file_url:`${BASE}/2021/08/2020Character.mp3`,sort_order:2},{name:"American Demo",file_url:`${BASE}/2021/08/American-VO-Demo.mp3`,sort_order:3},{name:"English Demo",file_url:`${BASE}/2022/09/EnglishGold.mp3`,sort_order:4},{name:"Video Game Demo",file_url:`${BASE}/2022/09/videogamedemo.mp3`,sort_order:5}],
  "thomas-larkin":   [{name:"Compilation Reel 2023",file_url:`${BASE}/2023/05/230505_LARKIN_THOMAS_COMPILATION-DEMO_2023_Master-REV-2.mp3`,sort_order:0},{name:"Documentary Demo",file_url:`${BASE}/2021/08/LARKIN-THOMAS-Documentary-Demo-MASTER2.mp3`,sort_order:1},{name:"Animation Demo 2023",file_url:`${BASE}/2023/05/Thomas-Larkin-Animation-Reel-2023_Master_3.0.mp3`,sort_order:2},{name:"Gaming Demo",file_url:`${BASE}/2021/08/LARKIN-THOMAS-GAMING-DEMO.mp3`,sort_order:3},{name:"Audio Book Demo",file_url:`${BASE}/2023/05/230505_Thomas-Larkin-Audiobook-Reel-2023_Master.mp3`,sort_order:4},{name:"Promo Reel 2023",file_url:`${BASE}/2023/05/230505_Thomas-Larkin-Promo-Reel-2023_Master.mp3`,sort_order:5}],
  "leon-murray":     [{name:"Compile Demo 2024",file_url:`${BASE}/2024/10/Leon-2024-Compile-Demo.mp3`,sort_order:0},{name:"Corporate & On Hold 2024",file_url:`${BASE}/2024/10/Leon-2024-Corporate-Demo.mp3`,sort_order:1},{name:"Retail & Promo",file_url:`${BASE}/2021/08/Leon-Murray-RETAIL-Demo-2018.mp3`,sort_order:2},{name:"Government",file_url:`${BASE}/2021/08/Leon-Murray-GOVT-Demo-2018.mp3`,sort_order:3},{name:"New Zealand Demo",file_url:`${BASE}/2021/12/Leon-Murray-BRISVO-NZ-MVO-REEL-MP3.mp3`,sort_order:4},{name:"Brand Positioning",file_url:`${BASE}/2022/09/Leon-Murray-Brand-Positioning-Demo-BRISVO.mp3`,sort_order:5}],
};

const CATS = ["All","Corporate","Commercial","Character","Audiobook","E-Learning","Female","Male","IVR & On Hold","Jingle","Retail"];
const accent = "#FF3D57";
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

function AuthScene({ eyebrow, title, copy, panelTitle, panelCopy, onBack, children }) {
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
                Back to Home
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

function ArtistLoginView({ onBack, onSwitch }) {
  const [form, setForm] = useState({ email:"", password:"" });
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
    const email = form.email.trim();

    if (!email) nextErrors.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) nextErrors.email = "Enter a valid email address.";

    if (!form.password) nextErrors.password = "Password is required.";
    else if (form.password.length < MIN_PASSWORD_LENGTH) nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    console.log("Mock artist login submitted", { email });
    setStatus("This sign-in is a frontend preview only. Your details were not sent anywhere.");
  };

  return (
    <AuthScene
      eyebrow="Artist Login"
      title="Welcome back to the BrisVO collective."
      copy="Sign in to access your artist-side space. The same straightforward BrisVO approach applies here too: professional, local, and easy to work with."
      panelTitle="Artist Sign-In"
      panelCopy="Use your email and password to enter the BrisVO artist area."
      onBack={onBack}
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
            onClick={() => {}}
            className="cursor-pointer bg-transparent p-0 text-white/54 transition hover:text-[#ff93a4]"
          >
            Forgot password?
          </button>
          <span className="text-white/35">Artist access</span>
        </div>

        <button
          type="submit"
          className="site-button site-button--primary site-button--full"
          style={{ "--button-color": accent, "--button-shadow": `${accent}44` }}
        >
          Sign In
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

    console.log("Mock artist registration submitted", { fullName, email });
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
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState("home");

  const fetchArtistsData = async () => {
    const data = await sb("artists?select=*,demos(*)&order=sort_order.asc&is_published=eq.true");
    data.forEach(a => { if(a.demos) a.demos.sort((x,y)=>x.sort_order-y.sort_order); });
    return data;
  };

  const loadArtists = async () => {
    try {
      const data = await fetchArtistsData();
      setArtists(data);
    } catch(e) {
      console.error("Failed to load artists:", e);
    }
    setLoading(false);
  };

  // Seed database with all 31 artists
  const seedDatabase = async () => {
    setSeeding(true); setSeedMsg("Testing Supabase connection…");
    try {
      // Step 1: Test connection
      setSeedMsg("Step 1: Testing connection to Supabase…");
      const testRes = await fetch(`${SUPABASE_URL}/rest/v1/artists?limit=1`, {
        headers: {
          "apikey": SUPABASE_ANON,
          "Authorization": `Bearer ${SUPABASE_ANON}`,
        }
      });
      setSeedMsg(`Step 1 result: HTTP ${testRes.status} ${testRes.statusText}`);
      if (!testRes.ok) {
        const errText = await testRes.text();
        setSeedMsg(`❌ Connection failed: ${testRes.status} — ${errText}`);
        setSeeding(false);
        return;
      }

      // Step 2: Try inserting first artist only
      setSeedMsg("Step 2: Inserting Thomas Murray as test…");
      const firstArtist = SEED_ARTISTS[0];
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/artists`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON,
          "Authorization": `Bearer ${SUPABASE_ANON}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify({...firstArtist, is_published: true}),
      });
      const insertText = await insertRes.text();
      setSeedMsg(`Step 2 result: HTTP ${insertRes.status} — ${insertText.slice(0,200)}`);

      if (!insertRes.ok) {
        setSeeding(false);
        return;
      }

      // Step 3: Full seed
      setSeedMsg("Step 2 worked! Running full seed…");
      const [inserted] = JSON.parse(insertText);
      const demos = SEED_DEMOS[firstArtist.slug] || [];
      for (const d of demos) {
        await fetch(`${SUPABASE_URL}/rest/v1/demos`, {
          method: "POST",
          headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
          body: JSON.stringify({...d, artist_id: inserted.id}),
        });
      }

      for (let i = 1; i < SEED_ARTISTS.length; i++) {
        const a = SEED_ARTISTS[i];
        setSeedMsg(`Adding ${a.name} (${i+1}/${SEED_ARTISTS.length})…`);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/artists`, {
          method: "POST",
          headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}`, "Content-Type": "application/json", "Prefer": "return=representation" },
          body: JSON.stringify({...a, is_published: true}),
        });
        if (res.ok) {
          const [art] = await res.json();
          const artistDemos = SEED_DEMOS[a.slug] || [];
          for (const d of artistDemos) {
            await fetch(`${SUPABASE_URL}/rest/v1/demos`, {
              method: "POST",
              headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
              body: JSON.stringify({...d, artist_id: art.id}),
            });
          }
        }
      }
      setSeedMsg("✅ All 31 artists loaded into Supabase!");
      await loadArtists();
    } catch(e) {
      setSeedMsg(`❌ Exception: ${e.message} — ${e.stack?.slice(0,200)}`);
    }
    setSeeding(false);
  };

  useEffect(() => {
    let cancelled = false;

    const initArtists = async () => {
      try {
        const data = await fetchArtistsData();
        if (!cancelled) setArtists(data);
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
    const mc = filter==="All"||(t.categories||[]).includes(filter);
    const ms = !search||t.name.toLowerCase().includes(search.toLowerCase());
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

      {artists.length===0&&!seeding&&(
        <div className="status-banner status-banner--warning">
          <div className="status-banner__content">
            <div className="status-banner__title status-banner__title--warning">⚡ Database is empty</div>
            <div className="status-banner__text">Click to seed all 31 BrisVO artists into Supabase</div>
          </div>
          <button type="button" onClick={seedDatabase} className="site-button site-button--gold">
            Seed 31 Artists →
          </button>
        </div>
      )}
      {seeding&&(
        <div className="status-banner status-banner--success">
          <div className="status-banner__spinner"/>
          <div className="status-banner__title status-banner__title--success">{seedMsg}</div>
        </div>
      )}
      {!seeding&&seedMsg&&artists.length>0&&(
        <div className="status-banner status-banner--success">
          <div className="status-banner__title status-banner__title--success">{seedMsg}</div>
        </div>
      )}

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
          {artists.length===0&&!seeding?(
            <div className="empty-state">
              <div className="empty-state__icon">🎙</div>
              <div className="empty-state__title">No artists yet</div>
              <div className="empty-state__text">Use the "Seed 31 Artists" button above to populate from BrisVO</div>
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
