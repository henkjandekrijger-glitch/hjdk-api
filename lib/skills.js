// Skills als bestand in de repo (.claude/skills/<naam>/SKILL.md), zodat ze niet afhangen van een Claude-account.
// Worden meegeleverd via includeFiles in vercel.json en live geserveerd (bijv. /api/zicht?op=skill).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
export function leesSkill(naam) {
  const n = String(naam || '').replace(/[^a-z0-9-]/g, '');
  for (const p of [join(process.cwd(), '.claude', 'skills', n, 'SKILL.md'), new URL('../.claude/skills/' + n + '/SKILL.md', import.meta.url).pathname]) { try { return readFileSync(p, 'utf8'); } catch (e) {} }
  return null;
}
