import express from "express";
import path from "path";
import {fileURLToPath} from "url";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

dotenv.config();

const app=express();
app.use(express.json({limit:"2mb"}));

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

app.get("/api/store/products",asyncHandler(async(req,res)=>{
  const [rows]=await db.query("SELECT * FROM products WHERE status IS NULL OR status=1 OR status='active' ORDER BY id DESC");
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

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const dist=path.resolve(__dirname,"../dist");
app.use(express.static(dist));
app.get("*",(req,res)=>res.sendFile(path.join(dist,"index.html")));

app.listen(PORT,async()=>{
  try{await ensureSettings();console.log("Store settings ready");}catch(e){console.error("Settings table setup failed:",e.message);}
  console.log("Balaji Handicraft server running on port "+PORT);
});
