/* eslint-disable no-undef */
import { chromium } from '@playwright/test';
const b=await chromium.launch(); const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await c.newPage(); const cdp=await c.newCDPSession(p);
await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8}); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.addInitScript(()=>{window.__events=[]; new PerformanceObserver(list=>{for(const e of list.getEntries()){if(['keydown','click','pointerdown'].includes(e.name)) window.__events.push({name:e.name,dur:Math.round(e.duration)})}}).observe({type:'event',buffered:true,durationThreshold:16});});
await p.goto('http://localhost:4321/calculators/hourly-rate-calculator/',{waitUntil:'load'}); await p.waitForTimeout(1200);
await p.locator('#targetIncome').click(); await p.keyboard.type('90000'); await p.getByRole('button',{name:'Calculate rate'}).click(); await p.waitForTimeout(500);
const ev=await p.evaluate(()=>window.__events); console.log(JSON.stringify({max:Math.max(...ev.map(e=>e.dur)),events:ev.slice(-12)},null,2)); await b.close();

