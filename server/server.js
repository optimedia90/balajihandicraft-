import express from "express";
import path from "path";
import {fileURLToPath} from "url";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

dotenv.config();

const app=express();
app.use(express.json());

const PORT=process.env.PORT||3000;
const JWT_SECRET=process.env.JWT_SECRET||"change-this-jwt-secret";
const ADMIN_EMAIL=process.env.ADMIN_EMAIL||"admin@balajihandicraft.com";
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"Balaji@Admin2026!";

const db=mysql.createPool({host:process.env.DB_HOST||"localhost",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,database:process.env.DB_NAME,password:process.env.DB_PASSWORD,waitForConnections:true,connectionLimit:10});

app.get("/api/health",(req,res)=>res.json({ok:true,service:"balaji-handicraft-api"}));
app.get("/api/db-health",async(req,res)=>{try{const [rows]=await db.query("SELECT 1 AS ok");res.json({ok:true,database:process.env.DB_NAME,check:rows[0].ok});}catch(e){res.status(500).json({ok:false,message:"Database connection failed"});}});

app.post("/api/admin/login",(req,res)=>{
  const {email,password}=req.body||{};
  if(email===ADMIN_EMAIL && password===ADMIN_PASSWORD){
    const token=jwt.sign({role:"admin",email},JWT_SECRET,{expiresIn:"8h"});
    return res.json({token,user:{email,role:"admin"}});
  }
  return res.status(401).json({message:"Invalid admin email or password"});
});

app.get("/api/admin/me",(req,res)=>{
  const auth=req.headers.authorization||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7):"";
  try{
    const payload=jwt.verify(token,JWT_SECRET);
    if(payload.role!=="admin") throw new Error("Forbidden");
    res.json({user:payload});
  }catch{
    res.status(401).json({message:"Unauthorized"});
  }
});

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const dist=path.resolve(__dirname,"../dist");
app.use(express.static(dist));
app.get("*",(req,res)=>res.sendFile(path.join(dist,"index.html")));

app.listen(PORT,()=>console.log(`Balaji Handicraft server running on port ${PORT}`));
