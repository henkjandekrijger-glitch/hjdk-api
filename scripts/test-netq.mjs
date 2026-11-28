// test netwerkmacro's in de Clickmind-link: node scripts/test-netq.mjs
import { netQ } from '../lib/mensmeter.js';
let f = 0; const ja = (c, t) => { console.log((c ? 'ok   ' : 'FOUT ') + t); if (!c) f++; };
const u = new URLSearchParams('xsz=4455&xpr=0.0021&xact=high&xzt={zone_type}&xdev=SM-A145F&xcat=${SITE_CATEGORY}&z=123');
const o = netQ(k => u.get(k));
ja(o.subzone === '4455' && o.cost === '0.0021' && o.activity === 'high' && o.device === 'SM-A145F', 'ingevulde macro\'s komen mee');
ja(!('zonetype' in o) && !('sitecat' in o), 'niet ingevulde macro\'s vallen weg');
ja(netQ(k => null) === null, 'zonder macro\'s niets');
process.exit(f ? 1 : 0);
