// Rendert één staande Kadoly-video (1080x1920, 12 s) uit productfoto's met tekstregels (zelfde opmaak als de eerste video's van 17 nov 2026).
// Tekst gaat als doorzichtige PNG-laag (@vercel/og met Poppins Bold), omdat ffmpeg-static geen drawtext heeft.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImageResponse } from '@vercel/og';

const W = 1080, H = 1920, FPS = 30, DUUR = 12;
const HIER = dirname(fileURLToPath(import.meta.url));
let FONT = null;
const font = () => FONT || (FONT = readFileSync(join(HIER, 'Poppins-Bold.ttf')));
const el = (type, style, children) => ({ type, props: { style: Object.assign({ display: 'flex' }, style), children } });

// één laag per tekstregel: regel 0 bovenin, de rest onderin (binnen het veilige vlak van TikTok en Reels), merk klein onderaan
async function laag(tekst, boven) {
  const blok = el('div', { background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 60, fontFamily: 'Poppins', lineHeight: 1.3, padding: '14px 26px', borderRadius: 12, maxWidth: 940, textAlign: 'center', justifyContent: 'center' }, tekst);
  const merk = el('div', { position: 'absolute', bottom: 160, left: 0, width: W, justifyContent: 'center' }, [el('div', { background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.92)', fontSize: 40, fontFamily: 'Poppins', padding: '8px 18px', borderRadius: 10 }, 'kadoly.com')]);
  const plek = boven ? { position: 'absolute', top: 150, left: 0, width: W, justifyContent: 'center' } : { position: 'absolute', bottom: 380, left: 0, width: W, justifyContent: 'center' };
  const r = new ImageResponse(el('div', { width: W, height: H, position: 'relative' }, [el('div', plek, [blok]), merk]), { width: W, height: H, fonts: [{ name: 'Poppins', data: font(), weight: 700, style: 'normal' }] });
  return Buffer.from(await r.arrayBuffer());
}

function draai(bin, args) {
  return new Promise((ok, nee) => { const p = spawn(bin, args); let err = ''; p.stderr.on('data', d => { err = (err + d).slice(-3000); }); p.on('error', nee); p.on('close', c => c === 0 ? ok() : nee(new Error('ffmpeg ' + c + ': ' + err.slice(-600)))); });
}

// spec: { fotos: [url|Buffer], regels: [tekst] } → mp4 als Buffer
export async function maakVideo(spec, ffmpeg) {
  const map = await mkdtemp(join(tmpdir(), 'kv-'));
  try {
    const fotos = [];
    for (let i = 0; i < spec.fotos.length; i++) {
      let b = spec.fotos[i];
      if (typeof b === 'string') { const r = await fetch(b, { signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error('foto ' + r.status + ' ' + b); b = Buffer.from(await r.arrayBuffer()); }
      const f = join(map, 'f' + i + '.jpg'); await writeFile(f, b); fotos.push(f);
    }
    const regels = spec.regels.slice(0, fotos.length), lagen = [];
    for (let j = 0; j < regels.length; j++) { const f = join(map, 'l' + j + '.png'); await writeFile(f, await laag(regels[j], j === 0)); lagen.push(f); }
    const n = fotos.length, per = DUUR / n, args = ['-loglevel', 'error', '-y'], filt = [];
    for (const f of fotos) args.push('-loop', '1', '-t', (per + 0.6).toFixed(2), '-i', f);
    for (const f of lagen) args.push('-loop', '1', '-t', String(DUUR), '-i', f);
    args.push('-f', 'lavfi', '-t', String(DUUR), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
    for (let i = 0; i < n; i++) {
      const frames = Math.round((per + 0.6) * FPS);
      filt.push(`[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=30:2,eq=brightness=-0.08[bg${i}];` +
        `[${i}:v]scale=${W}:1350:force_original_aspect_ratio=decrease,pad=${W}:1350:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,zoompan=z='min(1.0+0.0009*on,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x1350:fps=${FPS}[fg${i}];` +
        `[bg${i}][fg${i}]overlay=0:285,format=yuv420p,trim=duration=${(per + 0.6).toFixed(2)},setpts=PTS-STARTPTS[v${i}]`);
    }
    let keten = 'v0';
    for (let i = 1; i < n; i++) { filt.push(`[${keten}][v${i}]xfade=transition=fade:duration=0.6:offset=${(per * i - 0.3 * i).toFixed(2)}[x${i}]`); keten = 'x' + i; }
    for (let j = 0; j < lagen.length; j++) { const a = (DUUR / lagen.length * j).toFixed(2), b = (DUUR / lagen.length * (j + 1)).toFixed(2); filt.push(`[${keten}][${n + j}:v]overlay=0:0:enable='between(t,${a},${b})'[o${j}]`); keten = 'o' + j; }
    filt.push(`[${keten}]trim=duration=${DUUR},setpts=PTS-STARTPTS,format=yuv420p[uit]`);
    const uit = join(map, 'uit.mp4');
    args.push('-filter_complex', filt.join(';'), '-map', '[uit]', '-map', `${n + lagen.length}:a`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart', uit);
    await draai(ffmpeg, args);
    return await readFile(uit);
  } finally { await rm(map, { recursive: true, force: true }).catch(() => {}); }
}
