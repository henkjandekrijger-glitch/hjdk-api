// De wachtrij van gemaakte Kadoly-video's (nieuwste achteraan); de dagtaak social (hjdk-api kadoly/taak-social.md, stap 7b) leest dit.
import { leesLijst } from '../lib/lijst.js';
export default async function handler(req, res) {
  const lijst = await leesLijst();
  res.setHeader('cache-control', 'no-store');
  return res.status(200).json({ ok: true, aantal: lijst.length, videos: lijst });
}
