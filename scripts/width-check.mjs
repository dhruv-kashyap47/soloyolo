/* eslint-disable no-undef */
import { chromium } from '@playwright/test';
const b=await chromium.launch();
for(const w of [320,375,768,1024,1440,1920,2560]){
  const c=await b.newContext({viewport:{width:w,height:900}}); const p=await c.newPage();
  await p.goto('http://localhost:4321/',{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  const home=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth, h1:document.querySelector('h1')?.getBoundingClientRect().width, dock:document.querySelector('.dock-grid')?.getBoundingClientRect().width}));
  await p.goto('http://localhost:4321/calculators/hourly-rate-calculator/',{waitUntil:'networkidle'}); await p.waitForTimeout(300);
  const tool=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth}));
  console.log(w, home, tool); await c.close();
}
await b.close();

