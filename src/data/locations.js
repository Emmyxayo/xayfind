export const COUNTRIES = [
  { id: "nigeria", name: "Nigeria", flag: "🇳🇬", currency: "₦" },
  { id: "uk",      name: "United Kingdom", flag: "🇬🇧", currency: "£" },
  { id: "usa",     name: "United States",  flag: "🇺🇸", currency: "$" },
];

export const REGIONS = {
  nigeria: [
    "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
    "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT – Abuja","Gombe",
    "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
    "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
    "Taraba","Yobe","Zamfara"
  ],
  uk: [
    "Bath","Birmingham","Bradford","Brighton","Bristol","Cambridge","Canterbury",
    "Carlisle","Chelmsford","Chester","Chichester","Coventry","Derby","Durham",
    "Ely","Exeter","Gloucester","Hereford","Kingston upon Hull","Lancaster",
    "Leeds","Leicester","Lichfield","Lincoln","Liverpool","London","Manchester",
    "Newcastle","Norwich","Nottingham","Oxford","Peterborough","Plymouth",
    "Portsmouth","Preston","Ripon","Salford","Salisbury","Sheffield","Southampton",
    "St Albans","Stoke-on-Trent","Sunderland","Truro","Wakefield","Wells",
    "Winchester","Wolverhampton","Worcester","York",
    "Edinburgh","Glasgow","Aberdeen","Inverness","Dundee","Stirling",
    "Cardiff","Swansea","Newport","Bangor",
    "Belfast","Derry","Armagh","Lisburn"
  ],
  usa: [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
    "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
    "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
    "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
    "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
    "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
    "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
    "Virginia","Washington","West Virginia","Wisconsin","Wyoming"
  ]
};

export const CATEGORIES = [
  { id:"hotels",      name:"Hotels",          icon:"🏨", desc:"Stay & relax" },
  { id:"restaurants", name:"Restaurants",     icon:"🍽️", desc:"Food & drinks" },
  { id:"shortlets",   name:"Shortlets",       icon:"🏠", desc:"Short-term apartments" },
  { id:"lounges",     name:"Lounges & Bars",  icon:"🥂", desc:"Chill & vibe" },
  { id:"salons",      name:"Salons & Spas",   icon:"💇", desc:"Beauty & wellness" },
  { id:"arcades",     name:"Arcade & Gaming", icon:"🎮", desc:"Fun & entertainment" },
  { id:"gadgets",     name:"Gadget Shops",    icon:"📱", desc:"Tech & electronics" },
  { id:"clothing",    name:"Clothing & Fashion", icon:"👗", desc:"Style & fashion" },
];

export const INITIAL_SPOTS = [
  {
    id:1, name:"The Wheatbaker", categoryId:"hotels", country:"nigeria", region:"Lagos",
    address:"14 Onitolo St, Ikoyi, Lagos", phone:"+234 812 345 6789",
    website:"", instagram:"", featured:true, verified:true, plan:"premium",
    status:"active", tags:["Luxury","Pool","WiFi","Spa"],
    images:[], desc:"A boutique luxury hotel in Ikoyi. Known for art-filled corridors, rooftop pool, and exceptional service.",
    hours:{ mon:"7:00–22:00", tue:"7:00–22:00", wed:"7:00–22:00", thu:"7:00–22:00", fri:"7:00–23:00", sat:"8:00–23:00", sun:"8:00–21:00" },
    deal:"", dealExpiry:"", rating:4.7, reviews:[], referredBy:"", createdAt: Date.now()-864e5*30
  },
  {
    id:2, name:"Quilox Club", categoryId:"lounges", country:"nigeria", region:"Lagos",
    address:"Plot 1376 Ozumba Mbadiwe, VI, Lagos", phone:"+234 900 123 4567",
    website:"", instagram:"@quiloxlagos", featured:true, verified:true, plan:"featured",
    status:"active", tags:["Nightlife","Bar","DJ","VIP"],
    images:[], desc:"Lagos's most iconic nightlife destination. A-list DJs, creative cocktails, electric crowd.",
    hours:{ mon:"Closed", tue:"Closed", wed:"20:00–04:00", thu:"20:00–04:00", fri:"20:00–05:00", sat:"20:00–05:00", sun:"Closed" },
    deal:"Free entry before 10pm on Wednesdays", dealExpiry:"2025-12-31", rating:4.5, reviews:[], referredBy:"", createdAt: Date.now()-864e5*20
  },
  {
    id:3, name:"The Shard View", categoryId:"lounges", country:"uk", region:"London",
    address:"32 London Bridge St, London SE1 9SG", phone:"+44 20 3011 1111",
    website:"theviewfromtheshard.com", instagram:"@theviewfromtheshard", featured:true, verified:true, plan:"premium",
    status:"active", tags:["Rooftop","Views","Cocktails","Premium"],
    images:[], desc:"Breathtaking views of London from the highest vantage point in the city. Cocktail bar and dining experiences.",
    hours:{ mon:"10:00–22:00", tue:"10:00–22:00", wed:"10:00–22:00", thu:"10:00–22:00", fri:"10:00–23:00", sat:"10:00–23:00", sun:"10:00–22:00" },
    deal:"", dealExpiry:"", rating:4.8, reviews:[], referredBy:"", createdAt: Date.now()-864e5*10
  },
  {
    id:4, name:"Nobu Restaurant NYC", categoryId:"restaurants", country:"usa", region:"New York",
    address:"105 Hudson St, New York, NY 10013", phone:"+1 212-219-0500",
    website:"noburestaurants.com", instagram:"@noburestaurants", featured:true, verified:true, plan:"premium",
    status:"active", tags:["Japanese","Fine Dining","Sushi","Celebrity"],
    images:[], desc:"World-renowned Japanese-Peruvian fusion restaurant. Robert De Niro's iconic NYC dining experience since 1994.",
    hours:{ mon:"17:30–22:00", tue:"17:30–22:00", wed:"17:30–22:00", thu:"17:30–22:00", fri:"17:30–23:00", sat:"17:30–23:00", sun:"17:30–22:00" },
    deal:"Omakase tasting menu Tuesdays", dealExpiry:"2025-11-30", rating:4.6, reviews:[], referredBy:"", createdAt: Date.now()-864e5*5
  },
  {
    id:5, name:"Lumière Spa & Salon", categoryId:"salons", country:"nigeria", region:"Rivers",
    address:"32 Rumuola Rd, Port Harcourt", phone:"+234 805 678 9012",
    website:"", instagram:"@lumierephy", featured:false, verified:true, plan:"featured",
    status:"active", tags:["Spa","Nails","Hair","Massage"],
    images:[], desc:"Full-service beauty salon offering hair, nails, skincare and massage treatments in Port Harcourt.",
    hours:{ mon:"9:00–19:00", tue:"9:00–19:00", wed:"9:00–19:00", thu:"9:00–19:00", fri:"9:00–20:00", sat:"8:00–20:00", sun:"Closed" },
    deal:"20% off all treatments on Mondays", dealExpiry:"2025-12-31", rating:4.4, reviews:[], referredBy:"", createdAt: Date.now()-864e5*15
  },
  {
    id:6, name:"Harrods", categoryId:"clothing", country:"uk", region:"London",
    address:"87-135 Brompton Rd, London SW1X 7XL", phone:"+44 20 7730 1234",
    website:"harrods.com", instagram:"@harrods", featured:false, verified:true, plan:"basic",
    status:"active", tags:["Luxury","Fashion","Department Store","Designer"],
    images:[], desc:"The world's most famous luxury department store. Seven floors of fashion, beauty, food, and more.",
    hours:{ mon:"10:00–21:00", tue:"10:00–21:00", wed:"10:00–21:00", thu:"10:00–21:00", fri:"10:00–21:00", sat:"10:00–21:00", sun:"11:30–18:00" },
    deal:"", dealExpiry:"", rating:4.5, reviews:[], referredBy:"", createdAt: Date.now()-864e5*8
  },
  {
    id:7, name:"GameZone Arcades", categoryId:"arcades", country:"nigeria", region:"Kano",
    address:"Sahad Stores Complex, Kano", phone:"+234 813 000 1111",
    website:"", instagram:"", featured:false, verified:false, plan:"basic",
    status:"active", tags:["Gaming","Family","VR","Snacks"],
    images:[], desc:"The biggest arcade in Northern Nigeria. 80+ game stations, VR pods, and a snack bar for all ages.",
    hours:{ mon:"10:00–21:00", tue:"10:00–21:00", wed:"10:00–21:00", thu:"10:00–21:00", fri:"10:00–22:00", sat:"9:00–22:00", sun:"10:00–20:00" },
    deal:"", dealExpiry:"", rating:4.2, reviews:[], referredBy:"", createdAt: Date.now()-864e5*25
  },
  {
    id:8, name:"Apple Store Chicago", categoryId:"gadgets", country:"usa", region:"Illinois",
    address:"401 N Michigan Ave, Chicago, IL 60611", phone:"+1 312-529-9500",
    website:"apple.com", instagram:"@apple", featured:false, verified:true, plan:"basic",
    status:"active", tags:["Apple","Tech","Flagship","Repairs"],
    images:[], desc:"Iconic Apple flagship store on the Chicago Riverwalk. Full range of Apple products, Genius Bar, and workshops.",
    hours:{ mon:"10:00–21:00", tue:"10:00–21:00", wed:"10:00–21:00", thu:"10:00–21:00", fri:"10:00–21:00", sat:"10:00–21:00", sun:"11:00–18:00" },
    deal:"", dealExpiry:"", rating:4.3, reviews:[], referredBy:"", createdAt: Date.now()-864e5*3
  },
];

export const BLOG_POSTS = [
  { id:1, title:"Top 10 Restaurants in Lagos You Must Try in 2025", country:"nigeria", category:"restaurants", excerpt:"From jollof rice to sushi — Lagos dining scene has never been hotter. We round up the spots that are setting the standard.", image:"", date:"2025-11-15", author:"XayFind Team", readTime:"5 min" },
  { id:2, title:"Best Hidden Bars in London Right Now", country:"uk", category:"lounges", excerpt:"Skip the tourist traps. These under-the-radar London bars are where the locals actually go for a great night out.", image:"", date:"2025-11-10", author:"XayFind Team", readTime:"4 min" },
  { id:3, title:"New York's Most Iconic Hotels: A 2025 Guide", country:"usa", category:"hotels", excerpt:"Whether you want a classic Manhattan experience or something boutique and edgy — NYC has a hotel for every vibe.", image:"", date:"2025-11-05", author:"XayFind Team", readTime:"6 min" },
];

// Alias so both import names work

