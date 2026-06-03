import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import { COUNTRIES, REGIONS, BLOG_POSTS } from './data/locations';

const DEFAULT_CATEGORIES = [
  { id:"hotels",      name:"Hotels",             icon:"🏨" },
  { id:"restaurants", name:"Restaurants",        icon:"🍽️" },
  { id:"shortlets",   name:"Shortlets",          icon:"🏠" },
  { id:"lounges",     name:"Lounges & Bars",     icon:"🥂" },
  { id:"salons",      name:"Salons & Spas",      icon:"💇" },
  { id:"arcades",     name:"Arcade & Gaming",    icon:"🎮" },
  { id:"gadgets",     name:"Gadget Shops",       icon:"📱" },
  { id:"clothing",    name:"Clothing & Fashion", icon:"👗" },
];

function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function isOpenNow(hours) {
  if (!hours) return null;
  const days = ['sun','mon','tue','wed','thu','fri','sat'];
  const now  = new Date();
  const day  = days[now.getDay()];
  const h    = hours[day];
  if (!h || h === 'Closed') return false;
  const [open, close] = h.split('–');
  if (!open || !close) return null;
  const toMins = s => { const [hh,mm] = s.trim().split(':').map(Number); return hh*60+(mm||0); };
  const cur = now.getHours()*60+now.getMinutes();
  const o = toMins(open), c = toMins(close);
  return c < o ? cur >= o || cur < c : cur >= o && cur < c;
}

function dbToSpot(row) {
  return {
    id: row.id, name: row.name, categoryId: row.category_id,
    country: row.country, region: row.region, address: row.address,
    phone: row.phone, website: row.website||'', instagram: row.instagram||'',
    desc: row.description||'', plan: row.plan||'basic', status: row.status||'active',
    featured: row.featured||false, verified: row.verified||false,
    tags: row.tags||[], images: row.images||[], deal: row.deal||'',
    dealExpiry: row.deal_expiry||'', hours: row.hours||{},
    rating: row.rating||0, reviews: row.reviews||[],
    referredBy: row.referred_by||'', createdAt: new Date(row.created_at).getTime(),
  };
}

function spotToDB(spot) {
  return {
    name: spot.name, category_id: spot.categoryId, country: spot.country,
    region: spot.region, address: spot.address, phone: spot.phone,
    website: spot.website||'', instagram: spot.instagram||'',
    description: spot.desc||'', plan: spot.plan||'basic', status: spot.status||'active',
    featured: spot.featured||false, verified: spot.verified||false,
    tags: spot.tags||[], images: spot.images||[], deal: spot.deal||'',
    deal_expiry: spot.dealExpiry||'', hours: spot.hours||{},
    rating: spot.rating||0, reviews: spot.reviews||[], referred_by: spot.referredBy||'',
  };
}

function TagInput({ tags, onChange }) {
  const [input,setInput]=useState('');
  const add=()=>{const t=input.trim();if(t&&!tags.includes(t))onChange([...tags,t]);setInput('');};
  return (
    <div className="tag-input-row" onClick={e=>e.currentTarget.querySelector('input').focus()}>
      {tags.map(t=><span key={t} className="tag-input-tag">{t}<button onClick={()=>onChange(tags.filter(x=>x!==t))}>✕</button></span>)}
      <input className="tag-input-field" value={input} placeholder="Type & press Enter"
        onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add();}}}/>
    </div>
  );
}

function ImageUploader({ images, onChange }) {
  const fileRef=useRef();
  const handleFiles=async files=>{
    const newImgs=[];
    for(const file of Array.from(files)){
      if(!file.type.startsWith('image/'))continue;
      const url=await readFileAsDataURL(file);
      newImgs.push(url);
    }
    onChange([...images,...newImgs]);
  };
  return (
    <div>
      <div className="img-upload-grid">
        {images.map((img,i)=>(
          <div key={i} className="img-thumb">
            <img src={img} alt={`Upload ${i+1}`}/>
            <button className="img-remove" onClick={()=>onChange(images.filter((_,j)=>j!==i))}>✕</button>
            {i===0&&<span className="img-main-badge">Main</span>}
          </div>
        ))}
        <div className="img-add" onClick={()=>fileRef.current.click()}>
          <span style={{fontSize:22}}>📷</span>
          <span style={{fontSize:12}}>Add photo</span>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{display:'none'}}
        onChange={e=>handleFiles(e.target.files)}/>
      <p style={{fontSize:12,color:'var(--muted)',marginTop:6}}>First image = main photo.</p>
    </div>
  );
}

function GlobeHero() {
  return (
    <div className="hero-globe">
      <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="globeGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#2a1a0a"/><stop offset="100%" stopColor="#0a0a0a"/>
          </radialGradient>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#FF5C00" stopOpacity="0"/>
          </radialGradient>
          <clipPath id="globeClip"><circle cx="110" cy="110" r="88"/></clipPath>
        </defs>
        <circle cx="110" cy="110" r="108" fill="url(#glowGrad)"/>
        <circle cx="110" cy="110" r="88" fill="url(#globeGrad)" stroke="#FF5C00" strokeWidth="1.5" strokeOpacity="0.6"/>
        <g clipPath="url(#globeClip)" stroke="#FF5C00" strokeOpacity="0.18" strokeWidth="0.8" fill="none">
          <line x1="22" y1="110" x2="198" y2="110"/><line x1="110" y1="22" x2="110" y2="198"/>
          <ellipse cx="110" cy="110" rx="88" ry="44"/><ellipse cx="110" cy="110" rx="88" ry="22"/>
          <ellipse cx="110" cy="110" rx="44" ry="88"/><ellipse cx="110" cy="110" rx="22" ry="88"/>
          <line x1="32" y1="66" x2="188" y2="66"/><line x1="32" y1="154" x2="188" y2="154"/>
        </g>
        <g clipPath="url(#globeClip)" fill="#FF5C00" fillOpacity="0.22">
          <ellipse cx="90" cy="85" rx="30" ry="18"/><ellipse cx="145" cy="95" rx="20" ry="14"/>
          <ellipse cx="75" cy="128" rx="22" ry="12"/><ellipse cx="130" cy="130" rx="16" ry="10"/>
          <ellipse cx="158" cy="118" rx="12" ry="8"/>
        </g>
        <circle cx="148" cy="82" r="34" stroke="#FF5C00" strokeWidth="5" fill="rgba(255,92,0,0.08)"/>
        <line x1="174" y1="108" x2="196" y2="130" stroke="#FF5C00" strokeWidth="6" strokeLinecap="round"/>
        <circle cx="136" cy="70" r="8" fill="white" fillOpacity="0.07"/>
        <circle cx="90" cy="85" r="4" fill="#FF5C00"/><circle cx="90" cy="85" r="8" fill="#FF5C00" fillOpacity="0.3"/>
        <circle cx="145" cy="95" r="3.5" fill="#FF5C00"/><circle cx="145" cy="95" r="7" fill="#FF5C00" fillOpacity="0.25"/>
        <circle cx="75" cy="128" r="3" fill="#FF5C00"/><circle cx="75" cy="128" r="6" fill="#FF5C00" fillOpacity="0.2"/>
      </svg>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'80px 24px',flexDirection:'column',gap:16}}>
      <div style={{width:40,height:40,border:'3px solid var(--dark4)',borderTop:'3px solid var(--orange)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'var(--text2)',fontSize:14}}>Loading spots...</p>
    </div>
  );
}

function useRouter() {
  const [page,setPage]=useState('home');
  const [params,setParams]=useState({});
  const navigate=useCallback((p,prms={})=>{setPage(p);setParams(prms);window.scrollTo(0,0);},[]);
  return {page,params,navigate};
}

function Navbar({navigate,activeCountry,setActiveCountry}){
  const [showDrop,setShowDrop]=useState(false);
  const country=COUNTRIES.find(c=>c.id===activeCountry)||COUNTRIES[0];
  return(
    <nav className="navbar">
      <span className="nav-logo" onClick={()=>navigate('home')}>Xay<span>Find</span></span>
      <div className="nav-links">
        <button className="nav-link" onClick={()=>navigate('browse')}>Browse</button>
        <button className="nav-link" onClick={()=>navigate('deals')}>Deals 🏷️</button>
        <button className="nav-link" onClick={()=>navigate('blog')}>Blog</button>
        <button className="nav-link" onClick={()=>navigate('pricing')}>Pricing</button>
        <button className="nav-link" onClick={()=>navigate('contact')}>Contact</button>
        <div className="country-selector" onClick={()=>setShowDrop(d=>!d)} style={{position:'relative'}}>
          <span>{activeCountry==='all'?'🌍':country.flag}</span>
          <span>{activeCountry==='all'?'All':country.name}</span>
          <span style={{fontSize:10}}>▾</span>
          {showDrop&&(
            <div className="country-dropdown">
              <div className={`country-option ${activeCountry==='all'?'active':''}`}
                onClick={e=>{e.stopPropagation();setActiveCountry('all');setShowDrop(false);}}>
                <span>🌍</span><span>All Countries</span>
              </div>
              {COUNTRIES.map(c=>(
                <div key={c.id} className={`country-option ${c.id===activeCountry?'active':''}`}
                  onClick={e=>{e.stopPropagation();setActiveCountry(c.id);setShowDrop(false);}}>
                  <span>{c.flag}</span><span>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="nav-btn" onClick={()=>navigate('vendor-login')}>Vendor Login</button>
      </div>
    </nav>
  );
}

function Footer({navigate,categories}){
  return(
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">Xay<span>Find</span></div>
          <p className="footer-desc">Discover the best spots across Nigeria 🇳🇬, the UK 🇬🇧, and the USA 🇺🇸.</p>
          <p style={{marginTop:14,fontSize:13,color:'var(--muted)'}}>A Xayion product.</p>
        </div>
        <div className="footer-col">
          <h4>Discover</h4>
          <span onClick={()=>navigate('browse')}>All Spots</span>
          <span onClick={()=>navigate('deals')}>Deals & Offers</span>
          <span onClick={()=>navigate('blog')}>Blog</span>
          {categories.map(c=><span key={c.id} onClick={()=>navigate('category',{cat:c.id})}>{c.name}</span>)}
        </div>
        <div className="footer-col">
          <h4>Vendors</h4>
          <span onClick={()=>navigate('pricing')}>Pricing Plans</span>
          <span onClick={()=>navigate('contact')}>List Your Spot</span>
          <span onClick={()=>navigate('vendor-login')}>Vendor Login</span>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <span onClick={()=>navigate('about')}>About XayFind</span>
          <span onClick={()=>navigate('contact')}>Contact Us</span>
          <span>Privacy Policy</span><span>Terms of Service</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2025 XayFind by Xayion. All rights reserved.</span>
        <span>🇳🇬 🇬🇧 🇺🇸 Made for the world.</span>
      </div>
    </footer>
  );
}

function SpotCard({spot,navigate,categories}){
  if(!spot||!spot.categoryId) return null;
  const cat=(categories||[]).find(c=>c.id===spot.categoryId)||{name:'Spot',icon:'📍'};
  const mainImg=spot.images&&spot.images.length>0?spot.images[0]:null;
  const openSt=isOpenNow(spot.hours);
  const country=COUNTRIES.find(c=>c.id===spot.country);
  return(
    <div className="spot-card" onClick={()=>navigate('spot',{id:spot.id})}>
      <div className="spot-img">
        {mainImg?<img src={mainImg} alt={spot.name}/>:<span>{cat?.icon||'📍'}</span>}
        {spot.images&&spot.images.length>1&&<span className="spot-img-count">+{spot.images.length-1}</span>}
      </div>
      <div className="spot-body">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <div className="spot-cat">{cat?.name||'Spot'}</div>
          <div style={{display:'flex',gap:5}}>
            {openSt===true&&<span className="spot-badge badge-open">● Open</span>}
            {openSt===false&&<span className="spot-badge badge-closed">● Closed</span>}
          </div>
        </div>
        <div className="spot-name">{spot.name}</div>
        <div className="spot-loc">📍 {spot.region} {country?.flag}</div>
        <div className="spot-tags">{(spot.tags||[]).slice(0,3).map(t=><span key={t} className="spot-tag">{t}</span>)}</div>
        <div className="spot-footer">
          <div className="spot-rating">
            <span className="spot-rating-star">★</span>
            <span>{spot.rating?.toFixed(1)||'—'}</span>
            <span style={{color:'var(--muted)',fontSize:12}}>({spot.reviews?.length||0})</span>
          </div>
          <div className="spot-badges">
            {spot.featured&&<span className="spot-badge badge-featured">⭐ Featured</span>}
            {spot.verified&&<span className="spot-badge badge-verified">✓ Verified</span>}
            {spot.deal&&<span className="spot-badge badge-deal">🏷️ Deal</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({navigate,spots,categories,activeCountry,setActiveCountry,loading}){
  const [query,setQuery]=useState('');
  const [results,setResults]=useState([]);
  const [showRes,setShowRes]=useState(false);
  const search=()=>{
    if(!query.trim())return;
    const q=query.toLowerCase();
    setResults(spots.filter(s=>
      s.name.toLowerCase().includes(q)||s.region.toLowerCase().includes(q)||
      (s.categoryId||'').toLowerCase().includes(q)||(s.tags||[]).some(t=>t.toLowerCase().includes(q))
    ));
    setShowRes(true);
  };
  const featured=spots.filter(s=>s.featured&&s.status==='active'&&(activeCountry==='all'||s.country===activeCountry));
  const withDeals=spots.filter(s=>s.deal&&s.status==='active');
  return(
    <div>
      <div className="hero">
        <div className="hero-bg"><div className="hero-bg-glow"/><div className="hero-grid"/></div>
        <div className="hero-badge fade-up"><span className="hero-badge-dot"/>Discover spots worldwide</div>
        <GlobeHero/>
        <h1 className="fade-up-1">Find the Best <span>Spots</span><br/>Across the Globe</h1>
        <p className="hero-sub fade-up-2">Hotels, restaurants, shortlets, lounges, salons and more — Nigeria, UK & USA all in one place.</p>
        <div className="country-tabs fade-up-3">
          <button className={`country-tab ${activeCountry==='all'?'active':''}`} onClick={()=>setActiveCountry('all')}>🌍 All Countries</button>
          {COUNTRIES.map(c=><button key={c.id} className={`country-tab ${activeCountry===c.id?'active':''}`} onClick={()=>setActiveCountry(c.id)}>{c.flag} {c.name}</button>)}
        </div>
        <div className="hero-actions fade-up-3">
          <button className="btn-primary" onClick={()=>navigate('browse')}>Explore Spots</button>
          <button className="btn-secondary" onClick={()=>navigate('deals')}>View Deals 🏷️</button>
        </div>
        <div className="search-wrap fade-up-4" style={{position:'relative'}}>
          <input placeholder="Search spots, cities, categories..."
            value={query} onChange={e=>{setQuery(e.target.value);if(!e.target.value)setShowRes(false);}}
            onKeyDown={e=>e.key==='Enter'&&search()}/>
          <button onClick={search}>🔍</button>
          {showRes&&results.length>0&&(
            <div className="search-results">
              {results.map(r=>{
                const cat=categories.find(c=>c.id===r.categoryId);
                const country=COUNTRIES.find(c=>c.id===r.country);
                return(
                  <div key={r.id} className="search-result-item" onClick={()=>{navigate('spot',{id:r.id});setShowRes(false);}}>
                    <span style={{fontSize:22}}>{cat?.icon||'📍'}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14}}>{r.name}</div>
                      <div style={{fontSize:12,color:'var(--text2)'}}>{r.region} {country?.flag} · {cat?.name}</div>
                    </div>
                    {r.featured&&<span className="spot-badge badge-featured">⭐</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="hero-stats fade-up-5" style={{marginTop:52}}>
          {[
            {num:loading?'...':spots.length+'+',label:'Spots listed'},
            {num:'3',label:'Countries'},
            {num:categories.length,label:'Categories'},
            {num:'Free',label:'For users'},
          ].map(s=>(
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-num">{s.num}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-label">What are you looking for?</div>
        <h2 className="section-title">Browse by Category</h2>
        <p className="section-sub">From luxury hotels to gadget shops — every spot type covered.</p>
        <div className="cat-grid">
          {categories.map(c=>(
            <div key={c.id} className="cat-card" onClick={()=>navigate('category',{cat:c.id})}>
              <span className="cat-icon">{c.icon}</span>
              <div className="cat-name">{c.name}</div>
              <div className="cat-count">{spots.filter(s=>s.categoryId===c.id&&s.status==='active'&&(activeCountry==='all'||s.country===activeCountry)).length} spots</div>
            </div>
          ))}
        </div>
      </div>

      <hr className="divider"/>

      <div className="section">
        <div className="section-label">Hand-picked</div>
        <h2 className="section-title">Featured Spots</h2>
        <p className="section-sub">Verified, top-rated spots raising the bar.</p>
        {loading?<Spinner/>:featured.length>0
          ?<div className="spots-grid">{featured.slice(0,6).map(s=><SpotCard key={s.id} spot={s} navigate={navigate} categories={categories}/>)}</div>
          :<div className="empty"><div className="empty-icon">🌟</div><h3>No featured spots yet</h3><p>Add your first vendor from the <span className="link" onClick={()=>navigate('vendor-login')}>admin panel</span>.</p></div>
        }
      </div>

      <hr className="divider"/>

      {withDeals.length>0&&(
        <>
          <div className="section">
            <div className="section-label">Limited time</div>
            <h2 className="section-title">Active Deals 🏷️</h2>
            <div className="deals-grid">
              {withDeals.slice(0,3).map(s=>(
                <div key={s.id} className="deal-card" onClick={()=>navigate('spot',{id:s.id})}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                    <div className="deal-icon">{categories.find(c=>c.id===s.categoryId)?.icon||'🏷️'}</div>
                    <span>{COUNTRIES.find(c=>c.id===s.country)?.flag}</span>
                  </div>
                  <div className="deal-title">{s.name}</div>
                  <div className="deal-desc">{s.deal}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>📍 {s.region}</div>
                  {s.dealExpiry&&<div className="deal-expiry">⏰ Expires {s.dealExpiry}</div>}
                </div>
              ))}
            </div>
            <div style={{textAlign:'center',marginTop:28}}>
              <button className="btn-secondary" onClick={()=>navigate('deals')}>View All Deals →</button>
            </div>
          </div>
          <hr className="divider"/>
        </>
      )}

      <div className="section">
        <div className="section-label">For vendors</div>
        <h2 className="section-title">Get Your Spot Listed</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:20}}>
          {[
            {n:'01',t:'Reach out',d:'Fill our contact form about your spot.'},
            {n:'02',t:'We verify',d:'Our team reviews and sets up your listing.'},
            {n:'03',t:'Choose a plan',d:'Pay monthly via Paystack or Stripe.'},
            {n:'04',t:'Get discovered',d:'Thousands of users across 3 countries find you.'},
          ].map(s=>(
            <div key={s.n} style={{background:'var(--dark2)',border:'1px solid var(--border)',borderRadius:18,padding:'28px 22px'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:44,fontWeight:800,color:'var(--orange-glow)',WebkitTextStroke:'1px var(--orange)',lineHeight:1,marginBottom:14}}>{s.n}</div>
              <div style={{fontFamily:'var(--font-display)',fontSize:17,fontWeight:700,marginBottom:8}}>{s.t}</div>
              <p style={{color:'var(--text2)',fontSize:14,lineHeight:1.7}}>{s.d}</p>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',marginTop:40}}>
          <button className="btn-primary" onClick={()=>navigate('contact')}>List My Spot →</button>
        </div>
      </div>

      <hr className="divider"/>

      <div className="section">
        <div className="section-label">Discover more</div>
        <h2 className="section-title">From the XayFind Blog</h2>
        <div className="blog-grid">
          {BLOG_POSTS.map(post=>(
            <div key={post.id} className="blog-card" onClick={()=>navigate('blog-post',{id:post.id})}>
              <div className="blog-img">{categories.find(c=>c.id===post.category)?.icon||'📝'}</div>
              <div className="blog-body">
                <div className="blog-meta">
                  <span>{COUNTRIES.find(c=>c.id===post.country)?.flag} {post.date}</span>
                  <span>⏱ {post.readTime}</span>
                </div>
                <div className="blog-title">{post.title}</div>
                <div className="blog-excerpt">{post.excerpt}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',marginTop:28}}>
          <button className="btn-secondary" onClick={()=>navigate('blog')}>Read All Posts →</button>
        </div>
      </div>
    </div>
  );
}

// Approximate coordinates for regions so map pins land in the right area
const REGION_COORDS={
  'Lagos':[6.5244,3.3792],'FCT – Abuja':[9.0765,7.3986],'Rivers':[4.8156,7.0498],'Kano':[12.0022,8.5920],
  'Oyo':[8.1574,3.6147],'Anambra':[6.2209,6.9370],'Delta':[5.7040,5.9339],'Enugu':[6.5244,7.5186],
  'Kaduna':[10.5105,7.4165],'Ogun':[7.1608,3.3483],'Imo':[5.5720,7.0588],'Edo':[6.3350,5.6037],
  'London':[51.5074,-0.1278],'Manchester':[53.4808,-2.2426],'Edinburgh':[55.9533,-3.1883],
  'Birmingham':[52.4862,-1.8904],'Glasgow':[55.8642,-4.2518],'Liverpool':[53.4084,-2.9916],
  'Leeds':[53.8008,-1.5491],'Bristol':[51.4545,-2.5879],'Cardiff':[51.4816,-3.1791],
  'New York':[40.7128,-74.0060],'California':[36.7783,-119.4179],'Texas':[31.9686,-99.9018],
  'Florida':[27.6648,-81.5158],'Illinois':[40.6331,-89.3985],'Washington':[47.7511,-120.7401],
  'Massachusetts':[42.4072,-71.3824],'Georgia':[32.1656,-82.9001],'Nevada':[38.8026,-116.4194],
};

function MapView({spots,categories,navigate}){
  const mapRef=useRef(null);
  const containerRef=useRef(null);
  useEffect(()=>{
    if(!window.L||!containerRef.current)return;
    const L=window.L;
    if(!mapRef.current){
      mapRef.current=L.map(containerRef.current).setView([20,0],2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(mapRef.current);
    }
    const map=mapRef.current;
    map.eachLayer(layer=>{if(layer instanceof L.Marker)map.removeLayer(layer);});
    const bounds=[];
    spots.forEach(s=>{
      const coords=REGION_COORDS[s.region];
      if(!coords)return;
      const lat=coords[0]+(Math.random()-0.5)*0.08;
      const lng=coords[1]+(Math.random()-0.5)*0.08;
      const cat=categories.find(c=>c.id===s.categoryId);
      const marker=L.marker([lat,lng]).addTo(map);
      marker.bindPopup(`<div style="font-family:sans-serif;min-width:160px"><div style="font-size:22px">${cat?.icon||'📍'}</div><div style="font-weight:700;font-size:14px;margin:4px 0">${s.name}</div><div style="font-size:12px;color:#666">${cat?.name||''} · ${s.region}</div><div style="font-size:12px;margin-top:4px">⭐ ${s.rating?.toFixed(1)||'—'}</div><button id="spot-btn-${s.id}" style="margin-top:8px;background:#FF5C00;color:#fff;border:none;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;width:100%">View details →</button></div>`);
      marker.on('popupopen',()=>{const btn=document.getElementById(`spot-btn-${s.id}`);if(btn)btn.onclick=()=>navigate('spot',{id:s.id});});
      bounds.push([lat,lng]);
    });
    if(bounds.length>0)map.fitBounds(bounds,{padding:[50,50],maxZoom:12});
  },[spots,categories,navigate]);
  return <div ref={containerRef} style={{height:'600px',width:'100%',borderRadius:'var(--radius-lg)',overflow:'hidden',border:'1px solid var(--border)'}}/>;
}

function BrowsePage({navigate,spots,categories,loading}){
  const [selCat,setSelCat]=useState('all');
  const [selRegion,setSelRegion]=useState('all');
  const [selCountry,setSelCountry]=useState('all');
  const [search,setSearch]=useState('');
  const [sortBy,setSortBy]=useState('featured');
  const [view,setView]=useState('list');
  const regions=selCountry==='all'?[]:(REGIONS[selCountry]||[]);
  let filtered=(spots||[]).filter(s=>{
    const cOk=selCountry==='all'||s.country===selCountry;
    const catOk=selCat==='all'||s.categoryId===selCat;
    const rOk=selRegion==='all'||s.region===selRegion;
    const q=search.toLowerCase();
    const sOk=!q||s.name.toLowerCase().includes(q)||s.region.toLowerCase().includes(q)||(s.tags||[]).some(t=>t.toLowerCase().includes(q));
    return cOk&&catOk&&rOk&&sOk&&s.status==='active';
  });
  if(sortBy==='featured')filtered=[...filtered].sort((a,b)=>(b.featured?1:0)-(a.featured?1:0));
  if(sortBy==='rating')filtered=[...filtered].sort((a,b)=>(b.rating||0)-(a.rating||0));
  if(sortBy==='newest')filtered=[...filtered].sort((a,b)=>b.createdAt-a.createdAt);
  return(
    <div className="section">
      <div className="section-label">Explore</div>
      <h2 className="section-title">Browse All Spots</h2>
      <div className="country-tabs" style={{marginBottom:20}}>
        <button className={`country-tab ${selCountry==='all'?'active':''}`} onClick={()=>{setSelCountry('all');setSelRegion('all');}}>🌍 All</button>
        {COUNTRIES.map(c=><button key={c.id} className={`country-tab ${selCountry===c.id?'active':''}`} onClick={()=>{setSelCountry(c.id);setSelRegion('all');}}>{c.flag} {c.name}</button>)}
      </div>
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
        <input className="search-input-plain" style={{marginBottom:0,flex:1,minWidth:180}} placeholder="Search spots..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{background:'var(--dark3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'var(--font-body)',fontSize:13,padding:'10px 14px',outline:'none'}}>
          <option value="featured">Featured first</option>
          <option value="rating">Top rated</option>
          <option value="newest">Newest</option>
        </select>
        <div style={{display:'flex',gap:4,background:'var(--dark3)',border:'1px solid var(--border)',borderRadius:8,padding:3}}>
          <button onClick={()=>setView('list')} style={{background:view==='list'?'var(--orange)':'transparent',color:view==='list'?'#fff':'var(--text2)',border:'none',borderRadius:6,padding:'7px 14px',fontSize:13,cursor:'pointer',fontFamily:'var(--font-body)'}}>☰ List</button>
          <button onClick={()=>setView('map')} style={{background:view==='map'?'var(--orange)':'transparent',color:view==='map'?'#fff':'var(--text2)',border:'none',borderRadius:6,padding:'7px 14px',fontSize:13,cursor:'pointer',fontFamily:'var(--font-body)'}}>🗺️ Map</button>
        </div>
      </div>
      <div className="chip-row" style={{marginBottom:14}}>
        <span className={`chip ${selCat==='all'?'active':''}`} onClick={()=>setSelCat('all')}>All</span>
        {categories.map(c=><span key={c.id} className={`chip ${selCat===c.id?'active':''}`} onClick={()=>setSelCat(c.id)}>{c.icon} {c.name}</span>)}
      </div>
      {regions.length>0&&(
        <div className="chip-row" style={{marginBottom:36,flexWrap:'nowrap',overflowX:'auto',paddingBottom:4}}>
          <span className={`chip ${selRegion==='all'?'active':''}`} onClick={()=>setSelRegion('all')}>All regions</span>
          {regions.map(r=><span key={r} className={`chip ${selRegion===r?'active':''}`} style={{whiteSpace:'nowrap'}} onClick={()=>setSelRegion(r)}>{r}</span>)}
        </div>
      )}
      <p style={{color:'var(--text2)',fontSize:13,marginBottom:20}}>{loading?'Loading...':`${filtered.length} spot${filtered.length!==1?'s':''} found`}</p>
      {loading?<Spinner/>:view==='map'
        ?(filtered.length>0?<MapView spots={filtered} categories={categories} navigate={navigate}/>:<div className="empty"><div className="empty-icon">🗺️</div><h3>No spots to map</h3></div>)
        :filtered.length>0
          ?<div className="spots-grid">{filtered.map(s=><SpotCard key={s.id} spot={s} navigate={navigate} categories={categories}/>)}</div>
          :<div className="empty"><div className="empty-icon">🔍</div><h3>No spots found</h3><p>Try different filters.</p></div>
      }
    </div>
  );
}

function CategoryPage({cat,navigate,spots,categories,loading}){
  const category=(categories||[]).find(c=>c.id===cat);
  const catSpots=(spots||[]).filter(s=>s&&s.categoryId===cat&&s.status==='active');
  return(
    <div className="section">
      <button className="back-btn" onClick={()=>navigate('browse')}>← Browse</button>
      <div className="section-label">Category</div>
      <h2 className="section-title">{category?.icon} {category?.name}</h2>
      <p className="section-sub">{catSpots.length} listing{catSpots.length!==1?'s':''} across Nigeria, UK & USA</p>
      {loading?<Spinner/>:catSpots.length>0
        ?<div className="spots-grid">{catSpots.map(s=><SpotCard key={s.id} spot={s} navigate={navigate} categories={categories}/>)}</div>
        :<div className="empty"><div className="empty-icon">{category?.icon||'📍'}</div><h3>No {category?.name||'spots'} listed yet</h3><p><span className="link" onClick={()=>navigate('contact')}>Be the first →</span></p></div>
      }
    </div>
  );
}

function SpotDetailPage({id,navigate,spots,setSpots,categories}){
  const [activeImg,setActiveImg]=useState(0);
  const [reviewText,setReviewText]=useState('');
  const [reviewName,setReviewName]=useState('');
  const [reviewStars,setReviewStars]=useState(5);
  const [saved,setSaved]=useState(false);
  const [copied,setCopied]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const spot=spots.find(s=>s.id===Number(id));
  if(!spot)return<div className="section"><div className="empty"><h3>Spot not found</h3></div></div>;
  const cat=categories.find(c=>c.id===spot.categoryId);
  const country=COUNTRIES.find(c=>c.id===spot.country);
  const openSt=isOpenNow(spot.hours);
  const related=spots.filter(s=>s.region===spot.region&&s.id!==spot.id&&s.status==='active').slice(0,3);
  const DAYS=[['mon','Mon'],['tue','Tue'],['wed','Wed'],['thu','Thu'],['fri','Fri'],['sat','Sat'],['sun','Sun']];
  const submitReview=async()=>{
    if(!reviewText.trim()||!reviewName.trim())return;
    setSubmitting(true);
    const newReview={name:reviewName,text:reviewText,stars:reviewStars,date:new Date().toLocaleDateString('en-GB')};
    const allReviews=[...(spot.reviews||[]),newReview];
    const newRating=allReviews.reduce((s,r)=>s+r.stars,0)/allReviews.length;
    const rounded=Math.round(newRating*10)/10;
    const {error}=await supabase.from('spots').update({reviews:allReviews,rating:rounded}).eq('id',spot.id);
    if(!error){setSpots(prev=>prev.map(s=>s.id===spot.id?{...s,reviews:allReviews,rating:rounded}:s));setReviewText('');setReviewName('');setReviewStars(5);}
    setSubmitting(false);
  };
  const copyLink=()=>{navigator.clipboard?.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),2000);};

  // Build a search string for maps from the spot's address + region + country
  const mapsQuery=encodeURIComponent(`${spot.name}, ${spot.address}, ${spot.region}`);

  // Open Google Maps with directions from the user's CURRENT location to the spot
  const getDirections=()=>{
    // This URL tells Google Maps "directions to this destination" — it auto-detects the user's live location as the start point
    const url=`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}&travelmode=driving`;
    window.open(url,'_blank');
  };

  // Open the spot's location on a map (no directions, just show it)
  const openInMaps=()=>{
    const url=`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
    window.open(url,'_blank');
  };
  return(
    <div>
      <div className="spot-detail-hero">
        {spot.images&&spot.images.length>0?<img src={spot.images[activeImg]} alt={spot.name}/>:<span>{cat?.icon||'📍'}</span>}
      </div>
      {spot.images&&spot.images.length>1&&(
        <div className="spot-gallery-thumbs">
          {spot.images.map((img,i)=><div key={i} className={`spot-gallery-thumb ${i===activeImg?'active':''}`} onClick={()=>setActiveImg(i)}><img src={img} alt={`View ${i+1}`}/></div>)}
        </div>
      )}
      <div className="spot-detail-body">
        <button className="back-btn" onClick={()=>navigate('browse')}>← Back</button>
        <div className="spot-detail-grid">
          <div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
              <span className="spot-cat">{cat?.name}</span>
              {spot.featured&&<span className="spot-badge badge-featured">⭐ Featured</span>}
              {spot.verified&&<span className="spot-badge badge-verified">✓ Verified</span>}
              {openSt===true&&<span className="spot-badge badge-open">● Open now</span>}
              {openSt===false&&<span className="spot-badge badge-closed">● Closed</span>}
            </div>
            <h1 className="spot-detail-title">{spot.name}</h1>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
              <span style={{color:'var(--yellow)',fontSize:18}}>{'★'.repeat(Math.round(spot.rating||0))}{'☆'.repeat(5-Math.round(spot.rating||0))}</span>
              <span style={{fontSize:15,fontWeight:600}}>{spot.rating?.toFixed(1)||'—'}</span>
              <span style={{color:'var(--text2)',fontSize:14}}>({spot.reviews?.length||0} reviews)</span>
            </div>
            <p style={{color:'var(--text2)',marginBottom:28,lineHeight:1.85,fontSize:15}}>{spot.desc}</p>
            <div className="spot-tags" style={{marginBottom:28}}>{(spot.tags||[]).map(t=><span key={t} className="spot-tag">{t}</span>)}</div>
            {spot.deal&&(
              <div style={{background:'rgba(234,179,8,0.1)',border:'1px solid rgba(234,179,8,0.3)',borderRadius:12,padding:'14px 18px',marginBottom:28}}>
                <div style={{fontWeight:700,marginBottom:4,color:'var(--yellow)'}}>🏷️ Active Deal</div>
                <div style={{fontSize:14}}>{spot.deal}</div>
                {spot.dealExpiry&&<div style={{fontSize:12,color:'var(--text2)',marginTop:6}}>⏰ Expires {spot.dealExpiry}</div>}
              </div>
            )}
            {spot.hours&&Object.keys(spot.hours).length>0&&(
              <div className="info-card">
                <h3 className="info-card-title">⏰ Opening Hours</h3>
                <div className="hours-grid">
                  {DAYS.map(([key,label])=>(
                    <React.Fragment key={key}>
                      <div className="hours-day">{label}</div>
                      <div className="hours-time" style={{color:spot.hours[key]==='Closed'?'var(--red)':'var(--text)'}}>{spot.hours[key]||'—'}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
            <div style={{marginTop:32}}>
              <h3 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,marginBottom:20}}>Reviews ({spot.reviews?.length||0})</h3>
              {(spot.reviews||[]).map((rv,i)=>(
                <div key={i} className="review-card">
                  <div className="review-header"><div className="review-author">{rv.name}</div><div className="review-date">{rv.date}</div></div>
                  <div className="review-stars">{'★'.repeat(rv.stars)}{'☆'.repeat(5-rv.stars)}</div>
                  <div className="review-body">{rv.text}</div>
                </div>
              ))}
              <div className="review-form" style={{marginTop:20}}>
                <h4 style={{fontFamily:'var(--font-display)',fontWeight:700,marginBottom:16}}>Leave a Review</h4>
                <div style={{display:'flex',gap:6,marginBottom:14}}>
                  {[1,2,3,4,5].map(n=><button key={n} className={`star-btn ${reviewStars>=n?'active':''}`} onClick={()=>setReviewStars(n)}>★</button>)}
                </div>
                <div className="form-group"><label>Your Name</label><input placeholder="Anonymous" value={reviewName} onChange={e=>setReviewName(e.target.value)}/></div>
                <div className="form-group"><label>Your Review</label><textarea placeholder="Share your experience..." value={reviewText} onChange={e=>setReviewText(e.target.value)} style={{minHeight:90}}/></div>
                <button className="btn-primary btn-sm" onClick={submitReview} disabled={submitting}>{submitting?'Submitting...':'Submit Review'}</button>
              </div>
            </div>
          </div>
          <div>
            <div className="info-card">
              <h3 className="info-card-title">Contact</h3>
              <div className="info-row"><span className="info-label">📍 Address</span><span style={{fontSize:13}}>{spot.address}</span></div>
              <div className="info-row"><span className="info-label">📞 Phone</span><span style={{fontSize:13}}>{spot.phone}</span></div>
              <div className="info-row"><span className="info-label">🌍 Country</span><span style={{fontSize:13}}>{country?.flag} {country?.name}</span></div>
              {spot.website&&<div className="info-row"><span className="info-label">🌐 Website</span><a href={`https://${spot.website}`} target="_blank" rel="noreferrer" style={{fontSize:13,color:'var(--orange)'}}>{spot.website}</a></div>}
              {spot.instagram&&<div className="info-row"><span className="info-label">📷 Instagram</span><span style={{fontSize:13,color:'var(--orange)'}}>{spot.instagram}</span></div>}
              <div style={{display:'flex',gap:10,marginTop:18}}>
                <a href={`tel:${spot.phone}`} style={{flex:1,textDecoration:'none'}}><button className="btn-primary btn-sm" style={{width:'100%'}}>📞 Call</button></a>
                <a href={`https://wa.me/${spot.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{flex:1,textDecoration:'none'}}><button className="btn-secondary btn-sm" style={{width:'100%'}}>💬 WhatsApp</button></a>
              </div>
              <div style={{display:'flex',gap:10,marginTop:10}}>
                <button className="btn-secondary btn-sm" style={{flex:1}} onClick={()=>setSaved(s=>!s)}>{saved?'❤️ Saved':'🤍 Save'}</button>
                <button className="btn-secondary btn-sm" style={{flex:1}} onClick={copyLink}>{copied?'✓ Copied!':'🔗 Share'}</button>
              </div>
            </div>

            {/* Location & Directions */}
            <div className="info-card">
              <h3 className="info-card-title">📍 Location & Directions</h3>
              <div style={{borderRadius:'var(--radius)',overflow:'hidden',border:'1px solid var(--border)',marginBottom:14}}>
                <iframe
                  title={`Map of ${spot.name}`}
                  width="100%"
                  height="200"
                  style={{border:0,display:'block'}}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${REGION_COORDS[spot.region]?[REGION_COORDS[spot.region][1]-0.05,REGION_COORDS[spot.region][0]-0.04,REGION_COORDS[spot.region][1]+0.05,REGION_COORDS[spot.region][0]+0.04].join(','):'2.9,6.4,3.6,6.7'}&layer=mapnik&marker=${REGION_COORDS[spot.region]?REGION_COORDS[spot.region].join(','):'6.5244,3.3792'}`}
                />
              </div>
              <p style={{fontSize:13,color:'var(--text2)',marginBottom:14}}>📌 {spot.address}, {spot.region}</p>
              <button className="btn-primary" style={{width:'100%',marginBottom:10}} onClick={getDirections}>🧭 Get Directions</button>
              <button className="btn-secondary btn-sm" style={{width:'100%'}} onClick={openInMaps}>🗺️ Open in Google Maps</button>
              <p style={{fontSize:11,color:'var(--muted)',marginTop:10,textAlign:'center'}}>Directions open in Google Maps using your current location.</p>
            </div>
            {related.length>0&&(
              <div className="info-card">
                <h3 className="info-card-title">More in {spot.region}</h3>
                {related.map(s=>(
                  <div key={s.id} className="related-item" onClick={()=>navigate('spot',{id:s.id})}>
                    <span style={{fontSize:22}}>{categories.find(c=>c.id===s.categoryId)?.icon||'📍'}</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:600}}>{s.name}</div>
                      <div style={{fontSize:12,color:'var(--text2)'}}>{categories.find(c=>c.id===s.categoryId)?.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="cta-card">
              <div style={{fontSize:32,marginBottom:8}}>🏢</div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:700,marginBottom:8}}>Own a spot like this?</div>
              <p style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>Get discovered by users across Nigeria, UK & USA.</p>
              <button className="btn-primary" style={{width:'100%'}} onClick={()=>navigate('contact')}>Get Listed →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DealsPage({navigate,spots,categories,loading}){
  const deals=spots.filter(s=>s.deal&&s.status==='active');
  return(
    <div className="section">
      <div className="section-label">Limited time</div>
      <h2 className="section-title">Deals & Offers 🏷️</h2>
      <p className="section-sub">Exclusive deals from verified spots across Nigeria, UK & USA.</p>
      {loading?<Spinner/>:deals.length>0
        ?<div className="deals-grid">{deals.map(s=>(
          <div key={s.id} className="deal-card" onClick={()=>navigate('spot',{id:s.id})}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
              <div className="deal-icon">{categories.find(c=>c.id===s.categoryId)?.icon||'🏷️'}</div>
              <span>{COUNTRIES.find(c=>c.id===s.country)?.flag}</span>
            </div>
            <div className="deal-title">{s.name}</div>
            <div className="deal-desc">{s.deal}</div>
            <div style={{fontSize:12,color:'var(--text2)'}}>📍 {s.region}</div>
            {s.dealExpiry&&<div className="deal-expiry">⏰ Expires {s.dealExpiry}</div>}
          </div>
        ))}</div>
        :<div className="empty"><div className="empty-icon">🏷️</div><h3>No active deals</h3></div>
      }
    </div>
  );
}

function BlogPage({navigate,categories}){
  return(
    <div className="section">
      <div className="section-label">Read & discover</div>
      <h2 className="section-title">XayFind Blog</h2>
      <div className="blog-grid">
        {BLOG_POSTS.map(post=>(
          <div key={post.id} className="blog-card" onClick={()=>navigate('blog-post',{id:post.id})}>
            <div className="blog-img">{categories.find(c=>c.id===post.category)?.icon||'📝'}</div>
            <div className="blog-body">
              <div className="blog-meta"><span>{COUNTRIES.find(c=>c.id===post.country)?.flag} {post.date}</span><span>⏱ {post.readTime}</span></div>
              <div className="blog-title">{post.title}</div>
              <div className="blog-excerpt">{post.excerpt}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogPostPage({id,navigate,categories}){
  const post=BLOG_POSTS.find(p=>p.id===Number(id));
  if(!post)return<div className="section"><div className="empty"><h3>Post not found</h3></div></div>;
  const cat=categories.find(c=>c.id===post.category);
  return(
    <div>
      <div style={{height:280,background:'var(--dark3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80}}>{cat?.icon||'📝'}</div>
      <div style={{maxWidth:760,margin:'0 auto',padding:'48px 40px'}}>
        <button className="back-btn" onClick={()=>navigate('blog')}>← Back to Blog</button>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(28px,5vw,42px)',fontWeight:800,letterSpacing:-1,marginBottom:20,lineHeight:1.15}}>{post.title}</h1>
        <p style={{color:'var(--text2)',fontSize:17,lineHeight:1.85,marginBottom:28}}>{post.excerpt}</p>
        <div style={{marginTop:48,padding:'24px',background:'var(--dark2)',border:'1px solid var(--border)',borderRadius:16,textAlign:'center'}}>
          <button className="btn-primary" onClick={()=>navigate('browse')}>Browse More Spots →</button>
        </div>
      </div>
    </div>
  );
}

function PricingPage({navigate}){
  const plans=[
    {id:'basic',name:'Basic',price:'₦15,000',priceUK:'£9',priceUS:'$11',featured:false,features:['Standard listing','1 photo','Category visibility','Monthly analytics','WhatsApp button']},
    {id:'featured',name:'Featured',price:'₦30,000',priceUK:'£16',priceUS:'$21',featured:true,features:['Featured badge','Up to 10 photos','Homepage spotlight','Priority search','Weekly analytics','Verified tick','Deal posting']},
    {id:'premium',name:'Premium',price:'₦50,000',priceUK:'£27',priceUS:'$34',featured:false,features:['Everything in Featured','Dedicated landing page','Social media feature','Top of category','Daily analytics','Dedicated support']},
  ];
  return(
    <div className="section">
      <div style={{textAlign:'center',marginBottom:56}}>
        <div className="section-label">For businesses</div>
        <h2 className="section-title">Simple, Transparent Pricing</h2>
        <p className="section-sub">Monthly subscription. Cancel anytime.</p>
      </div>
      <div className="pricing-grid">
        {plans.map(plan=>(
          <div key={plan.id} className={`price-card ${plan.featured?'featured':''}`}>
            {plan.featured&&<div className="price-badge-top">MOST POPULAR</div>}
            <div className="price-tier">{plan.name}</div>
            <div className="price-amount">{plan.price}<span>/mo</span></div>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>{plan.priceUK}/mo UK · {plan.priceUS}/mo USA</div>
            <p style={{fontSize:13,color:'var(--text2)',marginBottom:24}}>Billed monthly · Paystack / Stripe</p>
            <ul className="price-features">{plan.features.map(f=><li key={f}>{f}</li>)}</ul>
            <button className={`price-cta ${plan.featured?'primary':'outline'}`} onClick={()=>navigate('contact')}>Get Started</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPage(){
  const [form,setForm]=useState({name:'',email:'',phone:'',business:'',country:'',region:'',plan:'',message:''});
  const [sent,setSent]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const regions=form.country?(REGIONS[form.country]||[]):[];
  if(sent)return(
    <div className="section" style={{textAlign:'center',padding:'80px 24px'}}>
      <div style={{fontSize:64,marginBottom:16}}>🎉</div>
      <h3 style={{fontFamily:'var(--font-display)',fontSize:28,fontWeight:700,marginBottom:8}}>We got your message!</h3>
      <p style={{color:'var(--text2)'}}>Our team will reach out within 24 hours.</p>
    </div>
  );
  return(
    <div className="section" style={{maxWidth:800}}>
      <div className="section-label">Get in touch</div>
      <h2 className="section-title">List Your Spot</h2>
      <div className="form-card">
        <form onSubmit={e=>{e.preventDefault();setSent(true);}}>
          <div className="form-row">
            <div className="form-group"><label>Full Name *</label><input required placeholder="Your name" value={form.name} onChange={e=>set('name',e.target.value)}/></div>
            <div className="form-group"><label>Email *</label><input required type="email" placeholder="you@email.com" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input placeholder="+234 812..." value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
            <div className="form-group"><label>Business Name *</label><input required placeholder="Your business" value={form.business} onChange={e=>set('business',e.target.value)}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Country *</label>
              <select required value={form.country} onChange={e=>{set('country',e.target.value);set('region','');}}>
                <option value="">Select country</option>
                {COUNTRIES.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Region / City</label>
              <select value={form.region} onChange={e=>set('region',e.target.value)} disabled={!regions.length}>
                <option value="">Select region</option>
                {regions.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label>Message</label><textarea placeholder="Tell us about your spot..." value={form.message} onChange={e=>set('message',e.target.value)}/></div>
          <button type="submit" className="btn-primary" style={{width:'100%',padding:15}}>Submit Application →</button>
        </form>
      </div>
    </div>
  );
}

function VendorLoginPage({navigate}){
  const [email,setEmail]=useState('');
  const [pass,setPass]=useState('');
  const [err,setErr]=useState('');
  const login=e=>{
    e.preventDefault();
    if(email==='admin@xayfind.com'&&pass==='admin123')navigate('admin');
    else if(email==='vendor@xayfind.com'&&pass==='vendor123')navigate('vendor-dashboard');
    else setErr('Invalid credentials. Admin: admin@xayfind.com / admin123');
  };
  return(
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">Xay<span>Find</span></div>
        <div className="auth-title">Welcome back</div>
        <p className="auth-sub">Sign in to manage your listing.</p>
        {err&&<div className="alert alert-error">{err}</div>}
        <form onSubmit={login}>
          <div className="form-group"><label>Email</label><input type="email" required placeholder="admin@xayfind.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div className="form-group"><label>Password</label><input type="password" required placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)}/></div>
          <button type="submit" className="btn-primary" style={{width:'100%',padding:14,marginTop:8}}>Sign In →</button>
        </form>
        <p style={{textAlign:'center',marginTop:16,fontSize:12,color:'var(--muted)'}}>Admin: admin@xayfind.com / admin123</p>
      </div>
    </div>
  );
}

function AdminPanel({navigate,spots,setSpots,categories,setCategories}){
  const [tab,setTab]=useState('vendors');
  const [editSpot,setEditSpot]=useState(null);
  const [showAddCat,setShowAddCat]=useState(false);
  const [success,setSuccess]=useState('');
  const [saving,setSaving]=useState(false);
  const [newCat,setNewCat]=useState({name:'',icon:''});
  const flash=msg=>{setSuccess(msg);setTimeout(()=>setSuccess(''),3500);};
  const blank={name:'',categoryId:'',country:'nigeria',region:'',address:'',phone:'',website:'',instagram:'',plan:'basic',featured:false,verified:false,tags:[],images:[],desc:'',deal:'',dealExpiry:'',status:'active',rating:0,reviews:[],referredBy:'',hours:{mon:'9:00–18:00',tue:'9:00–18:00',wed:'9:00–18:00',thu:'9:00–18:00',fri:'9:00–18:00',sat:'10:00–16:00',sun:'Closed'}};
  const [addForm,setAddForm]=useState(blank);
  const setAdd=(k,v)=>setAddForm(f=>({...f,[k]:v}));
  const regions=addForm.country?(REGIONS[addForm.country]||[]):[];
  const editRegions=editSpot?(REGIONS[editSpot.country]||[]):[];
  const DAYS=[['mon','Monday'],['tue','Tuesday'],['wed','Wednesday'],['thu','Thursday'],['fri','Friday'],['sat','Saturday'],['sun','Sunday']];

  const submitAdd=async()=>{
    if(!addForm.name||!addForm.categoryId||!addForm.country||!addForm.address||!addForm.phone){flash('⚠️ Please fill all required fields.');return;}
    setSaving(true);
    const {data,error}=await supabase.from('spots').insert([spotToDB(addForm)]).select();
    if(error)flash('❌ Error: '+error.message);
    else{setSpots(prev=>[...prev,dbToSpot(data[0])]);setAddForm(blank);flash('✓ Vendor added and live!');setTab('vendors');}
    setSaving(false);
  };

  const saveEdit=async()=>{
    setSaving(true);
    const {error}=await supabase.from('spots').update(spotToDB(editSpot)).eq('id',editSpot.id);
    if(error)flash('❌ Error: '+error.message);
    else{setSpots(prev=>prev.map(s=>s.id===editSpot.id?editSpot:s));setEditSpot(null);flash('✓ Vendor updated!');}
    setSaving(false);
  };

  const deleteSpot=async id=>{const{error}=await supabase.from('spots').delete().eq('id',id);if(!error)setSpots(prev=>prev.filter(s=>s.id!==id));flash(error?'❌ '+error.message:'Vendor removed.');};
  const toggleFeatured=async(id,val)=>{await supabase.from('spots').update({featured:!val}).eq('id',id);setSpots(prev=>prev.map(s=>s.id===id?{...s,featured:!val}:s));};
  const toggleVerified=async(id,val)=>{await supabase.from('spots').update({verified:!val}).eq('id',id);setSpots(prev=>prev.map(s=>s.id===id?{...s,verified:!val}:s));};
  const toggleStatus=async(id,val)=>{const ns=val==='active'?'inactive':'active';await supabase.from('spots').update({status:ns}).eq('id',id);setSpots(prev=>prev.map(s=>s.id===id?{...s,status:ns}:s));};
  const addCategory=async()=>{
    if(!newCat.name)return;
    const id=newCat.name.toLowerCase().replace(/\s+/g,'-');
    const{error}=await supabase.from('categories').insert([{id,name:newCat.name,icon:newCat.icon||'📦'}]);
    if(!error){setCategories(prev=>[...prev,{id,name:newCat.name,icon:newCat.icon||'📦'}]);setNewCat({name:'',icon:''});setShowAddCat(false);flash('✓ Category added!');}
    else flash('❌ '+error.message);
  };
  const deleteCategory=async id=>{await supabase.from('categories').delete().eq('id',id);setCategories(prev=>prev.filter(c=>c.id!==id));};

  const tabs=[{id:'vendors',icon:'🏢',label:'Vendors'},{id:'add',icon:'➕',label:'Add vendor'},{id:'categories',icon:'🏷️',label:'Categories'},{id:'analytics',icon:'📈',label:'Analytics'}];

  return(
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="sidebar-logo">Xay<span>Find</span> <span style={{fontSize:11,color:'var(--muted)',fontWeight:400}}>Admin</span></div>
        {tabs.map(t=><button key={t.id} className={`sidebar-item ${tab===t.id?'active':''}`} onClick={()=>{setTab(t.id);setEditSpot(null);}}><span className="si-icon">{t.icon}</span>{t.label}</button>)}
        <div style={{marginTop:'auto',paddingTop:16,borderTop:'1px solid var(--border)'}}><button className="sidebar-item" onClick={()=>navigate('home')}><span className="si-icon">🚪</span>Exit Admin</button></div>
      </div>
      <div className="dash-content">
        {success&&<div className="alert alert-success">{success}</div>}

        {tab==='vendors'&&!editSpot&&(
          <div>
            <div className="dash-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div><h2>All Vendors</h2><p>All changes save to Supabase instantly.</p></div>
              <button className="btn-primary btn-sm" onClick={()=>setTab('add')}>+ Add Vendor</button>
            </div>
            <div className="stats-row">
              {[{label:'Total',value:spots.length},{label:'Active',value:spots.filter(s=>s.status==='active').length,color:'var(--green)'},{label:'Featured',value:spots.filter(s=>s.featured).length,color:'var(--orange)'},{label:'Deals',value:spots.filter(s=>s.deal).length,color:'var(--yellow)'}].map(s=>(
                <div key={s.label} className="stat-card"><div className="stat-label">{s.label}</div><div className="stat-value" style={s.color?{color:s.color,fontSize:26}:{fontSize:26}}>{s.value}</div></div>
              ))}
            </div>
            <div style={{background:'var(--dark2)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
              <table className="admin-table">
                <thead><tr><th>Photo</th><th>Business</th><th>Country</th><th>Category</th><th>Plan</th><th>Status</th><th>Featured</th><th>Verified</th><th>Actions</th></tr></thead>
                <tbody>
                  {spots.map(s=>{
                    const cat=categories.find(c=>c.id===s.categoryId);
                    const cty=COUNTRIES.find(c=>c.id===s.country);
                    const img=s.images&&s.images.length>0?s.images[0]:null;
                    return(
                      <tr key={s.id}>
                        <td><div style={{width:46,height:36,borderRadius:8,overflow:'hidden',background:'var(--dark3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{img?<img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:cat?.icon||'📍'}</div></td>
                        <td style={{fontWeight:600}}>{s.name}</td>
                        <td>{cty?.flag} {cty?.name}</td>
                        <td style={{color:'var(--text2)'}}>{cat?.name||s.categoryId}</td>
                        <td style={{textTransform:'capitalize'}}>{s.plan}</td>
                        <td><span className={`status-pill ${s.status==='active'?'status-active':'status-inactive'}`} style={{cursor:'pointer'}} onClick={()=>toggleStatus(s.id,s.status)}>● {s.status}</span></td>
                        <td><button className={`feat-toggle ${s.featured?'on':'off'}`} onClick={()=>toggleFeatured(s.id,s.featured)}>{s.featured?'★':'☆'}</button></td>
                        <td><button className={`feat-toggle ${s.verified?'on':'off'}`} onClick={()=>toggleVerified(s.id,s.verified)}>{s.verified?'✓':'○'}</button></td>
                        <td><button className="action-btn" onClick={()=>setEditSpot({...s})}>Edit</button><button className="action-btn danger" onClick={()=>deleteSpot(s.id)}>Remove</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {spots.length===0&&<div className="empty" style={{padding:40}}><div className="empty-icon">🏢</div><h3>No vendors yet</h3><p>Use "Add vendor" to add your first spot.</p></div>}
            </div>
          </div>
        )}

        {tab==='vendors'&&editSpot&&(
          <div>
            <div className="dash-header"><button className="back-btn" onClick={()=>setEditSpot(null)}>← Back</button><h2>Edit: {editSpot.name}</h2></div>
            <div style={{background:'var(--dark2)',border:'1px solid var(--border)',borderRadius:16,padding:32,maxWidth:800}}>
              <div className="form-group" style={{marginBottom:28}}><label style={{fontSize:15,fontWeight:600,color:'var(--text)',marginBottom:12,display:'block'}}>📷 Photos</label><ImageUploader images={editSpot.images||[]} onChange={imgs=>setEditSpot(v=>({...v,images:imgs}))}/></div>
              <div className="form-row">
                <div className="form-group"><label>Business Name *</label><input value={editSpot.name} onChange={e=>setEditSpot(v=>({...v,name:e.target.value}))}/></div>
                <div className="form-group"><label>Category</label><select value={editSpot.categoryId} onChange={e=>setEditSpot(v=>({...v,categoryId:e.target.value}))}>{categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Country</label><select value={editSpot.country} onChange={e=>setEditSpot(v=>({...v,country:e.target.value,region:''}))}>
                  {COUNTRIES.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}</select></div>
                <div className="form-group"><label>Region / City</label><select value={editSpot.region} onChange={e=>setEditSpot(v=>({...v,region:e.target.value}))}><option value="">Select</option>{editRegions.map(r=><option key={r}>{r}</option>)}</select></div>
              </div>
              <div className="form-group"><label>Address *</label><input value={editSpot.address} onChange={e=>setEditSpot(v=>({...v,address:e.target.value}))}/></div>
              <div className="form-row">
                <div className="form-group"><label>Phone *</label><input value={editSpot.phone} onChange={e=>setEditSpot(v=>({...v,phone:e.target.value}))}/></div>
                <div className="form-group"><label>Plan</label><select value={editSpot.plan} onChange={e=>setEditSpot(v=>({...v,plan:e.target.value}))}><option value="basic">Basic</option><option value="featured">Featured</option><option value="premium">Premium</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Website</label><input value={editSpot.website} onChange={e=>setEditSpot(v=>({...v,website:e.target.value}))}/></div>
                <div className="form-group"><label>Instagram</label><input value={editSpot.instagram} onChange={e=>setEditSpot(v=>({...v,instagram:e.target.value}))}/></div>
              </div>
              <div className="form-group"><label>Tags</label><TagInput tags={editSpot.tags||[]} onChange={t=>setEditSpot(v=>({...v,tags:t}))}/></div>
              <div className="form-group"><label>Description</label><textarea value={editSpot.desc} onChange={e=>setEditSpot(v=>({...v,desc:e.target.value}))}/></div>
              <div className="form-row">
                <div className="form-group"><label>🏷️ Deal</label><input placeholder="e.g. 20% off Mondays" value={editSpot.deal} onChange={e=>setEditSpot(v=>({...v,deal:e.target.value}))}/></div>
                <div className="form-group"><label>Deal Expiry</label><input type="date" value={editSpot.dealExpiry} onChange={e=>setEditSpot(v=>({...v,dealExpiry:e.target.value}))}/></div>
              </div>
              <div className="form-group"><label style={{marginBottom:10,display:'block'}}>⏰ Opening Hours</label>
                <div style={{display:'grid',gap:8}}>
                  {DAYS.map(([key,label])=>(
                    <div key={key} style={{display:'grid',gridTemplateColumns:'100px 1fr',gap:10,alignItems:'center'}}>
                      <span style={{fontSize:13,color:'var(--text2)'}}>{label}</span>
                      <input placeholder="9:00–18:00 or Closed" value={editSpot.hours?.[key]||''} onChange={e=>setEditSpot(v=>({...v,hours:{...v.hours,[key]:e.target.value}}))}/>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
                <label className="form-check"><input type="checkbox" checked={!!editSpot.featured} onChange={e=>setEditSpot(v=>({...v,featured:e.target.checked}))}/>Featured</label>
                <label className="form-check"><input type="checkbox" checked={!!editSpot.verified} onChange={e=>setEditSpot(v=>({...v,verified:e.target.checked}))}/>Verified</label>
              </div>
              <div style={{display:'flex',gap:12}}>
                <button className="btn-primary" style={{padding:'12px 28px'}} onClick={saveEdit} disabled={saving}>{saving?'Saving...':'Save Changes'}</button>
                <button className="btn-secondary" style={{padding:'12px 28px'}} onClick={()=>setEditSpot(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {tab==='add'&&(
          <div>
            <div className="dash-header"><h2>Add New Vendor</h2><p>Saves to database and goes live immediately.</p></div>
            <div style={{background:'var(--dark2)',border:'1px solid var(--border)',borderRadius:16,padding:32,maxWidth:800}}>
              <div className="form-group" style={{marginBottom:28}}><label style={{fontSize:15,fontWeight:600,color:'var(--text)',marginBottom:12,display:'block'}}>📷 Photos</label><ImageUploader images={addForm.images} onChange={imgs=>setAdd('images',imgs)}/></div>
              <div className="form-row">
                <div className="form-group"><label>Business Name *</label><input placeholder="e.g. The Grand Hotel" value={addForm.name} onChange={e=>setAdd('name',e.target.value)}/></div>
                <div className="form-group"><label>Category *</label><select value={addForm.categoryId} onChange={e=>setAdd('categoryId',e.target.value)}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Country *</label><select value={addForm.country} onChange={e=>{setAdd('country',e.target.value);setAdd('region','');}}>{COUNTRIES.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}</select></div>
                <div className="form-group"><label>Region / City *</label><select value={addForm.region} onChange={e=>setAdd('region',e.target.value)}><option value="">Select</option>{regions.map(r=><option key={r}>{r}</option>)}</select></div>
              </div>
              <div className="form-group"><label>Full Address *</label><input placeholder="Street address" value={addForm.address} onChange={e=>setAdd('address',e.target.value)}/></div>
              <div className="form-row">
                <div className="form-group"><label>Phone *</label><input placeholder="+234 812 345 6789" value={addForm.phone} onChange={e=>setAdd('phone',e.target.value)}/></div>
                <div className="form-group"><label>Plan</label><select value={addForm.plan} onChange={e=>setAdd('plan',e.target.value)}><option value="basic">Basic</option><option value="featured">Featured</option><option value="premium">Premium</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Website</label><input placeholder="www.business.com" value={addForm.website} onChange={e=>setAdd('website',e.target.value)}/></div>
                <div className="form-group"><label>Instagram</label><input placeholder="@yourbusiness" value={addForm.instagram} onChange={e=>setAdd('instagram',e.target.value)}/></div>
              </div>
              <div className="form-group"><label>Tags</label><TagInput tags={addForm.tags} onChange={t=>setAdd('tags',t)}/></div>
              <div className="form-group"><label>Description</label><textarea placeholder="What makes this spot special?" value={addForm.desc} onChange={e=>setAdd('desc',e.target.value)}/></div>
              <div className="form-row">
                <div className="form-group"><label>🏷️ Deal (optional)</label><input placeholder="e.g. Free entry before 10pm" value={addForm.deal} onChange={e=>setAdd('deal',e.target.value)}/></div>
                <div className="form-group"><label>Deal Expiry</label><input type="date" value={addForm.dealExpiry} onChange={e=>setAdd('dealExpiry',e.target.value)}/></div>
              </div>
              <div className="form-group"><label style={{marginBottom:10,display:'block'}}>⏰ Opening Hours</label>
                <div style={{display:'grid',gap:8}}>
                  {DAYS.map(([key,label])=>(
                    <div key={key} style={{display:'grid',gridTemplateColumns:'100px 1fr',gap:10,alignItems:'center'}}>
                      <span style={{fontSize:13,color:'var(--text2)'}}>{label}</span>
                      <input placeholder="9:00–18:00 or Closed" value={addForm.hours?.[key]||''} onChange={e=>setAdd('hours',{...addForm.hours,[key]:e.target.value})}/>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
                <label className="form-check"><input type="checkbox" checked={addForm.featured} onChange={e=>setAdd('featured',e.target.checked)}/>Mark as Featured (homepage)</label>
                <label className="form-check"><input type="checkbox" checked={addForm.verified} onChange={e=>setAdd('verified',e.target.checked)}/>Mark as Verified</label>
              </div>
              <div className="form-group"><label>Referred By (optional)</label><input placeholder="Name of referring vendor" value={addForm.referredBy} onChange={e=>setAdd('referredBy',e.target.value)}/></div>
              <div style={{display:'flex',gap:12}}>
                <button className="btn-primary" style={{padding:'13px 32px'}} onClick={submitAdd} disabled={saving}>{saving?'Saving...':'Add Vendor & Go Live'}</button>
                <button className="btn-secondary" style={{padding:'13px 32px'}} onClick={()=>setAddForm(blank)}>Clear Form</button>
              </div>
            </div>
          </div>
        )}

        {tab==='categories'&&(
          <div>
            <div className="dash-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div><h2>Categories</h2><p>Saves to database. Reflects live immediately.</p></div>
              <button className="btn-primary btn-sm" onClick={()=>setShowAddCat(true)}>+ New Category</button>
            </div>
            {showAddCat&&(
              <div style={{background:'var(--dark2)',border:'1px solid rgba(255,92,0,0.3)',borderRadius:16,padding:24,maxWidth:480,marginBottom:28}}>
                <h3 style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,marginBottom:18}}>Add New Category</h3>
                <div className="form-row">
                  <div className="form-group"><label>Name *</label><input placeholder="e.g. Gadget Shops" value={newCat.name} onChange={e=>setNewCat(v=>({...v,name:e.target.value}))}/></div>
                  <div className="form-group"><label>Icon (emoji)</label><input placeholder="📱" maxLength={2} value={newCat.icon} onChange={e=>setNewCat(v=>({...v,icon:e.target.value}))}/></div>
                </div>
                <div style={{display:'flex',gap:12}}>
                  <button className="btn-primary btn-sm" onClick={addCategory}>Add Category</button>
                  <button className="btn-secondary btn-sm" onClick={()=>setShowAddCat(false)}>Cancel</button>
                </div>
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:14}}>
              {categories.map(c=>(
                <div key={c.id} style={{background:'var(--dark2)',border:'1px solid var(--border)',borderRadius:16,padding:24}}>
                  <div style={{fontSize:36,marginBottom:12}}>{c.icon}</div>
                  <div style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,marginBottom:4}}>{c.name}</div>
                  <div style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>{spots.filter(s=>s.categoryId===c.id).length} spots</div>
                  <button className="action-btn danger" onClick={()=>deleteCategory(c.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='analytics'&&(
          <div>
            <div className="dash-header"><h2>Analytics</h2><p>Live data from Supabase.</p></div>
            <div className="stats-row">
              {[{label:'Total Spots',value:spots.length},{label:'Active',value:spots.filter(s=>s.status==='active').length,color:'var(--green)'},{label:'Featured',value:spots.filter(s=>s.featured).length,color:'var(--orange)'},{label:'Countries',value:new Set(spots.map(s=>s.country)).size},{label:'Deals',value:spots.filter(s=>s.deal).length,color:'var(--yellow)'}].map(s=>(
                <div key={s.label} className="stat-card"><div className="stat-label">{s.label}</div><div className="stat-value" style={s.color?{color:s.color,fontSize:22}:{fontSize:22}}>{s.value}</div></div>
              ))}
            </div>
            <div style={{background:'var(--dark2)',border:'1px solid var(--border)',borderRadius:16,padding:28,marginBottom:20}}>
              <h3 style={{fontFamily:'var(--font-display)',fontSize:17,fontWeight:700,marginBottom:20}}>Spots by Country</h3>
              {COUNTRIES.map(c=>{
                const count=spots.filter(s=>s.country===c.id).length;
                const pct=spots.length?Math.round(count/spots.length*100):0;
                return(
                  <div key={c.id} style={{marginBottom:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:14,marginBottom:6}}><span>{c.flag} {c.name}</span><span style={{color:'var(--text2)'}}>{count} spots ({pct}%)</span></div>
                    <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VendorDashboard({navigate,spots,categories}){
  const [tab,setTab]=useState('overview');
  const spot=spots[0];
  const cat=spot?categories.find(c=>c.id===spot.categoryId):null;
  const tabs=[{id:'overview',icon:'📊',label:'Overview'},{id:'billing',icon:'💳',label:'Billing'},{id:'referral',icon:'👥',label:'Referrals'},{id:'settings',icon:'⚙️',label:'Settings'}];
  return(
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="sidebar-logo">Xay<span>Find</span></div>
        {tabs.map(t=><button key={t.id} className={`sidebar-item ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}><span className="si-icon">{t.icon}</span>{t.label}</button>)}
        <div style={{marginTop:'auto',paddingTop:16,borderTop:'1px solid var(--border)'}}><button className="sidebar-item" onClick={()=>navigate('home')}><span className="si-icon">🚪</span>Exit</button></div>
      </div>
      <div className="dash-content">
        {tab==='overview'&&(
          <div>
            <div className="dash-header"><h2>My Listing</h2></div>
            <div className="stats-row">
              {[{label:'Profile Views',value:'1,284',change:'↑ 12%'},{label:'WhatsApp Clicks',value:'87',change:'↑ 5%'},{label:'Phone Clicks',value:'43',change:'↑ 8%'},{label:'Review Score',value:spot?.rating?.toFixed(1)||'—',change:`${spot?.reviews?.length||0} reviews`}].map(s=>(
                <div key={s.label} className="stat-card"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div><div className="stat-change">{s.change}</div></div>
              ))}
            </div>
            {spot&&(
              <div className="info-card">
                <div style={{display:'flex',gap:16,alignItems:'center'}}>
                  <div style={{width:60,height:50,borderRadius:10,overflow:'hidden',background:'var(--dark3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>
                    {spot.images&&spot.images.length>0?<img src={spot.images[0]} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:cat?.icon||'📍'}
                  </div>
                  <div>
                    <div style={{fontFamily:'var(--font-display)',fontSize:19,fontWeight:700}}>{spot.name}</div>
                    <div style={{color:'var(--text2)',fontSize:13}}>📍 {spot.region} {COUNTRIES.find(c=>c.id===spot.country)?.flag}</div>
                    <div style={{marginTop:8,display:'flex',gap:6}}>
                      {spot.featured&&<span className="spot-badge badge-featured">⭐ Featured</span>}
                      {spot.verified&&<span className="spot-badge badge-verified">✓ Verified</span>}
                    </div>
                  </div>
                  <div style={{marginLeft:'auto'}}><span className="status-pill status-active">● Active</span></div>
                </div>
              </div>
            )}
          </div>
        )}
        {tab==='billing'&&(<div><div className="dash-header"><h2>Billing</h2></div><div className="info-card"><div style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,marginBottom:4}}>Featured Plan</div><div style={{color:'var(--text2)',fontSize:14,marginBottom:16}}>₦35,000 / month</div><span className="status-pill status-active">● Active</span><div style={{marginTop:20,display:'flex',gap:10}}><button className="btn-primary btn-sm">Upgrade Plan</button><button className="btn-secondary btn-sm">Update Payment</button></div></div></div>)}
        {tab==='referral'&&(<div><div className="dash-header"><h2>Referral Programme</h2></div><div className="referral-card"><div style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,marginBottom:8}}>Your Referral Code</div><div style={{fontSize:28,fontWeight:800,color:'var(--orange)',letterSpacing:4,marginBottom:12}}>XAYREF-001</div><p style={{color:'var(--text2)',fontSize:14,marginBottom:16}}>Refer another business and get <strong style={{color:'var(--text)'}}>1 free month</strong>.</p><button className="btn-primary btn-sm">Copy Referral Link</button></div></div>)}
        {tab==='settings'&&(<div><div className="dash-header"><h2>Settings</h2></div><div className="info-card"><div className="form-row"><div className="form-group"><label>Full Name</label><input defaultValue="Demo Vendor"/></div><div className="form-group"><label>Email</label><input defaultValue="vendor@xayfind.com"/></div></div><div className="form-group"><label>New Password</label><input type="password" placeholder="Leave blank to keep current"/></div><button className="btn-primary btn-sm">Save Settings</button></div></div>)}
      </div>
    </div>
  );
}

function AboutPage({navigate,spots,categories}){
  return(
    <div className="section" style={{maxWidth:800}}>
      <div className="section-label">Our Story</div>
      <h2 className="section-title">About XayFind</h2>
      <p style={{color:'var(--text2)',fontSize:17,lineHeight:1.9,marginBottom:22}}>XayFind is a product of <strong style={{color:'var(--text)'}}>Xayion</strong>, built to make finding great spots effortless — wherever you are.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:16,marginBottom:48}}>
        {[{n:'3',l:'Countries'},{n:categories.length,l:'Categories'},{n:`${spots.length}+`,l:'Spots Listed'},{n:'Free',l:'For Users'}].map(s=>(
          <div key={s.l} style={{background:'var(--dark2)',border:'1px solid var(--border)',borderRadius:16,padding:24,textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:38,fontWeight:800,color:'var(--orange)'}}>{s.n}</div>
            <div style={{color:'var(--text2)',fontSize:13,marginTop:4}}>{s.l}</div>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={()=>navigate('contact')}>Get Your Spot Listed →</button>
    </div>
  );
}

function App(){
  const {page,params,navigate}=useRouter();
  const [spots,setSpots]=useState([]);
  const [categories,setCategories]=useState(DEFAULT_CATEGORIES);
  const [activeCountry,setActiveCountry]=useState('all');
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const loadData=async()=>{
      setLoading(true);
      const [{data:catsData},{data:spotsData}]=await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('spots').select('*').order('created_at',{ascending:false}),
      ]);
      if(catsData&&catsData.length>0)setCategories(catsData.map(c=>({id:c.id,name:c.name,icon:c.icon})));
      if(spotsData)setSpots(spotsData.map(dbToSpot));
      setLoading(false);
    };
    loadData();
  },[]);

  const isDashboard=['vendor-dashboard','admin'].includes(page);
  const isAuth=page==='vendor-login';

  return(
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      {!isDashboard&&<Navbar navigate={navigate} activeCountry={activeCountry} setActiveCountry={setActiveCountry}/>}
      <main style={{flex:1}}>
        {page==='home'&&<HomePage navigate={navigate} spots={spots} categories={categories} activeCountry={activeCountry} setActiveCountry={setActiveCountry} loading={loading}/>}
        {page==='browse'&&<BrowsePage navigate={navigate} spots={spots} categories={categories} loading={loading}/>}
        {page==='category'&&<CategoryPage cat={params.cat} navigate={navigate} spots={spots} categories={categories} loading={loading}/>}
        {page==='spot'&&<SpotDetailPage id={params.id} navigate={navigate} spots={spots} setSpots={setSpots} categories={categories}/>}
        {page==='deals'&&<DealsPage navigate={navigate} spots={spots} categories={categories} loading={loading}/>}
        {page==='blog'&&<BlogPage navigate={navigate} categories={categories}/>}
        {page==='blog-post'&&<BlogPostPage id={params.id} navigate={navigate} categories={categories}/>}
        {page==='pricing'&&<PricingPage navigate={navigate}/>}
        {page==='contact'&&<ContactPage navigate={navigate}/>}
        {page==='about'&&<AboutPage navigate={navigate} spots={spots} categories={categories}/>}
        {page==='vendor-login'&&<VendorLoginPage navigate={navigate}/>}
        {page==='vendor-dashboard'&&<VendorDashboard navigate={navigate} spots={spots} categories={categories}/>}
        {page==='admin'&&<AdminPanel navigate={navigate} spots={spots} setSpots={setSpots} categories={categories} setCategories={setCategories}/>}
      </main>
      {!isDashboard&&!isAuth&&<Footer navigate={navigate} categories={categories}/>}
    </div>
  );
}

export default App;
