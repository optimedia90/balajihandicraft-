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
const uploadDir=path.join(__dirname,"uploads");
fs.mkdirSync(uploadDir,{recursive:true});
const upload=multer({dest:uploadDir,limits:{fileSize:50*1024*1024}});
app.use(express.json({limit:"20mb"}));
app.use("/uploads",express.static(uploadDir));

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
  const defs={category_id:"INT NULL",subcategory_id:"INT NULL",short_description:"TEXT",brand:"VARCHAR(255)",material:"VARCHAR(255)",tags:"VARCHAR(1000)",video:"VARCHAR(500)",image_2:"VARCHAR(500)",image_3:"VARCHAR(500)",image_4:"VARCHAR(500)",image_5:"VARCHAR(500)",length_in:"DECIMAL(10,2)",width_in:"DECIMAL(10,2)",height_in:"DECIMAL(10,2)",length_cm:"DECIMAL(10,2)",width_cm:"DECIMAL(10,2)",height_cm:"DECIMAL(10,2)",weight_kg:"DECIMAL(10,2)",color:"VARCHAR(255)",finish:"VARCHAR(255)",care_instructions:"TEXT",assembly_info:"TEXT",featured:"TINYINT(1) DEFAULT 0",best_seller:"TINYINT(1) DEFAULT 0",new_arrival:"TINYINT(1) DEFAULT 0",seo_title:"VARCHAR(255)",meta_description:"VARCHAR(500)",slug:"VARCHAR(255)"};
  const existing=new Set(await columns("products"));
  for(const [name,type] of Object.entries(defs)) if(!existing.has(name)) await db.query("ALTER TABLE products ADD COLUMN "+name+" "+type);
}

async function ensureSettings(){
  await db.query("CREATE TABLE IF NOT EXISTS store_settings (id INT PRIMARY KEY DEFAULT 1, store_name VARCHAR(255) NOT NULL DEFAULT 'Balaji Handicraft', currency VARCHAR(10) NOT NULL DEFAULT 'INR', shipping_threshold DECIMAL(12,2) NOT NULL DEFAULT 42000, phone VARCHAR(100) DEFAULT '', email VARCHAR(255) DEFAULT '', address VARCHAR(500) DEFAULT '', announcement VARCHAR(500) DEFAULT 'Free shipping on orders over ₹42,000') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  await db.query("INSERT IGNORE INTO store_settings (id) VALUES (1)");
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
  const [rows]=await db.query("SELECT * FROM products ORDER BY id DESC");
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
  const groups=new Map();
  for(const row of rows){
    const handle=String(row.Handle||row["Variant SKU"]||row.Title||"").trim();
    if(!handle)continue;
    if(!groups.has(handle))groups.set(handle,{first:row,images:[]});
    const g=groups.get(handle);
    if(row["Image Src"]&&String(row["Image Src"]).trim()&&!g.images.includes(String(row["Image Src"]).trim()))g.images.push(String(row["Image Src"]).trim());
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
        if(table==="categories"){
          const [r]=await connection.query("INSERT INTO categories (name,slug) VALUES (?,?)",[name,slug]);
          return r.insertId;
        }
        const [r]=await connection.query("INSERT INTO subcategories (category_id,name,slug) VALUES (?,?,?)",[parentId,name,slug]);
        return r.insertId;
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
        slug:String(first.Handle||name).trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")
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
        await connection.query("INSERT INTO products ("+keys.map(k=>"`"+k+"`").join(",")+") VALUES ("+keys.map(()=>"?").join(",")+")",keys.map(k=>data[k]));
        created++;
      }
    }
    await connection.commit();
    res.json({ok:true,rows:rows.length,products:groups.size,created,updated,skipped});
  }catch(err){await connection.rollback();res.status(400).json({message:"Bulk import failed: "+(err.message||"Database import error")});return}
  finally{connection.release()}
}));

app.post("/api/admin/products",auth,asyncHandler(async(req,res)=>{
  const cols=await columns("products");
  const body=pick(req.body||{},cols.filter(c=>c!=="id"&&c!=="created_at"&&c!=="updated_at"));
  if(!body.name)return res.status(400).json({message:"Product name is required"});
  const keys=Object.keys(body);
  const quoted=keys.map(k=>"\`"+k+"\`").join(",");
  const sql="INSERT INTO products ("+quoted+") VALUES ("+keys.map(()=>"?").join(",")+")";
  const [result]=await db.query(sql,keys.map(k=>body[k]));
  res.status(201).json({id:result.insertId});
}));
app.put("/api/admin/products/:id",auth,asyncHandler(async(req,res)=>{
  const cols=await columns("products");
  const body=pick(req.body||{},cols.filter(c=>c!=="id"&&c!=="created_at"&&c!=="updated_at"));
  const keys=Object.keys(body);
  if(!keys.length)return res.status(400).json({message:"No changes supplied"});
  const sql="UPDATE products SET "+keys.map(k=>"\`"+k+"\`=?").join(",")+" WHERE id=?";
  await db.query(sql,[...keys.map(k=>body[k]),req.params.id]);
  res.json({ok:true});
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
  await db.query("DELETE FROM subcategories WHERE id=?",[req.params.id]);
  res.json({ok:true});
}));
app.delete("/api/admin/categories/:id",auth,asyncHandler(async(req,res)=>{
  await db.query("DELETE FROM categories WHERE id=?",[req.params.id]);
  res.json({ok:true});
}));

app.get("/api/admin/orders",auth,asyncHandler(async(req,res)=>{
  const [rows]=await db.query("SELECT * FROM orders ORDER BY id DESC LIMIT 100");
  res.json({orders:rows});
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
  const [rows]=await db.query("SELECT p.*, c.name AS category_name, s.name AS subcategory_name FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN subcategories s ON s.id=p.subcategory_id WHERE p.status IS NULL OR p.status=1 OR p.status=\'active\' ORDER BY p.id DESC");
  res.json({products:rows});
}));
app.get("/api/store/categories",asyncHandler(async(req,res)=>{
  const [categories]=await db.query("SELECT * FROM categories ORDER BY id ASC");
  let subcategories=[];
  try{[subcategories]=await db.query("SELECT * FROM subcategories ORDER BY id ASC");}catch{}
  res.json({categories,subcategories});
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
  try{await ensureProductFields();await ensureSettings();console.log("Store settings ready");}catch(e){console.error("Settings table setup failed:",e.message);}
  console.log("Balaji Handicraft server running on port "+PORT);
});
