/* eslint-disable no-undef */
import { chromium } from '@playwright/test';
const b=await chromium.launch();
const c=await b.newContext({viewport:{width:390,height:844}}); const p=await c.newPage();
await p.goto('http://localhost:4321/',{waitUntil:'networkidle'}); await p.waitForTimeout(500);
await p.evaluate(() => document.body.focus());
await p.keyboard.press('Tab');
console.log('first focus', await p.evaluate(()=>{const el=document.activeElement; const r=el.getBoundingClientRect(); return {tag:el.tagName,text:(el.textContent||'').trim().slice(0,30),top:Math.round(r.top),visible:r.top>=0&&r.height>0,outline:getComputedStyle(el).outlineWidth};}));
await p.getByRole('button',{name:'Open menu'}).click();
console.log('menu open', await p.evaluate(()=>({expanded:document.getElementById('menu-toggle').getAttribute('aria-expanded'),focus:(document.activeElement.textContent||'').trim().slice(0,20)})));
await p.keyboard.press('Escape');
console.log('menu closed', await p.evaluate(()=>({expanded:document.getElementById('menu-toggle').getAttribute('aria-expanded'),focus:(document.activeElement.getAttribute('aria-label')||document.activeElement.textContent||'').trim().slice(0,30)})));
await p.keyboard.press('Control+k'); await p.waitForTimeout(500);
console.log('palette', await p.evaluate(()=>({open:!!document.querySelector('[role="dialog"]'),focus:(document.activeElement.getAttribute('placeholder')||document.activeElement.tagName)})));
await p.keyboard.press('Escape');
await b.close();


