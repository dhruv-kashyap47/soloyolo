/* eslint-disable no-undef */
import { chromium } from '@playwright/test';
const b=await chromium.launch(); const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await c.newPage(); const cdp=await c.newCDPSession(p);
await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8}); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.addInitScript(()=>{window.__events=[]; new PerformanceObserver(list=>{for(const e of list.getEntries()){if(e.name==='pointerdown'||e.name==='pointerup'||e.name==='click'||e.name==='keydown') window.__events.push({name:e.name,dur:Math.round(e.duration),start:Math.round(e.startTime)})}}).observe({type:'event',buffered:true,durationThreshold:16});});
await p.goto('http://localhost:4321/',{waitUntil:'load'}); await p.waitForTimeout(1200);
await p.getByRole('button',{name:/Pause motion/i}).first().click();
await p.waitForTimeout(400);
await p.getByRole('button',{name:'Search tools'}).first().click();
await p.waitForTimeout(600);
console.log(JSON.stringify(await p.evaluate(()=>window.__events),null,2));
await b.close();

