// Uitlegvideo voor Kadoly (Henkjan 26 nov 2026: "4 platformen iedere dag mix van nuttig en gewoon product hq vids kort .
// Altijd links en CTAs niks intypen zorg dat CM er tussen zit"). Werkwijze: kadoly/video-uitleg.md.
// Gebruik (vanuit de hoofdmap van de repo, zodat @vercel/og en sharp gevonden worden):
//   node scripts/uitlegvideo/maak.mjs <spec.json> <stem.json> <muziek.json> <fotos.json> <uitmap>
// stem/muziek/fotos = opgeslagen antwoorden van /api/shop?op=stem, op=muziek en op=fotob64 (ruwe JSON of de web_fetch-omhulling).
// Uit: <uitmap>/<id>-bio.mp4 (TikTok, Instagram), -link.mp4 (YouTube, Facebook), -pin.mp4 (Pinterest), 1080x1920, 30 fps.
import { ImageResponse } from '@vercel/og';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { INTER_500, INTER_800 } from '../../lib/pinfont.js';

const [specF, stemF, muziekF, fotoF, UIT] = process.argv.slice(2);
if (!UIT) { console.error('gebruik: maak.mjs spec.json stem.json muziek.json fotos.json uitmap'); process.exit(1); }
const lees = f => { let j = JSON.parse(fs.readFileSync(f, 'utf8')); if (Array.isArray(j) && j[0] && j[0].text) j = JSON.parse(j[0].text); if (j && typeof j.text === 'string' && 'status' in j) j = JSON.parse(j.text); return j; };
const spec = JSON.parse(fs.readFileSync(specF, 'utf8')), stem = lees(stemF), muziek = lees(muziekF), fotos = lees(fotoF);
const W = 1080, H = 1920, INK = '#0b1620', BLAUW = '#1D9BF0', WARM = '#FFB347', WIT = '#ffffff', ZACHT = '#c9d6e2';
const F = [{ name: 'Inter', data: Buffer.from(INTER_500, 'base64'), weight: 500, style: 'normal' }, { name: 'Inter', data: Buffer.from(INTER_800, 'base64'), weight: 800, style: 'normal' }];
const h = (t, s, c) => ({ type: t, props: { style: Object.assign({ display: 'flex' }, s), children: c } });
const D = path.join(UIT, 'w') + '/'; fs.mkdirSync(D, { recursive: true });
const sh = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: 'inherit' });
const duur = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const geen = x => /[–—]/.test(x); // geen gedachtestreepjes

const mark = { type: 'svg', props: { width: 84, height: 84, viewBox: '0 0 34 34', children: [{ type: 'rect', props: { width: 34, height: 34, rx: 9, fill: BLAUW } }, { type: 'path', props: { d: 'M9 13h14M19 9l4 4-4 4', stroke: '#fff', strokeWidth: 2.3, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } }, { type: 'path', props: { d: 'M25 21H11M15 25l-4-4 4-4', stroke: '#D6ECFC', strokeWidth: 2.3, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } }] } };
const merk = h('div', { alignItems: 'center', position: 'absolute', top: 120, left: 90 }, [mark, h('div', { fontSize: 44, fontWeight: 800, color: WIT, marginLeft: 22 }, 'kadoly')]);
const kleur = a => a === 'warm' ? WARM : a === 'rood' ? '#FF6B5E' : BLAUW;
function kaart({ nr, kicker, titel, tekst, bron, accent }, deel) {
  const ac = kleur(accent), blok = [];
  if (nr) blok.push(h('div', { width: 160, height: 160, borderRadius: 80, background: ac, alignItems: 'center', justifyContent: 'center', fontSize: 96, fontWeight: 800, color: INK, marginBottom: 64 }, String(nr)));
  if (kicker) blok.push(h('div', { fontSize: 42, fontWeight: 800, color: ac, letterSpacing: 3, marginBottom: 36 }, kicker.toUpperCase()));
  blok.push(h('div', { fontSize: titel.length > 34 ? 100 : 116, fontWeight: 800, color: WIT, lineHeight: 1.08 }, titel));
  if (tekst) blok.push(h('div', { opacity: deel === 'B' ? 1 : 0, fontSize: 60, fontWeight: 500, color: ZACHT, lineHeight: 1.35, marginTop: 60 }, tekst));
  if (bron) blok.push(h('div', { opacity: deel === 'B' ? 1 : 0, fontSize: 38, fontWeight: 500, color: ZACHT, marginTop: 70, borderTop: '3px solid #22344a', paddingTop: 28 }, 'Bron: ' + bron));
  return h('div', { width: W, height: H, background: INK, fontFamily: 'Inter', position: 'relative' }, [merk, h('div', { position: 'absolute', top: 0, left: 90, width: 900, height: H, paddingBottom: 260, flexDirection: 'column', justifyContent: 'center' }, blok)]);
}
async function producten(p, deel) {
  const tegels = [];
  for (const it of p.items.slice(0, 4)) { const b = fotos[it.pid]; if (!b || /^fout/.test(b)) continue;
    const src = 'data:image/jpeg;base64,' + (await sharp(Buffer.from(b, 'base64')).resize(400, 400, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer()).toString('base64');
    tegels.push(h('div', { flexDirection: 'column', width: 430, marginBottom: 30 }, [{ type: 'img', props: { src, width: 430, height: 430, style: { borderRadius: 28 } } }, h('div', { fontSize: 34, fontWeight: 800, color: WIT, marginTop: 16 }, it.naam)])); }
  return h('div', { width: W, height: H, background: INK, fontFamily: 'Inter', position: 'relative' }, [merk, h('div', { position: 'absolute', top: 250, left: 90, width: 900, flexDirection: 'column' }, [
    h('div', { fontSize: 38, fontWeight: 800, color: WARM, letterSpacing: 3, marginBottom: 28 }, (p.kicker || 'UIT DE WINKEL').toUpperCase()),
    h('div', { fontSize: 84, fontWeight: 800, color: WIT, lineHeight: 1.08, marginBottom: 50 }, p.titel),
    h('div', { flexWrap: 'wrap', justifyContent: 'space-between', width: 900, opacity: deel === 'B' ? 1 : 0 }, tegels)])]);
}
function eind(knop) {
  return h('div', { width: W, height: H, background: INK, fontFamily: 'Inter', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 90px' }, [{ ...mark, props: { ...mark.props, width: 220, height: 220 } },
    h('div', { fontSize: 64, fontWeight: 800, color: WIT, marginTop: 70, textAlign: 'center', lineHeight: 1.15 }, spec.eind_kop || 'Hele uitleg met alle bronnen'),
    h('div', { fontSize: 60, fontWeight: 800, color: INK, background: WIT, borderRadius: 999, padding: '34px 64px', marginTop: 56, textAlign: 'center' }, knop),
    h('div', { fontSize: 40, fontWeight: 500, color: ZACHT, marginTop: 60, textAlign: 'center' }, 'Volg Kadoly voor elke dag een korte uitleg')]);
}
const png = async (el, f) => fs.writeFileSync(D + f, Buffer.from(await new ImageResponse(el, { width: W, height: H, fonts: F }).arrayBuffer()));

// controle vooraf
const scenes = spec.scenes || [];
const vos = scenes.map(s => s.vo).concat(spec.producten ? [spec.producten.vo] : [], [spec.eind_vo || 'Tik op de link. Daar staat de hele uitleg, met alle bronnen.']);
const audio = (stem && stem.audio) || [];
if (audio.length !== vos.length) { console.error('stem.json heeft ' + audio.length + ' regels, spec vraagt ' + vos.length + ' (scenes, producten, eind; in die volgorde)'); process.exit(2); }
for (const s of scenes) for (const v of [s.titel, s.tekst, s.kicker, s.vo]) if (v && geen(v)) { console.error('gedachtestreepje in: ' + v); process.exit(3); }
if (!muziek || !muziek.audio) { console.error('geen muziek'); process.exit(4); }

// stem per regel, stilte eraf, en duur per scene
const D_ = [];
for (let i = 0; i < audio.length; i++) { fs.writeFileSync(D + 'vo' + i + '.mp3', Buffer.from(audio[i], 'base64'));
  sh('-i', D + 'vo' + i + '.mp3', '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', '-ac', '2', D + 'vt' + i + '.wav');
  D_.push(Math.round(Math.max(i === audio.length - 1 ? 5.5 : 3.5, duur(D + "vt" + i + ".wav") + 0.9) * 100) / 100); }
fs.writeFileSync(D + 'muziek.mp3', Buffer.from(muziek.audio, 'base64'));

// beelden
const ids = [];
for (let i = 0; i < scenes.length; i++) { const id = 's' + String(i + 1).padStart(2, '0'); await png(kaart(scenes[i], 'A'), id + 'A.png'); await png(kaart(scenes[i], 'B'), id + 'B.png'); ids.push(id); }
if (spec.producten) { await png(await producten(spec.producten, 'A'), 'spA.png'); await png(await producten(spec.producten, 'B'), 'spB.png'); ids.push('sp'); }
const KNOP = { bio: 'Tik op de link in ons profiel', link: 'Tik op de link hieronder', pin: 'Tik op de pin' };
for (const [p, k] of Object.entries(KNOP)) { await png(eind(k), 'e' + p + 'A.png'); await png(eind(k), 'e' + p + 'B.png'); }

// per scene een bestand, zachte overgang A naar B en langzaam inzoomen
const enc = (id, d, extra) => { const n = Math.round(d * 30); const tmp = D + 'tmp_' + id + '.mp4';
  sh('-framerate', '30', '-i', D + id + 'A.png', '-framerate', '30', '-i', D + id + 'B.png', '-filter_complex', `[0]format=yuv420p,loop=-1:1,trim=duration=1.2,setpts=PTS-STARTPTS[a];[1]format=yuv420p,loop=-1:1,trim=duration=${d},setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=0.4:offset=0.6,trim=duration=${d},scale=2160:3840,zoompan=z='1+0.035*on/${n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30${extra},format=yuv420p[v]`, '-map', '[v]', '-c:v', 'libx264', '-crf', '21', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', '30', tmp);
  fs.renameSync(tmp, D + id + '.mp4'); };
ids.forEach((id, i) => enc(id, D_[i], i === 0 ? ',fade=t=in:st=0:d=0.3' : ''));
const dl = D_[D_.length - 1];
for (const p of Object.keys(KNOP)) enc('e' + p, dl, `,fade=t=out:st=${(dl - 0.6).toFixed(2)}:d=0.6`);

// geluid: elke stemregel aan het begin van zijn scene, muziek eronder en zachter waar gesproken wordt
const tot = Math.round(D_.reduce((a, b) => a + b, 0) * 100) / 100; let t = 0; const ins = [], fl = [];
D_.forEach((d, i) => { const ms = Math.round((t + 0.2) * 1000); ins.push('-i', D + 'vt' + i + '.wav'); fl.push(`[${i}]adelay=${ms}|${ms}[v${i}]`); t += d; });
const n = D_.length;
sh(...ins, '-i', D + 'muziek.mp3', '-filter_complex', fl.join(';') + ';' + D_.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${n}:normalize=0:duration=longest,apad,atrim=0:${tot}[vo];[vo]asplit[vo1][vo2];[${n}]atrim=0:${tot},afade=t=in:st=0:d=1,afade=t=out:st=${(tot - 2).toFixed(2)}:d=2,volume=0.22[m];[m][vo2]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[md];[vo1][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]`, '-map', '[out]', '-ar', '44100', '-c:a', 'aac', '-b:a', '160k', D + 'mix.m4a');

for (const p of Object.keys(KNOP)) {
  fs.writeFileSync(D + 'lijst.txt', ids.concat(['e' + p]).map(i => `file '${D}${i}.mp4'`).join('\n') + '\n');
  sh('-f', 'concat', '-safe', '0', '-i', D + 'lijst.txt', '-c', 'copy', D + 'tmp_v.mp4');
  const uit = path.join(UIT, spec.id + '-' + p + '.mp4');
  sh('-i', D + 'tmp_v.mp4', '-i', D + 'mix.m4a', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', uit + '.tmp.mp4');
  fs.renameSync(uit + '.tmp.mp4', uit); fs.unlinkSync(D + 'tmp_v.mp4');
}
// controlebeelden: midden van scene 1 en het eind, om te bekijken voor het online gaat
sh('-ss', '2', '-i', path.join(UIT, spec.id + '-link.mp4'), '-frames:v', '1', '-vf', 'scale=360:-1', path.join(UIT, spec.id + '-controle1.jpg'));
sh('-ss', String(Math.max(0, tot - 2)), '-i', path.join(UIT, spec.id + '-bio.mp4'), '-frames:v', '1', '-vf', 'scale=360:-1', path.join(UIT, spec.id + '-controle2.jpg'));
console.log(JSON.stringify({ ok: true, id: spec.id, seconden: tot, scenes: D_ }));
