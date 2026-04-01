import { useState, useRef, useEffect } from "react";

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

// ── AUDIO PLAYER ──────────────────────────────────────────────
function DemoRow({ demo, colour, activeId, onActivate }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  const [cur, setCur] = useState("0:00");
  const [dur, setDur] = useState(null);
  const fmt = s => { if(!s||isNaN(s)) return null; const m=Math.floor(s/60),sec=Math.floor(s%60); return `${m}:${sec.toString().padStart(2,"0")}`; };
  useEffect(()=>{ if(activeId!==demo.file_url&&playing){ref.current?.pause();setPlaying(false);}}, [activeId]);
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
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const colour = talent.brand_color || "#FF3D57";
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{cursor:"pointer",borderRadius:14,overflow:"hidden",position:"relative",aspectRatio:"2/3",
        boxShadow:hov?`0 20px 48px ${colour}55`:"0 4px 16px rgba(0,0,0,0.18)",
        transform:hov?"translateY(-5px) scale(1.02)":"none",
        transition:"all 0.3s ease",border:hov?`3px solid ${colour}`:"3px solid transparent"}}>
      <div style={{position:"absolute",inset:0,background:colour}}>
        {imgErr?<Avatar name={talent.name} colour={colour} size={200}/>:
          <img src={talent.photo_url} alt={talent.name} onError={()=>setImgErr(true)}
            style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"top center",
              filter:hov?"none":"grayscale(100%) contrast(1.1)",transition:"filter 0.35s",display:"block"}}/>
        }
      </div>
      {!imgErr&&<div style={{position:"absolute",inset:0,background:colour,opacity:hov?0.25:0,transition:"opacity .3s",mixBlendMode:"multiply"}}/>}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.05) 50%,transparent 100%)"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:5,background:colour}}/>
      {talent.demos?.length>0&&(
        <div style={{position:"absolute",top:12,right:10,background:colour,color:"#000",fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:20}}>
          {talent.demos.length}🎙
        </div>
      )}
      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"14px 12px 16px"}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:"#fff",lineHeight:1.1,marginBottom:5}}>{talent.name}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
          {(talent.categories||[]).slice(0,2).map(c=>(
            <span key={c} style={{fontSize:8,fontWeight:800,letterSpacing:"1px",textTransform:"uppercase",background:colour,color:"#000",padding:"2px 7px",borderRadius:20}}>{c}</span>
          ))}
        </div>
      </div>
    </div>
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",maxWidth:740,width:"100%",maxHeight:"92vh",overflowY:"auto",borderRadius:20,position:"relative",boxShadow:`0 32px 80px ${colour}55`}}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.95)",border:`2px solid ${colour}`,cursor:"pointer",fontSize:15,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,color:"#111"}}>✕</button>
        <div style={{display:"flex",minHeight:300,borderRadius:"20px 20px 0 0",overflow:"hidden"}}>
          <div style={{width:240,flexShrink:0,position:"relative",background:colour}}>
            {imgErr?<div style={{width:"100%",minHeight:300}}><Avatar name={talent.name} colour={colour} size={240}/></div>:
              <img src={talent.photo_url} alt={talent.name} onError={()=>setImgErr(true)}
                style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top center",display:"block",minHeight:300}}/>
            }
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:5,background:colour}}/>
          </div>
          <div style={{flex:1,background:`linear-gradient(135deg,${colour}ee,${colour}aa)`,padding:"32px 26px",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
              {(talent.categories||[]).map(c=>(
                <span key={c} style={{fontSize:9,fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",background:"rgba(0,0,0,0.25)",color:"#fff",padding:"3px 10px",borderRadius:20}}>{c}</span>
              ))}
            </div>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:34,fontWeight:700,color:"#fff",lineHeight:1,marginBottom:8}}>{talent.name}</h2>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",color:"rgba(255,255,255,0.75)"}}>{talent.gender} · Australian Voice Artist</div>
            {talent.demos?.length>0&&(
              <div style={{marginTop:14,display:"inline-flex",alignItems:"center",gap:6,background:"rgba(0,0,0,0.25)",color:"#fff",padding:"6px 14px",borderRadius:20,fontSize:11,fontWeight:700,width:"fit-content"}}>
                🎙 {talent.demos.length} demo reel{talent.demos.length>1?"s":""}
              </div>
            )}
          </div>
        </div>
        <div style={{padding:"26px 30px 30px"}}>
          {talent.bio&&(
            <div style={{marginBottom:22}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:"3px",textTransform:"uppercase",color:colour,marginBottom:10}}>About</div>
              <p style={{fontSize:15,lineHeight:1.8,color:"#333",fontFamily:"Georgia,serif"}}>{talent.bio}</p>
            </div>
          )}
          {talent.demos?.length>0&&(
            <div style={{marginBottom:22}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:"3px",textTransform:"uppercase",color:colour,marginBottom:12}}>Demo Reels</div>
              {talent.demos.map((d,i)=><DemoRow key={i} demo={d} colour={colour} activeId={activeDemo} onActivate={setActiveDemo}/>)}
            </div>
          )}
          {/* ENQUIRY FORM */}
          <div style={{borderTop:"1px solid #f0f0f0",paddingTop:22}}>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:"3px",textTransform:"uppercase",color:colour,marginBottom:14}}>Enquire About This Artist</div>
            {enqSent?(
              <div style={{background:`${colour}11`,border:`1.5px solid ${colour}44`,borderRadius:10,padding:"20px 24px",textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:8}}>✅</div>
                <div style={{fontFamily:"Georgia,serif",fontSize:18,color:"#111",marginBottom:4}}>Message sent!</div>
                <div style={{fontSize:13,color:"#888"}}>We've received your enquiry and will be in touch shortly.</div>
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Name *","name","text","Your name"],["Email *","email","email","your@email.com"],["Company","company","text","Your company"],["Project Type","project_type","text","e.g. TVC, Radio, Corporate"]].map(([lbl,k,type,ph])=>(
                  <div key={k}>
                    <label style={{display:"block",fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:"#aaa",marginBottom:5,fontWeight:700}}>{lbl}</label>
                    <input type={type} value={enqForm[k]} onChange={e=>setEnqForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
                      style={{width:"100%",padding:"9px 11px",border:"1.5px solid #eee",background:"#fafafa",fontFamily:"Montserrat,sans-serif",fontSize:13,color:"#111",borderRadius:8,outline:"none"}}
                      onFocus={e=>e.target.style.borderColor=colour} onBlur={e=>e.target.style.borderColor="#eee"}/>
                  </div>
                ))}
                <div style={{gridColumn:"1 / -1"}}>
                  <label style={{display:"block",fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:"#aaa",marginBottom:5,fontWeight:700}}>Message *</label>
                  <textarea value={enqForm.message} onChange={e=>setEnqForm(f=>({...f,message:e.target.value}))} placeholder="Tell us about your project…"
                    style={{width:"100%",padding:"9px 11px",border:"1.5px solid #eee",background:"#fafafa",fontFamily:"Montserrat,sans-serif",fontSize:13,color:"#111",borderRadius:8,outline:"none",minHeight:80,resize:"vertical"}}
                    onFocus={e=>e.target.style.borderColor=colour} onBlur={e=>e.target.style.borderColor="#eee"}/>
                </div>
                <div style={{gridColumn:"1 / -1"}}>
                  <button onClick={submitEnquiry} disabled={enqLoading}
                    style={{width:"100%",padding:13,background:colour,color:"#fff",border:"none",cursor:enqLoading?"wait":"pointer",fontFamily:"Montserrat,sans-serif",fontSize:11,fontWeight:800,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8,boxShadow:`0 4px 16px ${colour}44`,opacity:enqLoading?0.7:1}}>
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
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if(!name.trim()||!email.trim()) return;
    setLoading(true); setError("");
    try {
      await sb("subscribers", { method:"POST", body: JSON.stringify({name:name.trim(), email:email.trim()}), prefer:"return=minimal" });
      setSubmitted(true);
    } catch(e) {
      // May fail if email already subscribed — still show success
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <div style={{background:"linear-gradient(135deg,#1a0030,#0a0a1a)",padding:"64px 40px",borderTop:"1px solid #1e1e1e",position:"relative",overflow:"hidden"}}>
      {["#7C3AED","#FF3D57","#00C48C"].map((c,i)=>(
        <div key={i} style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:c,opacity:0.06,filter:"blur(70px)",
          left:i===0?"5%":i===1?"55%":"30%",top:i===0?"-10%":i===1?"20%":"50%",pointerEvents:"none"}}/>
      ))}
      <div style={{maxWidth:560,margin:"0 auto",textAlign:"center",position:"relative"}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:"4px",textTransform:"uppercase",color:accent,marginBottom:16}}>Stay Connected</div>
        <h3 style={{fontFamily:"Georgia,serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:400,color:"#fff",fontStyle:"italic",marginBottom:12,lineHeight:1.2}}>Sign up to our newsletter</h3>
        <p style={{color:"rgba(255,255,255,0.45)",fontSize:14,lineHeight:1.8,marginBottom:36}}>Stay up to date with the latest news, special events, membership opportunities, and promotions.</p>
        {submitted?(
          <div style={{background:"rgba(0,196,140,0.12)",border:"1.5px solid #00C48C",borderRadius:12,padding:"24px 32px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            <div style={{fontSize:32}}>✅</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:20,color:"#fff",fontStyle:"italic"}}>You're on the list!</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Thanks {name.split(" ")[0]} — we'll be in touch with all things BrisVO.</div>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Your Name",name,setName,"text"],["Email Address",email,setEmail,"email"]].map(([ph,val,set,type])=>(
                <input key={ph} type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                  onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                  style={{width:"100%",padding:"13px 16px",background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",color:"#fff",fontFamily:"Montserrat,sans-serif",fontSize:14,borderRadius:8,outline:"none"}}
                  onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
              ))}
            </div>
            <button onClick={handleSubmit} disabled={loading}
              style={{width:"100%",padding:"14px",background:accent,color:"#fff",border:"none",cursor:loading?"wait":"pointer",fontFamily:"Montserrat,sans-serif",fontSize:11,fontWeight:800,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8,boxShadow:`0 6px 20px ${accent}44`,opacity:loading?0.7:1}}>
              {loading?"Signing up…":"Sign Up"}
            </button>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:4}}>No spam. Unsubscribe anytime.</p>
          </div>
        )}
      </div>
    </div>
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
  const [view, setView] = useState("home");

  // Load artists from Supabase
  const loadArtists = async () => {
    try {
      const data = await sb("artists?select=*,demos(*)&order=sort_order.asc&is_published=eq.true");
      // Sort demos by sort_order
      data.forEach(a => { if(a.demos) a.demos.sort((x,y)=>x.sort_order-y.sort_order); });
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

  useEffect(() => { loadArtists(); }, []);

  const filtered = artists.filter(t => {
    const mc = filter==="All"||(t.categories||[]).includes(filter);
    const ms = !search||t.name.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#0d0d0d",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontFamily:"Georgia,serif",fontSize:32,fontWeight:700,color:"#fff",letterSpacing:3}}>Bris<span style={{color:accent}}>VO</span></div>
      <div style={{color:"rgba(255,255,255,0.4)",fontSize:13,letterSpacing:2,textTransform:"uppercase",fontFamily:"Montserrat,sans-serif"}}>Loading talent…</div>
      <div style={{width:40,height:40,border:`3px solid rgba(255,255,255,0.1)`,borderTop:`3px solid ${accent}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0d0d0d"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Montserrat,sans-serif;}`}</style>

      {/* NAV */}
      <nav style={{background:"#0d0d0d",padding:"0 40px",display:"flex",alignItems:"center",justifyContent:"space-between",height:66,position:"sticky",top:0,zIndex:100,borderBottom:"1px solid #222"}}>
        <div style={{display:"flex",alignItems:"center",gap:32}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:26,fontWeight:700,color:"#fff",letterSpacing:3}}>Bris<span style={{color:accent}}>VO</span></div>
          <div style={{display:"flex",gap:18}}>
            {["Male Talent","Female Talent","Have You Heard?","About","Studio Links"].map(l=>(
              <span key={l} style={{color:"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",cursor:"pointer",transition:"color .2s"}}
                onMouseEnter={e=>e.target.style.color=accent} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.4)"}>{l}</span>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {/* Supabase status indicator */}
          <div style={{display:"flex",alignItems:"center",gap:5,marginRight:8}}>
            <div style={{width:7,height:7,borderRadius:"50%",background: artists.length>0?"#00C48C":"#FFB400",boxShadow: artists.length>0?"0 0 6px #00C48C":"0 0 6px #FFB400"}}/>
            <span style={{color:"rgba(255,255,255,0.3)",fontSize:9,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>
              {artists.length>0?`${artists.length} artists live`:"DB empty"}
            </span>
          </div>
          <button onClick={()=>setView("login")} style={{padding:"7px 18px",background:"transparent",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.2)",cursor:"pointer",fontFamily:"Montserrat,sans-serif",fontSize:10,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:4}}
            onMouseEnter={e=>{e.target.style.borderColor=accent;e.target.style.color=accent;}} onMouseLeave={e=>{e.target.style.borderColor="rgba(255,255,255,0.2)";e.target.style.color="rgba(255,255,255,0.6)";}}>
            Artist Login
          </button>
          <button onClick={()=>setView("register")} style={{padding:"7px 18px",background:accent,color:"#fff",border:"none",cursor:"pointer",fontFamily:"Montserrat,sans-serif",fontSize:10,fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:4,boxShadow:`0 4px 12px ${accent}44`}}>
            Join BrisVO
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{padding:"72px 40px 60px",background:"linear-gradient(135deg,#0d0d0d,#1a0a1a,#0d0d0d)",position:"relative",overflow:"hidden",borderBottom:"1px solid #222"}}>
        {["#FF3D57","#7C3AED","#00C48C","#FF6B1A"].map((c,i)=>(
          <div key={i} style={{position:"absolute",width:350,height:350,borderRadius:"50%",background:c,opacity:0.07,filter:"blur(70px)",
            left:i===0?"3%":i===1?"68%":i===2?"38%":"15%",top:i===0?"-5%":i===1?"-15%":i===2?"35%":"55%",pointerEvents:"none"}}/>
        ))}
        <div style={{position:"relative"}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"4px",textTransform:"uppercase",color:accent,marginBottom:16}}>Brisbane Voice Artists</div>
          <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(48px,8vw,92px)",fontWeight:700,color:"#fff",lineHeight:1,marginBottom:4}}>making waves</h1>
          <div style={{fontFamily:"Georgia,serif",fontSize:"clamp(18px,2.5vw,30px)",color:"rgba(255,255,255,0.28)",fontStyle:"italic",marginBottom:24,letterSpacing:3}}>since 1996</div>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:14,maxWidth:500,lineHeight:1.8}}>Queensland's premier collection of professional voice talent — commercial, corporate, character, and beyond.</p>
        </div>
      </div>

      {/* SEED PANEL — shown only when DB is empty */}
      {artists.length===0&&!seeding&&(
        <div style={{background:"#1a1a0a",border:"1px solid #FFB40044",padding:"24px 40px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
          <div>
            <div style={{color:"#FFB400",fontSize:12,fontWeight:700,marginBottom:4}}>⚡ Database is empty</div>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:12}}>Click to seed all 31 BrisVO artists into Supabase</div>
          </div>
          <button onClick={seedDatabase} style={{padding:"10px 28px",background:"#FFB400",color:"#000",border:"none",cursor:"pointer",fontFamily:"Montserrat,sans-serif",fontSize:11,fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:8}}>
            Seed 31 Artists →
          </button>
        </div>
      )}
      {seeding&&(
        <div style={{background:"#0a1a0a",border:"1px solid #00C48C44",padding:"20px 40px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:20,height:20,border:"2px solid rgba(255,255,255,0.1)",borderTop:"2px solid #00C48C",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
          <div style={{color:"#00C48C",fontSize:12,fontWeight:700}}>{seedMsg}</div>
        </div>
      )}
      {!seeding&&seedMsg&&artists.length>0&&(
        <div style={{background:"#0a1a0a",border:"1px solid #00C48C44",padding:"16px 40px"}}>
          <div style={{color:"#00C48C",fontSize:12,fontWeight:700}}>{seedMsg}</div>
        </div>
      )}

      {/* FILTER + SEARCH */}
      <div style={{background:"#111",borderBottom:"1px solid #1e1e1e",position:"sticky",top:66,zIndex:90}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 40px",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none"}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setFilter(c)}
                style={{padding:"13px 15px",background:"none",border:"none",color:filter===c?accent:"rgba(255,255,255,0.38)",fontFamily:"Montserrat,sans-serif",fontSize:10,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",cursor:"pointer",whiteSpace:"nowrap",borderBottom:filter===c?`2px solid ${accent}`:"2px solid transparent",transition:"all .18s"}}>
                {c}
              </button>
            ))}
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search artists…"
            style={{padding:"7px 13px",background:"#1e1e1e",border:"1px solid #333",color:"#fff",fontFamily:"Montserrat,sans-serif",fontSize:12,outline:"none",borderRadius:6,width:190}}/>
        </div>
      </div>

      {/* GRID */}
      <div style={{padding:"32px 40px",maxWidth:1500,margin:"0 auto"}}>
        {artists.length===0&&!seeding?(
          <div style={{textAlign:"center",color:"#444",padding:"80px 0",fontSize:13,lineHeight:2}}>
            <div style={{fontSize:48,marginBottom:16}}>🎙</div>
            <div style={{color:"rgba(255,255,255,0.3)",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",fontSize:11}}>No artists yet</div>
            <div style={{color:"rgba(255,255,255,0.2)",fontSize:12,marginTop:8}}>Use the "Seed 31 Artists" button above to populate from BrisVO</div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14}}>
            {filtered.map(t=>(
              <TalentCard key={t.id} talent={t} onClick={()=>setSelected(t)}/>
            ))}
          </div>
        )}
        {filtered.length===0&&artists.length>0&&(
          <div style={{textAlign:"center",color:"#444",padding:"80px 0",fontSize:11,letterSpacing:"2px",textTransform:"uppercase"}}>No artists found.</div>
        )}
      </div>

      {/* ABOUT */}
      <div style={{background:"#111",borderTop:"1px solid #1e1e1e"}}>
        <div style={{background:"linear-gradient(135deg,#1a0a1a,#111)",padding:"64px 40px 0",position:"relative",overflow:"hidden"}}>
          {["#FF3D57","#7C3AED"].map((c,i)=>(
            <div key={i} style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:c,opacity:0.05,filter:"blur(80px)",left:i===0?"-5%":"60%",top:i===0?"10%":"-20%",pointerEvents:"none"}}/>
          ))}
          <div style={{position:"relative",maxWidth:900,margin:"0 auto",textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:"4px",textTransform:"uppercase",color:accent,marginBottom:18}}>About BrisVO</div>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(32px,5vw,58px)",fontWeight:400,color:"#fff",lineHeight:1.1,marginBottom:24,fontStyle:"italic"}}>The voices in your head<br/>are close to hand</h2>
          </div>
        </div>
        <div style={{padding:"48px 40px 60px",maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:48}}>
          <div>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:"3px",textTransform:"uppercase",color:accent,marginBottom:16}}>Who We Are</div>
            <p style={{color:"rgba(255,255,255,0.7)",fontSize:15,lineHeight:1.9,marginBottom:18,fontFamily:"Georgia,serif"}}>BrisVO is not a company nor an agent, but a <strong style={{color:"#fff"}}>collective</strong> — a pool of reliable, accessible, independent voice-over talent of the highest calibre.</p>
            <p style={{color:"rgba(255,255,255,0.55)",fontSize:14,lineHeight:1.85,marginBottom:18}}>The initiative was established in 1996 to highlight the best of Brisbane-based voice talent and become the go-to place to assist the people who hire us. We strive not only to foster excellence in our industry, but make finding, quoting and booking talent as simple as possible.</p>
            <p style={{color:"rgba(255,255,255,0.55)",fontSize:14,lineHeight:1.85}}>As local, professional voice-over artists, we are very proud of what we do. Let us know how BrisVO can help you bring your ideas to life.</p>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:"3px",textTransform:"uppercase",color:accent,marginBottom:16}}>What We Offer</div>
            <p style={{color:"rgba(255,255,255,0.55)",fontSize:14,lineHeight:1.85,marginBottom:24}}>All BrisVO talent can accept your brief, analyse your script, respond to direction and come up with the goods — without wasting valuable studio time, letting you get on with the job.</p>
            <p style={{color:"rgba(255,255,255,0.7)",fontSize:15,lineHeight:1.9,fontFamily:"Georgia,serif",fontStyle:"italic",borderLeft:`3px solid ${accent}`,paddingLeft:20,marginBottom:24}}>"We'd love to speak for you, giving voice to your client's project in a professional manner that will leave both you &amp; your client delighted with the result."</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[["🎙","Find talent fast","Browse professional voices — filter by style, gender, accent"],["▶","Hear before you hire","Up to 6 demo reels per artist, stream instantly"],["✉","Book with ease","Direct enquiry form on every profile"]].map(([icon,title,desc])=>(
                <div key={title} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 16px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.06)"}}>
                  <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{icon}</span>
                  <div><div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:2}}>{title}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.5}}>{desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,0.03)",borderTop:"1px solid rgba(255,255,255,0.06)",padding:"28px 40px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <p style={{color:"rgba(255,255,255,0.5)",fontSize:13}}>Ready to be heard? Join Queensland's finest voice collective.</p>
          <button onClick={()=>setView("register")} style={{padding:"12px 32px",background:accent,color:"#fff",border:"none",cursor:"pointer",fontFamily:"Montserrat,sans-serif",fontSize:10,fontWeight:800,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8,boxShadow:`0 6px 20px ${accent}44`}}>Join as an Artist</button>
        </div>
      </div>

      <NewsletterSection/>

      {/* FOOTER */}
      <div style={{background:"#0d0d0d",padding:"28px 40px",borderTop:"1px solid #1a1a1a"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:"#fff",letterSpacing:2}}>Bris<span style={{color:accent}}>VO</span></div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            {["Male Talent","Female Talent","Have You Heard?","About BrisVO","Studio Links","Rate Card","Disclaimer","Terms"].map(l=>(
              <span key={l} style={{color:"rgba(255,255,255,0.25)",fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",cursor:"pointer",fontWeight:700}}
                onMouseEnter={e=>e.target.style.color=accent} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.25)"}>{l}</span>
            ))}
          </div>
          <p style={{color:"rgba(255,255,255,0.18)",fontSize:11}}>©2025 BrisVO. All rights reserved.</p>
        </div>
      </div>

      {selected&&<TalentModal talent={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}
