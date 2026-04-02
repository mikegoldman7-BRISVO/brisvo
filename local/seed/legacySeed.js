// Local-only backup of the original browser seed routine.
// This file is intentionally not imported by the app.

const PROXY = "https://corsproxy.io/?";
const BASE = "https://www.brisvo.com/wp-content/uploads";
const p = url => `${PROXY}${encodeURIComponent(url)}`;

export const SEED_ARTISTS = [
  { name:"Thomas Murray", slug:"thomas-murray", gender:"Male", brand_color:"#FF3D57", categories:["Male","Corporate","Commercial"], photo_url:p(`${BASE}/2021/08/Tom-Murray-1-B_W.jpg`), bio:"Award-winning sound producer and voiceover artist with over 15 years industry experience. Tom has worked for The Australian Radio Network, 4BC, and Nova Entertainment. Co-hosted the Sunday morning breakfast show on Nova 106.9.", sort_order:1 },
  { name:"Jackie Bowker", slug:"jackie-bowker", gender:"Female", brand_color:"#FF6B1A", categories:["Female","Commercial","Corporate","Character"], photo_url:p(`${BASE}/2025/04/Jackie-Bowker%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Think of her voice as your Swiss Army knife — versatile enough to tackle any style. Clients include Rio Tinto, Bonds Australia, Volkswagen, ANZ Bank, Cancer Council, Medibank, Spotify and The Australian Open.", sort_order:2 },
  { name:"Fotene Maroulis", slug:"fotene-maroulis", gender:"Female", brand_color:"#FFB400", categories:["Female","Corporate","E-Learning","Commercial"], photo_url:p(`${BASE}/2022/07/Fontene-Maroulis-BrisVO-Voice-Artist-768x1143.jpg`), bio:"Originally from New Zealand, Fotene's love of music and performance contributes to the warmth in her natural speaking tone. Campaigns include Michael Hill, The Iconic, Bisolvon, Otrivin and Sun Super.", sort_order:3 },
  { name:"Liz Buchanan", slug:"liz-buchanan", gender:"Female", brand_color:"#00C48C", categories:["Female","Commercial","Audiobook","E-Learning"], photo_url:p(`${BASE}/2021/08/Liz-Buchannan-BW.jpg`), bio:"Theatre and TV actor and trained singer with over a decade of VO work. Clients include Lite n' Easy, Suncorp, Goodstart Early Learning, NRMA and Triple P Online. Also the voice of an alien telepath in 'Space Chickens in Space'.", sort_order:4 },
  { name:"Hugh Parker", slug:"hugh-parker", gender:"Male", brand_color:"#00B4D8", categories:["Male","Character","Commercial","Corporate"], photo_url:p(`${BASE}/2021/08/Hugh-Parker_.jpg`), bio:"Actor, writer and teacher with an acute ear for the most engaging delivery. London recording studios were his second home. He excels at straight, comedic, tone-filled and humble voice work.", sort_order:5 },
  { name:"Robert Coleby", slug:"robert-coleby", gender:"Male", brand_color:"#7C3AED", categories:["Male","Corporate","Commercial","Character"], photo_url:p(`${BASE}/2021/08/Robert-Colby-B_w.jpg`), bio:"London-trained actor with over 83 film and TV productions and 45 plays. Voice of Darwin in QTC's 'The Wider Earth' and a series regular in 'The Queen of Oz' for the BBC.", sort_order:6 },
  { name:"Chris Crickmay", slug:"chris-crickmay", gender:"Male", brand_color:"#F72585", categories:["Male","Character","Commercial","E-Learning","Corporate"], photo_url:p(`${BASE}/2022/07/Chris-Crickmay-BrisVO-B_W-768x1143.jpg`), bio:"Award-winning Australian voice talent. Clients include ANZ, Commonwealth Bank, Subaru, Toyota, BP, Dan Murphy's, KFC, Mazda, BMW, Triple J and the Gold Coast Suns.", sort_order:7 },
  { name:"Walter Williams", slug:"walter-williams", gender:"Male", brand_color:"#06D6A0", categories:["Male","Corporate","Commercial","Audiobook","Character","Retail"], photo_url:p(`${BASE}/2023/10/Walter-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-B_W-768x1143.jpg`), bio:"'The Voice' people rely on. Walt has narrated nine seasons of 'Industry Leaders' on Foxtel. Clients include BHP, Cadbury, Jack Daniels, Jaguar, LG, McDonald's McCafe, Mercedes Benz, Rio Tinto, Westpac and Yamaha.", sort_order:8 },
  { name:"Andrea Moor", slug:"andrea-moor", gender:"Female", brand_color:"#FF4D6D", categories:["Female","Corporate","Commercial","Character"], photo_url:p(`${BASE}/2021/08/Andrea-Moor-Brisvo-Website-Hero-Head-shots-768x1143.jpg`), bio:"Known for her sophisticated voice of reason, perfect for luxury real estate and financial products. National profile as a stage and screen actor with a warm, sensual honeyed voice.", sort_order:9 },
  { name:"Nelle Lee", slug:"nelle-lee", gender:"Female", brand_color:"#4361EE", categories:["Female","Commercial","Character","Jingle"], photo_url:p(`${BASE}/2021/08/Nelle-Lee-%E2%80%A2-Brisvo-Website-Hero-Head-shots-768x1143.jpg`), bio:"Energetic, youthful vocal quality with extensive theatre and film history. Natural comic timing and a bright vibrant feel. Clients include Telstra, Griffith, Subway and Oz Lotto.", sort_order:10 },
  { name:"Brie Jurss", slug:"brie-jurss", gender:"Female", brand_color:"#FB5607", categories:["Female","Commercial","E-Learning","Corporate","Retail"], photo_url:p(`${BASE}/2022/09/Brie-Jurss-Brisvo-Website-Hero-Head-shots-1-768x1143.jpg`), bio:"Bright, natural tone bursting with energy and kindness. Relatable yet trustworthy. Clients include Flight Centre, Suncorp Group, The Lott and University of Sunshine Coast.", sort_order:11 },
  { name:"Michael Goldman", slug:"michael-goldman", gender:"Male", brand_color:"#3A86FF", categories:["Male","Commercial","Corporate","Character"], photo_url:p(`${BASE}/2021/08/Mike-Goldman-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"One of the founders of BrisVO. Voice artist since the 1990s, learning the ropes from his father Grant Goldman. Now used by some of the biggest brands in the world for his instinctual ability to follow direction and interpret a script.", sort_order:12 },
  { name:"Thomas Larkin", slug:"thomas-larkin", gender:"Male", brand_color:"#8338EC", categories:["Male","Audiobook","Character","Corporate","Commercial"], photo_url:p(`${BASE}/2021/08/Thomas-Larkin-B_W.jpg`), bio:"VCA graduate. Screen credits include Baz Luhrmann's Elvis (2022) and animated feature Combat Wombat opposite Deborah Mailman. Recipient of the Brisbane City Council Lord Mayor's Young and Emerging Artists Fellowship.", sort_order:13 },
  { name:"Megan Shapcott", slug:"megan-shapcott", gender:"Female", brand_color:"#FF006E", categories:["Female","E-Learning","Corporate","Commercial"], photo_url:p(`${BASE}/2021/08/Megan-Shapcott-1.jpg`), bio:"Clear, articulate and approachable — a go-to for e-learning, corporate narration and commercial work throughout Australia.", sort_order:14 },
  { name:"Leon Murray", slug:"leon-murray", gender:"Male", brand_color:"#00B4D8", categories:["Male","Corporate","Commercial","Retail","IVR & On Hold"], photo_url:p(`${BASE}/2021/08/Leon-Murray-BrisVO-Artist.jpg`), bio:"'Voice of Big Brother' on Network TEN (2008) and Nine Network (2012–2014). Clients include BMW, McDonald's, Suncorp, Hewlett Packard, Crown, Watpac and Expedia.", sort_order:15 },
  { name:"Ashlee Lollback", slug:"ashlee-lollback", gender:"Female", brand_color:"#06D6A0", categories:["Female","Commercial","Retail","Corporate"], photo_url:p(`${BASE}/2025/04/Ashlee-Lollback-2-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Fresh, contemporary sound for retail and commercial productions. Natural warmth and approachable energy that clients love.", sort_order:16 },
  { name:"Digby Gillings", slug:"digby-gillings", gender:"Male", brand_color:"#FF3D57", categories:["Male","Commercial","Character","Corporate"], photo_url:p(`${BASE}/2021/08/Digby-Gilling.jpg`), bio:"Old head on young shoulders — a genuine radio veteran with a natural gift for storytelling.", sort_order:17 },
  { name:"Paul Davies", slug:"paul-davies", gender:"Male", brand_color:"#FFB400", categories:["Male","Corporate","IVR & On Hold","Commercial"], photo_url:p(`${BASE}/2022/11/Paul-Davies%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Polished, professional reads every time. Warm authority trusted for corporate messaging, IVR and radio campaigns throughout Australia.", sort_order:18 },
  { name:"Ross Newth", slug:"ross-newth", gender:"Male", brand_color:"#7C3AED", categories:["Male","Commercial","Corporate"], photo_url:p(`${BASE}/2025/05/Ross-Newth-%E2%80%A2-Brisvo-Website-Hero-Head-shots-768x1143.jpg`), bio:"Fresh, modern sound for commercial and corporate productions. Versatile, reliable and always on brief.", sort_order:19 },
  { name:"Steven Grives", slug:"steven-grives", gender:"Male", brand_color:"#F72585", categories:["Male","Corporate","Audiobook","Commercial"], photo_url:p(`${BASE}/2021/08/Steven-Grives-1-B_W.jpg`), bio:"Accomplished actor and voice artist whose screen and stage experience informs every recording.", sort_order:20 },
  { name:"LJ Stockwell", slug:"lj-stockwell", gender:"Female", brand_color:"#4CC9F0", categories:["Female","Commercial","E-Learning","Corporate"], photo_url:p(`${BASE}/2023/06/LJ-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Friendly, approachable tone that has made her a favourite for e-learning and consumer-facing campaigns.", sort_order:21 },
  { name:"Emily Dickson", slug:"emily-dickson", gender:"Female", brand_color:"#FF6B1A", categories:["Female","Commercial","Retail","E-Learning"], photo_url:p(`${BASE}/2022/07/Emily-Dickson-BrisVO-Voice-Artist-B_W-768x1143.jpg`), bio:"Bright, engaging voice perfect for retail, commercial and lifestyle productions.", sort_order:22 },
  { name:"Jennifer Mary", slug:"jennifer-mary", gender:"Female", brand_color:"#00C48C", categories:["Female","Corporate","IVR & On Hold","Commercial"], photo_url:p(`${BASE}/2021/08/Jennifer-Mary-1-B_W.jpg`), bio:"Warm professionalism shining through in every corporate and IVR recording.", sort_order:23 },
  { name:"Helen Cassidy", slug:"helen-cassidy", gender:"Female", brand_color:"#3A86FF", categories:["Female","Audiobook","Corporate","Commercial"], photo_url:p(`${BASE}/2025/04/Helen-Cassidy-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Elegance and depth in audiobook narration and premium corporate productions.", sort_order:24 },
  { name:"Todd MacDonald", slug:"todd-macdonald", gender:"Male", brand_color:"#8338EC", categories:["Male","Commercial","Character","Corporate"], photo_url:p(`${BASE}/2023/11/Todd-Macdonald%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Distinctive voice with natural authority equally effective for comedy and drama.", sort_order:25 },
  { name:"Todd Levi", slug:"todd-levi", gender:"Male", brand_color:"#FB5607", categories:["Male","Corporate","Commercial","IVR & On Hold"], photo_url:p(`${BASE}/2023/01/TODD-LEVI-1%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Confidence and clarity in every read. Equally comfortable in the boardroom or the booth.", sort_order:26 },
  { name:"Marcus Oborn", slug:"marcus-oborn", gender:"Male", brand_color:"#FF006E", categories:["Male","Commercial","Jingle","Corporate"], photo_url:p(`${BASE}/2025/04/Marcus-Oborn-%E2%80%A2-Brisvo-Website-Hero-Head-shots-768x1143.jpg`), bio:"Warm, energetic delivery that makes him a standout for commercial and jingle work.", sort_order:27 },
  { name:"Teresa Lim", slug:"teresa-lim", gender:"Female", brand_color:"#4361EE", categories:["Female","Corporate","E-Learning","Commercial"], photo_url:p(`${BASE}/2021/08/Teresa-Lim-1-B_W.jpg`), bio:"Clear, composed delivery perfect for multilingual corporate and e-learning content.", sort_order:28 },
  { name:"Damien Garvey", slug:"damien-garvey", gender:"Male", brand_color:"#06D6A0", categories:["Male","Character","Audiobook","Corporate"], photo_url:p(`${BASE}/2022/03/Damien-Garvey-BrisVO-Voice-Actor-B_W-768x1143.jpg`), bio:"Respected actor and voice artist spanning drama, comedy and documentary with equal distinction.", sort_order:29 },
  { name:"Mikee Joaquin", slug:"mikee-joaquin", gender:"Male", brand_color:"#FF3D57", categories:["Male","Character","E-Learning","Commercial"], photo_url:p(`${BASE}/2021/08/Mikee-Joaquin-%E2%80%A2-Brisvo-WebsiteHero-Head-shots-768x1143.jpg`), bio:"Loads of creative flair. His unique, quirky style landed him work for Crayola, Colgate-Palmolive — and the role of Dipsy, the green Teletubby.", sort_order:30 },
  { name:"Tony Bellette", slug:"tony-bellette", gender:"Male", brand_color:"#FFB400", categories:["Male","Corporate","Commercial","IVR & On Hold"], photo_url:p(`${BASE}/2021/08/Tony-Billette-1-B_W.jpg`), bio:"Commanding voice trusted by major brands for decades of corporate and commercial work.", sort_order:31 },
];

export const SEED_DEMOS = {
  "thomas-murray": [{name:"Current Demo Reel 2025",file_url:`${BASE}/2025/11/Thomas-Murray-Prod-Reel-2025.mp3`,sort_order:0},{name:"VO Reel 2023",file_url:`${BASE}/2023/05/TOM-MURRAY-2023-VO-REEL.mp3`,sort_order:1}],
  "jackie-bowker": [{name:"Compilation Reel",file_url:`${BASE}/2025/04/Jackie-Bowker-VO-Demo-Compilation-V2-with-music.mp3`,sort_order:0},{name:"Commercial Reel",file_url:`${BASE}/2025/04/Jackie-Bowker-VO-Demo-Commercial-music.mp3`,sort_order:1},{name:"Corporate Reel",file_url:`${BASE}/2025/04/Jackie-Bowker-CorporateReel.Music_.NoSlate.mp3`,sort_order:2}],
  "fotene-maroulis": [{name:"Voice Reel",file_url:`${BASE}/2022/07/01-FoteneMaroulis_VO_Demo_2min.mp3`,sort_order:0}],
  "liz-buchanan": [{name:"Voice Over Demos",file_url:`${BASE}/2021/08/Liz-Buchanan-KAMvoices-1.mp3`,sort_order:0},{name:"Narration & E-Learning",file_url:`${BASE}/2021/08/Liz-Buchanan-KAMvoices-Narration-1.mp3`,sort_order:1},{name:"US Accent",file_url:`${BASE}/2021/08/Amway-edit-fade-up-1.wav`,sort_order:2}],
  "hugh-parker": [{name:"Compilation",file_url:`${BASE}/2021/08/HughCompilationV3.mp3`,sort_order:0}],
  "robert-coleby": [{name:"Voice Demo",file_url:`${BASE}/2021/08/Robert-Coleby-Voice-Demo.mp3`,sort_order:0}],
  "chris-crickmay": [{name:"Sample Montage",file_url:`${BASE}/2024/02/Chris-Crickmay-JAN-sample-montage.mp3`,sort_order:0},{name:"TV & Radio Reel",file_url:`${BASE}/2022/07/CRICKERS-TV-RADIO-READS.mp3`,sort_order:1},{name:"Characters & Accents",file_url:`${BASE}/2022/07/Chris-Crickmay-CHARACTERS-ACCENTS-AND-ANIMATION_02.mp3`,sort_order:2},{name:"E-Learning & Corporate",file_url:`${BASE}/2022/07/Chris-Crickmay-ELEARNING-AND-CORPORATE-NARRATION.mp3`,sort_order:3},{name:"Intimate Reads",file_url:`${BASE}/2022/07/Chris-Crickmay-INTIMATE-READS.mp3`,sort_order:4}],
  "walter-williams": [{name:"Commercial Demo",file_url:`${BASE}/2021/08/Walts-Commercial-Demo-2020.mp3`,sort_order:0},{name:"Natural Demo",file_url:`${BASE}/2021/08/Walts-Natural-Demo-2020.mp3`,sort_order:1},{name:"Corporate Demo",file_url:`${BASE}/2021/08/Walts-Corporate-Demo.mp3`,sort_order:2},{name:"Retail Demo",file_url:`${BASE}/2021/08/Walts-Retail-Demo.mp3`,sort_order:3},{name:"Animation Demo",file_url:`${BASE}/2021/08/Walts-Animation-Demo-2019.mp3`,sort_order:4},{name:"Narration Demo",file_url:`${BASE}/2021/08/Walts-Narration-Demo-2020.mp3`,sort_order:5}],
  "andrea-moor": [{name:"Voice Demo",file_url:`${BASE}/2023/11/Andrea-Moor-Voice-Demo-17112023-10.58-am.mp3`,sort_order:0}],
  "nelle-lee": [{name:"Voice Over Demo",file_url:`${BASE}/2021/08/NelleLee-A1Compilation.mp3`,sort_order:0}],
  "brie-jurss": [{name:"Demo Reel",file_url:`${BASE}/2021/08/Demo-Reel-Brie-Jurss-1.mp3`,sort_order:0}],
  "michael-goldman": [{name:"VO Demo 2021",file_url:`${BASE}/2021/10/Mike-Goldmans-Demo-2021.mp3`,sort_order:0},{name:"TV Promos 2023",file_url:`${BASE}/2023/03/Mike-Goldman-TV-Promos-2023.mp3`,sort_order:1},{name:"Character Reel",file_url:`${BASE}/2021/08/2020Character.mp3`,sort_order:2},{name:"American Demo",file_url:`${BASE}/2021/08/American-VO-Demo.mp3`,sort_order:3},{name:"English Demo",file_url:`${BASE}/2022/09/EnglishGold.mp3`,sort_order:4},{name:"Video Game Demo",file_url:`${BASE}/2022/09/videogamedemo.mp3`,sort_order:5}],
  "thomas-larkin": [{name:"Compilation Reel 2023",file_url:`${BASE}/2023/05/230505_LARKIN_THOMAS_COMPILATION-DEMO_2023_Master-REV-2.mp3`,sort_order:0},{name:"Documentary Demo",file_url:`${BASE}/2021/08/LARKIN-THOMAS-Documentary-Demo-MASTER2.mp3`,sort_order:1},{name:"Animation Demo 2023",file_url:`${BASE}/2023/05/Thomas-Larkin-Animation-Reel-2023_Master_3.0.mp3`,sort_order:2},{name:"Gaming Demo",file_url:`${BASE}/2021/08/LARKIN-THOMAS-GAMING-DEMO.mp3`,sort_order:3},{name:"Audio Book Demo",file_url:`${BASE}/2023/05/230505_Thomas-Larkin-Audiobook-Reel-2023_Master.mp3`,sort_order:4},{name:"Promo Reel 2023",file_url:`${BASE}/2023/05/230505_Thomas-Larkin-Promo-Reel-2023_Master.mp3`,sort_order:5}],
  "leon-murray": [{name:"Compile Demo 2024",file_url:`${BASE}/2024/10/Leon-2024-Compile-Demo.mp3`,sort_order:0},{name:"Corporate & On Hold 2024",file_url:`${BASE}/2024/10/Leon-2024-Corporate-Demo.mp3`,sort_order:1},{name:"Retail & Promo",file_url:`${BASE}/2021/08/Leon-Murray-RETAIL-Demo-2018.mp3`,sort_order:2},{name:"Government",file_url:`${BASE}/2021/08/Leon-Murray-GOVT-Demo-2018.mp3`,sort_order:3},{name:"New Zealand Demo",file_url:`${BASE}/2021/12/Leon-Murray-BRISVO-NZ-MVO-REEL-MP3.mp3`,sort_order:4},{name:"Brand Positioning",file_url:`${BASE}/2022/09/Leon-Murray-Brand-Positioning-Demo-BRISVO.mp3`,sort_order:5}],
};

export async function seedLegacyBrisvoArtists({ supabaseUrl, supabaseAnonKey, onStatus = () => {} }) {
  onStatus("Step 1: Testing connection to Supabase...");

  const testRes = await fetch(`${supabaseUrl}/rest/v1/artists?limit=1`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  onStatus(`Step 1 result: HTTP ${testRes.status} ${testRes.statusText}`);

  if (!testRes.ok) {
    throw new Error(await testRes.text());
  }

  onStatus("Step 2: Inserting Thomas Murray as test...");
  const firstArtist = SEED_ARTISTS[0];
  const insertRes = await fetch(`${supabaseUrl}/rest/v1/artists`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ ...firstArtist, is_published: true }),
  });

  const insertText = await insertRes.text();
  onStatus(`Step 2 result: HTTP ${insertRes.status} — ${insertText.slice(0, 200)}`);

  if (!insertRes.ok) {
    throw new Error(insertText);
  }

  onStatus("Step 2 worked! Running full seed...");
  const [inserted] = JSON.parse(insertText);
  const firstArtistDemos = SEED_DEMOS[firstArtist.slug] || [];

  for (const demo of firstArtistDemos) {
    await fetch(`${supabaseUrl}/rest/v1/demos`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ ...demo, artist_id: inserted.id }),
    });
  }

  for (let i = 1; i < SEED_ARTISTS.length; i += 1) {
    const artist = SEED_ARTISTS[i];
    onStatus(`Adding ${artist.name} (${i + 1}/${SEED_ARTISTS.length})...`);

    const res = await fetch(`${supabaseUrl}/rest/v1/artists`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ ...artist, is_published: true }),
    });

    if (!res.ok) continue;

    const [insertedArtist] = await res.json();
    const demos = SEED_DEMOS[artist.slug] || [];

    for (const demo of demos) {
      await fetch(`${supabaseUrl}/rest/v1/demos`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ ...demo, artist_id: insertedArtist.id }),
      });
    }
  }

  onStatus("All 31 artists loaded into Supabase.");
}
