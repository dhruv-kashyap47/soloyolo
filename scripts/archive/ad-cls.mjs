/* eslint-disable no-undef */
import { chromium } from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:4321/',{waitUntil:'networkidle'}); await p.waitForTimeout(800);
await p.evaluate(()=>{window.__cls=0; new PerformanceObserver(list=>{for(const e of list.getEntries()){if(!e.hadRecentInput) window.__cls+=e.value}}).observe({type:'layout-shift',buffered:true});});
const before=await p.evaluate(()=>[...document.querySelectorAll('.ad-slot')].map(el=>{const r=el.getBoundingClientRect();return {slot:el.dataset.slot,top:Math.round(r.top+scrollY),h:Math.round(r.height)}}));
await p.evaluate(()=>{document.querySelectorAll('.ad-slot').forEach((slot,i)=>{const d=document.createElement('div'); d.style.height=(i%2?240:160)+'px'; d.style.borderRadius='12px'; d.style.background='#111'; d.style.marginTop='18px'; d.textContent='Mock creative'; slot.appendChild(d);});});
await p.waitForTimeout(800);
const after=await p.evaluate(()=>({cls:window.__cls,slots:[...document.querySelectorAll('.ad-slot')].map(el=>{const r=el.getBoundingClientRect();return {slot:el.dataset.slot,top:Math.round(r.top+scrollY),h:Math.round(r.height)}})}));
console.log(JSON.stringify({before,after},null,2)); await b.close();

