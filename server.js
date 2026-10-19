import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();
const app=express(); const PORT=process.env.PORT||5000;
const __dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(cors()); app.use(express.json({limit:'100kb'}));
app.use(express.static(path.join(__dirname,'public')));
const titleSchema = new mongoose.Schema({name:{type:String,required:true,trim:true},duration:{type:Number,required:true,min:1},genres:{type:[String],default:[]},moods:{type:[String],default:[]},languages:{type:[String],default:[]},audience:{type:String,enum:['kids','family','teen','adult'],required:true},rating:{type:String,default:'U'},emoji:String,colors:{type:[String],default:['#496f82','#b8dce8']},description:String,videoUrl:{type:String,required:true},thumbnailUrl:{type:String,default:''},provider:{type:String,default:'other'}},{timestamps:true});
const Title=mongoose.model('Title',titleSchema);
function match(values,want){return want?(values||[]).includes(want)?1:.15:.5}
function score(t,p){const time=t.duration<=p.minutes?1:Math.max(0,1-(t.duration-p.minutes)/Math.max(p.minutes,1));const audience=t.audience===p.audience?1:(p.audience==='family'&&t.audience==='kids'?.8:.2);return time*.25+match(t.genres,p.genre)*.2+match(t.moods,p.mood)*.15+match(t.languages,p.language)*.15+audience*.15+.1}
function explain(t,p){const r=[];if(t.duration<=p.minutes)r.push(`${t.duration} minutes`);if(t.genres?.includes(p.genre))r.push(`${p.genre} genre`);if(t.moods?.includes(p.mood))r.push(`${p.mood} mood`);if(t.languages?.includes(p.language))r.push(`${p.language} audio`);if(t.audience===p.audience)r.push('right for your audience');return r.length?`Matches: ${r.join(', ')}.`:'A balanced match for your request.'}
app.get('/api/health',(_,res)=>res.json({ok:true,service:'fire-tv-just-play'}));
app.get('/api/titles',async(_,res)=>{try{res.json({titles:await Title.find().limit(200).lean()})}catch(e){res.status(500).json({error:'Could not load titles'})}});
app.post('/api/recommendations',async(req,res)=>{try{const p={minutes:Number(req.body.minutes)||45,mood:req.body.mood,audience:req.body.audience,language:req.body.language,genre:req.body.genre};const budget=req.body.budget||'three';const list=(await Title.find().limit(200).lean()).map(t=>({...t,score:score(t,p),why:explain(t,p)})).sort((a,b)=>b.score-a.score);res.json({recommendations:list.slice(0,budget==='three'?3:1),privacy:'session-only'})}catch(e){console.error(e);res.status(500).json({error:'Could not create recommendations'})}});
app.get('*',(_,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
async function start(){if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is missing. Add it as an environment variable.');await mongoose.connect(process.env.MONGODB_URI);console.log('MongoDB connected');app.listen(PORT,()=>console.log(`http://localhost:${PORT}`))}start().catch(e=>{console.error(e.message);process.exit(1)});