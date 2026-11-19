import { chromium } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
const b=await chromium.launch(); const c=await b.newContext({viewport:{width:1440,height:1000}}); const p=await c.newPage();
for(const route of ['/','/calculators/hourly-rate-calculator/','/generators/invoice-generator/','/uk/vat-invoice-generator/','/calculators/','/generators/','/countries/','/about/','/privacy/','/404']){
  await p.goto('http://localhost:4321'+route,{waitUntil:'networkidle'}); await p.waitForTimeout(600);
  const res=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  console.log(route, res.violations.length, res.violations.map(v=>v.id+':'+v.nodes.length).join(', '));
}
await b.close();



