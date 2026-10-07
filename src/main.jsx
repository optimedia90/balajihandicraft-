import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {HashRouter,useLocation,useNavigate,useParams,Link} from "react-router-dom";
import {Search,ShoppingBag,Heart,User,Menu,X,ChevronDown,ArrowRight,Star,SlidersHorizontal,Trash2,Minus,Plus,Check,Truck,ShieldCheck,RotateCcw,Instagram,Facebook,Youtube,Image as ImageIcon,Video,Upload,Save,Package,Tag,FileText,Settings as SettingsIcon,Eye,ChevronLeft} from "lucide-react";
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
const normalizeProduct=(p)=>({id:Number(p.id),name:p.name||p.title||"Furniture Product",category:p.category_name||p.category||"Furniture",sub:p.subcategory_name||p.sub||"",price:Number(p.price||0),old:Number(p.old_price||p.old||p.price||0),rating:Number(p.rating||4.8),img:p.image||p.img||"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900",images:[p.image,p.image_2,p.image_3,p.image_4,p.image_5].filter(Boolean),video:p.video||"",description:p.description||p.short_description||"",shortDescription:p.short_description||"",material:p.material||"Solid Sheesham Wood",brand:p.brand||"Balaji Handicraft",length_in:p.length_in,width_in:p.width_in,height_in:p.height_in,length_cm:p.length_cm,width_cm:p.width_cm,height_cm:p.height_cm,weight_kg:p.weight_kg,color:p.color,finish:p.finish,care:p.care_instructions,assembly:p.assembly_info,tag:p.featured?"Featured":""});
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
const fmt=n=>{const value=activeCurrency==="INR"?Number(n)*84:Number(n);return activeCurrency==="INR"?"₹"+Math.round(value).toLocaleString("en-IN"):"$"+value.toLocaleString("en-US",{maximumFractionDigits:0});};
function App(){
 const [cart,setCart]=useState(()=>JSON.parse(localStorage.getItem("bh_cart")||"[]"));
 const [wish,setWish]=useState(()=>JSON.parse(localStorage.getItem("bh_wish")||"[]"));
 const [currency,setCurrency]=useState(()=>localStorage.getItem("bh_currency")||"USD");
 const [,setStoreVersion]=useState(0);
 const [storeSettings,setStoreSettings]=useState(null);
 activeCurrency=currency;
 useEffect(()=>localStorage.setItem("bh_currency",currency),[currency]);
 useEffect(()=>localStorage.setItem("bh_cart",JSON.stringify(cart)),[cart]);
 useEffect(()=>localStorage.setItem("bh_wish",JSON.stringify(wish)),[wish]);
 useEffect(()=>{
   Promise.all([fetch("/api/store/products"),fetch("/api/store/categories"),fetch("/api/store/settings")]).then(async([p,c,s])=>[await p.json(),await c.json(),await s.json()]).then(([p,c,s])=>{
     if(Array.isArray(p.products)&&p.products.length)products=p.products.map(normalizeProduct);
     if(Array.isArray(c.categories)){
       const subs=Array.isArray(c.subcategories)?c.subcategories:[];
       liveCategoryMenus=c.categories.map(cat=>({name:cat.name,slug:cat.slug||cat.name,subs:subs.filter(x=>Number(x.category_id)===Number(cat.id)).map(x=>x.name)}));
       liveCats=[["All Furniture",""],...c.categories.map(cat=>[cat.name,cat.slug||cat.name])];
     }
     if(s&&s.settings)setStoreSettings(s.settings);
     setStoreVersion(v=>v+1);
   }).catch(()=>{});
 },[]);
 const add=(p)=>setCart(c=>{const x=c.find(i=>i.id===p.id);return x?c.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...c,{...p,qty:1}]});
 const toggleWish=(p)=>setWish(w=>w.some(x=>x.id===p.id)?w.filter(x=>x.id!==p.id):[...w,p]);
 return <><Header cart={cart.length} wish={wish.length} currency={currency} setCurrency={setCurrency} settings={storeSettings}/><main><RoutesView cart={cart} setCart={setCart} wish={wish} toggleWish={toggleWish} add={add}/></main><Footer/></>
}
function Header({cart,wish,currency,setCurrency,settings}){
 const [open,setOpen]=useState(false);const [search,setSearch]=useState(false);
 return <header className="header"><div className="topbar">{settings?.announcement||("Free shipping on orders over "+fmt(500))} <span>•</span> Handcrafted furniture, made to last</div>
 <div className="navwrap"><Link to="/" className="logo"><span className="logoMark">BH</span><span><b>BALAJI</b><small>HANDICRAFT</small></span></Link>
 <nav className={open?"mobile open":"mobile"}><Link to="/shop" onClick={()=>setOpen(false)}>All Furniture</Link>{(liveCategoryMenus.length?liveCategoryMenus:categoryMenus).map(cat=><div className="navMenu" key={cat.name}><Link className="navMenuTitle" to={"/shop?cat="+cat.slug} onClick={()=>setOpen(false)}>{cat.name}<ChevronDown/></Link><div className="dropdownMenu">{cat.subs.map(sub=><Link key={sub} to={"/shop?cat="+cat.slug+"&sub="+encodeURIComponent(sub)} onClick={()=>setOpen(false)}>{sub}</Link>)}</div></div>)}</nav>
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
function Home({add,toggleWish,wish}){
 return <><section className="hero"><div className="heroText"><span className="eyebrow">THE ART OF BETTER LIVING</span><h1>Furniture with<br/><em>character.</em></h1><p>Handcrafted solid wood pieces designed to bring warmth, comfort and timeless beauty into your home.</p><div className="actions"><Link className="btn dark" to="/shop">Shop Furniture <ArrowRight/></Link><Link className="textlink" to="/blog">Our craftsmanship →</Link></div></div><div className="heroVisual"><div className="heroCard"><img src={products[0].img}/><div><b>Sheesham Collection</b><span>Built for generations</span></div></div><div className="floatBadge">100%<small>Solid Wood</small></div></div></section>
 <section className="trust"><div><Truck/><b>Free Delivery</b><span>On orders over $500</span></div><div><ShieldCheck/><b>Quality Assured</b><span>Crafted & checked by hand</span></div><div><RotateCcw/><b>Easy Returns</b><span>7-day return policy</span></div><div><Check/><b>Secure Payments</b><span>100% protected checkout</span></div></section>
 <SectionTitle kicker="CURATED FOR YOUR HOME" title="Shop by category" link="/shop"/><div className="catGrid">{cats.slice(1).map(([n,c],i)=><Link to={"/shop?cat="+c} className="catTile" key={n}><img src={products[i].img}/><div><b>{n}</b><span>Explore collection <ArrowRight/></span></div></Link>)}</div>
 <section className="editorial"><div><span className="eyebrow">THE SHEESHHAM EDIT</span><h2>Natural wood.<br/><em>Beautifully lived in.</em></h2><p>Every grain tells a story. Our solid wood collection pairs traditional craftsmanship with clean, contemporary silhouettes.</p><Link className="btn light" to="/shop?cat=Storage">Explore the edit <ArrowRight/></Link></div><img src={products[9].img}/></section>
 <SectionTitle kicker="MOST LOVED" title="Bestselling pieces" link="/shop"/><ProductGrid items={products.slice(0,4)} add={add} toggleWish={toggleWish} wish={wish}/>
 <section className="newsletter"><span className="eyebrow">JOIN THE HOME EDIT</span><h2>Beautiful homes start here.</h2><p>Get first access to new collections, private offers and styling inspiration.</p><div><input placeholder="Your email address"/><button>Subscribe <ArrowRight/></button></div></section></>
}
function SectionTitle({kicker,title,link}){return <div className="sectionTitle"><div><span>{kicker}</span><h2>{title}</h2></div>{link&&<Link to={link}>View all <ArrowRight/></Link>}</div>}
function ProductGrid({items,add,toggleWish,wish}){return <div className="products">{items.map(p=><ProductCard key={p.id} p={p} add={add} toggleWish={toggleWish} wished={wish.some(x=>x.id===p.id)}/>)}</div>}
function ProductCard({p,add,toggleWish,wished}){return <article className="product"><Link to={"/product?id="+p.id} className="productImg">{p.tag&&<b className="tag">{p.tag}</b>}<img src={p.img}/><button className={wished?"wish active":"wish"} onClick={e=>{e.preventDefault();toggleWish(p)}}><Heart fill={wished?"currentColor":"none"}/></button><button className="quick" onClick={e=>{e.preventDefault();add(p)}}>Add to cart</button></Link><div className="productInfo"><div className="stars"><Star fill="currentColor"/> {p.rating}</div><Link to={"/product?id="+p.id}><h3>{p.name}</h3></Link><span className="sub">{p.sub}</span><div className="price"><b>{fmt(p.price)}</b><del>{fmt(p.old)}</del></div></div></article>}
function Shop({add,toggleWish,wish}){
 const qs=new URLSearchParams(useLocation().search),cat=qs.get("cat")||"",q=(qs.get("q")||"").toLowerCase();
 const categoryList=liveCats.length?liveCats:cats;const [sort,setSort]=useState("featured");
 const list=useMemo(()=>{let x=products.filter(p=>(!cat||p.category===cat)&&(!q||p.name.toLowerCase().includes(q)));if(sort==="low")x.sort((a,b)=>a.price-b.price);if(sort==="high")x.sort((a,b)=>b.price-a.price);return x},[cat,q,sort]);
 return <div className="container shop"><div className="crumb">Home / Shop</div><div className="shopHead"><div><span className="eyebrow">THE COLLECTION</span><h1>{cat||"All Furniture"}</h1><p>Thoughtfully designed furniture for every room.</p></div><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Sort: Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></div><div className="shopBody"><aside><b>Categories</b>{categoryList.map(([n,c])=><Link className={cat===c?"sel":""} to={"/shop"+(c?"?cat="+c:"")} key={n}>{n}</Link>)}<div className="filterNote"><SlidersHorizontal/><b>Made to last</b><span>Solid wood • Handcrafted • Premium finishes</span></div></aside><section><div className="resultbar">{list.length} products <span>Showing the latest collection</span></div><ProductGrid items={list} add={add} toggleWish={toggleWish} wish={wish}/></section></div></div>
}
function Product({add,toggleWish,wish}){
 const id=Number(new URLSearchParams(useLocation().search).get("id")||1),p=products.find(x=>x.id===id)||products[0];
 const imgs=p.images?.length?p.images:[p.img];
 const [selected,setSelected]=useState(imgs[0]); const [qty,setQty]=useState(1); const [tab,setTab]=useState("description");
 return <div className="container detail"><div className="crumb">Home / {p.category} / {p.name}</div><div className="detailGrid"><div className="gallery"><img src={selected} className="mainProductImage"/><div className="thumbs">{imgs.map((im,i)=><button key={im+i} className={selected===im?"selected":""} onClick={()=>setSelected(im)}><img src={im}/></button>)}</div>{p.video&&<video className="productDetailVideo" src={p.video} controls/>}</div><div className="detailInfo"><span className="eyebrow">{p.category.toUpperCase()}</span><h1>{p.name}</h1><div className="rating"><Star fill="currentColor"/> {p.rating} <span>Customer reviews</span></div><div className="detailPrice">{fmt(p.price)} <del>{fmt(p.old)}</del></div>{p.shortDescription&&<p className="lead">{p.shortDescription}</p>}<div className="productFacts">{p.material&&<span><b>Material</b>{p.material}</span>}{p.brand&&<span><b>Brand</b>{p.brand}</span>}{p.finish&&<span><b>Finish</b>{p.finish}</span>}</div><div className="buyrow"><div className="qty"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus/></button>{qty}<button onClick={()=>setQty(qty+1)}><Plus/></button></div><button className="btn dark big" onClick={()=>{for(let i=0;i<qty;i++)add(p)}}>Add to cart <ShoppingBag/></button><button className="round" onClick={()=>toggleWish(p)}><Heart/></button></div><div className="perks"><span><Truck/> Free delivery</span><span><ShieldCheck/> Quality checked</span><span><RotateCcw/> Easy returns</span></div></div></div><div className="detailTabs"><div><button className={tab==="description"?"active":""} onClick={()=>setTab("description")}>Description</button><button className={tab==="dimensions"?"active":""} onClick={()=>setTab("dimensions")}>Dimensions</button><button className={tab==="care"?"active":""} onClick={()=>setTab("care")}>Care & Assembly</button></div><div className="detailContent">{tab==="description"?<p>{p.description||"Handcrafted furniture made with premium materials and careful finishing."}</p>:tab==="dimensions"?<div className="dimensionTable"><span>Length <b>{p.length_in||"—"} in / {p.length_cm||"—"} cm</b></span><span>Width <b>{p.width_in||"—"} in / {p.width_cm||"—"} cm</b></span><span>Height <b>{p.height_in||"—"} in / {p.height_cm||"—"} cm</b></span><span>Weight <b>{p.weight_kg||"—"} kg</b></span></div>:<p>{p.care||"Wipe with a soft dry cloth. Avoid prolonged moisture and direct heat."}{p.assembly&&<><br/><br/><b>Assembly:</b> {p.assembly}</>}</div>}</div><SectionTitle kicker="YOU MAY ALSO LIKE" title="Complete the room" link="/shop"/><ProductGrid items={products.filter(x=>x.id!==p.id).slice(0,4)} add={add} toggleWish={toggleWish} wish={wish}/></div>
}
function Cart({cart,setCart}){const total=cart.reduce((s,x)=>s+x.price*x.qty,0);return <div className="container page"><span className="eyebrow">YOUR BAG</span><h1>Shopping cart</h1>{!cart.length?<div className="empty"><ShoppingBag/><h2>Your cart is empty</h2><Link className="btn dark" to="/shop">Explore furniture</Link></div>:<div className="cartGrid"><section>{cart.map(x=><div className="cartItem" key={x.id}><img src={x.img}/><div><Link to={"/product?id="+x.id}><h3>{x.name}</h3></Link><span>{x.sub}</span><div className="cartActions"><div className="qty"><button onClick={()=>setCart(c=>c.map(i=>i.id===x.id?{...i,qty:Math.max(1,i.qty-1)}:i))}><Minus/></button>{x.qty}<button onClick={()=>setCart(c=>c.map(i=>i.id===x.id?{...i,qty:i.qty+1}:i))}><Plus/></button></div><button className="remove" onClick={()=>setCart(c=>c.filter(i=>i.id!==x.id))}><Trash2/> Remove</button></div></div><b>{fmt(x.price*x.qty)}</b></div>)}</section><aside className="summary"><h2>Order summary</h2><div><span>Subtotal</span><b>{fmt(total)}</b></div><div><span>Shipping</span><b>{total>=500?"Free":"$49"}</b></div><hr/><div className="total"><span>Total</span><b>{fmt(total+(total>=500?0:49))}</b></div><Link className="btn dark full" to="/checkout">Proceed to checkout <ArrowRight/></Link><p>Taxes calculated at checkout.</p></aside></div>}</div>}
function Wishlist({wish,add,toggleWish}){return <div className="container page"><span className="eyebrow">SAVED FOR LATER</span><h1>My wishlist</h1>{!wish.length?<div className="empty"><Heart/><h2>No saved pieces yet</h2><Link className="btn dark" to="/shop">Find your favourites</Link></div>:<ProductGrid items={wish} add={add} toggleWish={toggleWish} wish={wish}/>}</div>}
function Checkout({cart}){const total=cart.reduce((s,x)=>s+x.price*x.qty,0);return <div className="container checkout"><div><span className="eyebrow">SECURE CHECKOUT</span><h1>Complete your order</h1><div className="formCard"><h2>Contact information</h2><div className="formgrid"><input placeholder="First name"/><input placeholder="Last name"/><input placeholder="Email address"/><input placeholder="Phone number"/></div><h2>Delivery address</h2><div className="formgrid"><input className="wide" placeholder="Address"/><input placeholder="City"/><input placeholder="State"/><input placeholder="PIN / ZIP code"/></div><h2>Payment</h2><div className="pay">Cash on Delivery <Check/></div><button className="btn dark big full">Place order <ArrowRight/></button></div></div><aside className="summary"><h2>Your order</h2>{cart.map(x=><div className="mini" key={x.id}><img src={x.img}/><span>{x.name} × {x.qty}</span><b>{fmt(x.price*x.qty)}</b></div>)}<hr/><div className="total"><span>Total</span><b>{fmt(total)}</b></div></aside></div>}
function Blog(){return <div className="container page"><span className="eyebrow">THE HOME JOURNAL</span><h1>Stories for better living.</h1><div className="blogGrid">{[["How to choose the right wood for your home",products[0].img],["5 ways to make a small room feel bigger",products[4].img],["Why handcrafted furniture ages beautifully",products[9].img]].map(([t,img])=><article className="blogCard"><img src={img}/><div><span>INTERIORS</span><h2>{t}</h2><p>Ideas, materials and timeless styling inspiration from the Balaji Handicraft studio.</p><b>Read story →</b></div></article>)}</div></div>}
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
function ProductEditor({editing,setEditing,categories,subcategories,api,onSave,onCancel}){
 const [uploading,setUploading]=useState("");
 const [activeSection,setActiveSection]=useState("basic");
 const update=(key,value)=>setEditing(v=>({...v,[key]:value}));
 const uploadMedia=async(key,file)=>{
   if(!file)return;
   setUploading(key);
   try{
     const fd=new FormData();fd.append("file",file);
     const data=await api("/api/admin/upload",{method:"POST",body:fd});
     update(key,data.url);
   }catch(e){alert(e.message||"Upload failed");}
   finally{setUploading("");}
 };
 const imgKeys=["image","image_2","image_3","image_4","image_5"];
 const imageLabel=i=>i===0?"Main Image":"Image "+(i+1);
 const selectedSub=subcategories.filter(s=>!editing.category_id||Number(s.category_id)===Number(editing.category_id));
 const setDimensions=(key,val)=>{update(key,val);const n=Number(val);if(!Number.isNaN(n)){const cmKey=key.replace("_in","_cm");if(key.endsWith("_in"))update(cmKey,(n*2.54).toFixed(1));}};
 return <div className="productEditor">
   <div className="editorTitle"><div><span className="eyebrow">PRODUCT CATALOG</span><h2>{editing.id?"Edit Product":"Add New Product"}</h2><p>Complete product information, media, specifications, pricing and SEO from one place.</p></div><div className="editorActions"><button className="btn light" onClick={onCancel}>Cancel</button><button className="btn light" onClick={()=>window.open("/#/product?id="+(editing.id||""),"_blank")}><Eye/> Preview</button><button className="btn dark" onClick={onSave}><Save/> Save Product</button></div></div>
   <div className="editorTabs">{[["basic","Basic Information"],["media","Images & Video"],["details","Product Details"],["specs","Specifications"],["pricing","Pricing & Stock"],["seo","SEO & Meta"],["settings","Settings"]].map(([id,label])=><button key={id} className={activeSection===id?"active":""} onClick={()=>setActiveSection(id)}>{label}</button>)}</div>
   <div className="editorGrid">
    <div className="editorMain">
     {activeSection==="basic"&&<section className="editorCard"><h3><FileText/> Basic Information</h3><div className="editorFields two"><label>Product Name *<input value={editing.name||""} onChange={e=>update("name",e.target.value)} placeholder="e.g. Sheesham Wood 6 Drawer Dresser"/></label><label>SKU *<input value={editing.sku||""} onChange={e=>update("sku",e.target.value)} placeholder="BH-DR-001"/></label><label>Category *<select value={editing.category_id||""} onChange={e=>{update("category_id",e.target.value);update("subcategory_id","")}}><option value="">Select Category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Subcategory *<select value={editing.subcategory_id||""} onChange={e=>update("subcategory_id",e.target.value)}><option value="">Select Subcategory</option>{selectedSub.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Brand<input value={editing.brand||""} onChange={e=>update("brand",e.target.value)} placeholder="Balaji Handicraft"/></label><label>Material<input value={editing.material||""} onChange={e=>update("material",e.target.value)} placeholder="Solid Sheesham Wood"/></label><label className="full">Short Description<textarea maxLength="200" value={editing.short_description||""} onChange={e=>update("short_description",e.target.value)} placeholder="Short description shown on product listings..."/></label><label className="full">Full Description<textarea className="largeText" value={editing.description||""} onChange={e=>update("description",e.target.value)} placeholder="Write complete product description, features, craftsmanship, usage and benefits..."/></label><label className="full">Tags <span className="hint">comma separated</span><input value={editing.tags||""} onChange={e=>update("tags",e.target.value)} placeholder="sheesham, wooden furniture, bedroom, handcrafted"/></label></div></section>}
     {activeSection==="media"&&<section className="editorCard"><h3><ImageIcon/> Product Images & Video</h3><p className="editorHint">Add up to 5 product images. The first image is the main listing image.</p><div className="mediaGrid">{imgKeys.map((key,i)=><div className="mediaBox" key={key}>{editing[key]?<img src={editing[key]} alt={imageLabel(i)}/>:<div className="uploadEmpty"><ImageIcon/><span>{imageLabel(i)}</span><small>JPG / PNG / WEBP</small></div>}<label className="uploadButton"><Upload/> {uploading===key?"Uploading...":editing[key]?"Change Image":"Upload Image"}<input type="file" accept="image/*" onChange={e=>uploadMedia(key,e.target.files?.[0])}/></label></div>)}</div><div className="videoUpload"><div>{editing.video?<video src={editing.video} controls/>:<div className="uploadEmpty"><Video/><span>Product Video</span><small>MP4 / WEBM • max 50MB</small></div>}</div><label className="uploadButton"><Upload/> {uploading==="video"?"Uploading...":editing.video?"Change Video":"Upload Video"}<input type="file" accept="video/mp4,video/webm" onChange={e=>uploadMedia("video",e.target.files?.[0])}/></label></div></section>}
     {activeSection==="details"&&<section className="editorCard"><h3><Package/> Product Details</h3><div className="editorFields two"><label>Color<input value={editing.color||""} onChange={e=>update("color",e.target.value)} placeholder="Natural Brown"/></label><label>Finish<input value={editing.finish||""} onChange={e=>update("finish",e.target.value)} placeholder="Natural Sheesham Finish"/></label><label className="full">Care Instructions<textarea value={editing.care_instructions||""} onChange={e=>update("care_instructions",e.target.value)} placeholder="Care and maintenance instructions..."/></label><label className="full">Assembly Information<textarea value={editing.assembly_info||""} onChange={e=>update("assembly_info",e.target.value)} placeholder="Assembly requirements / included hardware..."/></label></div></section>}
     {activeSection==="specs"&&<section className="editorCard"><h3><Package/> Product Specifications</h3><div className="editorFields four"><label>Length (in)<input type="number" value={editing.length_in||""} onChange={e=>setDimensions("length_in",e.target.value)}/></label><label>Width (in)<input type="number" value={editing.width_in||""} onChange={e=>setDimensions("width_in",e.target.value)}/></label><label>Height (in)<input type="number" value={editing.height_in||""} onChange={e=>setDimensions("height_in",e.target.value)}/></label><label>Weight (kg)<input type="number" value={editing.weight_kg||""} onChange={e=>update("weight_kg",e.target.value)}/></label><label>Length (cm)<input type="number" value={editing.length_cm||""} onChange={e=>update("length_cm",e.target.value)}/></label><label>Width (cm)<input type="number" value={editing.width_cm||""} onChange={e=>update("width_cm",e.target.value)}/></label><label>Height (cm)<input type="number" value={editing.height_cm||""} onChange={e=>update("height_cm",e.target.value)}/></label><label>Weight (kg)<input type="number" value={editing.weight_kg||""} onChange={e=>update("weight_kg",e.target.value)}/></label></div><div className="specNote">Dimensions in inches automatically convert to centimeters. You can manually adjust the centimeter values if required.</div></section>}
     {activeSection==="pricing"&&<section className="editorCard"><h3><Tag/> Pricing & Stock</h3><div className="editorFields three"><label>Regular Price *<input type="number" value={editing.price||""} onChange={e=>update("price",e.target.value)} placeholder="0"/></label><label>Sale Price<input type="number" value={editing.old_price||""} onChange={e=>update("old_price",e.target.value)} placeholder="0"/></label><label>Stock Quantity *<input type="number" value={editing.qty||""} onChange={e=>update("qty",e.target.value)} placeholder="0"/></label></div></section>}
     {activeSection==="seo"&&<section className="editorCard"><h3><Search/> SEO & Meta Information</h3><div className="editorFields one"><label>SEO Title<input maxLength="255" value={editing.seo_title||""} onChange={e=>update("seo_title",e.target.value)} placeholder="Sheesham Wood 6 Drawer Dresser | Balaji Handicraft"/></label><label>Meta Description<textarea maxLength="500" value={editing.meta_description||""} onChange={e=>update("meta_description",e.target.value)} placeholder="Write a search-friendly description for Google..."/></label><label>Product URL Slug<input value={editing.slug||""} onChange={e=>update("slug",e.target.value)} placeholder="sheesham-wood-6-drawer-dresser"/></label></div></section>}
     {activeSection==="settings"&&<section className="editorCard"><h3><SettingsIcon/> Product Settings</h3><div className="toggleList"><label><span><b>Active Product</b><small>Show this product on the website</small></span><input type="checkbox" checked={editing.status!=="inactive"} onChange={e=>update("status",e.target.checked?"active":"inactive")}/></label><label><span><b>Featured Product</b><small>Show in featured sections</small></span><input type="checkbox" checked={!!Number(editing.featured)} onChange={e=>update("featured",e.target.checked?1:0)}/></label><label><span><b>Best Seller</b><small>Mark as a bestselling product</small></span><input type="checkbox" checked={!!Number(editing.best_seller)} onChange={e=>update("best_seller",e.target.checked?1:0)}/></label><label><span><b>New Arrival</b><small>Show as a new arrival</small></span><input type="checkbox" checked={!!Number(editing.new_arrival)} onChange={e=>update("new_arrival",e.target.checked?1:0)}/></label></div></section>}
    </div>
    <aside className="editorSide"><div className="editorCard"><h3><Eye/> Product Preview</h3>{editing.image?<img className="previewImage" src={editing.image}/>:<div className="previewPlaceholder">No main image</div>}<b>{editing.name||"Product name"}</b><span>{editing.category_id?"Selected category":"Category not selected"}</span><strong>{fmt(Number(editing.price||0)/84)}</strong></div><div className="editorCard"><h3><Save/> Publish</h3><button className="btn dark full" onClick={onSave}>Save Product</button><button className="btn light full" onClick={onCancel}>Cancel</button></div></aside>
   </div>
 </div>;
}
function Admin(){
 const [tab,setTab]=useState("overview");
 const [allowed,setAllowed]=useState(Boolean(localStorage.getItem("bh_admin_token")));
 const [stats,setStats]=useState({products:0,orders:0,customers:0,revenue:0});
 const [rows,setRows]=useState([]); const [categories,setCategories]=useState([]); const [subcategories,setSubcategories]=useState([]); const [orders,setOrders]=useState([]);
 const [settings,setSettings]=useState({store_name:"Balaji Handicraft",currency:"INR",shipping_threshold:42000,phone:"",email:"",address:"",announcement:""});
 const [editing,setEditing]=useState(null); const [notice,setNotice]=useState(""); const [loading,setLoading]=useState(false); const navigate=useNavigate(); const token=localStorage.getItem("bh_admin_token");
 const api=async(path,options={})=>{const headers={"Authorization":"Bearer "+token,...(options.headers||{})};if(!(options.body instanceof FormData))headers["Content-Type"]="application/json";const res=await fetch(path,{...options,headers});const text=await res.text();let data={};try{data=text?JSON.parse(text):{};}catch{data={message:text};}if(!res.ok)throw new Error(data.message||"Request failed");return data;};
 const emptyProduct={name:"",sku:"",category_id:"",subcategory_id:"",price:"",old_price:"",qty:"",image:"",image_2:"",image_3:"",image_4:"",image_5:"",video:"",short_description:"",description:"",brand:"Balaji Handicraft",material:"Solid Sheesham Wood",tags:"",length_in:"",width_in:"",height_in:"",length_cm:"",width_cm:"",height_cm:"",weight_kg:"",color:"",finish:"",care_instructions:"",assembly_info:"",featured:0,best_seller:0,new_arrival:0,seo_title:"",meta_description:"",slug:"",status:"active"};
 const load=async()=>{setLoading(true);setNotice("");try{const [st,p,c,o,ss]=await Promise.all([api("/api/admin/stats"),api("/api/admin/products"),api("/api/admin/categories"),api("/api/admin/orders"),api("/api/admin/settings")]);setStats(st);setRows(p.products||[]);setCategories(c.categories||[]);setSubcategories(c.subcategories||[]);setOrders(o.orders||[]);setSettings(ss.settings||settings);}catch(e){setNotice(e.message||"Could not load admin data");}finally{setLoading(false);}};
 useEffect(()=>{if(allowed)load();},[allowed]);
 if(!allowed)return <AdminLogin/>;
 const logout=()=>{localStorage.removeItem("bh_admin_token");setAllowed(false);navigate("/admin",{replace:true});};
 const removeProduct=async id=>{if(!confirm("Delete this product permanently?"))return;try{await api("/api/admin/products/"+id,{method:"DELETE"});setNotice("Product deleted.");load();}catch(e){setNotice(e.message);}};
 const saveSettings=async()=>{try{await api("/api/admin/settings",{method:"PUT",body:JSON.stringify(settings)});setNotice("Store settings saved.");}catch(e){setNotice(e.message);}};
 const saveProduct=async()=>{if(!editing?.name)return setNotice("Product name is required.");const payload={...editing,price:Number(editing.price||0),old_price:Number(editing.old_price||0),qty:Number(editing.qty||0),category_id:editing.category_id?Number(editing.category_id):null,subcategory_id:editing.subcategory_id?Number(editing.subcategory_id):null};try{if(editing.id)await api("/api/admin/products/"+editing.id,{method:"PUT",body:JSON.stringify(payload)});else await api("/api/admin/products",{method:"POST",body:JSON.stringify(payload)});setEditing(null);setNotice("Product saved successfully.");await load();}catch(e){setNotice(e.message);}};
 const saveCategory=async()=>{if(!editing?.name)return setNotice("Category name is required.");try{if(editing.id)await api("/api/admin/categories/"+editing.id,{method:"PUT",body:JSON.stringify(editing)});else await api("/api/admin/categories",{method:"POST",body:JSON.stringify(editing)});setEditing(null);setNotice("Category saved successfully.");load();}catch(e){setNotice(e.message);}};
 const tabs=[["overview","Dashboard"],["products","Products"],["orders","Orders"],["categories","Categories"],["settings","Store settings"]];
 return <div className="container admin"><div className="adminTop"><div><span className="eyebrow">STORE CONTROL</span><h1>Furniture Admin</h1><p>Professional control center for your furniture store.</p></div><div className="adminTopActions"><button className="btn light" onClick={logout}>Sign out</button><Link className="btn dark" to="/">View store <ArrowRight/></Link></div></div>{notice&&<div className="adminNotice">{notice}</div>}<div className="adminLayout"><aside>{tabs.map(([id,label])=><button key={id} className={tab===id?"on":""} onClick={()=>{setTab(id);setEditing(null)}}>{label}</button>)}</aside><section className="adminPanel">
 {tab==="overview"&&<><div className="panelHead"><div><h2>Dashboard</h2><p className="adminMuted">Live store overview</p></div><button className="btn light" onClick={load}>Refresh</button></div><div className="adminStats"><div><span>Products</span><b>{stats.products}</b><small>Live catalog</small></div><div><span>Orders</span><b>{stats.orders}</b><small>All orders</small></div><div><span>Revenue</span><b>{fmt(stats.revenue/84)}</b><small>Database total</small></div><div><span>Customers</span><b>{stats.customers}</b><small>Registered users</small></div></div><div className="adminQuick"><button onClick={()=>{setTab("products");setEditing({...emptyProduct});}}>+ Add product</button><button onClick={()=>setTab("orders")}>View orders</button><button onClick={()=>setTab("categories")}>Manage categories</button><button onClick={()=>setTab("settings")}>Website settings</button></div></>}
 {tab==="products"&&<>{editing?<ProductEditor editing={editing} setEditing={setEditing} categories={categories} subcategories={subcategories} api={api} onSave={saveProduct} onCancel={()=>setEditing(null)}/>:<><div className="panelHead"><div><h2>Products</h2><p className="adminMuted">{rows.length} products in database</p></div><button type="button" className="btn dark" onClick={()=>setEditing({...emptyProduct})}>+ Add product</button></div>{loading?<p>Loading…</p>:rows.map(x=><div className="adminRow" key={x.id}><img src={x.image||"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300"}/><div><b>{x.name}</b><span>{x.sku||"No SKU"} · Stock {x.qty??"—"}</span></div><strong>{x.price!=null?fmt(Number(x.price)/84):"—"}</strong><span className="stock">{String(x.status||"active")}</span><button className="editProductBtn" onClick={()=>{setEditing({...emptyProduct,...x});window.scrollTo({top:0,behavior:"smooth"})}}>Edit Product</button><button onClick={()=>removeProduct(x.id)} title="Delete product"><Trash2/></button></div>)}</>}
 {tab==="orders"&&<><div className="panelHead"><div><h2>Orders</h2><p className="adminMuted">Latest 100 orders</p></div><button className="btn light" onClick={load}>Refresh</button></div>{orders.length?orders.map(o=><div className="orderMock" key={o.id}><b>#{o.order_number||o.id}</b><span>{o.created_at||o.date||"Order"} · {o.status||"Pending"}</span><strong>{o.total!=null?fmt(Number(o.total)/84):"—"}</strong><i>{o.payment_status||o.status||"Pending"}</i></div>):<div className="emptyAdmin">No orders found yet.</div>}</>}
 {tab==="categories"&&<><div className="panelHead"><div><h2>Categories</h2><p className="adminMuted">Manage your furniture catalog structure.</p></div><button className="btn dark" onClick={()=>setEditing({name:"",slug:""})}>+ Add category</button></div>{editing&&<div className="adminForm"><h3>{editing.id?"Edit category":"Add category"}</h3><div className="adminFormGrid"><input placeholder="Category name *" value={editing.name||""} onChange={e=>setEditing({...editing,name:e.target.value})}/><input placeholder="Slug" value={editing.slug||""} onChange={e=>setEditing({...editing,slug:e.target.value})}/></div><div className="formActions"><button className="btn light" onClick={()=>setEditing(null)}>Cancel</button><button className="btn dark" onClick={saveCategory}>Save category</button></div></div>}{categories.map(c=><div className="categoryRow" key={c.id}><b>{c.name}</b><span>{c.slug||""}</span><button onClick={()=>setEditing({...c})}>Edit</button></div>)}</>}
 {tab==="settings"&&<><div className="panelHead"><div><h2>Website settings</h2><p className="adminMuted">Control store-wide settings from the database.</p></div></div><div className="settingsBox"><label>Store name<input value={settings.store_name||""} onChange={e=>setSettings({...settings,store_name:e.target.value})}/></label><label>Currency<select value={settings.currency||"INR"} onChange={e=>setSettings({...settings,currency:e.target.value})}><option value="INR">INR (₹)</option><option value="USD">USD ($)</option></select></label><label>Free shipping threshold<input type="number" value={settings.shipping_threshold||""} onChange={e=>setSettings({...settings,shipping_threshold:e.target.value})}/></label><label>Announcement<input value={settings.announcement||""} onChange={e=>setSettings({...settings,announcement:e.target.value})}/></label><label>Phone<input value={settings.phone||""} onChange={e=>setSettings({...settings,phone:e.target.value})}/></label><label>Email<input value={settings.email||""} onChange={e=>setSettings({...settings,email:e.target.value})}/></label><label>Address<input value={settings.address||""} onChange={e=>setSettings({...settings,address:e.target.value})}/></label><button className="btn dark" onClick={saveSettings}>Save website settings</button></div></>}
 </section></div></div>
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