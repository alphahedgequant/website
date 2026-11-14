/**
 * A curated directory, not an exhaustive worldwide tournament database.
 * Every sourceURL points at the organiser/primary event calendar.
 * Source-checked 14 November 2026. Do not extrapolate registrant names or live scores.
 */
export const VERIFIED_AS_OF = "2026-11-14";
export const COMPETITIONS = [
  {
    slug:"fide-world-chess-championship-2026", title:"FIDE World Chess Championship 2026", category:"Chess",
    country:"Switzerland", city:"Geneva", mode:"In person", organiser:"FIDE", start:"2026-11-22", end:"2026-12-12",
    format:"World championship match", participants:["Gukesh D","Javokhir Sindarov"],
    participantLabel:"Players named in the Lichess championship broadcast",
    description:"The world championship match in Geneva. Follow round schedules, games and confirmed competitors through the official coverage.",
    sourceURL:"https://worldchampionship.fide.com/", broadcastURL:"https://lichess.org/broadcast",
    eligibility:"Spectator event; consult organisers for attendance", tags:["Classical","World championship"], featured:true
  },
  {
    slug:"jerusalem-masters-2026", title:"Jerusalem Masters 2026", category:"Chess",
    country:"Israel", city:"Jerusalem", mode:"In person", organiser:"Jerusalem Masters", start:"2026-11-23", end:null,
    format:"Invitational · rounds", participants:["Arjun Erigaisi","Ian Nepomniachtchi","Wesley So","Hans Niemann"],
    participantLabel:"Featured players listed in the Lichess broadcast calendar",
    description:"A major invited-player tournament with broadcast rounds starting 23 November. End date was not specified in the source checked.",
    sourceURL:"https://lichess.org/broadcast/calendar/2026/11", broadcastURL:"https://lichess.org/broadcast",
    eligibility:"Invitational; spectator access via broadcast", tags:["Classical","Grandmasters"]
  },
  {
    slug:"us-masters-2026", title:"2026 US Masters", category:"Chess", country:"United States", city:"Charlotte", mode:"In person", organiser:"US Masters",
    start:"2026-11-25", end:"2026-11-29", format:"Open tournament", participants:[],
    description:"US Masters in Charlotte, listed on the FIDE Circuit event calendar.",
    sourceURL:"https://www.fide.com/fide-circuit-2026-2027/", eligibility:"See organiser for player eligibility", tags:["FIDE Circuit"]
  },
  {
    slug:"london-chess-classic-masters-2026", title:"London Chess Classic Masters 2026", category:"Chess", country:"United Kingdom", city:"London", mode:"In person", organiser:"London Chess Classic",
    start:"2026-11-25", end:"2026-12-04", format:"Masters", participants:[],
    description:"London Chess Classic Masters. The tournament dates are included in FIDE's published Circuit calendar.",
    sourceURL:"https://www.fide.com/fide-circuit-2026-2027/", eligibility:"See official event rules", tags:["Masters","FIDE Circuit"]
  },
  {
    slug:"turkic-individual-chess-2026", title:"Turkic Individual Chess Championship", category:"Chess", country:"Kazakhstan", city:"Turkistan", mode:"In person", organiser:"Turkic Chess Championship",
    start:"2026-11-19", end:"2026-11-28", format:"Individual championship", participants:[],
    description:"Turkic individual championship held in Turkistan, Kazakhstan, per the FIDE Circuit schedule.",
    sourceURL:"https://www.fide.com/fide-circuit-2026-2027/", eligibility:"Check participating federation requirements", tags:["International"]
  },
  {
    slug:"world-rapid-blitz-2026", title:"FIDE World Rapid & Blitz Championships", category:"Chess", country:"Turkey", city:"Istanbul", mode:"In person", organiser:"FIDE",
    start:"2026-12-25", end:"2026-12-30", format:"Rapid and blitz", participants:[],
    description:"The world rapid and blitz championships in Istanbul, scheduled for late December.",
    sourceURL:"https://www.fide.com/fide-circuit-2026-2027/", eligibility:"See FIDE regulations", tags:["Rapid","Blitz"], featured:true
  },
  {
    slug:"world-senior-chess-2026", title:"FIDE World Senior Chess Championships", category:"Chess", country:"Serbia", city:"Banja", mode:"In person", organiser:"FIDE",
    start:"2026-11-02", end:"2026-11-15", format:"Senior championships", participants:[],
    description:"FIDE's 2026 senior championship event. For standings and current pairings, use the source links.",
    sourceURL:"https://events.fide.com/index.php/calendar-2026/", broadcastURL:"https://lichess.org/broadcast", eligibility:"Senior age eligibility determined by FIDE", tags:["Senior"]
  },
  {
    slug:"kiroween-2026", title:"Kiroween 2026", category:"Hackathons", country:"Worldwide", city:"Online", mode:"Online", organiser:"Kiro",
    start:"2026-10-30", end:"2026-12-04", format:"Online developer hackathon", participants:[],
    description:"Build and submit developer projects in this global online hackathon. Official Devpost listing contains current entry rules and submission details.",
    sourceURL:"https://kiroween.devpost.com/", eligibility:"Check entry age and excluded jurisdictions in official rules", tags:["AI","Developer tools"], featured:true
  },
  {
    slug:"codegeist-2026", title:"Codegeist 2026", category:"Hackathons", country:"Worldwide", city:"Online", mode:"Online", organiser:"Atlassian",
    start:"2026-10-27", end:"2026-12-22", format:"Online builder competition", participants:[],
    description:"Atlassian's Codegeist developer challenge, focused on building useful software and workflows.",
    sourceURL:"https://codegeist2026.devpost.com/", eligibility:"See official entry rules and excluded jurisdictions", tags:["Enterprise","AI"]
  },
  {
    slug:"build-hybrid-ai-2026", title:"#BuildHybridAI 2026", category:"Hackathons", country:"Worldwide", city:"Online", mode:"Online", organiser:"Google",
    start:"2026-11-11", end:"2026-11-30", format:"Online hackathon", participants:[],
    description:"An online build competition with hybrid AI, mobile and web categories.",
    sourceURL:"https://firebasehybridaihackathon.devpost.com/", eligibility:"Check official regional exclusions and project rules", tags:["AI","Mobile","Web"]
  },
  {
    slug:"meta-vr-start-2026", title:"Meta VR Start Developer Competition 2026", category:"Hackathons", country:"Worldwide", city:"Online", mode:"Online", organiser:"Meta",
    start:"2026-09-24", end:"2026-11-18", format:"Online developer competition", participants:[],
    description:"A global AR/VR and immersive development competition. The listing shows the published submission window.",
    sourceURL:"https://start-developer-competition-26.devpost.com/", eligibility:"Meta VR Start program membership, developer account and other rules required", tags:["AR / VR","AI"]
  },
  {
    slug:"qnx-global-hackathon-2026", title:"QNX Global Hackathon 2026", category:"Hackathons", country:"Worldwide", city:"Online", mode:"Online", organiser:"QNX",
    start:"2026-11-02", end:"2026-12-15", format:"Online hackathon", participants:[],
    description:"Global developer hackathon on the QNX ecosystem and embedded technology.",
    sourceURL:"https://qnx.devpost.com/", eligibility:"See official competition rules", tags:["IoT","AI"]
  },
  {
    slug:"reddit-game-day-2026", title:"Reddit Game of the Day Hackathon", category:"Hackathons", country:"Worldwide", city:"Online", mode:"Online", organiser:"Reddit",
    start:"2026-11-11", end:"2026-12-08", format:"Online hackathon", participants:[],
    description:"Build an interactive experience for the Reddit ecosystem.",
    sourceURL:"https://redditgameofday2026.devpost.com/", eligibility:"See official entry age and regional rules", tags:["Games","Developer tools"]
  },
  {
    slug:"global-strategy-challenge-2026", title:"Global Strategy Challenge", category:"Quant", country:"Worldwide", city:"Online", mode:"Online", organiser:"PM.finance",
    start:"2026-12-15", end:null, endLabel:"Finals begin 1 February 2027 (closing date unannounced)", registrationOpens:"2026-11-15", registrationDeadline:"2026-12-13",
    format:"Paper-trading qualifier, then trading finals", participants:[],
    description:"Quant strategy championship with separate crypto and US-equity divisions. Qualifier begins 15 December 2026; finals scheduled from 1 February 2027.",
    sourceURL:"https://pm.finance/contest", eligibility:"Individual or institution; eligibility verification required", tags:["Trading","Crypto","US equities"], featured:true
  },
  {
    slug:"istc-2027", title:"Indian Strategy & Trading Conclave 2027", category:"Quant", country:"India", city:"Mumbai", mode:"Hybrid", organiser:"ISTC",
    start:"2027-01-18", end:"2027-03-14", registrationNote:"Registration open on organiser page · checked 14 Nov 2026",
    format:"Prelims, qualifiers and in-person final", participants:[],
    description:"Quant trading and research tests, market-making simulations, arbitrage tasks and algorithmic poker. Mumbai grand finale 12–14 March 2027.",
    sourceURL:"https://istc.co/", eligibility:"Refer to organiser's participant criteria", tags:["Market making","Arbitrage","Algorithmic trading"], featured:true
  },
  {
    slug:"berkeley-trading-competition-2027", title:"Berkeley Trading Competition 2027", category:"Quant", country:"United States", city:"Berkeley", mode:"In person", organiser:"Traders at Berkeley",
    start:"2027-02-27", end:"2027-02-28", registrationDeadline:"2026-12-06",
    format:"Intercollegiate trading and quant research", participants:[],
    description:"Two days of trading cases and quantitative research challenges at UC Berkeley. Applications close 6 December 2026 (PST).",
    sourceURL:"https://traders.studentorg.berkeley.edu/competition/", eligibility:"Students; check application rules", tags:["Trading","Research"]
  },
  {
    slug:"mit-trading-competition-2027", title:"MIT Trading Competition 2027", category:"Quant", country:"United States", city:"Cambridge, Massachusetts", mode:"In person", organiser:"Traders@MIT",
    start:"2027-03-06", end:"2027-03-07", registrationDeadline:"2026-12-06",
    format:"Individual trading cases", participants:[],
    description:"A two-day intercollegiate trading championship. Organiser lists an application deadline of 6 December 2026 (ET).",
    sourceURL:"https://traders.mit.edu/competition.html", eligibility:"See university-level applicant requirements", tags:["Trading","Probability"]
  },
  {
    slug:"rotman-trading-competition-2027", title:"Rotman International Trading Competition 2027", category:"Quant", country:"Canada", city:"Toronto", mode:"In person", organiser:"University of Toronto",
    start:"2027-02-18", end:"2027-02-20", registrationNote:"Registration open on organiser page · checked 14 Nov 2026",
    format:"University teams · simulated trading cases", participants:[],
    description:"International student trading competition using the Rotman Interactive Trader simulator. Organiser currently invites team registration.",
    sourceURL:"https://www.rotman.utoronto.ca/faculty-and-research/education-labs/bmo-financial-group-finance-research-and-trading-lab/rotman-international-trading-competition/registration/",
    eligibility:"University teams; published team fees apply", tags:["Trading","Simulation"]
  },
  {
    slug:"stevens-hft-competition-2027", title:"Stevens High-Frequency Trading Competition", category:"Quant", country:"United States", city:"Online", mode:"Online", organiser:"Stevens Institute of Technology",
    start:"2027-04-02", end:"2027-05-07", registrationDeadline:"2027-02-15",
    format:"Multi-round algorithmic trading", participants:[],
    description:"Students build Python trading algorithms for the SHIFT simulator. Application deadline is 15 February 2027; contest days are in April and May.",
    sourceURL:"https://www.stevens.edu/events/high-frequency-trading-competition", eligibility:"Accredited-university undergraduates and graduates; published team fee follows selection", tags:["HFT","Python","Simulation"]
  },
  {
    slug:"alberta-commodities-2027", title:"International Commodities Trading Competition 2027", category:"Quant", country:"Worldwide", city:"Online", mode:"Online", organiser:"University of Alberta",
    start:"2027-03-12", end:"2027-03-12", registrationOpens:"2026-11-02",
    format:"Virtual commodity-trading competition", participants:[],
    description:"An international virtual commodities trading case competition hosted by University of Alberta. Registrations opened 2 November 2026.",
    sourceURL:"https://www.ualberta.ca/en/business/careers/experiential-learning/international-commodities-trading-competition.html",
    eligibility:"Eligible students and recent graduates; organiser lists CA$250 per team plus tax", tags:["Commodities","Risk","Trading"]
  },
  {
    slug:"cfa-research-challenge-2027", title:"CFA Institute Research Challenge 2027", category:"Quant", country:"Worldwide", city:"Singapore (global final)", mode:"Hybrid", organiser:"CFA Institute",
    start:"2027-04-06", end:null, endLabel:"Week of 10 May 2027 (global final)", dateNote:"Regional semifinals 6–7 April; finals 8–9 April; global final during week of 10 May 2027.",
    format:"Equity research and valuation presentations", participants:[],
    description:"University teams advance through local, subregional and regional rounds toward a global research final in Singapore.",
    sourceURL:"https://www.cfainstitute.org/insights/events/research-challenge", eligibility:"University teams through local CFA Society competitions", tags:["Equity research","Valuation"]
  },
  {
    slug:"worldquant-iqc-2026", title:"WorldQuant International Quant Championship 2026", category:"Quant", country:"Worldwide", city:"Singapore (finals)", mode:"Hybrid", organiser:"WorldQuant BRAIN",
    start:"2026-03-17", end:null, endLabel:"September 2026 (exact day not published)", statusOverride:"Completed", dateNote:"Global finals took place during September 2026; precise concluding day not stated in organiser overview.",
    format:"University teams · alpha research", participants:[],
    description:"The 2026 championship completed its advertised March–September competition cycle. Follow the official organiser for the next announced edition.",
    sourceURL:"https://www.worldquant.com/brain/iqc/", eligibility:"2026 university teams; registration period has ended", tags:["Alpha research","Quant signals"]
  }
];

export const CATEGORIES = ["All","Chess","Hackathons","Quant"];
export const COUNTRY_LIST = ["All countries",...Array.from(new Set(COMPETITIONS.map(event=>event.country))).sort((a,b)=>a.localeCompare(b))];

export function competitionStatus(event, today = new Date().toISOString().slice(0,10)) {
  if (event.statusOverride) return event.statusOverride;
  if (event.end && event.end < today) return "Completed";
  if (event.start && event.start > today) return "Upcoming";
  if (event.start && event.start <= today && !event.end) return "Schedule started";
  if (event.start && event.end && event.start <= today && event.end >= today) return "In progress";
  return "Schedule TBA";
}
export function registrationStatus(event, today = new Date().toISOString().slice(0,10)) {
  if (event.registrationDeadline && today > event.registrationDeadline) return "Applications closed";
  if (event.registrationOpens && today < event.registrationOpens) return "Opens " + event.registrationOpens;
  if (event.registrationDeadline && today <= event.registrationDeadline) return "Applications open · check eligibility";
  if (event.registrationOpens && today >= event.registrationOpens) return "Check registration availability";
  return event.registrationNote || "Check official event page";
}
export function eventBySlug(slug) { return COMPETITIONS.find(event=>event.slug===slug); }
