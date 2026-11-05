// Run explicitly by the owner on a machine with a display and Node.js 24.
// Does not read the existing Chrome profile or any browser credential database.
import { chromium } from 'playwright-core';
import { mkdir,writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin,stdout } from 'node:process';
import { storageState } from '../lib/cm-flipboard.js';
const browser=await chromium.launch({channel:'chrome',headless:false});
try {
 const context=await browser.newContext();const page=await context.newPage();await page.goto('https://flipboard.com/login');
 const rl=createInterface({input:stdin,output:stdout});await rl.question('Log zelf in als Kadoly (@Hnkjn2020). Druk daarna hier op Enter. ');rl.close();
 await page.goto('https://flipboard.com/profile');await page.getByRole('button',{name:/Avatar.*Kadoly/i}).waitFor({timeout:15000});
 const raw=Buffer.from(JSON.stringify(await context.storageState())).toString('base64');
 const own=storageState(raw);const encoded=Buffer.from(JSON.stringify(own)).toString('base64');
 await mkdir('private',{recursive:true,mode:0o700});await writeFile('private/flipboard-production.env','FLIPBOARD_STORAGE_STATE_B64='+encoded+'\n',{mode:0o600,flag:'wx'});
 stdout.write('Serversessie opgeslagen in private/flipboard-production.env. Importeer uitsluitend als gevoelige productievariabele in het eigen Vercel-project. Niet delen in chat of Git.\n');
} finally {await browser.close();}
