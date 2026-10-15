import express from "express";
import path from "path";
import {fileURLToPath} from "url";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import multer from "multer";
import fs from "fs";

dotenv.config();

const app=express();
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
// Keep new uploads outside the deployed source tree when possible.
const legacyUploadDir=path.join(__dirname,"uploads");
const uploadDir=process.env.UPLOAD_DIR||path.join(process.env.HOME||__dirname,".balaji-handicraft-uploads");
fs.mkdirSync(uploadDir,{recursive:true});
fs.mkdirSync(legacyUploadDir,{recursive:true});
const upload=multer({dest:uploadDir,limits:{fileSize:50*1024*1024}});
app.use(express.json({limit:"20mb"}));
app.use("/uploads",express.static(uploadDir));
app.use("/uploads",express.static(legacyUploadDir));

// Proxy Shopify CDN product images through the storefront origin.
app.get("/api/image-proxy",async(req,res)=>{
  try{
    const target=new URL(String(req.query.url||""));
    if(target.protocol!=="https:"||target.hostname!=="cdn.shopify.com")return res.status(400).end("Unsupported image host");
    const upstream=await fetch(target.href,{headers:{"User-Agent":"BalajiHandicraftImageProxy/1.0"},signal:AbortSignal.timeout(12000)});
    if(!upstream.ok)return res.status(upstream.status).end("Image unavailable");
    if(new URL(upstream.url).hostname!=="cdn.shopify.com")return res.status(502).end("Unexpected image host");
    const type=upstream.headers.get("content-type")||"";
    if(!type.startsWith("image/"))return res.status(415).end("Not an image");
    res.setHeader("Content-Type",type);
    res.setHeader("Cache-Control","public, max-age=86400, stale-while-revalidate=604800");
    res.setHeader("X-Content-Type-Options","nosniff");
    res.status(200);
    const bytes=Buffer.from(await upstream.arrayBuffer());
    res.end(bytes);
  }catch(err){
    if(!res.headersSent)res.status(502);
    res.end("Could not load product image");
  }
});

const PORT=process.env.PORT||3000;
const JWT_SECRET=process.env.JWT_SECRET||"change-this-jwt-secret";
const ADMIN_EMAIL=process.env.ADMIN_EMAIL||"admin@balajihandicraft.com";
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"change-this-admin-password";

const db=mysql.createPool({
  host:process.env.DB_HOST||"localhost",
  port:Number(process.env.DB_PORT||3306),
  user:process.env.DB_USER,
  database:process.env.DB_NAME,
  password:process.env.DB_PASSWORD,
  waitForConnections:true,
  connectionLimit:10
});


const asyncHandler=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);

// Customer order confirmation email. Configure SMTP_* variables in Hostinger.
// Email delivery failures must never undo a successfully saved order.
function escapeHtml(value){
 return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
async function sendOrderConfirmation({email,name,orderNumber,total,items,address,city,state,postal}){
 const {SMTP_HOST,SMTP_PORT,SMTP_SECURE,SMTP_USER,SMTP_PASS,MAIL_FROM,STORE_URL}=process.env;
 if(!SMTP_HOST||!SMTP_USER||!SMTP_PASS){
  console.warn("Order confirmation email skipped: SMTP_HOST, SMTP_USER and SMTP_PASS must be configured.");
  return false;
 }
 const nodemailer=(await import("nodemailer")).default;
 const port=Number(SMTP_PORT||465);
 const transporter=nodemailer.createTransport({
  host:SMTP_HOST,port,secure:SMTP_SECURE?SMTP_SECURE==="true":port===465,
  auth:{user:SMTP_USER,pass:SMTP_PASS}
 });
 const money=value=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(value)||0);
 const rows=items.map(item=>'<tr><td style="padding:12px 8px;border-bottom:1px solid #e8e2d9">'+escapeHtml(item.name)+'</td><td style="padding:12px 8px;text-align:center;border-bottom:1px solid #e8e2d9">'+item.qty+'</td><td style="padding:12px 8px;text-align:right;border-bottom:1px solid #e8e2d9">'+money(item.price*item.qty)+'</td></tr>').join("");
 const site=String(STORE_URL||"https://ivory-lemur-828776.hostingersite.com").replace(/\/$/,"");
 const from=MAIL_FROM||SMTP_USER;
 await transporter.sendMail({
  from:{name:"Balaji Handicraft",address:from},to:email,
  subject:"Order confirmed — "+orderNumber+" | Balaji Handicraft",
  text:"Hi "+name+", thank you for your order "+orderNumber+". We have received your Cash on Delivery order for "+money(total)+". Delivery address: "+[address,city,state,postal].join(", ")+". We will keep you updated. "+site,
  html:`<!doctype html><html><body style="margin:0;background:#f7f4ef;font-family:Arial,sans-serif;color:#211f1b"><div style="max-width:680px;margin:28px auto;background:#fff;border:1px solid #e8e2d9"><div style="background:#171511;color:#fff;padding:28px 32px"><div style="font-size:12px;letter-spacing:3px">BALAJI HANDICRAFT</div><h1 style="font-family:Georgia,serif;font-weight:normal;margin:22px 0 6px;font-size:30px">Thank you for your order.</h1><p style="margin:0;color:#d6c6ad">Your order has been received successfully.</p></div><div style="padding:28px 32px"><p>Hi <strong>${escapeHtml(name)}</strong>,</p><p>Thank you for choosing Balaji Handicraft. We have received your order and it is currently being processed.</p><div style="background:#f7f4ef;padding:16px;margin:22px 0"><div style="font-size:12px;color:#756b5f">ORDER NUMBER</div><div style="font-size:22px;font-weight:bold;margin-top:5px">${escapeHtml(orderNumber)}</div><div style="margin-top:10px">Payment: Cash on Delivery</div></div><h2 style="font-family:Georgia,serif;font-size:20px">Order summary</h2><table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr><th style="text-align:left;padding:10px 8px;border-bottom:2px solid #211f1b">Product</th><th style="padding:10px 8px;border-bottom:2px solid #211f1b">Qty</th><th style="text-align:right;padding:10px 8px;border-bottom:2px solid #211f1b">Amount</th></tr></thead><tbody>${rows}</tbody></table><div style="text-align:right;font-size:19px;font-weight:bold;padding:18px 8px">Total: ${money(total)}</div><h2 style="font-family:Georgia,serif;font-size:20px">Delivery address</h2><p style="line-height:1.7">${escapeHtml(name)}<br>${escapeHtml(address)}<br>${escapeHtml(city)}, ${escapeHtml(state)} ${escapeHtml(postal)}<br>${escapeHtml(process.env.CUSTOMER_SUPPORT_EMAIL||"")}</p><p style="line-height:1.6">We’ll send you updates as your order progresses. If you have questions, reply to this email.</p><p style="margin-top:28px"><a href="${escapeHtml(site)}" style="display:inline-block;background:#171511;color:#fff;text-decoration:none;padding:13px 20px">Visit Balaji Handicraft</a></p></div><div style="background:#f7f4ef;padding:18px 32px;color:#756b5f;font-size:12px">Handcrafted furniture made with care · Balaji Handicraft</div></div></body></html>`
 });
 return true;
}


async function columns(table){
  const [rows]=await db.query("SHOW COLUMNS FROM \`"+table+"\`");
  return rows.map(r=>r.Field);
}
function pick(obj,allowed){
  const out={};
  for(const key of allowed) if(Object.prototype.hasOwnProperty.call(obj,key)) out[key]=obj[key];
  return out;
}
function auth(req,res,next){
  const header=req.headers.authorization||"";
  const token=header.startsWith("Bearer ")?header.slice(7):"";
  try{
    const payload=jwt.verify(token,JWT_SECRET);
    if(payload.role!=="admin") throw new Error("Forbidden");
    req.admin=payload;
    next();
  }catch{res.status(401).json({message:"Unauthorized"});}
}
async function ensureProductFields(){
  const defs={image:"VARCHAR(500)",category_id:"INT NULL",subcategory_id:"INT NULL",short_description:"TEXT",brand:"VARCHAR(255)",material:"VARCHAR(255)",tags:"VARCHAR(1000)",video:"VARCHAR(500)",image_2:"VARCHAR(500)",image_3:"VARCHAR(500)",image_4:"VARCHAR(500)",image_5:"VARCHAR(500)",length_in:"DECIMAL(10,2)",width_in:"DECIMAL(10,2)",height_in:"DECIMAL(10,2)",length_cm:"DECIMAL(10,2)",width_cm:"DECIMAL(10,2)",height_cm:"DECIMAL(10,2)",weight_kg:"DECIMAL(10,2)",color:"VARCHAR(255)",finish:"VARCHAR(255)",care_instructions:"TEXT",assembly_info:"TEXT",featured:"TINYINT(1) DEFAULT 0",best_seller:"TINYINT(1) DEFAULT 0",new_arrival:"TINYINT(1) DEFAULT 0",seo_title:"VARCHAR(255)",meta_description:"VARCHAR(500)",slug:"VARCHAR(255)"};
  const existing=new Set(await columns("products"));
  for(const [name,type] of Object.entries(defs)) if(!existing.has(name)) await db.query("ALTER TABLE products ADD COLUMN "+name+" "+type);
}

const imageRepairMapPath=path.join(__dirname,"product-image-repair.json");
let imageRepairMap=null;
function getImageRepairMap(){
  if(imageRepairMap)return imageRepairMap;
  try{imageRepairMap=JSON.parse(fs.readFileSync(imageRepairMapPath,"utf8"));}catch{imageRepairMap={};}
  return imageRepairMap;
}
function missingLocalUpload(value){
  if(!value)return true;
  let pathname="";
  try{pathname=new URL(String(value),"http://local.invalid").pathname;}catch{return false;}
  const at=pathname.indexOf("/uploads/");
  if(at<0)return false;
  let filename="";
  try{filename=path.basename(decodeURIComponent(pathname.slice(at+9)));}catch{return true;}
  if(!filename)return true;
  return !fs.existsSync(path.join(uploadDir,filename))&&!fs.existsSync(path.join(legacyUploadDir,filename));
}
async function repairProductImages(rows){
  const map=getImageRepairMap();
  for(const product of rows){
    const backup=map[String(product.sku||"").trim()];
    if(!backup)continue;
    let changed=false;
    if(missingLocalUpload(product.image)){product.image=backup;changed=true;}
    for(const key of ["image_2","image_3","image_4","image_5"]){
      if(product[key]&&missingLocalUpload(product[key])){product[key]="";changed=true;}
    }
    if(changed){
      await db.query("UPDATE products SET image=?, image_2=?, image_3=?, image_4=?, image_5=? WHERE id=?",
        [product.image||backup,product.image_2||"",product.image_3||"",product.image_4||"",product.image_5||"",product.id]);
      if(!product.image)product.image=backup;
    }
  }
  return rows;
}

async function ensureSettings(){
  await db.query("CREATE TABLE IF NOT EXISTS store_settings (id INT PRIMARY KEY DEFAULT 1, store_name VARCHAR(255) NOT NULL DEFAULT 'Balaji Handicraft', currency VARCHAR(10) NOT NULL DEFAULT 'INR', shipping_threshold DECIMAL(12,2) NOT NULL DEFAULT 42000, phone VARCHAR(100) DEFAULT '', email VARCHAR(255) DEFAULT '', address VARCHAR(500) DEFAULT '', announcement VARCHAR(500) DEFAULT 'Free shipping on orders over ₹42,000') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  await db.query("INSERT IGNORE INTO store_settings (id) VALUES (1)");
}

async function ensureFurnitureTaxonomy(){
  // Seed the exact category/subcategory structure used by the storefront and admin.
  // Existing products and legacy categories are preserved; records are reused by name.
  const taxonomy=[
    {name:"Living Room",subs:["Armchairs","Rocking Chairs","Folding Chairs","Stools & Ottomans","Coffee Tables","Side & End Tables","Console Tables","TV Units"]},
    {name:"Sofas",subs:["1 Seater Sofa","2 Seater Sofa","3 Seater Sofa","L-shaped Sofa","Sofa Cum Bed"]},
    {name:"Bedroom",subs:["All Beds","King Size Beds","Queen Size Beds","Single Beds","Wardrobes","Trunks","Dressing Tables"]},
    {name:"Dining Room",subs:["All Dining Sets","4 Seater Dining Sets","6 Seater Dining Sets","Dining Chairs","Dining Benches","Bar Furniture"]},
    {name:"Storage & Study",subs:["Bookshelves","Sideboards & Crockery Units","Trunks & Storage Chests","Wall Shelves","Benches & Settees","Study Tables"]},
    {name:"Office Furniture",subs:["Office Chairs","Office Stools","Workspace Tables","Desks","Filing Cabinets","Office Shelving"]}
  ];
  const slugify=value=>String(value||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  await db.query("CREATE TABLE IF NOT EXISTS app_migrations (name VARCHAR(191) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  const [taxonomyMigrationRows]=await db.query("SELECT name FROM app_migrations WHERE name=?",["normalize_furniture_taxonomy_v1"]);
  const runLegacyMigration=!taxonomyMigrationRows.length;
  if(runLegacyMigration){
  // Replace the old Home Decor main category with Office Furniture without changing its ID.
  const [officeRows]=await db.query("SELECT id FROM categories WHERE LOWER(name)=LOWER(?) LIMIT 1",["Office Furniture"]);
  const [homeRows]=await db.query("SELECT id FROM categories WHERE LOWER(name)=LOWER(?) LIMIT 1",["Home Decor"]);
  if(!officeRows[0]&&homeRows[0]){
    await db.query("UPDATE categories SET name=?,slug=? WHERE id=?",["Office Furniture","office-furniture",homeRows[0].id]);
  }else if(officeRows[0]&&homeRows[0]){
    const officeId=officeRows[0].id,homeId=homeRows[0].id;
    const [legacySubs]=await db.query("SELECT id FROM subcategories WHERE category_id=?",[homeId]);
    for(const oldSub of legacySubs){
      // Clear outdated decor subcategory links before removing those labels.
      await db.query("UPDATE products SET subcategory_id=NULL WHERE subcategory_id=?",[oldSub.id]);
      await db.query("DELETE FROM subcategories WHERE id=?",[oldSub.id]);
    }
    await db.query("UPDATE products SET category_id=? WHERE category_id=?",[officeId,homeId]);
    await db.query("DELETE FROM categories WHERE id=?",[homeId]);
  }
  for(const item of taxonomy){
    let [found]=await db.query("SELECT id FROM categories WHERE LOWER(name)=LOWER(?) LIMIT 1",[item.name]);
    let categoryId=found[0]?.id;
    if(!categoryId){
      let slug=slugify(item.name),n=2;
      while((await db.query("SELECT id FROM categories WHERE LOWER(slug)=LOWER(?) LIMIT 1",[slug]))[0][0])slug=slugify(item.name)+"-"+n++;
      const [created]=await db.query("INSERT INTO categories (name,slug) VALUES (?,?)",[item.name,slug]);
      categoryId=created.insertId;
    }
    for(const subName of item.subs){
      const [existing]=await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(name)=LOWER(?) LIMIT 1",[categoryId,subName]);
      if(existing[0])continue;
      let slug=slugify(subName),n=2;
      while((await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(slug)=LOWER(?) LIMIT 1",[categoryId,slug]))[0][0])slug=slugify(subName)+"-"+n++;
      await db.query("INSERT INTO subcategories (category_id,name,slug) VALUES (?,?,?)",[categoryId,subName,slug]);
    }
  }
  // Keep sofa types under their own admin category, while the storefront nests
  // that category as the "Sofas" group inside the Living Room mega-menu.
  const [sofaCategoryRows]=await db.query("SELECT id FROM categories WHERE LOWER(name)=LOWER(?) LIMIT 1",["Sofas"]);
  const [livingRows]=await db.query("SELECT id FROM categories WHERE LOWER(name)=LOWER(?) LIMIT 1",["Living Room"]);
  if(sofaCategoryRows[0]&&livingRows[0]){
    const sofaId=Number(sofaCategoryRows[0].id);
    const sofaNames=["1 Seater Sofa","2 Seater Sofa","3 Seater Sofa","L-shaped Sofa","Sofa Cum Bed"];
    for(const subName of sofaNames){
      const [sources]=await db.query("SELECT id,category_id FROM subcategories WHERE LOWER(name)=LOWER(?) AND category_id<>?",[subName,sofaId]);
      const [targetRows]=await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(name)=LOWER(?) LIMIT 1",[sofaId,subName]);
      let targetId=targetRows[0]?.id;
      if(!targetId){
        const slug=slugify(subName);
        const [created]=await db.query("INSERT INTO subcategories (category_id,name,slug) VALUES (?,?,?)",[sofaId,subName,slug]);
        targetId=created.insertId;
      }
      for(const source of sources){
        await db.query("UPDATE products SET subcategory_id=?,category_id=? WHERE subcategory_id=?",[targetId,sofaId,source.id]);
        await db.query("DELETE FROM subcategories WHERE id=?",[source.id]);
      }
    }
  }
  // Remove the obsolete "Sofa Sets" leaf from all categories; keep products
  // and their category assignment, but clear the deleted subcategory reference.
  const [oldSofaSetRows]=await db.query("SELECT id FROM subcategories WHERE LOWER(TRIM(name))=LOWER(?)",["Sofa Sets"]);
  for(const old of oldSofaSetRows){
    await db.query("UPDATE products SET subcategory_id=NULL WHERE subcategory_id=?",[old.id]);
    await db.query("DELETE FROM subcategories WHERE id=?",[old.id]);
  }
  // Remove the old Bedroom dresser label in favor of Trunks while preserving product links.
  const [bedroomRows]=await db.query("SELECT id FROM categories WHERE LOWER(name)=LOWER(?) LIMIT 1",["Bedroom"]);
  if(bedroomRows[0]){
    const bedroomId=bedroomRows[0].id;
    const [oldRows]=await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(name) IN (?,?)",[bedroomId,"dressers & chests of drawers","dressers"]);
    const [trunkRows]=await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(name)=LOWER(?) LIMIT 1",[bedroomId,"Trunks"]);
    if(oldRows.length&&trunkRows[0]){
      for(const old of oldRows){
        await db.query("UPDATE products SET subcategory_id=? WHERE subcategory_id=?",[trunkRows[0].id,old.id]);
        await db.query("DELETE FROM subcategories WHERE id=?",[old.id]);
      }
    }else if(oldRows.length){
      await db.query("UPDATE subcategories SET name=?,slug=? WHERE id=?",["Trunks","trunks",oldRows[0].id]);
      for(const old of oldRows.slice(1)){
        await db.query("UPDATE products SET subcategory_id=? WHERE subcategory_id=?",[oldRows[0].id,old.id]);
        await db.query("DELETE FROM subcategories WHERE id=?",[old.id]);
      }
    }
  }

  // Fold old top-level menu headings into the six canonical admin categories.
  // Product records are retained and their category/subcategory IDs are remapped.
  const canonicalNames=["Living Room","Sofas","Bedroom","Dining Room","Storage & Study","Office Furniture"];
  const canonicalIds={};
  for(const name of canonicalNames){
    const [rows]=await db.query("SELECT id FROM categories WHERE LOWER(name)=LOWER(?) LIMIT 1",[name]);
    if(rows[0])canonicalIds[name]=Number(rows[0].id);
  }
  const legacyFallback={
    "chairs":"Living Room","seating":"Living Room","tables":"Living Room","tv & media":"Living Room",
    "beds":"Bedroom","bedroom storage":"Bedroom","vanity":"Bedroom",
    "dining sets":"Dining Room","dining seating":"Dining Room","bar":"Dining Room",
    "storage":"Storage & Study","cabinets & storage":"Storage & Study","shelving":"Storage & Study","benches":"Storage & Study",
    "office seating":"Office Furniture","workspaces":"Office Furniture","office storage":"Office Furniture",
    "outdoor furniture":"Living Room","furniture sets":"Living Room","sofa sets":"Sofas"
  };
  const destinationForSub=(subName,legacyName)=>{
    const n=String(subName||"").toLowerCase();
    if(/sofa|couch|sectional/.test(n))return "Sofas";
    if(/dining|bar furniture/.test(n))return "Dining Room";
    if(/bed|wardrobe|trunk|dresser|vanity|dressing/.test(n))return "Bedroom";
    if(/office|desk|workspace|filing/.test(n))return "Office Furniture";
    if(/study|book|shelf|storage|cabinet|sideboard|chest|bench|settee/.test(n))return "Storage & Study";
    return legacyFallback[String(legacyName||"").toLowerCase()]||"Living Room";
  };
  const knownLegacyNames=new Set(["chairs","seating","tables","tv & media","beds","bedroom storage","vanity","dining sets","dining seating","bar","storage","cabinets & storage","shelving","benches","office seating","workspaces","office storage","outdoor furniture","furniture sets","sofa sets","foot stool","foot stools","study","desks","workspace tables","coffee tables","side tables","side & end tables","console tables"]);
  const [legacyCategories]=await db.query("SELECT id,name FROM categories ORDER BY id ASC");
  for(const legacy of legacyCategories){
    const legacyName=String(legacy.name||"");
    if(canonicalNames.some(name=>name.toLowerCase()===legacyName.toLowerCase())||!knownLegacyNames.has(legacyName.toLowerCase()))continue;
    const [legacySubs]=await db.query("SELECT id,name FROM subcategories WHERE category_id=? ORDER BY id ASC",[legacy.id]);
    for(const sub of legacySubs){
      const targetName=destinationForSub(sub.name,legacyName);
      const targetCategoryId=canonicalIds[targetName]||canonicalIds["Living Room"];
      if(!targetCategoryId)continue;
      const [dupes]=await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(name)=LOWER(?) LIMIT 1",[targetCategoryId,sub.name]);
      const targetSubId=dupes[0]?.id;
      if(targetSubId){
        await db.query("UPDATE products SET category_id=?,subcategory_id=? WHERE subcategory_id=?",[targetCategoryId,targetSubId,sub.id]);
        await db.query("DELETE FROM subcategories WHERE id=?",[sub.id]);
      }else{
        await db.query("UPDATE subcategories SET category_id=? WHERE id=?",[targetCategoryId,sub.id]);
        await db.query("UPDATE products SET category_id=? WHERE subcategory_id=?",[targetCategoryId,sub.id]);
      }
    }
    const defaultTarget=legacyFallback[legacyName.toLowerCase()]||destinationForSub(legacyName,legacyName);
    const targetId=canonicalIds[defaultTarget]||canonicalIds["Living Room"];
    if(targetId)await db.query("UPDATE products SET category_id=?,subcategory_id=NULL WHERE category_id=? AND (subcategory_id IS NULL OR subcategory_id NOT IN (SELECT id FROM subcategories))",[targetId,legacy.id]);
    await db.query("DELETE FROM categories WHERE id=?",[legacy.id]);
  }
  // Final guard: no dresser label remains in Bedroom Storage after legacy categories merge.
  const finalBedroomId=canonicalIds["Bedroom"];
  if(finalBedroomId){
    const [trunks]=await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(name)=LOWER(?) LIMIT 1",[finalBedroomId,"Trunks"]);
    if(trunks[0]){
      const [dresserRows]=await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(name) LIKE '%dresser%'",[finalBedroomId]);
      for(const old of dresserRows){
        await db.query("UPDATE products SET subcategory_id=?,category_id=? WHERE subcategory_id=?",[trunks[0].id,finalBedroomId,old.id]);
        await db.query("DELETE FROM subcategories WHERE id=?",[old.id]);
      }
    }
  }
  await db.query("INSERT IGNORE INTO app_migrations (name) VALUES (?)",["normalize_furniture_taxonomy_v1"]);
  }
}

async function ensureDiningSetsMenuTaxonomy(){
  await db.query("CREATE TABLE IF NOT EXISTS app_migrations (name VARCHAR(191) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  const migrationName="align_dining_sets_menu_taxonomy_v1";
  const [done]=await db.query("SELECT name FROM app_migrations WHERE name=?",[migrationName]);
  if(done.length)return;
  const slugify=value=>String(value||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const [diningRows]=await db.query("SELECT id FROM categories WHERE LOWER(TRIM(name)) IN (?,?) ORDER BY CASE WHEN LOWER(TRIM(name))=? THEN 0 ELSE 1 END LIMIT 1",["Dining Room","Dining","Dining Room"]);
  let diningId=Number(diningRows[0]?.id||0);
  if(!diningId){
    let slug="dining-room",n=2;
    while((await db.query("SELECT id FROM categories WHERE LOWER(slug)=LOWER(?) LIMIT 1",[slug]))[0][0])slug="dining-room-"+n++;
    const [created]=await db.query("INSERT INTO categories (name,slug) VALUES (?,?)",["Dining Room",slug]);
    diningId=Number(created.insertId);
  }
  const [sourceCategories]=await db.query("SELECT id,name FROM categories WHERE LOWER(TRIM(name)) IN (?,?,?)",["Dining Sets","Dining Set","Dining"]);
  for(const sourceCategory of sourceCategories){
    if(Number(sourceCategory.id)===diningId)continue;
    const [sourceSubs]=await db.query("SELECT id,name FROM subcategories WHERE category_id=?",[sourceCategory.id]);
    for(const source of sourceSubs){
      let targetName=String(source.name||"").trim();
      if(/^dining sets?$/i.test(targetName))targetName="All Dining Sets";
      const [existing]=await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(TRIM(name))=LOWER(?) LIMIT 1",[diningId,targetName]);
      if(existing[0]){
        await db.query("UPDATE products SET category_id=?,subcategory_id=? WHERE subcategory_id=?",[diningId,existing[0].id,source.id]);
        await db.query("DELETE FROM subcategories WHERE id=?",[source.id]);
      }else{
        await db.query("UPDATE subcategories SET category_id=?,name=?,slug=? WHERE id=?",[diningId,targetName,slugify(targetName),source.id]);
        await db.query("UPDATE products SET category_id=? WHERE subcategory_id=?",[diningId,source.id]);
      }
    }
    await db.query("UPDATE products SET category_id=?,subcategory_id=NULL WHERE category_id=? AND (subcategory_id IS NULL OR subcategory_id NOT IN (SELECT id FROM subcategories))",[diningId,sourceCategory.id]);
    await db.query("DELETE FROM categories WHERE id=?",[sourceCategory.id]);
  }
  const ensureSub=async(name,aliases=[])=>{
    const names=[name,...aliases];
    const [targetRows]=await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(TRIM(name))=LOWER(?) LIMIT 1",[diningId,name]);
    let targetId=Number(targetRows[0]?.id||0);
    const placeholders=names.map(()=>"?").join(",");
    const [sources]=await db.query("SELECT id,name FROM subcategories WHERE category_id=? AND LOWER(TRIM(name)) IN ("+placeholders+") ORDER BY id ASC",[diningId,...names]);
    if(!targetId&&sources.length){
      targetId=Number(sources[0].id);
      await db.query("UPDATE subcategories SET name=?,slug=? WHERE id=?",[name,slugify(name),targetId]);
    }
    if(!targetId){
      let slug=slugify(name),n=2;
      while((await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(slug)=LOWER(?) LIMIT 1",[diningId,slug]))[0][0])slug=slugify(name)+"-"+n++;
      const [created]=await db.query("INSERT INTO subcategories (category_id,name,slug) VALUES (?,?,?)",[diningId,name,slug]);
      targetId=Number(created.insertId);
    }
    for(const source of sources){
      if(Number(source.id)===targetId)continue;
      await db.query("UPDATE products SET category_id=?,subcategory_id=? WHERE subcategory_id=?",[diningId,targetId,source.id]);
      await db.query("DELETE FROM subcategories WHERE id=?",[source.id]);
    }
  };
  await ensureSub("All Dining Sets",["Dining Sets","Dining Set"]);
  await ensureSub("4 Seater Dining Sets",["4 Seater Dining Set"]);
  await ensureSub("6 Seater Dining Sets",["6 Seater Dining Set"]);
  await db.query("INSERT IGNORE INTO app_migrations (name) VALUES (?)",[migrationName]);
}

async function ensureBedroomMenuTaxonomy(){
  await db.query("CREATE TABLE IF NOT EXISTS app_migrations (name VARCHAR(191) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  const migrationName="align_bedroom_menu_taxonomy_v1";
  const [done]=await db.query("SELECT name FROM app_migrations WHERE name=?",[migrationName]);
  if(done.length)return;

  const slugify=value=>String(value||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const getOrCreateCategory=async name=>{
    const [rows]=await db.query("SELECT id FROM categories WHERE LOWER(TRIM(name))=LOWER(?) LIMIT 1",[name]);
    if(rows[0])return Number(rows[0].id);
    let slug=slugify(name),n=2;
    while((await db.query("SELECT id FROM categories WHERE LOWER(slug)=LOWER(?) LIMIT 1",[slug]))[0][0])slug=slugify(name)+"-"+n++;
    const [created]=await db.query("INSERT INTO categories (name,slug) VALUES (?,?)",[name,slug]);
    return Number(created.insertId);
  };
  const [bedroomRows]=await db.query("SELECT id FROM categories WHERE LOWER(TRIM(name))=LOWER(?) LIMIT 1",["Bedroom"]);
  const bedroomId=Number(bedroomRows[0]?.id||0);
  const bedsId=await getOrCreateCategory("Beds");
  const storageId=await getOrCreateCategory("Bedroom Storage");
  const vanityId=await getOrCreateCategory("Vanity");

  const migrateSubcategory=async({targetCategoryId,name,aliases=[]})=>{
    const [targetRows]=await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(TRIM(name))=LOWER(?) LIMIT 1",[targetCategoryId,name]);
    let targetId=Number(targetRows[0]?.id||0);
    const searchNames=[name,...aliases];
    const params=[...searchNames.map(()=>"?")];
    const sourceCategoryIds=[bedroomId,targetCategoryId].filter(Boolean);
    const sourcePlaceholders=sourceCategoryIds.map(()=>"?").join(",");
    const [sources]=await db.query(
      "SELECT id,category_id,name FROM subcategories WHERE LOWER(TRIM(name)) IN ("+params.join(",")+") AND category_id IN ("+sourcePlaceholders+") ORDER BY id ASC",
      [...searchNames,...sourceCategoryIds]
    );
    if(!targetId&&sources.length){
      const source=sources.shift();
      await db.query("UPDATE subcategories SET category_id=?,name=?,slug=? WHERE id=?",[targetCategoryId,name,slugify(name),source.id]);
      await db.query("UPDATE products SET category_id=? WHERE subcategory_id=?",[targetCategoryId,source.id]);
      targetId=Number(source.id);
    }
    if(!targetId){
      let slug=slugify(name),n=2;
      while((await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(slug)=LOWER(?) LIMIT 1",[targetCategoryId,slug]))[0][0])slug=slugify(name)+"-"+n++;
      const [created]=await db.query("INSERT INTO subcategories (category_id,name,slug) VALUES (?,?,?)",[targetCategoryId,name,slug]);
      targetId=Number(created.insertId);
    }
    for(const source of sources){
      if(Number(source.id)===targetId)continue;
      await db.query("UPDATE products SET category_id=?,subcategory_id=? WHERE subcategory_id=?",[targetCategoryId,targetId,source.id]);
      await db.query("DELETE FROM subcategories WHERE id=?",[source.id]);
    }
    return targetId;
  };

  for(const name of ["All Beds","King Size Beds","Queen Size Beds","Single Beds"]){
    await migrateSubcategory({targetCategoryId:bedsId,name});
  }
  await migrateSubcategory({targetCategoryId:storageId,name:"Wardrobes"});
  await migrateSubcategory({targetCategoryId:storageId,name:"Chests of Drawers",aliases:["Dressers","Dresser","Dressers & Chests of Drawers"]});
  await migrateSubcategory({targetCategoryId:storageId,name:"Bedside Tables",aliases:["Bedside Table","Nightstands","Nightstand"]});
  await migrateSubcategory({targetCategoryId:storageId,name:"Console Tables"});
  await migrateSubcategory({targetCategoryId:storageId,name:"Trunks",aliases:["Trunk"]});
  await migrateSubcategory({targetCategoryId:vanityId,name:"Dressing",aliases:["Dressing Tables","Dressing Table"]});

  // Remove outdated Bedroom-only labels after their products have been remapped.
  if(bedroomId){
    const oldNames=["All Beds","King Size Beds","Queen Size Beds","Single Beds","Wardrobes","Dressers","Dresser","Dressers & Chests of Drawers","Bedside Table","Bedside Tables","Nightstands","Nightstand","Console Tables","Trunks","Trunk","Dressing Tables","Dressing Table"];
    for(const oldName of oldNames){
      const [rows]=await db.query("SELECT id FROM subcategories WHERE category_id=? AND LOWER(TRIM(name))=LOWER(?)",[bedroomId,oldName]);
      for(const row of rows){
        await db.query("UPDATE products SET category_id=?,subcategory_id=NULL WHERE subcategory_id=?",[bedroomId,row.id]);
        await db.query("DELETE FROM subcategories WHERE id=?",[row.id]);
      }
    }
  }
  await db.query("INSERT IGNORE INTO app_migrations (name) VALUES (?)",[migrationName]);
}

async function ensureMegaMenuCleanup(){
  await db.query("CREATE TABLE IF NOT EXISTS app_migrations (name VARCHAR(191) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  const [done]=await db.query("SELECT name FROM app_migrations WHERE name=?",["clean_furniture_mega_menu_v1"]);
  if(done.length)return;

  const removeSubcategory=async(row)=>{
    await db.query("UPDATE products SET subcategory_id=NULL WHERE subcategory_id=?",[row.id]);
    await db.query("DELETE FROM subcategories WHERE id=?",[row.id]);
  };
  // Remove legacy sofa labels while retaining the five requested sofa types.
  const sofaRemove=["Sofas","Sofa Sets","Wood Pull Out Sofa Cum Bed","Wooden Sofa","Sofa Set","Loveseat Sofas"];
  for(const label of sofaRemove){
    const [rows]=await db.query(
      "SELECT s.id FROM subcategories s JOIN categories c ON c.id=s.category_id WHERE LOWER(TRIM(s.name))=LOWER(?) AND LOWER(c.name) IN (?,?,?)",
      [label,"Living Room","Sofas","Sofa Sets"]
    );
    for(const row of rows)await removeSubcategory(row);
  }

  // Clean the Living Room tables menu. Preserve Storage & Study > Study Tables;
  // in the old Tables/Living Room group, relabel Study Tables to End Tables.
  const [studyRows]=await db.query(
    "SELECT s.id,s.category_id FROM subcategories s JOIN categories c ON c.id=s.category_id WHERE LOWER(TRIM(s.name))=LOWER(?) AND LOWER(c.name) IN (?,?)",
    ["Study Tables","Living Room","Tables"]
  );
  for(const study of studyRows){
    const [existing]=await db.query(
      "SELECT id FROM subcategories WHERE category_id=? AND LOWER(TRIM(name))=LOWER(?) AND id<>? LIMIT 1",
      [study.category_id,"End Tables",study.id]
    );
    if(existing[0]){
      await db.query("UPDATE products SET subcategory_id=? WHERE subcategory_id=?",[existing[0].id,study.id]);
      await db.query("DELETE FROM subcategories WHERE id=?",[study.id]);
    }else{
      await db.query("UPDATE subcategories SET name=?,slug=? WHERE id=?",["End Tables","end-tables",study.id]);
    }
  }
  const tableRemove=["Kitchen & Dining Room Tables","Accent Tables","Nightstands"];
  for(const label of tableRemove){
    const [rows]=await db.query(
      "SELECT s.id FROM subcategories s JOIN categories c ON c.id=s.category_id WHERE LOWER(TRIM(s.name))=LOWER(?) AND LOWER(c.name) IN (?,?)",
      [label,"Living Room","Tables"]
    );
    for(const row of rows)await removeSubcategory(row);
  }

  // Remove the requested extra seating labels from the Living Room/Chairs menu.
  const seatingRemove=["Table & Bar Stools","Kitchen & Dining Room Chairs","Slipper Chairs","Armchairs, Recliners & Sleeper Chairs","Chaises"];
  for(const label of seatingRemove){
    const [rows]=await db.query(
      "SELECT s.id FROM subcategories s JOIN categories c ON c.id=s.category_id WHERE LOWER(TRIM(s.name))=LOWER(?) AND LOWER(c.name) IN (?,?,?)",
      [label,"Living Room","Chairs","Seating"]
    );
    for(const row of rows)await removeSubcategory(row);
  }
  await db.query("INSERT IGNORE INTO app_migrations (name) VALUES (?)",["clean_furniture_mega_menu_v1"]);
}

app.get("/api/health",(req,res)=>res.json({ok:true,service:"balaji-handicraft-api"}));
app.get("/api/db-health",asyncHandler(async(req,res)=>{
  const [rows]=await db.query("SELECT 1 AS ok");
  res.json({ok:true,database:process.env.DB_NAME,check:rows[0].ok});
}));

app.post("/api/admin/login",(req,res)=>{
  const {email,password}=req.body||{};
  if(String(email||"").trim().toLowerCase()===String(ADMIN_EMAIL).trim().toLowerCase() && password===ADMIN_PASSWORD){
    const token=jwt.sign({role:"admin",email:ADMIN_EMAIL},JWT_SECRET,{expiresIn:"8h"});
    return res.json({token,user:{email:ADMIN_EMAIL,role:"admin"}});
  }
  return res.status(401).json({message:"Invalid admin email or password"});
});
app.get("/api/admin/me",auth,(req,res)=>res.json({user:req.admin}));

app.post("/api/admin/upload",auth,upload.single("file"),asyncHandler(async(req,res)=>{
  if(!req.file)return res.status(400).json({message:"No file uploaded"});
  const ext=path.extname(req.file.originalname).toLowerCase().replace(/[^a-z0-9.]/g,"");
  const safeName=Date.now()+"-"+Math.random().toString(36).slice(2,9)+(ext||"");
  const finalPath=path.join(uploadDir,safeName);
  fs.renameSync(req.file.path,finalPath);
  res.json({url:"/uploads/"+safeName,name:req.file.originalname,size:req.file.size});
}));

app.get("/api/admin/stats",auth,asyncHandler(async(req,res)=>{
  const [p]=await db.query("SELECT COUNT(*) count FROM products");
  const [o]=await db.query("SELECT COUNT(*) count FROM orders");
  const [u]=await db.query("SELECT COUNT(*) count FROM users");
  let revenue=0;
  try{
    const [r]=await db.query("SELECT COALESCE(SUM(total),0) revenue FROM orders WHERE status NOT IN ('cancelled','canceled')");
    revenue=Number(r[0]?.revenue||0);
  }catch{}
  res.json({products:Number(p[0].count),orders:Number(o[0].count),customers:Number(u[0].count),revenue});
}));

app.get("/api/admin/products",auth,asyncHandler(async(req,res)=>{
  await ensureProductFields();
  const [rows]=await db.query("SELECT * FROM products ORDER BY id DESC");
  await repairProductImages(rows);
  res.json({products:rows});
}));
app.post("/api/admin/products/bulk-csv",auth,upload.single("file"),asyncHandler(async(req,res)=>{
  if(!req.file)return res.status(400).json({message:"CSV file is required"});
  const csv=fs.readFileSync(req.file.path,"utf8");
  try{fs.unlinkSync(req.file.path)}catch{}
  const parseCSV=(text)=>{
    const rows=[];let row=[],cell="",quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i],next=text[i+1];
      if(quoted){
        if(ch==='"'&&next==='"'){cell+='"';i++}
        else if(ch==='"')quoted=false;
        else cell+=ch;
      }else{
        if(ch==='"')quoted=true;
        else if(ch===','){row.push(cell);cell=""}
        else if(ch==='\n'){row.push(cell.replace(/\r$/,""));rows.push(row);row=[];cell=""}
        else cell+=ch;
      }
    }
    if(cell.length||row.length){row.push(cell.replace(/\r$/,""));rows.push(row)}
    if(!rows.length)return [];
    const headers=rows.shift().map(x=>String(x||"").trim());
    return rows.filter(r=>r.some(x=>String(x||"").trim()!=="")).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??""])));
  };
  const rows=parseCSV(csv);
  if(!rows.length)return res.status(400).json({message:"CSV contains no product rows"});
  // Image-only repair imports update only the five image columns and never overwrite product details.
  if(rows.some(r=>String(r["Image Repair"]||"").trim().toUpperCase()==="YES")){
    const imageGroups=new Map();
    for(const row of rows){
      const sku=String(row["Variant SKU"]||row.SKU||"").trim();
      const image=String(row["Image Src"]||"").trim();
      if(!sku||!image)continue;
      if(!imageGroups.has(sku))imageGroups.set(sku,[]);
      imageGroups.get(sku).push({image,position:Number(row["Image Position"]||0)});
    }
    const connection=await db.getConnection();
    let updated=0,notFound=0;
    try{
      await connection.beginTransaction();
      for(const [sku,entries] of imageGroups){
        const images=[...new Map(entries.sort((a,b)=>(a.position||9999)-(b.position||9999)).map(x=>[x.image,x.image])).values()].slice(0,5);
        while(images.length<5)images.push("");
        const [result]=await connection.query("UPDATE products SET image=?, image_2=?, image_3=?, image_4=?, image_5=? WHERE sku=?",[...images,sku]);
        if(result.affectedRows)updated++;else notFound++;
      }
      await connection.commit();
    }catch(err){await connection.rollback();throw err}
    finally{connection.release()}
    return res.json({message:"Image-only repair finished. Other product fields were not changed.",updated,notFound,processed:imageGroups.size});
  }
  const groups=new Map();
  // Group Shopify rows by SKU first. Every image row can contain a Title,
  // so grouping by "Title present/blank" is unreliable. SKU is the stable
  // product identity and guarantees each product receives its own images.
  for(const row of rows){
    const title=String(row.Title||"").trim();
    const rawHandle=String(row.Handle||"").trim();
    const sku=String(row["Variant SKU"]||row.SKU||"").trim();
    const key=sku||rawHandle||title;
    if(!key)continue;
    if(!groups.has(key))groups.set(key,{first:row,images:[]});
    const g=groups.get(key);
    // Prefer the first row that has a title/SKU as the product source row.
    if(!String(g.first?.Title||"").trim() && title)g.first=row;
    const image=String(row["Image Src"]||"").trim();
    if(image&&!g.images.includes(image))g.images.push(image);
  }
  for(const g of groups.values()){
    // Keep the CSV image order; Shopify Image Position 1 is the main product image.
    g.images=g.images.slice(0,5);
  }
  const productCols=await columns("products");
  const categoryCols=await columns("categories");
  const subcategoryCols=await columns("subcategories");
  const connection=await db.getConnection();
  let created=0,updated=0,skipped=0; const reservedSlugs=new Set();
  try{
    await connection.beginTransaction();
    for(const {first,images} of groups.values()){
      const name=String(first.Title||"").trim();
      if(!name){skipped++;continue}
      const sku=String(first["Variant SKU"]||first.SKU||"").trim();
      const categoryPath=String(first["Product Category"]||"").split(">").map(x=>x.trim()).filter(Boolean);
      let categoryName=categoryPath.length>1?categoryPath[1]:String(first.Type||"Furniture").trim()||"Furniture";
      let subcategoryName=categoryPath.length>2?categoryPath[2]:String(first.Type||"").trim();
      const findOrCreate=async(table,name,parentId=null)=>{
        if(!name)return null;
        const slug=String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
        const [found]=await connection.query(parentId===null
          ? "SELECT id FROM categories WHERE LOWER(name)=LOWER(?) OR LOWER(slug)=LOWER(?) LIMIT 1"
          : "SELECT id FROM subcategories WHERE category_id=? AND (LOWER(name)=LOWER(?) OR LOWER(slug)=LOWER(?)) LIMIT 1",
          parentId===null?[name,slug]:[parentId,name,slug]);
        if(found[0])return found[0].id;
        let candidateSlug=slug;
        if(table==="subcategories" && parentId!==null){
          const parentSuffix=String(parentId);
          candidateSlug=slug+"-"+parentSuffix;
          let n=2;
          while((await connection.query("SELECT id FROM subcategories WHERE LOWER(slug)=LOWER(?) LIMIT 1",[candidateSlug]))[0][0]){
            candidateSlug=slug+"-"+parentSuffix+"-"+n++;
          }
        }
        try{
          if(table==="categories"){
            const [r]=await connection.query("INSERT INTO categories (name,slug) VALUES (?,?)",[name,candidateSlug]);
            return r.insertId;
          }
          const [r]=await connection.query("INSERT INTO subcategories (category_id,name,slug) VALUES (?,?,?)",[parentId,name,candidateSlug]);
          return r.insertId;
        }catch(err){
          if(err.code==="ER_DUP_ENTRY"){
            const [retry]=await connection.query(parentId===null
              ? "SELECT id FROM categories WHERE LOWER(slug)=LOWER(?) LIMIT 1"
              : "SELECT id FROM subcategories WHERE category_id=? AND LOWER(slug)=LOWER(?) LIMIT 1",
              parentId===null?[candidateSlug]:[parentId,candidateSlug]);
            if(retry[0])return retry[0].id;
          }
          throw err;
        }
      };
      const categoryId=await findOrCreate("categories",categoryName);
      const subcategoryId=subcategoryName?await findOrCreate("subcategories",subcategoryName,categoryId):null;
      const grams=Number(first["Variant Grams"]||0);
      const weightKg=grams?grams/1000:null;
      const price=Number(first["Variant Price"]||0)||0;
      const oldPrice=Number(first["Variant Compare At Price"]||0)||0;
      const qty=Number(first["Variant Inventory Qty"]||0)||0;
      const bodyHtml=String(first["Body (HTML)"]||"").trim();
      const bodyText=bodyHtml.replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim();
      const payload={
        name,sku,description:bodyHtml,short_description:bodyText.slice(0,200),
        brand:String(first.Vendor||"").trim(),material:"",tags:String(first.Tags||"").trim(),
        image:images[0]||String(first["Image Src"]||"").trim(),image_2:images[1]||"",image_3:images[2]||"",image_4:images[3]||"",image_5:images[4]||"",
        price,old_price:oldPrice,qty,status:String(first.Status||"active").trim()||"active",
        category_id:categoryId,subcategory_id:subcategoryId,weight_kg:weightKg,
        seo_title:String(first["SEO Title"]||name).trim(),meta_description:String(first["SEO Description"]||bodyText).trim().slice(0,500),
        slug:(String(first.Handle||name).trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-"+(sku?String(sku).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""):"product")).slice(0,250)
      };
      const data={}; for(const key of productCols) if(Object.prototype.hasOwnProperty.call(payload,key))data[key]=payload[key];
      let existingId=null;
      if(sku){const [found]=await connection.query("SELECT id FROM products WHERE sku=? LIMIT 1",[sku]);existingId=found[0]?.id||null}
      if(payload.slug){
        const baseSlug=payload.slug;
        const [slugRows]=await connection.query("SELECT id FROM products WHERE slug=? LIMIT 1",[baseSlug]);
        const slugTakenByOther=slugRows[0] && (!existingId || Number(slugRows[0].id)!==Number(existingId));
        if(slugTakenByOther || reservedSlugs.has(baseSlug)){
          const suffix=sku?String(sku).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40):"product";
          let candidate=baseSlug+"-"+(suffix||"product");
          let n=2;
          while(reservedSlugs.has(candidate) || (await connection.query("SELECT id FROM products WHERE slug=? LIMIT 1",[candidate]))[0][0]){
            candidate=baseSlug+"-"+(suffix||"product")+"-"+n++;
          }
          payload.slug=candidate;
          data.slug=candidate;
        }
        reservedSlugs.add(payload.slug);
      }
      const keys=Object.keys(data);
      if(existingId){
        await connection.query("UPDATE products SET "+keys.map(k=>"`"+k+"`=?").join(",")+" WHERE id=?",[...keys.map(k=>data[k]),existingId]);
        updated++;
      }else{
        try{
          await connection.query("INSERT INTO products ("+keys.map(k=>"`"+k+"`").join(",")+") VALUES ("+keys.map(()=>"?").join(",")+")",keys.map(k=>data[k]));
          created++;
        }catch(err){
          if(err.code==="ER_DUP_ENTRY" && String(err.message||"").includes("slug")){
            const base=payload.slug||"product";
            let n=2,candidate=base+"-"+n;
            while(reservedSlugs.has(candidate) || (await connection.query("SELECT id FROM products WHERE slug=? LIMIT 1",[candidate]))[0][0]) candidate=base+"-"+(++n);
            data.slug=candidate; payload.slug=candidate; reservedSlugs.add(candidate);
            await connection.query("INSERT INTO products ("+keys.map(k=>"`"+k+"`").join(",")+") VALUES ("+keys.map(()=>"?").join(",")+")",keys.map(k=>data[k]));
            created++;
          }else throw err;
        }
      }
    }
    await connection.commit();
    res.json({ok:true,rows:rows.length,products:groups.size,created,updated,skipped});
  }catch(err){await connection.rollback();res.status(400).json({message:"Bulk import failed: "+(err.message||"Database import error")});return}
  finally{connection.release()}
}));

async function uniqueProductSlug(name,sku,requestedSlug,excludeId=null){
  const clean=v=>String(v||"").toLowerCase().normalize("NFKD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const base=clean(requestedSlug)||[clean(name),clean(sku)].filter(Boolean).join("-");
  let candidate=(base||"furniture-product").slice(0,240),n=2;
  while(true){
    const params=[candidate];
    let sql="SELECT id FROM products WHERE slug=? ";
    if(excludeId){sql+="AND id<>? ";params.push(excludeId)}
    sql+="LIMIT 1";
    const [rows]=await db.query(sql,params);
    if(!rows.length)return candidate;
    const suffix="-"+n++;
    candidate=(base||"furniture-product").slice(0,250-suffix.length)+suffix;
  }
}
app.post("/api/admin/products",auth,asyncHandler(async(req,res)=>{
  await ensureProductFields();
  const cols=await columns("products");
  const body=pick(req.body||{},cols.filter(c=>!["id","created_at","updated_at"].includes(c)));
  if(!String(body.name||"").trim())return res.status(400).json({message:"Product name is required"});
  body.name=String(body.name).trim();
  if(cols.includes("slug"))body.slug=await uniqueProductSlug(body.name,body.sku,body.slug);
  const keys=Object.keys(body);
  if(!keys.length)return res.status(400).json({message:"No product fields were supplied"});
  const quoted=keys.map(k=>String.fromCharCode(96)+k+String.fromCharCode(96)).join(",");
  const sql="INSERT INTO products ("+quoted+") VALUES ("+keys.map(()=>"?").join(",")+")";
  try{const [result]=await db.query(sql,keys.map(k=>body[k]));res.status(201).json({id:result.insertId})}
  catch(err){console.error("Create product failed:",err);res.status(400).json({message:"Could not save product: "+(err.sqlMessage||err.message||"Database error")})}
}));
app.put("/api/admin/products/:id",auth,asyncHandler(async(req,res)=>{
  await ensureProductFields();
  const cols=await columns("products");
  const body=pick(req.body||{},cols.filter(c=>!["id","created_at","updated_at"].includes(c)));
  if(body.name)body.name=String(body.name).trim();
  if(cols.includes("slug")&&body.name)body.slug=await uniqueProductSlug(body.name,body.sku,body.slug,req.params.id);
  const keys=Object.keys(body);
  if(!keys.length)return res.status(400).json({message:"No changes supplied"});
  const quoted=keys.map(k=>String.fromCharCode(96)+k+String.fromCharCode(96)+"=?").join(",");
  try{await db.query("UPDATE products SET "+quoted+" WHERE id=?",[...keys.map(k=>body[k]),req.params.id]);res.json({ok:true})}
  catch(err){console.error("Update product failed:",err);res.status(400).json({message:"Could not update product: "+(err.sqlMessage||err.message||"Database error")})}
}));
app.delete("/api/admin/products/bulk",auth,asyncHandler(async(req,res)=>{
  const raw=Array.isArray(req.body?.ids)?req.body.ids:[];
  const ids=[...new Set(raw.map(Number).filter(id=>Number.isInteger(id)&&id>0))];
  if(!ids.length)return res.status(400).json({message:"Select at least one valid product."});
  const [result]=await db.query("DELETE FROM products WHERE id IN ("+ids.map(()=>"?").join(",")+")",ids);
  res.json({ok:true,deleted:result.affectedRows||0});
}));
app.delete("/api/admin/products/:id",auth,asyncHandler(async(req,res)=>{
  await db.query("DELETE FROM products WHERE id=?",[req.params.id]);
  res.json({ok:true});
}));

app.get("/api/admin/categories",auth,asyncHandler(async(req,res)=>{
  const [categories]=await db.query("SELECT * FROM categories ORDER BY id ASC");
  let subcategories=[];
  try{[subcategories]=await db.query("SELECT * FROM subcategories ORDER BY id ASC");}catch{}
  res.json({categories,subcategories});
}));
app.post("/api/admin/categories",auth,asyncHandler(async(req,res)=>{
  const cols=await columns("categories");
  const body=pick(req.body||{},cols.filter(c=>c!=="id"&&c!=="created_at"&&c!=="updated_at"));
  if(!body.name)return res.status(400).json({message:"Category name is required"});
  if(!body.slug)body.slug=String(body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const keys=Object.keys(body);
  const quoted=keys.map(k=>"\`"+k+"\`").join(",");
  const [result]=await db.query("INSERT INTO categories ("+quoted+") VALUES ("+keys.map(()=>"?").join(",")+")",keys.map(k=>body[k]));
  res.status(201).json({id:result.insertId});
}));
app.put("/api/admin/categories/:id",auth,asyncHandler(async(req,res)=>{
  const cols=await columns("categories");
  const body=pick(req.body||{},cols.filter(c=>c!=="id"&&c!=="created_at"&&c!=="updated_at"));
  const keys=Object.keys(body);
  if(!keys.length)return res.status(400).json({message:"No changes supplied"});
  await db.query("UPDATE categories SET "+keys.map(k=>"\`"+k+"\`=?").join(",")+" WHERE id=?",[...keys.map(k=>body[k]),req.params.id]);
  res.json({ok:true});
}));
app.get("/api/admin/subcategories",auth,asyncHandler(async(req,res)=>{
  const [subcategories]=await db.query("SELECT s.*,c.name AS category_name FROM subcategories s LEFT JOIN categories c ON c.id=s.category_id ORDER BY s.id ASC");
  res.json({subcategories});
}));
app.post("/api/admin/subcategories",auth,asyncHandler(async(req,res)=>{
  const cols=await columns("subcategories");
  const body=pick(req.body||{},cols.filter(c=>c!=="id"&&c!=="created_at"&&c!=="updated_at"));
  if(!body.name)return res.status(400).json({message:"Subcategory name is required"});
  if(!body.category_id)return res.status(400).json({message:"Parent category is required"});
  if(!body.slug)body.slug=String(body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const keys=Object.keys(body);
  const [result]=await db.query("INSERT INTO subcategories ("+keys.join(",")+") VALUES ("+keys.map(()=>"?").join(",")+")",keys.map(k=>body[k]));
  res.status(201).json({id:result.insertId});
}));
app.put("/api/admin/subcategories/:id",auth,asyncHandler(async(req,res)=>{
  const cols=await columns("subcategories");
  const body=pick(req.body||{},cols.filter(c=>c!=="id"&&c!=="created_at"&&c!=="updated_at"));
  const keys=Object.keys(body);
  if(!keys.length)return res.status(400).json({message:"No changes supplied"});
  await db.query("UPDATE subcategories SET "+keys.map(k=>k+"=?").join(",")+" WHERE id=?",[...keys.map(k=>body[k]),req.params.id]);
  res.json({ok:true});
}));
app.delete("/api/admin/subcategories/:id",auth,asyncHandler(async(req,res)=>{
  const id=Number(req.params.id);
  const [rows]=await db.query("SELECT id FROM subcategories WHERE id=? LIMIT 1",[id]);
  if(!rows.length)return res.status(404).json({message:"Subcategory not found."});
  // Keep products intact; removing a subcategory only clears its assignment.
  await db.query("UPDATE products SET subcategory_id=NULL WHERE subcategory_id=?",[id]);
  await db.query("DELETE FROM subcategories WHERE id=?",[id]);
  res.json({ok:true});
}));
app.delete("/api/admin/categories/:id",auth,asyncHandler(async(req,res)=>{
  const id=Number(req.params.id);
  const [rows]=await db.query("SELECT id FROM categories WHERE id=? LIMIT 1",[id]);
  if(!rows.length)return res.status(404).json({message:"Category not found."});
  const [subs]=await db.query("SELECT id FROM subcategories WHERE category_id=?",[id]);
  const subIds=subs.map(x=>Number(x.id));
  if(subIds.length){
    await db.query("UPDATE products SET subcategory_id=NULL WHERE subcategory_id IN ("+subIds.map(()=>"?").join(",")+")",subIds);
    await db.query("DELETE FROM subcategories WHERE category_id=?",[id]);
  }
  // Keep products intact but unassign them from the deleted category.
  await db.query("UPDATE products SET category_id=NULL,subcategory_id=NULL WHERE category_id=?",[id]);
  await db.query("DELETE FROM categories WHERE id=?",[id]);
  res.json({ok:true});
}));

app.get("/api/admin/orders",auth,asyncHandler(async(req,res)=>{
  const [rows]=await db.query("SELECT * FROM orders ORDER BY id DESC LIMIT 100");
  res.json({orders:rows});
}));
app.put("/api/admin/orders/:id",auth,asyncHandler(async(req,res)=>{
  const allowedStatuses=new Set(["pending","confirmed","processing","shipped","delivered","cancelled"]);
  const status=String(req.body?.status||"").trim().toLowerCase();
  if(!allowedStatuses.has(status))return res.status(400).json({message:"Invalid order status."});
  const [result]=await db.query("UPDATE orders SET status=? WHERE id=?",[status,req.params.id]);
  if(!result.affectedRows)return res.status(404).json({message:"Order not found."});
  const [rows]=await db.query("SELECT * FROM orders WHERE id=? LIMIT 1",[req.params.id]);
  res.json({ok:true,order:rows[0]});
}));

app.get("/api/admin/settings",auth,asyncHandler(async(req,res)=>{
  await ensureSettings();
  const [rows]=await db.query("SELECT * FROM store_settings WHERE id=1 LIMIT 1");
  res.json({settings:rows[0]||{}});
}));
app.put("/api/admin/settings",auth,asyncHandler(async(req,res)=>{
  await ensureSettings();
  const allowed=["store_name","currency","shipping_threshold","phone","email","address","announcement"];
  const body=pick(req.body||{},allowed);
  const keys=Object.keys(body);
  if(!keys.length)return res.status(400).json({message:"No settings supplied"});
  await db.query("UPDATE store_settings SET "+keys.map(k=>"\`"+k+"\`=?").join(",")+" WHERE id=1",keys.map(k=>body[k]));
  res.json({ok:true});
}));

async function ensureAdminContent(){
  await db.query("CREATE TABLE IF NOT EXISTS coupons (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(100) UNIQUE, discount_type VARCHAR(20) DEFAULT 'percent', discount_value DECIMAL(12,2) DEFAULT 0, min_order DECIMAL(12,2) DEFAULT 0, expires_at DATE NULL, status VARCHAR(30) DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  const defs={homepage_hero:"VARCHAR(500)",homepage_subtitle:"TEXT",homepage_image:"VARCHAR(500)",seo_title:"VARCHAR(255)",meta_description:"VARCHAR(500)",seo_keywords:"VARCHAR(500)",favicon:"VARCHAR(500)"};
  const existing=new Set(await columns("store_settings"));
  for(const [name,type] of Object.entries(defs)) if(!existing.has(name)) await db.query("ALTER TABLE store_settings ADD COLUMN "+name+" "+type);
}
async function adminRows(table){ const [rows]=await db.query("SELECT * FROM "+table+" ORDER BY id DESC"); return rows; }
async function adminCreate(table,body){ const cols=await columns(table); const data=pick(body||{},cols.filter(c=>c!=="id"&&c!=="created_at"&&c!=="updated_at")); const keys=Object.keys(data); if(!keys.length) throw new Error("No data supplied"); const [result]=await db.query("INSERT INTO "+table+" ("+keys.join(",")+") VALUES ("+keys.map(()=>"?").join(",")+")",keys.map(k=>data[k])); return result.insertId; }
async function adminUpdate(table,id,body){ const cols=await columns(table); const data=pick(body||{},cols.filter(c=>c!=="id"&&c!=="created_at"&&c!=="updated_at")); const keys=Object.keys(data); if(!keys.length) throw new Error("No changes supplied"); await db.query("UPDATE "+table+" SET "+keys.map(k=>k+"=?").join(",")+" WHERE id=?",[...keys.map(k=>data[k]),id]); }
for(const table of ["banners","blog_posts","coupons","reviews","contact_messages"]){
  app.get("/api/admin/"+table,auth,asyncHandler(async(req,res)=>res.json({items:await adminRows(table)})));
  app.post("/api/admin/"+table,auth,asyncHandler(async(req,res)=>res.status(201).json({id:await adminCreate(table,req.body)})));
  app.put("/api/admin/"+table+"/:id",auth,asyncHandler(async(req,res)=>{await adminUpdate(table,req.params.id,req.body);res.json({ok:true})}));
  app.delete("/api/admin/"+table+"/:id",auth,asyncHandler(async(req,res)=>{await db.query("DELETE FROM "+table+" WHERE id=?",[req.params.id]);res.json({ok:true})}));
}
app.get("/api/admin/customers",auth,asyncHandler(async(req,res)=>{ const cols=await columns("users"); const safe=cols.filter(c=>!["password","password_hash"].includes(c)); const [items]=await db.query("SELECT "+safe.join(",")+" FROM users ORDER BY id DESC"); res.json({items}); }));
app.get("/api/admin/users",auth,asyncHandler(async(req,res)=>{ const cols=await columns("users"); const safe=cols.filter(c=>!["password","password_hash"].includes(c)); const [items]=await db.query("SELECT "+safe.join(",")+" FROM users ORDER BY id DESC"); res.json({items}); }));
app.get("/api/admin/reports",auth,asyncHandler(async(req,res)=>{ const [daily]=await db.query("SELECT DATE(created_at) day,COUNT(*) orders,COALESCE(SUM(total),0) revenue FROM orders GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 30"); const [status]=await db.query("SELECT status,COUNT(*) count,COALESCE(SUM(total),0) revenue FROM orders GROUP BY status"); res.json({daily,status}); }));
app.get("/api/admin/homepage",auth,asyncHandler(async(req,res)=>{ await ensureAdminContent(); const [rows]=await db.query("SELECT * FROM store_settings WHERE id=1 LIMIT 1"); res.json({settings:rows[0]||{}}); }));
app.put("/api/admin/homepage",auth,asyncHandler(async(req,res)=>{ await ensureAdminContent(); await adminUpdate("store_settings",1,pick(req.body||{},["homepage_hero","homepage_subtitle","homepage_image"])); res.json({ok:true}); }));
app.get("/api/admin/seo",auth,asyncHandler(async(req,res)=>{ await ensureAdminContent(); const [rows]=await db.query("SELECT * FROM store_settings WHERE id=1 LIMIT 1"); res.json({settings:rows[0]||{}}); }));
app.put("/api/admin/seo",auth,asyncHandler(async(req,res)=>{ await ensureAdminContent(); await adminUpdate("store_settings",1,pick(req.body||{},["seo_title","meta_description","seo_keywords","favicon"])); res.json({ok:true}); }));
app.get("/api/store/blog",asyncHandler(async(req,res)=>{ const [items]=await db.query("SELECT * FROM blog_posts WHERE status IS NULL OR status='published' OR status='active' ORDER BY id DESC"); res.json({items}); }));
app.get("/api/store/banners",asyncHandler(async(req,res)=>{ const [items]=await db.query("SELECT * FROM banners ORDER BY id DESC"); res.json({items}); }));
app.get("/api/store/products",asyncHandler(async(req,res)=>{
  await ensureProductFields();
  const [rows]=await db.query("SELECT p.*, c.name AS category_name, s.name AS subcategory_name FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN subcategories s ON s.id=p.subcategory_id WHERE p.status IS NULL OR p.status=1 OR p.status=? ORDER BY p.id DESC",["active"]);
  await repairProductImages(rows);
  res.json({products:rows});
}));
app.get("/api/store/categories",asyncHandler(async(req,res)=>{
  const [categories]=await db.query("SELECT * FROM categories ORDER BY id ASC");
  let subcategories=[];
  try{[subcategories]=await db.query("SELECT * FROM subcategories ORDER BY id ASC");}catch{}
  res.json({categories,subcategories});
}));
async function ensureOrders(){
 await db.query("CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, order_number VARCHAR(40) NULL, customer_name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(100) NOT NULL, address VARCHAR(500) NOT NULL, city VARCHAR(150) NOT NULL, state VARCHAR(150) NOT NULL, postal_code VARCHAR(20) NOT NULL, items LONGTEXT NOT NULL, total DECIMAL(12,2) NOT NULL DEFAULT 0, payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash on Delivery', status VARCHAR(40) NOT NULL DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
 const defs={order_number:"VARCHAR(40) NULL",customer_name:"VARCHAR(255) NOT NULL DEFAULT ''",email:"VARCHAR(255) NOT NULL DEFAULT ''",phone:"VARCHAR(100) NOT NULL DEFAULT ''",address:"VARCHAR(500) NOT NULL DEFAULT ''",city:"VARCHAR(150) NOT NULL DEFAULT ''",state:"VARCHAR(150) NOT NULL DEFAULT ''",postal_code:"VARCHAR(20) NOT NULL DEFAULT ''",items:"LONGTEXT NULL",payment_method:"VARCHAR(50) NOT NULL DEFAULT 'Cash on Delivery'",status:"VARCHAR(40) NOT NULL DEFAULT 'pending'"};
 const existing=new Set(await columns("orders"));
 for(const [name,type] of Object.entries(defs))if(!existing.has(name))await db.query("ALTER TABLE orders ADD COLUMN `"+name+"` "+type);
}
app.post("/api/store/orders",asyncHandler(async(req,res)=>{
 const body=req.body||{},customer=body.customer||{},shipping=body.shipping||{},items=Array.isArray(body.items)?body.items:[];
 const name=String(customer.name||"").trim(),email=String(customer.email||"").trim(),phone=String(customer.phone||"").trim();
 const address=String(shipping.address||"").trim(),city=String(shipping.city||"").trim(),state=String(shipping.state||"").trim(),postal=String(shipping.postal_code||"").trim();
 if(!name||!email||!phone||!address||!city||!state||!postal)return res.status(400).json({message:"Please complete all contact and delivery details."});
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({message:"Please enter a valid email address."});
 if(!items.length)return res.status(400).json({message:"Your cart is empty."});
 const cleanItems=items.map(x=>({id:String(x.id||""),name:String(x.name||"Product").slice(0,255),price:Number(x.price),qty:Math.floor(Number(x.qty)||1)}));
 if(cleanItems.some(x=>!Number.isFinite(x.price)||x.price<0||x.qty<1||x.qty>99))return res.status(400).json({message:"One or more cart items are invalid. Please review your cart."});
 const total=cleanItems.reduce((sum,x)=>sum+x.price*x.qty,0);
 if(!Number.isFinite(total)||total<=0)return res.status(400).json({message:"Order total is invalid."});
 await ensureOrders();
 const orderNumber="BH"+Date.now().toString().slice(-10);
 const data={order_number:orderNumber,customer_name:name,email,phone,address,city,state,postal_code:postal,items:JSON.stringify(cleanItems),total,payment_method:"Cash on Delivery",status:"pending"};
 const allowed=new Set(await columns("orders")),keys=Object.keys(data).filter(k=>allowed.has(k));
 const [result]=await db.query("INSERT INTO orders ("+keys.map(k=>"`"+k+"`").join(",")+") VALUES ("+keys.map(()=>"?").join(",")+")",keys.map(k=>data[k]));
 let emailSent=false;
 try{
  emailSent=await sendOrderConfirmation({email,name,orderNumber,total,items:cleanItems,address,city,state,postal});
 }catch(mailError){
  console.error("Order saved but customer confirmation email failed:",mailError.message);
 }
 res.status(201).json({ok:true,order:{id:result.insertId,order_number:orderNumber,total,status:"pending",emailSent}});
}));
// Admin-only SMTP diagnostic: never returns credentials.
app.get("/api/admin/email-status",auth,asyncHandler(async(req,res)=>{
 const configured={
  host:Boolean(process.env.SMTP_HOST||"smtp.hostinger.com"),
  user:Boolean(process.env.SMTP_USER),
  password:Boolean(process.env.SMTP_PASS),
  from:Boolean(process.env.MAIL_FROM||process.env.SMTP_USER)
 };
 if(!configured.user||!configured.password){
  return res.status(200).json({configured:false,verified:false,missing:["SMTP_USER","SMTP_PASS"].filter(k=>!process.env[k]),message:"Add the SMTP mailbox username and password in Hostinger environment variables, then restart/redeploy the app."});
 }
 try{
  const nodemailer=(await import("nodemailer")).default;
  const port=Number(process.env.SMTP_PORT||465);
  const transporter=nodemailer.createTransport({
   host:process.env.SMTP_HOST||"smtp.hostinger.com",
   port,
   secure:process.env.SMTP_SECURE?process.env.SMTP_SECURE==="true":port===465,
   auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},
   connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000
  });
  await transporter.verify();
  return res.json({configured:true,verified:true,message:"SMTP connection verified. New orders can send confirmation emails."});
 }catch(error){
  console.error("SMTP diagnostic failed:",error.message);
  return res.status(200).json({configured:true,verified:false,message:"SMTP connection failed. Check Hostinger mailbox credentials, SMTP host/port, and mailbox status."});
 }
}));
app.get("/api/store/settings",asyncHandler(async(req,res)=>{
  await ensureSettings();
  const [rows]=await db.query("SELECT * FROM store_settings WHERE id=1 LIMIT 1");
  res.json({settings:rows[0]||{}});
}));

app.use((err,req,res,next)=>{
  console.error(err);
  res.status(500).json({message:"Server error",detail:process.env.NODE_ENV==="development"?err.message:undefined});
});

const dist=path.resolve(__dirname,"../dist");
app.use(express.static(dist));
app.get("*",(req,res)=>res.sendFile(path.join(dist,"index.html")));

app.listen(PORT,async()=>{
  try{await ensureProductFields();await ensureSettings();await ensureOrders();await ensureFurnitureTaxonomy();await ensureMegaMenuCleanup();await ensureBedroomMenuTaxonomy();await ensureDiningSetsMenuTaxonomy();console.log("Store settings, orders and furniture taxonomy ready");}catch(e){console.error("Store setup failed:",e.message);}
  console.log("Balaji Handicraft server running on port "+PORT);
});
