import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {HashRouter,useLocation,useNavigate,useParams,Link} from "react-router-dom";
import {Search,ShoppingBag,Heart,User,Menu,X,ChevronDown,ArrowRight,Star,SlidersHorizontal,Trash2,Minus,Plus,Check,Truck,ShieldCheck,RotateCcw,Instagram,Facebook,Youtube,Home as HomeIcon,LayoutDashboard,Package,ShoppingCart,Users,Image as ImageIcon,FileText,Tag,MessageSquare,Settings,BarChart3,LogOut,Sun,Moon,Bell,ExternalLink,Save,Video,FileImage,Boxes,Ticket,StarHalf,PanelLeftClose,PanelLeftOpen,CalendarDays,Info} from "lucide-react";
import "./styles.css";

const demoProducts=[
{id:1,name:"Sheesham Wood Lattice Bed",category:"Beds",sub:"King Beds",price:699,old:899,rating:4.9,img:"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900",tag:"Bestseller"},
{id:2,name:"Solid Wood Scandinavian Sofa",category:"Sofas",sub:"3 Seater Sofas",price:549,old:699,rating:4.8,img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900",tag:"New"},
{id:3,name:"Handcrafted Sheesham Dining Table",category:"Dining",sub:"Dining Tables",price:429,old:529,rating:4.9,img:"https://images.unsplash.com/photo-1617806118233-18e1de247200?w=900",tag:"Popular"},
{id:4,name:"Cane Accent Lounge Chair",category:"Chairs",sub:"Accent Chairs",price:229,old:289,rating:4.7,img:"https://images.unsplash.com/photo-1592078615290-033ee584e267?w=900"},
{id:5,name:"Solid Wood 6 Drawer Dresser",category:"Storage",sub:"Dressers",price:389,old:479,rating:4.8,img:"https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=900"},
{id:6,name:"Minimal Oak Bedside Table",category:"Tables",sub:"Bedside Tables",price:149,old:189,rating:4.6,img:"https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=900"},
{id:7,name:"Royal Sheesham TV Unit",category:"Storage",sub:"TV Units",price:319,old:399,rating:4.8,img:"https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900",tag:"Bestseller"},
{id:8,name:"Modern Upholstered Armchair",category:"Chairs",sub:"Accent Chairs",price:279,old:349,rating:4.7,img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900"},
{id:9,name:"Live Edge Console Table",category:"Tables",sub:"Console Tables",price:299,old:369,rating:4.9,img:"https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=900",tag:"New"},
{id:10,name:"Handcrafted Bookshelf",category:"Storage",sub:"Bookshelves",price:259,old:329,rating:4.8,img:"https://images.unsplash.com/photo-1594620302200-9a762244a156?w=900"},
{id:11,name:"Classic 4 Seater Dining Set",category:"Dining",sub:"Dining Sets",price:649,old:799,rating:4.9,img:"https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=900"},
{id:12,name:"Boucle Round Coffee Table",category:"Tables",sub:"Coffee Tables",price:199,old:249,rating:4.6,img:"https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=900"}
 ];
let products=[...demoProducts];
let liveCategoryMenus=[];
let liveCats=[];
const originalImageUrl=(src)=>{try{const u=new URL(String(src||""),window.location.origin);if(u.pathname==="/api/image-proxy")return u.searchParams.get("url")||src;return src}catch{return src}};
const imageErrorFallback=(e)=>{
 const img=e.currentTarget;
 const src=img.dataset.originalSrc||img.src;
 let u;try{u=new URL(src,window.location.origin)}catch{u=null}
 if(u&&u.hostname==="cdn.shopify.com"&&img.dataset.weservTried!=="1"){
  img.dataset.originalSrc=u.href;
  img.dataset.weservTried="1";
  img.src="https://images.weserv.nl/?url="+encodeURIComponent(u.href);
  return;
 }
 if(u&&u.hostname==="images.weserv.nl"&&img.dataset.proxyTried!=="1"){
  img.dataset.proxyTried="1";
  img.src=window.location.origin+"/api/image-proxy?url="+encodeURIComponent(img.dataset.originalSrc||"");
  return;
 }
 if(u&&u.pathname==="/api/image-proxy"&&img.dataset.originalTried!=="1"){
  img.dataset.originalTried="1";
  img.src=img.dataset.originalSrc||u.searchParams.get("url")||img.src;
  return;
 }
 // Never substitute an unrelated stock photo for a real product image.
 img.style.visibility="hidden";
};
const resolveImage=(src)=>{
 const v=String(src||"").trim().replace(/^["']|["']$/g,"");
 if(!v)return "";
 if(/^https?:\/\//i.test(v)){
  try{
   const u=new URL(v);
   if(u.protocol==="https:"&&u.hostname==="cdn.shopify.com")return u.href;
   return u.href;
  }catch{return v;}
 }
 if(v.startsWith("//"))return resolveImage("https:"+v);
 if(v.startsWith("/"))return window.location.origin+v;
 return window.location.origin+"/"+v.replace(/^\.\//,"");
};
const normalizeProduct=(p)=>{
 const imgs=[p.image,p.image_2,p.image_3,p.image_4,p.image_5].map(resolveImage).filter(Boolean);
 return {id:Number(p.id),name:p.name||p.title||"Furniture Product",category:p.category_name||p.category||"Furniture",sub:p.subcategory_name||p.sub||"",price:Number(p.price||0),old:Number(p.old_price||p.old||p.price||0),rating:Number(p.rating||4.8),img:imgs[0]||p.img||"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900",gallery:imgs,description:p.description||p.short_description||"",short_description:p.short_description||"",brand:p.brand||"",material:p.material||"",color:p.color||"",finish:p.finish||"",care_instructions:p.care_instructions||"",assembly_info:p.assembly_info||"",length_in:p.length_in,width_in:p.width_in,height_in:p.height_in,length_cm:p.length_cm,width_cm:p.width_cm,height_cm:p.height_cm,weight_kg:p.weight_kg,tag:p.featured?"Featured":""};
};
const cats=[["All Furniture",""],["Beds","Beds"],["Sofas","Sofas"],["Dining","Dining"],["Chairs","Chairs"],["Tables","Tables"],["Storage","Storage"]];
const categoryMenus=[
 {name:"Beds",slug:"Beds",subs:["King Beds","Queen Beds","Double Beds","Single Beds","Storage Beds","Canopy Beds","Kids Beds"]},
 {name:"Sofas",slug:"Sofas",subs:["3 Seater Sofas","2 Seater Sofas","Sectional Sofas","Sofa Sets","L Shape Sofas","Recliner Sofas","Loveseats"]},
 {name:"Dining",slug:"Dining",subs:["Dining Tables","Dining Sets","Dining Chairs","Bar Tables","Benches","Sideboards"]},
 {name:"Chairs",slug:"Chairs",subs:["Accent Chairs","Armchairs","Lounge Chairs","Dining Chairs","Office Chairs","Rocking Chairs"]},
 {name:"Tables",slug:"Tables",subs:["Coffee Tables","Console Tables","Side Tables","Bedside Tables","Study Tables","Office Tables"]},
 {name:"Storage",slug:"Storage",subs:["Wardrobes","Dressers","TV Units","Bookshelves","Cabinets","Sideboards","Chest of Drawers"]}
];
let activeCurrency=localStorage.getItem("bh_currency")||"USD";
const fmt=n=>{const value=Number(n)||0;return activeCurrency==="INR"?"₹"+Math.round(value).toLocaleString("en-IN"):"$"+(value/84).toLocaleString("en-US",{maximumFractionDigits:0});};
function App(){
 const [cart,setCart]=useState(()=>JSON.parse(localStorage.getItem("bh_cart")||"[]"));
 const [wish,setWish]=useState(()=>JSON.parse(localStorage.getItem("bh_wish")||"[]"));
 const [currency,setCurrency]=useState(()=>localStorage.getItem("bh_currency")||"USD");
 const [,setStoreVersion]=useState(0);
 const [storeSettings,setStoreSettings]=useState(null);
 activeCurrency=currency;
 useEffect(()=>{if(storeSettings?.seo_title)document.title=storeSettings.seo_title; if(storeSettings?.meta_description){let m=document.querySelector('meta[name="description"]');if(!m){m=document.createElement("meta");m.name="description";document.head.appendChild(m)}m.content=storeSettings.meta_description}},[storeSettings?.seo_title,storeSettings?.meta_description]);
 useEffect(()=>localStorage.setItem("bh_currency",currency),[currency]);
 useEffect(()=>localStorage.setItem("bh_cart",JSON.stringify(cart)),[cart]);
 useEffect(()=>localStorage.setItem("bh_wish",JSON.stringify(wish)),[wish]);
 useEffect(()=>{
   Promise.all([fetch("/api/store/products"),fetch("/api/store/categories"),fetch("/api/store/settings"),fetch("/api/store/banners")]).then(async([p,c,s,b])=>[await p.json(),await c.json(),await s.json(),await b.json()]).then(([p,c,s,b])=>{
     if(Array.isArray(p.products)&&p.products.length)products=p.products.map(normalizeProduct);
     if(Array.isArray(c.categories)){
       const subs=Array.isArray(c.subcategories)?c.subcategories:[];
       liveCategoryMenus=c.categories.map(cat=>({name:cat.name,slug:cat.slug||cat.name,subs:subs.filter(x=>Number(x.category_id)===Number(cat.id)).map(x=>x.name)}));
       liveCats=[["All Furniture",""],...c.categories.map(cat=>[cat.name,cat.slug||cat.name])];
     }
     if(s&&s.settings)setStoreSettings({...s.settings,banners:b?.items||[]});
     setStoreVersion(v=>v+1);
   }).catch(()=>{});
 },[]);
 const add=p=>setCart(c=>{const x=c.find(i=>i.id===p.id);return x?c.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...c,{...p,qty:1}]});
 const toggleWish=p=>setWish(w=>w.some(x=>x.id===p.id)?w.filter(x=>x.id!==p.id):[...w,p]);
 const isAdmin=useLocation().pathname==="/admin";
 if(isAdmin)return <Admin/>;
 return <><Header cart={cart.length} wish={wish.length} currency={currency} setCurrency={setCurrency} settings={storeSettings}/><main><RoutesView cart={cart} setCart={setCart} wish={wish} toggleWish={toggleWish} add={add} settings={storeSettings}/></main><Footer/><a className="floatingWhatsApp" href="https://wa.me/919521089505" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp" title="Chat with us on WhatsApp"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M19.11 17.21c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.6-1.5-1.87-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.48.07-.73.34-.25.27-.96.93-.96 2.27s.98 2.63 1.12 2.81c.14.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.56.57.66.21 1.26.18 1.73.11.53-.08 1.6-.65 1.83-1.29.23-.63.23-1.18.16-1.29-.07-.11-.25-.18-.52-.32z"/><path fill="currentColor" d="M16.03 3.2C9.03 3.2 3.34 8.88 3.34 15.88c0 2.23.59 4.4 1.72 6.31L3.23 28.8l6.77-1.78a12.65 12.65 0 0 0 6.03 1.54h.01c7 0 12.68-5.69 12.68-12.68 0-3.39-1.32-6.57-3.72-8.96a12.6 12.6 0 0 0-8.97-3.72zm0 22.98h-.01c-1.91 0-3.78-.51-5.42-1.48l-.39-.23-4.02 1.06 1.07-3.92-.25-.4a10.52 10.52 0 0 1-1.62-5.63c0-5.87 4.77-10.64 10.64-10.64 2.84 0 5.51 1.11 7.52 3.12a10.57 10.57 0 0 1 3.12 7.53c0 5.87-4.77 10.64-10.64 10.64z"/></svg></a></>
}
function Header({cart,wish,currency,setCurrency,settings}){
 const [open,setOpen]=useState(false);const [search,setSearch]=useState(false);
 return <header className="header"><div className="topbar">{settings?.announcement||("Free shipping on orders over "+fmt(500))} <span>•</span> Handcrafted furniture, made to last</div>
 <div className="navwrap"><Link to="/" className="logo"><span className="logoMark">BH</span><span><b>BALAJI</b><small>HANDICRAFT</small></span></Link>
 <nav className={open?"mobile open":"mobile"}><Link to="/shop" onClick={()=>setOpen(false)}>All Furniture</Link>{[...categoryMenus].map(cat=><div className="navMenu" key={cat.name}><Link className="navMenuTitle" to={"/shop?cat="+cat.slug} onClick={()=>setOpen(false)}>{cat.name}<ChevronDown/></Link><div className="dropdownMenu">{cat.subs.map(sub=><Link key={sub} to={"/shop?cat="+cat.slug+"&sub="+encodeURIComponent(sub)} onClick={()=>setOpen(false)}>{sub}</Link>)}</div></div>)}</nav>
 <div className="navicons"><div className="currencySwitcher"><span>{currency==="USD"?"🇺🇸":"🇮🇳"}</span><select aria-label="Currency" value={currency} onChange={e=>setCurrency(e.target.value)}><option value="USD">USD ($)</option><option value="INR">INR (₹)</option></select></div><button onClick={()=>setSearch(!search)}><Search/></button><Link to="/wishlist" className="countIcon"><Heart/><i>{wish}</i></Link><Link to="/account"><User/></Link><Link to="/cart" className="countIcon"><ShoppingBag/><i>{cart}</i></Link><button className="hamb" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></div>
 {search&&<div className="searchbar"><Search/><input autoFocus placeholder="Search beds, sofas, dining tables..." onKeyDown={e=>{if(e.key==="Enter")location.href="/shop?q="+encodeURIComponent(e.currentTarget.value)}}/></div>}
 </header>
}
function RoutesView(p){
 const path=useLocation().pathname;
 if(path==="/")return <Home {...p}/>;
 if(path==="/shop")return <Shop {...p}/>;
 if(path==="/product")return <Product {...p}/>;
 if(path==="/cart")return <Cart {...p}/>;
 if(path==="/wishlist")return <Wishlist {...p}/>;
 if(path==="/checkout")return <Checkout {...p}/>;
 if(path==="/blog")return <Blog/>; if(path==="/account"||path==="/login")return <AuthPage mode="login"/>; if(path==="/register"||path==="/signup")return <AuthPage mode="register"/>; if(path==="/forgot-password")return <AuthPage mode="forgot"/>; if(path==="/admin")return <Admin/>; return <Home {...p}/>;
}
function Home({add,toggleWish,wish,settings}){
 const roomCards=[
  {name:"Living Room",sub:"Sofas • Coffee Tables • TV Units",img:products[1]?.img},
  {name:"Bedroom",sub:"Beds • Dressers • Bedside Tables",img:products[0]?.img},
  {name:"Dining Room",sub:"Dining Sets • Chairs • Sideboards",img:products[2]?.img},
  {name:"Home Office",sub:"Desks • Office Chairs • Storage",img:products[5]?.img}
 ];
 const materials=[
  {name:"Solid Sheesham",text:"Rich grain, lasting strength",img:products[0]?.img},
  {name:"Natural Cane",text:"Light, airy and handcrafted",img:products[3]?.img},
  {name:"Warm Teak",text:"Timeless warmth and character",img:products[6]?.img},
  {name:"Premium Finishes",text:"Hand-finished for everyday living",img:products[4]?.img}
 ];
 const testimonials=[
  ["“The finish, weight and detailing are genuinely impressive. It feels like furniture made to stay in the family.”","Aarav Mehta","Verified Customer"],
  ["“Beautiful in person and even better than the photos. The craftsmanship is visible in every little detail.”","Riya Sharma","Verified Customer"],
  ["“From ordering to delivery, everything felt premium. Our living room finally has the character we wanted.”","Karan Singh","Verified Customer"]
 ];
 return <>
  {/* 01 Hero */}
  <section className="hero homeReveal">
   <div className="heroText"><span className="eyebrow">THE ART OF BETTER LIVING</span><h1>{settings?.homepage_hero||"Furniture with character."}</h1><p>{settings?.homepage_subtitle||"Handcrafted solid wood pieces designed to bring warmth, comfort and timeless beauty into your home."}</p><div className="actions"><Link className="btn dark" to="/shop">Shop Furniture <ArrowRight/></Link><Link className="textlink" to="/blog">Our craftsmanship →</Link></div></div>
   <div className="heroVisual"><div className="heroCard"><img onError={imageErrorFallback} src={settings?.homepage_image||settings?.banners?.[0]?.image||products[0].img}/><div><b>Sheesham Collection</b><span>Built for generations</span></div></div><div className="floatBadge">100%<small>Solid Wood</small></div></div>
  </section>

  {/* 02 Trust */}
  <section className="trust homeStagger"><div><Truck/><b>Free Delivery</b><span>On orders over $500</span></div><div><ShieldCheck/><b>Quality Assured</b><span>Crafted & checked by hand</span></div><div><RotateCcw/><b>Easy Returns</b><span>7-day return policy</span></div><div><Check/><b>Secure Payments</b><span>100% protected checkout</span></div></section>

  {/* 03 Categories */}
  <section className="homeSection categorySection">
   <SectionTitle kicker="CURATED FOR YOUR HOME" title="Shop by category" link="/shop"/>
   <div className="catGrid categoryReveal">{cats.slice(1).map(([n,c],i)=><Link to={"/shop?cat="+c} className="catTile" key={n}><img onError={imageErrorFallback} src={products[i]?.img}/><div><b>{n}</b><span>Explore collection <ArrowRight/></span></div></Link>)}</div>
  </section>

  {/* 04 Featured products */}
  <section className="homeSection featuredSection">
   <SectionTitle kicker="CURATED PICKS" title="Pieces worth coming home to." link="/shop"/>
   <div className="products productLift"><ProductGrid items={products.slice(0,4)} add={add} toggleWish={toggleWish} wish={wish}/></div>
  </section>

  {/* 05 Room inspiration */}
  <section className="homeRooms">
   <div className="homeRoomsHead"><div><span className="eyebrow">DESIGNED AROUND YOU</span><h2>Find your room's<br/><em>signature piece.</em></h2></div><p>Explore furniture collections designed to work together, so every corner of your home feels intentional.</p></div>
   <div className="roomGrid">{roomCards.map((r,i)=><Link to={"/shop?cat="+["Sofas","Beds","Dining","Tables"][i]} className="roomCard" key={r.name}><img onError={imageErrorFallback} src={r.img}/><div><small>0{i+1}</small><b>{r.name}</b><span>{r.sub}</span></div></Link>)}</div>
  </section>

  {/* 06 Craftsmanship */}
  <section className="craftSection">
   <div className="craftImage"><img onError={imageErrorFallback} src={products[9]?.img}/><span>HANDCRAFTED</span></div>
   <div className="craftCopy"><span className="eyebrow">MADE BY HAND</span><h2>Good furniture<br/><em>takes its time.</em></h2><p>From carefully selected timber to the final hand-finished surface, each Balaji piece is made with patience, precision and respect for the material.</p><div className="craftStats"><div><b>25+</b><span>Years of craft</span></div><div><b>100%</b><span>Solid wood focus</span></div><div><b>1-by-1</b><span>Quality checked</span></div></div><Link className="btn dark" to="/blog">Discover our craft <ArrowRight/></Link></div>
  </section>

  {/* 07 Best sellers */}
  <section className="homeSection bestSection">
   <SectionTitle kicker="MOST LOVED" title="Bestselling pieces" link="/shop"/>
   <div className="products productWave"><ProductGrid items={products.slice(4,8)} add={add} toggleWish={toggleWish} wish={wish}/></div>
  </section>

  {/* 08 Brand statement / marquee */}
  <section className="statementBand"><div className="statementTrack"><span>CRAFTED FOR LIFE</span><i>✦</i><span>BUILT TO LAST</span><i>✦</i><span>MADE WITH CHARACTER</span><i>✦</i><span>CRAFTED FOR LIFE</span><i>✦</i></div></section>

  {/* 09 Materials */}
  <section className="homeSection materialSection">
   <SectionTitle kicker="THE MATERIAL STORY" title="Choose your character." link="/shop"/>
   <div className="materialGrid">{materials.map((m,i)=><Link to="/shop" className="materialCard" key={m.name}><div className="materialImg"><img onError={imageErrorFallback} src={m.img}/><span>0{i+1}</span></div><div><h3>{m.name}</h3><p>{m.text}</p><ArrowRight/></div></Link>)}</div>
  </section>

  {/* 10 New arrivals */}
  <section className="newArrivalSection">
   <div className="newArrivalVisual"><img onError={imageErrorFallback} src={products[8]?.img}/><div><span>NEW ARRIVAL</span><b>Live Edge<br/>Collection</b></div></div>
   <div className="newArrivalCopy"><span className="eyebrow">JUST LANDED</span><h2>Fresh forms.<br/><em>Natural edges.</em></h2><p>New silhouettes inspired by organic shapes, expressive grain and modern living.</p><Link className="btn dark" to="/shop">Shop new arrivals <ArrowRight/></Link></div>
   <div className="newArrivalMini">{products.slice(8,12).map(p=><Link to={"/product?id="+p.id} key={p.id}><img onError={imageErrorFallback} src={p.img}/><span>{p.name}</span><b>{fmt(p.price)}</b></Link>)}</div>
  </section>

  {/* 11 Social proof */}
  <section className="homeSection reviewSection">
   <SectionTitle kicker="REAL HOMES. REAL STORIES." title="Loved by people who love home."/>
   <div className="reviewGrid">{testimonials.map((t,i)=><article className="reviewCard" key={t[1]}><div className="reviewStars">★★★★★</div><p>{t[0]}</p><b>{t[1]}</b><span>{t[2]}</span></article>)}</div>
  </section>

  {/* 12 Process */}
  <section className="processSection">
   <div className="processIntro"><span className="eyebrow">FROM WOOD TO HOME</span><h2>Made in four<br/><em>thoughtful steps.</em></h2></div>
   <div className="processSteps">{[["01","Select","We choose timber for grain, strength and character."],["02","Shape","Skilled hands turn raw material into balanced forms."],["03","Finish","Each surface is sanded and finished for a rich touch."],["04","Deliver","Your finished piece is carefully prepared for its new home."]].map(s=><div className="processStep" key={s[0]}><span>{s[0]}</span><i></i><h3>{s[1]}</h3><p>{s[2]}</p></div>)}</div>
  </section>

  {/* 13 Collection showcase */}
  <section className="showcaseSection">
   <div className="showcaseCopy"><span className="eyebrow">THE SHEESHHAM EDIT</span><h2>Natural wood.<br/><em>Beautifully lived in.</em></h2><p>Every grain tells a story. Our solid wood collection pairs traditional craftsmanship with clean, contemporary silhouettes.</p><Link className="btn light" to="/shop?cat=Storage">Explore the edit <ArrowRight/></Link></div>
   <div className="showcaseImage"><img onError={imageErrorFallback} src={products[10]?.img}/><span>01 / 04</span></div>
  </section>

  {/* 14 More to explore */}
  <section className="homeSection exploreSection">
   <SectionTitle kicker="MORE TO EXPLORE" title="Complete the room." link="/shop"/>
   <div className="exploreGrid">{products.slice(8,12).map((p,i)=><Link to={"/product?id="+p.id} className="exploreCard" key={p.id}><img onError={imageErrorFallback} src={p.img}/><div><span>0{i+1}</span><h3>{p.name}</h3><b>View piece <ArrowRight/></b></div></Link>)}</div>
  </section>

  {/* 15 Journal */}
  <section className="homeSection journalSection">
   <SectionTitle kicker="FROM THE JOURNAL" title="Ideas for better living." link="/blog"/>
   <div className="journalGrid">{[
    ["How to choose the right wood for your home",products[0]?.img,"MATERIAL GUIDE"],
    ["5 ways to make a living room feel warmer",products[1]?.img,"HOME EDIT"],
    ["The details that make handcrafted furniture special",products[9]?.img,"CRAFT"]
   ].map(x=><Link to="/blog" className="journalCard" key={x[0]}><img onError={imageErrorFallback} src={x[1]}/><span>{x[2]}</span><h3>{x[0]}</h3><b>Read story <ArrowRight/></b></Link>)}</div>
  </section>

  {/* 16 Newsletter */}
  <section className="newsletter newsletterReveal"><span className="eyebrow">JOIN THE HOME EDIT</span><h2>Beautiful homes start here.</h2><p>Get first access to new collections, private offers and styling inspiration.</p><div><input placeholder="Your email address"/><button>Subscribe <ArrowRight/></button></div></section>
 </>
}function SectionTitle({kicker,title,link}){return <div className="sectionTitle"><div><span>{kicker}</span><h2>{title}</h2></div>{link&&<Link to={link}>View all <ArrowRight/></Link>}</div>}
function ProductGrid({items,add,toggleWish,wish}){return <div className="products">{items.map(p=><ProductCard key={p.id} p={p} add={add} toggleWish={toggleWish} wished={wish.some(x=>x.id===p.id)}/>)}</div>}
function ProductCard({p,add,toggleWish,wished}){return <article className="product"><Link to={"/product?id="+p.id} className="productImg">{p.tag&&<b className="tag">{p.tag}</b>}<img onError={imageErrorFallback} src={p.img}/><button className={wished?"wish active":"wish"} onClick={e=>{e.preventDefault();toggleWish(p)}}><Heart fill={wished?"currentColor":"none"}/></button><button className="quick" onClick={e=>{e.preventDefault();add(p)}}>Add to cart</button></Link><div className="productInfo"><div className="stars"><Star fill="currentColor"/> {p.rating}</div><Link to={"/product?id="+p.id}><h3>{p.name}</h3></Link><span className="sub">{p.sub}</span><div className="price"><b>{fmt(p.price)}</b><del>{fmt(p.old)}</del></div></div></article>}
function Shop({add,toggleWish,wish}){
 const qs=new URLSearchParams(useLocation().search),cat=qs.get("cat")||"",q=(qs.get("q")||"").toLowerCase();
 const categoryList=liveCats.length?liveCats:cats;const [sort,setSort]=useState("featured");
 const list=useMemo(()=>{let x=products.filter(p=>(!cat||p.category===cat)&&(!q||p.name.toLowerCase().includes(q)));if(sort==="low")x.sort((a,b)=>a.price-b.price);if(sort==="high")x.sort((a,b)=>b.price-a.price);return x},[cat,q,sort]);
 return <div className="container shop"><div className="crumb">Home / Shop</div><div className="shopHead"><div><span className="eyebrow">THE COLLECTION</span><h1>{cat||"All Furniture"}</h1><p>Thoughtfully designed furniture for every room.</p></div><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Sort: Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></div><div className="shopBody"><aside><b>Categories</b>{categoryList.map(([n,c])=><Link className={cat===c?"sel":""} to={"/shop"+(c?"?cat="+c:"")} key={n}>{n}</Link>)}<div className="filterNote"><SlidersHorizontal/><b>Made to last</b><span>Solid wood • Handcrafted • Premium finishes</span></div></aside><section><div className="resultbar">{list.length} products <span>Showing the latest collection</span></div><ProductGrid items={list} add={add} toggleWish={toggleWish} wish={wish}/></section></div></div>
}
function Product({add,toggleWish,wish}){
 const id=Number(new URLSearchParams(useLocation().search).get("id")||1),p=products.find(x=>x.id===id)||products[0],[qty,setQty]=useState(1),[tab,setTab]=useState("description"),[activeImg,setActiveImg]=useState(p.img),[zoom,setZoom]=useState(null);
 useEffect(()=>{setActiveImg(p.img);setZoom(null)},[p.id,p.img]);
 const moveZoom=e=>{const r=e.currentTarget.getBoundingClientRect(),x=((e.clientX-r.left)/r.width)*100,y=((e.clientY-r.top)/r.height)*100;setZoom({x,y,src:activeImg})};
 return <div className="container detail"><div className="crumb">Home / {p.category} / {p.name}</div><div className="detailGrid"><div className="gallery"><div className="mainImageWrap" onMouseMove={moveZoom} onMouseEnter={moveZoom} onMouseLeave={()=>setZoom(null)}><img src={activeImg} onError={imageErrorFallback} className="mainProductImage" alt={p.name}/>{zoom&&<div className="zoomPanel" style={{backgroundImage:`url("${zoom.src}")`,backgroundPosition:zoom.x+"% "+zoom.y+"%"}}><span>Move mouse to zoom</span></div>}</div><div className="thumbs">{(p.gallery&&p.gallery.length?p.gallery:[p.img]).map((src,i)=><img src={src} onError={imageErrorFallback} alt={p.name+" view "+(i+1)} className={activeImg===src?"active":""} key={src+i} onClick={()=>setActiveImg(src)}/> )}</div></div><div className="detailInfo"><span className="eyebrow">{p.category.toUpperCase()}</span><h1>{p.name}</h1><div className="rating"><Star fill="currentColor"/> {p.rating} <span>128 reviews</span></div><div className="detailPrice">{fmt(p.price)} <del>{fmt(p.old)}</del></div><p className="lead">{p.description||"A beautifully crafted furniture piece made from premium solid wood, finished by hand for a warm, timeless look."}</p><div className="swatch"><b>Finish</b><span>Natural Sheesham</span><i></i><i className="darkWood"></i></div><div className="buyrow"><div className="qty"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus/></button>{qty}<button onClick={()=>setQty(qty+1)}><Plus/></button></div><button className="btn dark big" onClick={()=>{for(let i=0;i<qty;i++)add(p)}}>Add to cart <ShoppingBag/></button><button className="round" onClick={()=>toggleWish(p)}><Heart/></button></div><div className="perks"><span><Truck/> Free delivery</span><span><ShieldCheck/> Quality checked</span><span><RotateCcw/> Easy returns</span></div></div></div><div className="detailTabs"><div><button className={tab==="description"?"active":""} onClick={()=>setTab("description")}>Description</button><button className={tab==="dimensions"?"active":""} onClick={()=>setTab("dimensions")}>Dimensions</button><button className={tab==="care"?"active":""} onClick={()=>setTab("care")}>Care guide</button></div><p>{tab==="description"?(p.description||p.short_description||"Designed for everyday living, this piece combines durable solid wood construction with thoughtful proportions and handcrafted finishing."):tab==="dimensions"?((p.length_in||p.width_in||p.height_in)?`Approx. ${p.length_in||"-"} × ${p.width_in||"-"} × ${p.height_in||"-"} in.${(p.length_cm||p.width_cm||p.height_cm)?` / ${p.length_cm||"-"} × ${p.width_cm||"-"} × ${p.height_cm||"-"} cm`:""}`:"Product dimensions can vary slightly because every piece is handcrafted."): (p.care_instructions||"Wipe with a soft dry cloth. Avoid prolonged moisture and direct heat. Use a wood-safe polish occasionally.")}</p></div><SectionTitle kicker="YOU MAY ALSO LIKE" title="Complete the room" link="/shop"/><ProductGrid items={products.filter(x=>x.id!==p.id).slice(0,4)} add={add} toggleWish={toggleWish} wish={wish}/></div>
}
function Cart({cart,setCart}){const total=cart.reduce((s,x)=>s+x.price*x.qty,0);return <div className="container page"><span className="eyebrow">YOUR BAG</span><h1>Shopping cart</h1>{!cart.length?<div className="empty"><ShoppingBag/><h2>Your cart is empty</h2><Link className="btn dark" to="/shop">Explore furniture</Link></div>:<div className="cartGrid"><section>{cart.map(x=><div className="cartItem" key={x.id}><img onError={imageErrorFallback} src={x.img}/><div><Link to={"/product?id="+x.id}><h3>{x.name}</h3></Link><span>{x.sub}</span><div className="cartActions"><div className="qty"><button onClick={()=>setCart(c=>c.map(i=>i.id===x.id?{...i,qty:Math.max(1,i.qty-1)}:i))}><Minus/></button>{x.qty}<button onClick={()=>setCart(c=>c.map(i=>i.id===x.id?{...i,qty:i.qty+1}:i))}><Plus/></button></div><button className="remove" onClick={()=>setCart(c=>c.filter(i=>i.id!==x.id))}><Trash2/> Remove</button></div></div><b>{fmt(x.price*x.qty)}</b></div>)}</section><aside className="summary"><h2>Order summary</h2><div><span>Subtotal</span><b>{fmt(total)}</b></div><div><span>Shipping</span><b>{total>=500?"Free":"$49"}</b></div><hr/><div className="total"><span>Total</span><b>{fmt(total+(total>=500?0:49))}</b></div><Link className="btn dark full" to="/checkout">Proceed to checkout <ArrowRight/></Link><p>Taxes calculated at checkout.</p></aside></div>}</div>}
function Wishlist({wish,add,toggleWish}){return <div className="container page"><span className="eyebrow">SAVED FOR LATER</span><h1>My wishlist</h1>{!wish.length?<div className="empty"><Heart/><h2>No saved pieces yet</h2><Link className="btn dark" to="/shop">Find your favourites</Link></div>:<ProductGrid items={wish} add={add} toggleWish={toggleWish} wish={wish}/>}</div>}
function Checkout({cart}){const total=cart.reduce((s,x)=>s+x.price*x.qty,0);return <div className="container checkout"><div><span className="eyebrow">SECURE CHECKOUT</span><h1>Complete your order</h1><div className="formCard"><h2>Contact information</h2><div className="formgrid"><input placeholder="First name"/><input placeholder="Last name"/><input placeholder="Email address"/><input placeholder="Phone number"/></div><h2>Delivery address</h2><div className="formgrid"><input className="wide" placeholder="Address"/><input placeholder="City"/><input placeholder="State"/><input placeholder="PIN / ZIP code"/></div><h2>Payment</h2><div className="pay">Cash on Delivery <Check/></div><button className="btn dark big full">Place order <ArrowRight/></button></div></div><aside className="summary"><h2>Your order</h2>{cart.map(x=><div className="mini" key={x.id}><img onError={imageErrorFallback} src={x.img}/><span>{x.name} × {x.qty}</span><b>{fmt(x.price*x.qty)}</b></div>)}<hr/><div className="total"><span>Total</span><b>{fmt(total)}</b></div></aside></div>}
function Blog(){const [items,setItems]=useState([]);useEffect(()=>{fetch("/api/store/blog").then(r=>r.json()).then(d=>setItems(d.items||[])).catch(()=>{})},[]);const fallback=[["How to choose the right wood for your home",products[0].img],["5 ways to make a small room feel bigger",products[4].img],["Why handcrafted furniture ages beautifully",products[9].img]];return <div className="container page"><span className="eyebrow">THE HOME JOURNAL</span><h1>Stories for better living.</h1><div className="blogGrid">{(items.length?items.map(x=>[x.title,x.image,x.excerpt]):fallback).map((x,i)=><article className="blogCard" key={x[0]+i}><img onError={imageErrorFallback} src={x[1]||products[i%products.length].img}/><div><span>INTERIORS</span><h2>{x[0]}</h2><p>{x[2]||"Ideas, materials and timeless styling inspiration from the Balaji Handicraft studio."}</p><b>Read story →</b></div></article>)}</div></div>}
function AdminLogin(){
 const [form,setForm]=useState({email:"",password:""});
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const navigate=useNavigate();

 const submit=async e=>{
   if(e)e.preventDefault();
   if(loading)return;
   setError("");
   const email=form.email.trim().toLowerCase();
   const password=form.password;
   if(!email||!password){setError("Please enter admin email and password.");return;}
   setLoading(true);
   try{
     const res=await fetch(new URL("/api/admin/login",window.location.origin),{
       method:"POST",
       headers:{"Content-Type":"application/json","Accept":"application/json"},
       body:JSON.stringify({email,password})
     });
     const text=await res.text();
     let data={};
     try{data=text?JSON.parse(text):{};}catch{data={message:text||"Server returned an invalid response"};}
     if(!res.ok)throw new Error(data.message||"Invalid admin email or password");
     if(!data.token)throw new Error("Login succeeded but no admin token was returned.");
     localStorage.setItem("bh_admin_token",data.token);
     navigate("/admin",{replace:true});
   }catch(err){
     setError(err.message||"Unable to sign in. Please try again.");
   }finally{
     setLoading(false);
   }
 };

 return <div className="container page adminAuth"><span className="eyebrow">STORE CONTROL</span><h1>Admin Login</h1><div className="accountCard authCard"><ShieldCheck/><h2>Balaji Handicraft Admin</h2><p>Authorized staff only. Sign in to manage the store.</p><form onSubmit={submit} noValidate><input type="email" placeholder="Admin email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} autoComplete="username" required/><input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} autoComplete="current-password" required/>{error&&<div className="authMessage">{error}</div>}<button className="btn dark full" type="submit" disabled={loading}>{loading?"Signing in…":"Sign in to Admin"}</button></form><Link className="authBottom" to="/">← Back to store</Link></div></div>
}
function ProductEditor({editing,setEditing,categories,subcategories,onSave,onCancel,onUpload}){
 const [tab,setTab]=useState("basic");
 const set=(key,value)=>setEditing({...editing,[key]:value});
 const inchToCm=v=>v===""||v==null?"":(Number(v)*2.54).toFixed(2);
 const cmToIn=v=>v===""||v==null?"":(Number(v)/2.54).toFixed(2);
 const setIn=(key,value,cmKey)=>{const next={...editing,[key]:value};if(value!==""&&Number.isFinite(Number(value)))next[cmKey]=inchToCm(value);setEditing(next)};
 const setCm=(key,value,inKey)=>{const next={...editing,[key]:value};if(value!==""&&Number.isFinite(Number(value)))next[inKey]=cmToIn(value);setEditing(next)};
 const subs=subcategories.filter(s=>String(s.category_id)===String(editing.category_id||""));
 const field=(label,key,placeholder,type="text")=><label className="peField"><span>{label}</span><input type={type} placeholder={placeholder||label} value={editing[key]??""} onChange={e=>set(key,e.target.value)}/></label>;
 const tabs=[["basic","Basic Information",FileText],["media","Images & Video",ImageIcon],["details","Product Details",Boxes],["specs","Specifications",SlidersHorizontal],["pricing","Pricing & Stock",ShoppingBag],["seo","SEO & Meta",Tag],["settings","Settings",Settings]];
 const uploadBox=(key,label,sub)=> <button type="button" className={"uploadBox "+(editing[key]?"hasImage":"")} onClick={()=>onUpload&&onUpload(key)}>{editing[key]?<><img onError={imageErrorFallback} src={editing[key]} /><span>Replace Image</span></>:<><ImageIcon/><b>Upload Image</b><small>{label}</small><em>{sub}</em></>}</button>;
 return <div className="productEditor">
  <div className="peHead"><div><div className="peCrumb"><Star/> Products <ChevronDown/> Add Product</div><h3>{editing.id?"Edit Product":"Add New Product"}</h3><p>Add product details, images, video, specifications and SEO information.</p></div><div className="peHeadActions"><button className="btn light" onClick={onCancel}>← Back to Products</button><button className="btn dark" onClick={onSave}><Save/> Save Product</button></div></div>
  <div className="peTabs">{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}><Icon/>{label}</button>)}</div>
  {tab==="basic"&&<div className="peCanvas">
   <div className="peMain">
    <section className="peCard"><h4><FileText/> Basic Information</h4><div className="peBasicGrid"><div className="peLeft">{field("Product Name *","name","e.g. Sheesham Wood 6 Drawer Dresser")}{field("SKU *","sku","e.g. BH-DR-001")}<label className="peField"><span>Short Description *</span><textarea rows="3" maxLength="200" placeholder="Enter a short description (will be shown on product listing)" value={editing.short_description||""} onChange={e=>set("short_description",e.target.value)}/><small>{(editing.short_description||"").length}/200</small></label><label className="peField"><span>Full Description *</span><textarea className="richText" rows="7" placeholder="Enter detailed product description..." value={editing.description||""} onChange={e=>set("description",e.target.value)}/></label></div><div className="peRight"><label className="peField"><span>Category *</span><select value={editing.category_id||""} onChange={e=>setEditing({...editing,category_id:e.target.value,subcategory_id:""})}><option value="">Select Category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="peField"><span>Subcategory *</span><select value={editing.subcategory_id||""} onChange={e=>set("subcategory_id",e.target.value)}><option value="">Select Subcategory</option>{subs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>{field("Brand","brand","Enter brand name")}{field("Material","material","e.g. Solid Sheesham Wood")}{field("Tags (comma separated)","tags","e.g. wooden, dresser, storage, bedroom")}</div></div></section>
    <section className="peCard"><h4><ImageIcon/> Product Images & Video</h4><div className="mediaLayout"><div><div className="fieldTitle">Product Images <b>(Add up to 5 images) *</b></div><div className="uploadGrid">{["image","image_2","image_3","image_4","image_5"].map((k,i)=><div key={k}>{uploadBox(k,i===0?"Main Image":"Image "+(i+1),"800×800px")}</div>)}</div></div><div><div className="fieldTitle">Product Video <span>(Optional)</span></div><button type="button" className="videoBox" onClick={()=>onUpload&&onUpload("video")}>{editing.video?<><Video/><b>Video uploaded</b><small>Click to replace</small></>:<><Video/><b>Upload Video</b><small>MP4 or WebM (Max 50MB)</small><em>Product showcase video</em></>}</button></div></div></section>
    <div className="bottomGrid"><section className="peCard"><h4><SlidersHorizontal/> Product Specifications</h4><div className="specInputs">{[["Length","length_in","length_cm"],["Width","width_in","width_cm"],["Height","height_in","height_cm"]].map(([n,i,c])=><div key={n}><span>{n} (inches)</span><input type="number" step=".01" placeholder={n==="Length"?"48":n==="Width"?"18":"32"} value={editing[i]??""} onChange={e=>setIn(i,e.target.value,c)}/><span>{n} (cm)</span><input type="number" step=".01" placeholder={n==="Length"?"122":n==="Width"?"46":"81"} value={editing[c]??""} onChange={e=>setCm(c,e.target.value,i)}/></div>)}<div><span>Weight (kg)</span><input type="number" step=".01" placeholder="45" value={editing.weight_kg??""} onChange={e=>set("weight_kg",e.target.value)}/></div></div><button className="addSpecBtn" type="button" onClick={()=>setTab("details")}>+ Add More Specification</button></section>
    <section className="peCard"><h4>₹ Pricing & Stock</h4><div className="priceGrid">{field("Regular Price *","old_price","0","number")}{field("Sale Price","price","0","number")}{field("Stock Quantity *","qty","0","number")}{field("Low Stock Alert","low_stock_alert","5","number")}</div></section></div>
   </div>
   <aside className="peSide"><section className="peCard"><h4><Settings/> Product Status</h4><div className="toggleRow"><span>Active</span><button type="button" className={"switch "+(editing.status!=="inactive"?"on":"")} onClick={()=>set("status",editing.status==="inactive"?"active":"inactive")}><i/></button></div>{[["featured","Featured Product"],["best_seller","Best Seller"],["new_arrival","New Arrival"]].map(([k,l])=><label className="checkRow" key={k}><input type="checkbox" checked={Boolean(Number(editing[k]))} onChange={e=>set(k,e.target.checked?1:0)}/><span>{l}</span>{k==="featured"&&<Info/>}</label>)}</section>
   <section className="peCard"><h4><CalendarDays/> Publishing</h4><div className="twoFields">{field("Publish Date","publish_date","2026-10-07","date")}{field("Sort Order","sort_order","0","number")}</div></section>
   <section className="peCard"><h4><Search/> Preview</h4><div className="previewBox"><img onError={imageErrorFallback} src={editing.image||"https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=500"}/><div><b>Product Preview</b><span>Will appear like this on store</span><button type="button">Preview on Store <ExternalLink/></button></div></div></section>
   <section className="peCard"><h4><Search/> SEO & Meta Information</h4>{field("SEO Title","seo_title","e.g. Sheesham Wood 6 Drawer Dresser | Balaji Handicraft")}<label className="peField"><span>Meta Description</span><textarea rows="4" maxLength="160" placeholder="Enter meta description for search engines" value={editing.meta_description||""} onChange={e=>set("meta_description",e.target.value)}/></label>{field("Product URL Slug","slug","e.g. sheesham-wood-6-drawer-dresser")}</section></aside>
  </div>}
  {tab==="media"&&<div className="tabPage"><section className="peCard"><h4><ImageIcon/> Images & Video</h4><div className="uploadGrid large">{["image","image_2","image_3","image_4","image_5"].map((k,i)=><div key={k}>{uploadBox(k,i===0?"Main Image":"Image "+(i+1),"800×800px")}</div>)}</div><button type="button" className="videoBox wideVideo" onClick={()=>onUpload&&onUpload("video")}><Video/><b>{editing.video?"Replace Product Video":"Upload Product Video"}</b><small>MP4 or WebM • Maximum 50MB</small></button></section></div>}
  {tab==="details"&&<div className="tabPage"><section className="peCard"><h4><Boxes/> Product Details</h4><div className="peGrid">{field("Color","color","Natural Brown")}{field("Finish","finish","Natural / Matte")}<label className="peField peWide"><span>Care Instructions</span><textarea rows="6" value={editing.care_instructions||""} onChange={e=>set("care_instructions",e.target.value)} placeholder="Wipe with a soft dry cloth..."/></label><label className="peField peWide"><span>Assembly Information</span><textarea rows="6" value={editing.assembly_info||""} onChange={e=>set("assembly_info",e.target.value)} placeholder="Assembly required / Ready to use"/></label></div></section></div>}
  {tab==="specs"&&<div className="tabPage"><section className="peCard"><h4><SlidersHorizontal/> Specifications</h4><div className="specLarge">{[["Length","length_in","length_cm"],["Width","width_in","width_cm"],["Height","height_in","height_cm"]].map(([n,i,c])=><div className="specLargeRow" key={n}><b>{n}</b><input type="number" value={editing[i]??""} onChange={e=>setIn(i,e.target.value,c)} placeholder="Inches"/><input type="number" value={editing[c]??""} onChange={e=>setCm(c,e.target.value,i)} placeholder="Centimetres"/></div>)}<div className="specLargeRow"><b>Weight</b><input type="number" value={editing.weight_kg??""} onChange={e=>set("weight_kg",e.target.value)} placeholder="KG"/><span>kg</span></div></div></section></div>}
  {tab==="pricing"&&<div className="tabPage"><section className="peCard"><h4>₹ Pricing & Stock</h4><div className="peGrid">{field("Regular Price *","old_price","0","number")}{field("Sale Price","price","0","number")}{field("Stock Quantity *","qty","0","number")}{field("Low Stock Alert","low_stock_alert","5","number")}</div></section></div>}
  {tab==="seo"&&<div className="tabPage"><section className="peCard"><h4><Tag/> SEO & Meta</h4><div className="peGrid">{field("SEO Title","seo_title","Product name | Balaji Handicraft")}{field("Product URL Slug","slug","solid-sheesham-wood-cabinet")}<label className="peField peWide"><span>Meta Description</span><textarea rows="7" maxLength="160" value={editing.meta_description||""} onChange={e=>set("meta_description",e.target.value)} placeholder="Enter meta description for search engines"/></label></div></section></div>}
  {tab==="settings"&&<div className="tabPage"><section className="peCard"><h4><Settings/> Product Settings</h4><div className="peSettings">{[["featured","Featured Product"],["best_seller","Best Seller"],["new_arrival","New Arrival"]].map(([k,l])=><label key={k}><input type="checkbox" checked={Boolean(Number(editing[k]))} onChange={e=>set(k,e.target.checked?1:0)}/><span>{l}</span><small>Control how this product is highlighted across the store.</small></label>)}</div></section></div>}
  <div className="peBottomActions"><button className="btn light" onClick={onCancel}>Cancel</button><button className="btn dark" onClick={onSave}><Save/> {editing.id?"Update Product":"Save Product"}</button></div>
 </div>
}

function AdminModule({module,api,setNotice}){
 const configs={
  banners:{title:"Banners",endpoint:"banners",fields:[["title","Banner Title"],["image","Image URL"],["link","Link URL"],["sort_order","Sort Order"]]},
  blog:{title:"Blog",endpoint:"blog_posts",fields:[["title","Title"],["slug","Slug"],["excerpt","Excerpt"],["content","Content"],["image","Image URL"],["status","Status"],["seo_title","SEO Title"],["meta_description","Meta Description"]]},
  coupons:{title:"Coupons",endpoint:"coupons",fields:[["code","Coupon Code"],["discount_type","Discount Type"],["discount_value","Discount Value"],["min_order","Minimum Order"],["expires_at","Expiry Date"],["status","Status"]]},
  reviews:{title:"Reviews",endpoint:"reviews",fields:[["product_id","Product ID"],["customer_name","Customer Name"],["rating","Rating"],["comment","Review"],["status","Status"]]},
  messages:{title:"Messages",endpoint:"contact_messages",fields:[]},
  customers:{title:"Customers",endpoint:"customers",fields:[]},
  users:{title:"Users",endpoint:"users",fields:[]}
 };
 const cfg=configs[module]; const [items,setItems]=useState([]); const [editing,setEditing]=useState(null); const [loading,setLoading]=useState(true);
 const load=async()=>{setLoading(true);try{const d=await api("/api/admin/"+cfg.endpoint);setItems(d.items||[])}catch(e){setNotice(e.message)}finally{setLoading(false)}};
 useEffect(()=>{load()},[module]);
 const save=async()=>{try{if(!editing)return; if(editing.id)await api("/api/admin/"+cfg.endpoint+"/"+editing.id,{method:"PUT",body:JSON.stringify(editing)});else await api("/api/admin/"+cfg.endpoint,{method:"POST",body:JSON.stringify(editing)});setEditing(null);setNotice(cfg.title+" saved successfully.");load()}catch(e){setNotice(e.message)}};
 const remove=async id=>{if(!confirm("Delete this item?"))return;try{await api("/api/admin/"+cfg.endpoint+"/"+id,{method:"DELETE"});load();setNotice("Deleted successfully.")}catch(e){setNotice(e.message)}};
 return <><div className="adminPageTitle"><div><div className="pageCrumb">Management <ChevronDown/> {cfg.title}</div><h1>{cfg.title}</h1><p>Manage {cfg.title.toLowerCase()} connected to the store.</p></div>{cfg.fields.length>0&&<button className="btn dark" onClick={()=>setEditing({})}><Plus/> Add {cfg.title.slice(0,-1)}</button>}</div>
 {editing&&<section className="settingsAdminCard adminModuleForm">{cfg.fields.map(([key,label])=><label key={key}>{label}<input value={editing[key]??""} onChange={e=>setEditing({...editing,[key]:e.target.value})}/></label>)}<div><button className="btn dark" onClick={save}><Save/> Save</button> <button className="btn light" onClick={()=>setEditing(null)}>Cancel</button></div></section>}
 <section className="listCard">{loading?<div className="adminLoading">Loading…</div>:items.length?items.map(x=><div className="simpleRow adminDataRow" key={x.id}><b>{x.title||x.code||x.customer_name||x.name||("Item #"+x.id)}</b><span>{x.status||x.email||x.message||x.comment||x.created_at||""}</span>{cfg.fields.length>0&&<button onClick={()=>setEditing({...x})}>Edit</button>}{cfg.fields.length>0&&<button onClick={()=>remove(x.id)}><Trash2/></button>}</div>):<div className="adminEmpty">No records found.</div>}</section></>;
}
function AdminSettingsModule({type,api,setNotice}){
 const [data,setData]=useState({}); const [loading,setLoading]=useState(true);
 const cfg=type==="homepage"?{title:"Homepage",endpoint:"homepage",fields:[["homepage_hero","Hero Heading"],["homepage_subtitle","Hero Subtitle"],["homepage_image","Hero Image URL"]]}:{title:"SEO Settings",endpoint:"seo",fields:[["seo_title","Site SEO Title"],["meta_description","Meta Description"],["seo_keywords","SEO Keywords"],["favicon","Favicon URL"]]};
 useEffect(()=>{api("/api/admin/"+cfg.endpoint).then(d=>setData(d.settings||{})).catch(e=>setNotice(e.message)).finally(()=>setLoading(false))},[type]);
 const save=async()=>{try{await api("/api/admin/"+cfg.endpoint,{method:"PUT",body:JSON.stringify(data)});setNotice(cfg.title+" saved successfully.")}catch(e){setNotice(e.message)}};
 return <><div className="adminPageTitle"><div><div className="pageCrumb">Store <ChevronDown/> {cfg.title}</div><h1>{cfg.title}</h1><p>Changes here are connected to the live website.</p></div></div><section className="settingsAdminCard">{loading?<div className="adminLoading">Loading…</div>:<>{cfg.fields.map(([k,l])=><label key={k}>{l}<input value={data[k]??""} onChange={e=>setData({...data,[k]:e.target.value})}/></label>)}<button className="btn dark" onClick={save}><Save/> Save Changes</button></>}</section></>;
}
function AdminReports({api,setNotice}){
 const [data,setData]=useState({daily:[],status:[]}); useEffect(()=>{api("/api/admin/reports").then(setData).catch(e=>setNotice(e.message))},[]);
 return <><div className="adminPageTitle"><div><div className="pageCrumb">Analytics <ChevronDown/> Reports</div><h1>Reports</h1><p>Real order and revenue reports from the database.</p></div></div><div className="dashboardStats"><div><span>Total Orders</span><b>{data.status.reduce((a,x)=>a+Number(x.count||0),0)}</b></div><div><span>Total Revenue</span><b>₹{data.status.reduce((a,x)=>a+Number(x.revenue||0),0).toLocaleString("en-IN")}</b></div><div><span>Report Days</span><b>{data.daily.length}</b></div><div><span>Statuses</span><b>{data.status.length}</b></div></div><section className="listCard" style={{marginTop:"16px"}}>{data.daily.map(x=><div className="simpleRow" key={x.day}><b>{String(x.day).slice(0,10)}</b><span>{x.orders} orders</span><strong>₹{Number(x.revenue||0).toLocaleString("en-IN")}</strong></div>)}</section></>;
}

function Admin(){
 const [section,setSection]=useState("products"); const [productView,setProductView]=useState("add");
 const [allowed,setAllowed]=useState(Boolean(localStorage.getItem("bh_admin_token")));
 const [stats,setStats]=useState({products:0,orders:0,customers:0,revenue:0}); const [rows,setRows]=useState([]); const [selectedProducts,setSelectedProducts]=useState([]);
 const [categories,setCategories]=useState([]); const [subcategories,setSubcategories]=useState([]); const [categoryMode,setCategoryMode]=useState("categories"); const [orders,setOrders]=useState([]);
 const [settings,setSettings]=useState({store_name:"Balaji Handicraft",currency:"INR",shipping_threshold:42000,phone:"",email:"",address:"",announcement:""});
 const [editing,setEditing]=useState(null); const [notice,setNotice]=useState(""); const [loading,setLoading]=useState(false); const [search,setSearch]=useState("");
 const [collapsed,setCollapsed]=useState(false); const [dark,setDark]=useState(()=>localStorage.getItem("bh_admin_dark")==="1"); const [notificationsOpen,setNotificationsOpen]=useState(false); const [userOpen,setUserOpen]=useState(false); const navigate=useNavigate(); const token=localStorage.getItem("bh_admin_token");
 const api=async(path,options={})=>{const isForm=options.body instanceof FormData;const headers={"Authorization":"Bearer "+(localStorage.getItem("bh_admin_token")||token||""),...(options.headers||{})};if(!isForm)headers["Content-Type"]="application/json";const res=await fetch(path,{...options,headers});const text=await res.text();let data={};try{data=text?JSON.parse(text):{};}catch{data={message:text};}if(res.status===401){localStorage.removeItem("bh_admin_token");setAllowed(false);throw new Error("Admin session expired. Please login again.");}if(!res.ok)throw new Error(data.message||"Request failed");return data};
 const load=async()=>{setLoading(true);try{const [s,p,c,o,st]=await Promise.all([api("/api/admin/stats"),api("/api/admin/products"),api("/api/admin/categories"),api("/api/admin/orders"),api("/api/admin/settings")]);setStats(s);setRows(p.products||[]);setCategories(c.categories||[]);setSubcategories(c.subcategories||[]);setOrders(o.orders||[]);setSettings(st.settings||settings)}catch(e){setNotice(e.message||"Could not load admin data")}finally{setLoading(false)}};
 useEffect(()=>{if(allowed)load()},[allowed]);
 useEffect(()=>{localStorage.setItem("bh_admin_dark",dark?"1":"0")},[dark]);
 if(!allowed)return <AdminLogin/>;
 const blankProduct=()=>({name:"",sku:"",category_id:"",subcategory_id:"",short_description:"",description:"",brand:"Balaji Handicraft",material:"Solid Sheesham Wood",tags:"",image:"",image_2:"",image_3:"",image_4:"",image_5:"",video:"",length_in:"",width_in:"",height_in:"",length_cm:"",width_cm:"",height_cm:"",weight_kg:"",color:"",finish:"",care_instructions:"",assembly_info:"",price:"",old_price:"",qty:"",low_stock_alert:"5",status:"active",featured:0,best_seller:0,new_arrival:0,seo_title:"",meta_description:"",slug:"",publish_date:"2026-10-07",sort_order:"0"});
 const startAdd=()=>{setEditing(blankProduct());setSection("products");setProductView("add")};
 const editProduct=x=>{setEditing({...blankProduct(),...x});setSection("products");setProductView("add")};
 const saveProduct=async()=>{if(!editing?.name?.trim())return setNotice("Product name is required.");const payload={...editing,name:editing.name.trim(),price:Number(editing.price||0),old_price:Number(editing.old_price||0),qty:Number(editing.qty||0),category_id:editing.category_id?Number(editing.category_id):null,subcategory_id:editing.subcategory_id?Number(editing.subcategory_id):null,length_in:editing.length_in===""?null:Number(editing.length_in),width_in:editing.width_in===""?null:Number(editing.width_in),height_in:editing.height_in===""?null:Number(editing.height_in),length_cm:editing.length_cm===""?null:Number(editing.length_cm),width_cm:editing.width_cm===""?null:Number(editing.width_cm),height_cm:editing.height_cm===""?null:Number(editing.height_cm),weight_kg:editing.weight_kg===""?null:Number(editing.weight_kg),featured:editing.featured?1:0,best_seller:editing.best_seller?1:0,new_arrival:editing.new_arrival?1:0};try{if(editing.id)await api("/api/admin/products/"+editing.id,{method:"PUT",body:JSON.stringify(payload)});else await api("/api/admin/products",{method:"POST",body:JSON.stringify(payload)});setEditing(null);setProductView("all");setNotice("Product saved successfully.");load()}catch(e){setNotice(e.message||"Could not save product")}};
 const uploadMedia=async key=>{const input=document.createElement("input");input.type="file";input.accept=key==="video"?"video/*":"image/*";input.onchange=async()=>{const file=input.files?.[0];if(!file)return;const form=new FormData();form.append("file",file);try{setNotice("Uploading "+file.name+"…");const data=await api("/api/admin/upload",{method:"POST",body:form});setEditing(e=>({...e,[key]:data.url}));setNotice("Upload complete.")}catch(e){setNotice(e.message||"Upload failed")}};input.click()};
 const removeProduct=async id=>{if(!confirm("Delete this product permanently?"))return;try{await api("/api/admin/products/"+id,{method:"DELETE"});setNotice("Product deleted.");load()}catch(e){setNotice(e.message)}};
 const visibleProducts=rows.filter(x=>(x.name||"").toLowerCase().includes(search.toLowerCase()));
 const toggleProduct=(id,checked)=>setSelectedProducts(current=>checked?[...new Set([...current,id])]:current.filter(x=>x!==id));
 const toggleAllVisible=checked=>setSelectedProducts(current=>checked?[...new Set([...current,...visibleProducts.map(x=>x.id)])]:current.filter(id=>!visibleProducts.some(x=>x.id===id)));
 const bulkDeleteProducts=async()=>{const ids=selectedProducts.filter(id=>rows.some(x=>x.id===id));if(!ids.length)return setNotice("Select at least one product.");if(!confirm("Permanently delete "+ids.length+" selected product(s)? This cannot be undone."))return;try{await api("/api/admin/products/bulk",{method:"DELETE",body:JSON.stringify({ids})});setNotice(ids.length+" product(s) deleted.");setSelectedProducts([]);load()}catch(e){setNotice(e.message||"Bulk delete failed")}};
 const saveSettings=async()=>{try{await api("/api/admin/settings",{method:"PUT",body:JSON.stringify(settings)});setNotice("Store settings saved.")}catch(e){setNotice(e.message)}};
 const saveSubcategory=async()=>{if(!editing?.name)return setNotice("Subcategory name is required.");if(!editing?.category_id)return setNotice("Select a parent category.");try{const payload={...editing,category_id:Number(editing.category_id)};if(editing.id)await api("/api/admin/subcategories/"+editing.id,{method:"PUT",body:JSON.stringify(payload)});else await api("/api/admin/subcategories",{method:"POST",body:JSON.stringify(payload)});setEditing(null);setNotice("Subcategory saved.");load()}catch(e){setNotice(e.message)}};
 const saveCategory=async()=>{if(!editing?.name)return setNotice("Category name is required.");try{if(editing.id)await api("/api/admin/categories/"+editing.id,{method:"PUT",body:JSON.stringify(editing)});else await api("/api/admin/categories",{method:"POST",body:JSON.stringify(editing)});setEditing(null);setNotice("Category saved.");load()}catch(e){setNotice(e.message)}};
 const logout=()=>{localStorage.removeItem("bh_admin_token");setAllowed(false);navigate("/admin",{replace:true})};
 const nav=[["dashboard","Dashboard",LayoutDashboard],["products","Products",Package,true],["categories","Categories",FileText],["orders","Orders",ShoppingCart],["customers","Customers",Users],["banners","Banners",ImageIcon],["homepage","Homepage",HomeIcon],["blog","Blog",FileText],["coupons","Coupons",Ticket],["reviews","Reviews",Star],["messages","Messages",MessageSquare],["seo","SEO Settings",Search],["store","Store Settings",Settings],["users","Users",User],["reports","Reports",BarChart3]];
 const sectionTitle=nav.find(x=>x[0]===section)?.[1]||"Dashboard";
 const notificationItems=orders.slice(0,5); const notificationCount=orders.filter(o=>String(o.status||"").toLowerCase().includes("pending")).length;
 const bulkUpload=()=>{const input=document.createElement("input");input.type="file";input.accept=".csv,text/csv";input.onchange=async()=>{const file=input.files?.[0];if(!file)return;const form=new FormData();form.append("file",file);try{setNotice("Importing "+file.name+"…");const data=await api("/api/admin/products/bulk-csv",{method:"POST",body:form});setNotice("Imported: "+(data.created||0)+" created, "+(data.updated||0)+" updated.");load()}catch(e){setNotice(e.message||"Bulk import failed")}};input.click()};
 const handleAdminSearch=value=>{setSearch(value);const q=value.trim().toLowerCase();if(!q)return;if(q.includes("order")){setSection("orders");setProductView("all")}else if(q.includes("customer")||q.includes("user")){setSection(q.includes("customer")?"customers":"users")}else if(q.includes("category"))setSection("categories");else if(q.includes("banner"))setSection("banners");else if(q.includes("blog"))setSection("blog");else if(q.includes("coupon"))setSection("coupons");else if(q.includes("review"))setSection("reviews");else if(q.includes("message"))setSection("messages");else if(q.includes("seo"))setSection("seo");else if(q.includes("setting"))setSection("store");else if(q.includes("report"))setSection("reports");else setSection("products");};
 const Placeholder=({title})=><div className="adminPlaceholder"><div><Settings/><h2>{title}</h2><p>This admin module is ready for the next database-connected step.</p><button className="btn dark" onClick={()=>setSection("products")}>Go to Products</button></div></div>;
 return <div className={"adminApp "+(collapsed?"sidebarCollapsed ":"")+(dark?"adminDark":"")}>
  <aside className="adminSidebar"><div className="adminBrand"><span>BH</span><div><b>BALAJI</b><small>HANDICRAFT</small></div><button onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen/>:<PanelLeftClose/>}</button></div><nav>{nav.map(([id,label,Icon,expand])=><React.Fragment key={id}><button className={section===id?"active":""} onClick={()=>{setSection(id);if(id==="products")setProductView("all");setEditing(null)}} title={label}><Icon/><span>{label}</span>{expand&&<ChevronDown/>}</button>{id==="products"&&section==="products"&&<div className="adminSubnav"><button className={productView==="all"&&!editing?"active":""} onClick={()=>{setProductView("all");setEditing(null)}}>All Products</button><button className={productView==="add"||editing?"active":""} onClick={startAdd}>Add Product</button><button className={productView==="bulk"?"active":""} onClick={bulkUpload}>Product Bulk Upload</button></div>}</React.Fragment>)}</nav><button className="adminLogout" onClick={logout}><LogOut/><span>Logout</span></button></aside>
  <div className="adminWorkspace"><header className="adminHeader"><button className="mobileSideBtn" onClick={()=>setCollapsed(!collapsed)}><Menu/></button><div className="adminSearch"><Search/><input value={search} onChange={e=>handleAdminSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleAdminSearch(e.currentTarget.value)}} placeholder="Search products, orders, customers..."/></div><div className="adminHeaderRight"><Link to="/" target="_blank" rel="noreferrer" className="viewStore">View Store <ExternalLink/></Link><button className="headerIconBtn" title={dark?"Switch to light mode":"Switch to dark mode"} onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</button><div className="headerPopoverWrap"><button className="headerIconBtn bell" title="Notifications" onClick={()=>{setNotificationsOpen(!notificationsOpen);setUserOpen(false)}}><Bell/>{notificationCount>0&&<i>{notificationCount>99?"99+":notificationCount}</i>}</button>{notificationsOpen&&<div className="headerPopover notificationPopover"><div className="popoverTitle"><b>Notifications</b><button onClick={()=>setNotificationsOpen(false)}>×</button></div>{notificationItems.length?notificationItems.map(o=><button className="notificationItem" key={o.id} onClick={()=>{setSection("orders");setNotificationsOpen(false)}}><strong>Order #{o.id}</strong><span>{o.status||"New order"} · ₹{Number(o.total||0).toLocaleString("en-IN")}</span></button>):<div className="popoverEmpty">No recent notifications.</div>}</div>}</div><div className="headerPopoverWrap"><button className="adminUser" title="Admin menu" onClick={()=>{setUserOpen(!userOpen);setNotificationsOpen(false)}}><span>A</span><b>Admin</b><ChevronDown/></button>{userOpen&&<div className="headerPopover userPopover"><button onClick={()=>{setSection("store");setUserOpen(false)}}><Settings/> Store Settings</button><button onClick={()=>{setSection("seo");setUserOpen(false)}}><Search/> SEO Settings</button><button onClick={()=>{setSection("reports");setUserOpen(false)}}><BarChart3/> Reports</button><button className="danger" onClick={logout}><LogOut/> Logout</button></div>}</div></div></header>
   <main className="adminMain">{notice&&<div className="adminNotice">{notice}</div>}
    {section==="products"&&productView==="add"&&editing?<ProductEditor editing={editing} setEditing={setEditing} categories={categories} subcategories={subcategories} onSave={saveProduct} onCancel={()=>{setEditing(null);setProductView("all")}} onUpload={uploadMedia}/>:section==="products"?<><div className="adminPageTitle"><div><div className="pageCrumb">Products <ChevronDown/> All Products</div><h1>Products</h1><p>Manage your furniture catalog, inventory and product information.</p></div><div className="peHeadActions"><button className="btn light" onClick={bulkUpload}><FileImage/> Bulk Upload CSV</button><button className="btn dark" onClick={startAdd}><Plus/> Add Product</button></div></div><section className="listCard"><div className="listToolbar"><b>{visibleProducts.length} Products</b><div><input placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)}/><button onClick={load}>Refresh</button></div></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"12px 16px",borderBottom:"1px solid #e9e2d8",background:"#faf8f4",flexWrap:"wrap"}}><label style={{display:"flex",alignItems:"center",gap:9,fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={visibleProducts.length>0&&visibleProducts.every(x=>selectedProducts.includes(x.id))} onChange={e=>toggleAllVisible(e.target.checked)}/> Select all products {search.trim()?"in search results":"("+rows.length+")"}</label><button className="btn dark" disabled={!selectedProducts.length} onClick={bulkDeleteProducts} style={{opacity:selectedProducts.length?1:.5,cursor:selectedProducts.length?"pointer":"not-allowed"}}><Trash2/> Delete selected ({selectedProducts.length})</button></div>{loading?<div className="adminLoading">Loading products…</div>:visibleProducts.map(x=><div className="productListRow" key={x.id}><input aria-label={"Select "+x.name} type="checkbox" checked={selectedProducts.includes(x.id)} onChange={e=>toggleProduct(x.id,e.target.checked)} style={{margin:"0 8px",flexShrink:0}}/><img onError={imageErrorFallback} src={x.image||"https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=300"}/><div><b>{x.name}</b><span>{x.sku||"No SKU"} · {x.category_name||"Furniture"}</span></div><strong>₹{Number(x.price||0).toLocaleString("en-IN")}</strong><span className="pill">{x.status||"active"}</span><button onClick={()=>editProduct(x)}>Edit</button><button onClick={()=>removeProduct(x.id)}><Trash2/></button></div>)}</section></>:section==="categories"?<><div className="adminPageTitle"><div><div className="pageCrumb">Catalog <ChevronDown/> Categories</div><h1>{categoryMode==="categories"?"Categories":"Subcategories"}</h1><p>Manage furniture categories and subcategories.</p></div><div className="peHeadActions"><button className={categoryMode==="categories"?"btn dark":"btn light"} onClick={()=>{setCategoryMode("categories");setEditing(null)}}>Categories</button><button className={categoryMode==="subcategories"?"btn dark":"btn light"} onClick={()=>{setCategoryMode("subcategories");setEditing(null)}}>Subcategories</button><button className="btn dark" onClick={()=>setEditing(categoryMode==="categories"?{name:"",slug:""}:{name:"",slug:"",category_id:""})}><Plus/> Add {categoryMode==="categories"?"Category":"Subcategory"}</button></div></div><section className="listCard">{editing&&<div className="quickEdit"><label>{categoryMode==="categories"?"Category Name":"Subcategory Name"}<input placeholder={categoryMode==="categories"?"Category name":"Subcategory name"} value={editing.name||""} onChange={e=>setEditing({...editing,name:e.target.value})}/>{categoryMode==="subcategories"&&<><span style={{display:"block",marginTop:"8px"}}>Parent Category</span><select value={editing.category_id||""} onChange={e=>setEditing({...editing,category_id:e.target.value})} style={{display:"block",width:"280px",border:"1px solid #ddd7ce",padding:"10px",marginTop:"6px",fontSize:"10px"}}><option value="">Select Category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></>}<button className="btn dark" onClick={categoryMode==="categories"?saveCategory:saveSubcategory}><Save/> Save {categoryMode==="categories"?"Category":"Subcategory"}</button></label></div>}{categoryMode==="categories"?categories.map(c=><div className="simpleRow" key={c.id}><b>{c.name}</b><span>{subcategories.filter(s=>Number(s.category_id)===Number(c.id)).length} subcategories</span><button onClick={()=>setEditing({...c})}>Edit</button></div>):subcategories.map(s=><div className="simpleRow" key={s.id}><b>{s.name}</b><span>{s.category_name||categories.find(c=>Number(c.id)===Number(s.category_id))?.name||"No parent"}</span><button onClick={()=>setEditing({...s})}>Edit</button></div>)}</section></>:section==="orders"?<><div className="adminPageTitle"><div><div className="pageCrumb">Sales <ChevronDown/> Orders</div><h1>Orders</h1><p>View and manage customer orders.</p></div></div><section className="listCard">{orders.length?orders.map(o=><div className="simpleRow" key={o.id}><b>#{o.order_number||o.id}</b><span>{o.created_at||"Order"} · {o.status||"Pending"}</span><strong>₹{Number(o.total||0).toLocaleString("en-IN")}</strong></div>):<div className="adminEmpty">No orders found yet.</div>}</section></>:section==="store"?<><div className="adminPageTitle"><div><div className="pageCrumb">Settings <ChevronDown/> Store Settings</div><h1>Store Settings</h1></div></div><section className="settingsAdminCard">{["store_name","currency","shipping_threshold","announcement","phone","email","address"].map(k=><label key={k}>{k.replaceAll("_"," ")}<input value={settings[k]??""} onChange={e=>setSettings({...settings,[k]:e.target.value})}/></label>)}<button className="btn dark" onClick={saveSettings}><Save/> Save Settings</button></section></>:section==="dashboard"?<><div className="adminPageTitle"><div><div className="pageCrumb">Home <ChevronDown/> Dashboard</div><h1>Dashboard</h1><p>Welcome back. Here's what's happening with your store.</p></div></div><div className="dashboardStats"><div><span>Products</span><b>{stats.products}</b><small>Live catalog</small></div><div><span>Orders</span><b>{stats.orders}</b><small>Latest orders</small></div><div><span>Customers</span><b>{stats.customers}</b><small>Registered users</small></div><div><span>Revenue</span><b>₹{Number(stats.revenue||0).toLocaleString("en-IN")}</b><small>Database total</small></div></div><div className="dashboardQuick"><button onClick={startAdd}><Plus/> Add Product</button><button onClick={()=>setSection("orders")}><ShoppingCart/> View Orders</button><button onClick={()=>setSection("categories")}><FileText/> Categories</button><button onClick={()=>setSection("store")}><Settings/> Store Settings</button></div></>:section==="customers"?<AdminModule module="customers" api={api} setNotice={setNotice}/>:section==="banners"?<AdminModule module="banners" api={api} setNotice={setNotice}/>:section==="blog"?<AdminModule module="blog" api={api} setNotice={setNotice}/>:section==="coupons"?<AdminModule module="coupons" api={api} setNotice={setNotice}/>:section==="reviews"?<AdminModule module="reviews" api={api} setNotice={setNotice}/>:section==="messages"?<AdminModule module="messages" api={api} setNotice={setNotice}/>:section==="homepage"?<AdminSettingsModule type="homepage" api={api} setNotice={setNotice}/>:section==="seo"?<AdminSettingsModule type="seo" api={api} setNotice={setNotice}/>:section==="users"?<AdminModule module="users" api={api} setNotice={setNotice}/>:section==="reports"?<AdminReports api={api} setNotice={setNotice}/>:<Placeholder title={sectionTitle}/>}
   </main>
  </div>
 </div>
}
function AuthPage({mode}){
 const navigate=useNavigate();
 const [method,setMethod]=useState("email");
 const [form,setForm]=useState({email:"",phone:"",password:"",firstName:"",lastName:""});
 const [message,setMessage]=useState("");
 const update=e=>setForm({...form,[e.target.name]:e.target.value});
 const submit=e=>{
   e.preventDefault();setMessage("");
   const users=JSON.parse(localStorage.getItem("bh_users")||"[]");
   if(mode==="register"){
     if(!form.firstName||!form.lastName||!form.password||(method==="email"&&!form.email)||(method==="phone"&&!form.phone)){setMessage("Please fill all required fields.");return;}
     const loginValue=method==="email"?form.email.trim().toLowerCase():form.phone.trim();
     if(users.some(u=>u.login===loginValue)){setMessage("An account with these details already exists.");return;}
     users.push({firstName:form.firstName,lastName:form.lastName,login:loginValue,method,password:form.password});
     localStorage.setItem("bh_users",JSON.stringify(users));localStorage.setItem("bh_user",JSON.stringify({firstName:form.firstName,lastName:form.lastName,login:loginValue}));
     setMessage("Account created successfully.");setTimeout(()=>navigate("/account"),400);
   }else if(mode==="login"){
     const loginValue=method==="email"?form.email.trim().toLowerCase():form.phone.trim();
     const user=users.find(u=>u.login===loginValue&&u.password===form.password);
     if(!user){setMessage("Invalid login details. Please try again.");return;}
     localStorage.setItem("bh_user",JSON.stringify({firstName:user.firstName,lastName:user.lastName,login:user.login}));
     navigate("/account");
   }else{
     if(!(method==="email"?form.email:form.phone)){setMessage("Enter your email or phone number.");return;}
     setMessage("If an account exists, password reset instructions will be sent."); 
   }
 };
 const logged=JSON.parse(localStorage.getItem("bh_user")||"null");
 if(mode==="login"&&logged)return <div className="container page authPage"><span className="eyebrow">MY ACCOUNT</span><h1>Welcome, {logged.firstName}.</h1><div className="accountCard"><User/><h2>{logged.firstName} {logged.lastName}</h2><p>{logged.login}</p><Link className="btn dark full" to="/shop">Continue shopping</Link><button className="authTextBtn" onClick={()=>{localStorage.removeItem("bh_user");location.reload()}}>Sign out</button></div></div>;
 const title=mode==="register"?"Create your account":mode==="forgot"?"Reset your password":"Welcome back.";
 const subtitle=mode==="register"?"Create an account to track orders, save furniture and checkout faster.":mode==="forgot"?"Enter your email or phone and we’ll help you reset your password.":"Sign in to view orders, saved furniture and delivery updates.";
 return <div className="container page authPage"><span className="eyebrow">{mode==="register"?"JOIN BALAJI HANDICRAFT":mode==="forgot"?"PASSWORD RESET":"MY ACCOUNT"}</span><h1>{title}</h1><div className="accountCard authCard"><User/><h2>{mode==="register"?"Customer account":"Customer account"}</h2><p>{subtitle}</p>
 <div className="authTabs"><button className={method==="email"?"active":""} onClick={()=>setMethod("email")}>Email</button><button className={method==="phone"?"active":""} onClick={()=>setMethod("phone")}>Phone number</button></div>
 <form onSubmit={submit}>{mode==="register"&&<div className="authName"><input name="firstName" placeholder="First name" value={form.firstName} onChange={update}/><input name="lastName" placeholder="Last name" value={form.lastName} onChange={update}/></div>}
 {method==="email"?<input name="email" type="email" placeholder="Email address" value={form.email} onChange={update}/>:<input name="phone" type="tel" placeholder="Phone number" value={form.phone} onChange={update}/>}
 {mode!=="forgot"&&<input name="password" type="password" placeholder="Password" value={form.password} onChange={update}/>}
 {message&&<div className="authMessage">{message}</div>}
 <button className="btn dark full" type="submit">{mode==="register"?"Create account":mode==="forgot"?"Send reset instructions":"Sign in"}</button></form>
 {mode==="login"&&<Link className="authLink" to="/forgot-password">Forgot password?</Link>}
 {mode==="login"?<p className="authBottom">New customer? <Link to="/register">Create an account</Link></p>:mode==="register"?<p className="authBottom">Already have an account? <Link to="/login">Sign in</Link></p>:<p className="authBottom"><Link to="/login">← Back to sign in</Link></p>}
 </div></div>
}
function Footer(){return <footer><div className="footerMain"><div><Link to="/" className="logo lightLogo"><span className="logoMark">BH</span><span><b>BALAJI</b><small>HANDICRAFT</small></span></Link><p>Handcrafted furniture made from honest materials, thoughtful design and skilled craftsmanship.</p><div className="social"><a><Instagram/></a><a><Facebook/></a><a><Youtube/></a></div></div><div><h4>Shop</h4><Link to="/shop?cat=Beds">Beds</Link><Link to="/shop?cat=Sofas">Sofas</Link><Link to="/shop?cat=Dining">Dining</Link><Link to="/shop?cat=Storage">Storage</Link></div><div><h4>Help</h4><Link to="/account">My Account</Link><Link to="/blog">Journal</Link><Link to="/cart">Shipping & Returns</Link><Link to="/checkout">Checkout</Link></div><div><h4>Contact</h4><span>Balaji Handicraft Studio</span><span>Churu, Rajasthan, India</span><span>+91 00000 00000</span><span>hello@balajihandicraft.com</span></div></div><div className="footerBottom">© 2026 Balaji Handicraft <span>Made for homes with character.</span></div></footer>}
createRoot(document.getElementById("root")).render(<HashRouter><App/></HashRouter>);