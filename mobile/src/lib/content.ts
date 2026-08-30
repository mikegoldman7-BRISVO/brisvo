/**
 * Ported verbatim from the website (src/App.jsx) so the app and site stay in step.
 */
export type StudioContact = { name?: string; email?: string; phone?: string; note?: string };
export type Studio = {
  name: string;
  description: string;
  website: string;
  location: string;
  contacts: StudioContact[];
};

export const CATEGORIES = ["All","Corporate","Commercial","Character","Audiobook","E-Learning","Female","Male","IVR & On Hold","Jingle","Retail"];

export const GENDER_FILTERS = new Set(["Male", "Female"]);

export const RATE_CARD_URL = "https://brisvo.com/downloads/Voice-over-rate-card_v9-July.pdf";
export const WEBSITE_URL = "https://brisvo.com";

export const STUDIOS: Studio[] = [
  {
    name: "Rosco Audio",
    description: "Brisbane's premier sound design & VO recording studio (35+ yrs in advertising audio); sound design, VO direction/casting, editing, mixing incl. Dolby.",
    website: "roscoaudio.com.au",
    location: "Tarragindi (37 Barnehurst St)",
    contacts: [
      { email: "rosco@roscoaudio.com.au", phone: "0413 129 777" },
      { email: "sarah@roscoaudio.com.au", phone: "0497 484 062" },
    ],
  },
  {
    name: "Folklore Sound",
    description: "Est. 2012, West End. QLD's first Dolby theatrically-certified studio; Emmy-winning film/TV sound design, ADR, re-recording mix and immersive/Atmos.",
    website: "folkloresound.com",
    location: "314 Montague Rd, West End QLD 4101",
    contacts: [{ phone: "(07) 3180 8819" }],
  },
  {
    name: "3P Studio",
    description: "Award-winning full-service post house in Milton (one of QLD's largest artist-owned facilities); editorial, grade, sound, VFX, animation, with 3 audio suites + record booths. Founder Haley McDonald.",
    website: "3pstudio.com.au",
    location: "Milton (Black St)",
    contacts: [{ note: "Contact via site / @threepstudio" }],
  },
  {
    name: "xoPost",
    description: "New (2025) boutique picture-and-sound post studio by Trelise Blade & Mike Lange (ex-Cutting Edge); offline edit, sound design/mix, colour grade, online finishing.",
    website: "",
    location: "",
    contacts: [{ note: "via campaignbrief.com / badc.com.au, or Mike Lange / Trelise Blade on LinkedIn" }],
  },
  {
    name: "Unison Sound",
    description: "Top-tier TV/film/immersive sound post; design, Foley, ADR, Dolby Atmos. Clients incl. ABC, SBS, Netflix, Disney, Stan. Owner Wes Chew.",
    website: "unisonsound.com.au",
    location: "Suite 4, Level 1, 76 Commercial Rd, Teneriffe QLD 4005",
    contacts: [{ email: "producer@unisonsound.com.au", phone: "+61 2 9383 4478" }],
  },
  {
    name: "The Audio Suite",
    description: "Brisbane sister of the Birmingham (UK) studio; audio post for feature film, high-end TV drama, docos and commercials. Within 30 mins of Brisbane airport.",
    website: "audiosuite.co.uk",
    location: "Brisbane",
    contacts: [{ note: "Enquiry form (covers AU + UK)" }],
  },
  {
    name: "Alchemix Recording Studios",
    description: "Est. 1998, South Brisbane. Acoustically-treated rooms, large live room (6m ceilings); recording, production, mixing, mastering and VO.",
    website: "alchemix.com.au",
    location: "Unit 4/24 Brereton St, South Brisbane QLD 4101",
    contacts: [],
  },
  {
    name: "Underground Audio",
    description: "Nundah music studio run by engineer Chris Brownbill (since 2014); engineering, mixing, production and VO. Day rates from ~$350.",
    website: "undergroundaudio.com.au",
    location: "22 Hamson Terrace, Nundah QLD 4012",
    contacts: [{ phone: "0432 928 089" }],
  },
  {
    name: "Jagger Rocky Studios",
    description: "Podcast recording, rehearsal rooms, voiceover recording with Source Connect, acting and voiceover classes, plus space for event hire.",
    website: "jaggerrocky.com",
    location: "27 Birubi Street, Coorparoo",
    contacts: [{ email: "studio@jaggerrocky.com" }],
  },
  {
    name: "Sounds Like Butter",
    description: "Award-winning Audio Producer.",
    website: "",
    location: "",
    contacts: [{ name: "Stevie Leigh", email: "leigh@soundslikebutter.com", phone: "0407 620 039" }],
  },
];

export const ABOUT_TAGLINE = "The voices in your head are close to hand";

export const ABOUT_PARAGRAPHS = [
  "BrisVO is not a company nor an agent, but a collective — a pool of reliable, accessible, independent voice-over talent of the highest calibre.",
  "The initiative was established in 1996 to highlight the best of Brisbane-based voice talent and become the go-to place to assist the people who hire us. We strive not only to foster excellence in our industry, but make finding, quoting and booking talent as simple as possible.",
  "As local, professional voice-over artists, we are very proud of what we do. Let us know how BrisVO can help you bring your ideas to life.",
  "All BrisVO talent can accept your brief, analyse your script, respond to direction and come up with the goods — without wasting valuable studio time, letting you get on with the job.",
];

export const ABOUT_QUOTE =
  "We'd love to speak for you, giving voice to your client's project in a professional manner that will leave both you & your client delighted with the result.";

export const OFFER_ITEMS: { icon: string; title: string; text: string }[] = [
  { icon: "🎙", title: "Find talent fast", text: "Browse professional voices — filter by style, gender, accent" },
  { icon: "▶", title: "Hear before you hire", text: "Up to 6 demo reels per artist, stream instantly" },
  { icon: "✉", title: "Book with ease", text: "Direct enquiry form on every profile" },
];

export const PROJECT_TYPES = [
  "TV commercial",
  "Radio commercial",
  "Corporate video",
  "E-learning",
  "Audiobook",
  "IVR & on hold",
  "Character / animation",
  "Other",
];
