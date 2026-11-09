// We Are Many: advertentie-hooks en advertentiebeelden (Henkjan 9 nov 2026: "Ads moeten we ook goede hook vinden voor überhaupt verkeer,
// dat gaan we iedere dag optimaliseren"). Elke hook hoort bij een familie van openers in lib/wam.js, zodat de chat de belofte van de
// advertentie meteen voortzet (message match). Regels uit de campagneskill: geen prijzen of cijfers, geen nep-urgentie, knoptekst altijd
// ingevuld, titel max ~30 tekens, tekst max ~40-60 tekens. De beelden tekent /api/wam?op=beeld&h=<hook>&t=<taal>&v=icon|img.
export const HOOKS = {
  teveel: { familie: 'besparen', kleur: '#0F6E56',
    en: { titel: 'Paying too much?', tekst: 'Ask me. I check if it can be cheaper.', knop: 'Check now', beeld: 'Paying too much?' },
    nl: { titel: 'Betaal je te veel?', tekst: 'Vraag het mij. Ik kijk of het goedkoper kan.', knop: 'Check het', beeld: 'Betaal je te veel?' },
    de: { titel: 'Zahlst du zu viel?', tekst: 'Frag mich. Ich prüfe, ob es günstiger geht.', knop: 'Jetzt prüfen', beeld: 'Zahlst du zu viel?' } },
  opzeggen: { familie: 'opzeggen', kleur: '#993C1D',
    en: { titel: 'Forgot a subscription?', tekst: 'Tell me which one. I help you cancel today.', knop: 'Start', beeld: 'Cancel it today' },
    nl: { titel: 'Vergeten abonnement?', tekst: 'Zeg welke. Ik help je het vandaag opzeggen.', knop: 'Begin', beeld: 'Vandaag nog opgezegd' },
    de: { titel: 'Abo vergessen?', tekst: 'Sag mir welches. Ich helfe beim Kündigen.', knop: 'Los geht\'s', beeld: 'Heute noch gekündigt' } },
  regelaar: { familie: 'open', kleur: '#3C3489',
    en: { titel: 'Your own personal fixer', tekst: 'Bills, deals, complaints: just ask.', knop: 'Try it', beeld: 'Your own fixer' },
    nl: { titel: 'Je eigen regelaar', tekst: 'Rekeningen, deals, klachten: vraag maar.', knop: 'Probeer het', beeld: 'Je eigen regelaar' },
    de: { titel: 'Dein eigener Kümmerer', tekst: 'Rechnungen, Deals, Beschwerden: frag einfach.', knop: 'Ausprobieren', beeld: 'Dein Kümmerer' } },
  wens: { familie: 'wens', kleur: '#185FA5',
    en: { titel: 'What do you want sorted?', tekst: 'Type it. I find the best way to get it.', knop: 'Ask', beeld: 'What do you want?' },
    nl: { titel: 'Wat wil je geregeld?', tekst: 'Typ het. Ik zoek de beste manier.', knop: 'Vraag', beeld: 'Wat wil je geregeld?' },
    de: { titel: 'Was soll geklärt werden?', tekst: 'Schreib es. Ich finde den besten Weg.', knop: 'Fragen', beeld: 'Was brauchst du?' } },
  samen: { familie: 'samen', kleur: '#085041',
    en: { titel: 'Together we pay less', tekst: 'Join people who want the same deal.', knop: 'Join', beeld: 'We are many' },
    nl: { titel: 'Samen betalen we minder', tekst: 'Doe mee met mensen die hetzelfde willen.', knop: 'Doe mee', beeld: 'We zijn met velen' },
    de: { titel: 'Zusammen zahlen wir weniger', tekst: 'Mach mit bei Leuten mit demselben Wunsch.', knop: 'Mitmachen', beeld: 'Wir sind viele' } },
  rekening: { familie: 'besparen', kleur: '#854F0B',
    en: { titel: 'Is your bill fair?', tekst: 'Tell me what you pay. I compare it.', knop: 'Compare', beeld: 'Is your bill fair?' },
    nl: { titel: 'Is jouw rekening eerlijk?', tekst: 'Zeg wat je betaalt. Ik vergelijk het.', knop: 'Vergelijk', beeld: 'Eerlijke rekening?' },
    de: { titel: 'Ist deine Rechnung fair?', tekst: 'Sag mir, was du zahlst. Ich vergleiche.', knop: 'Vergleichen', beeld: 'Faire Rechnung?' } },
  vraag: { familie: 'open', kleur: '#72243E',
    en: { titel: 'Quick question for you', tekst: 'What would make your week easier?', knop: 'Answer', beeld: 'Quick question' },
    nl: { titel: 'Korte vraag aan jou', tekst: 'Wat zou jouw week makkelijker maken?', knop: 'Antwoord', beeld: 'Korte vraag' },
    de: { titel: 'Kurze Frage an dich', tekst: 'Was würde deine Woche leichter machen?', knop: 'Antworten', beeld: 'Kurze Frage' } },
  klacht: { familie: 'open', kleur: '#A32D2D',
    en: { titel: 'Company not listening?', tekst: 'I help you write a complaint that works.', knop: 'Start', beeld: 'Get heard' },
    nl: { titel: 'Bedrijf luistert niet?', tekst: 'Ik help je een klacht die werkt.', knop: 'Begin', beeld: 'Word gehoord' },
    de: { titel: 'Firma hört nicht zu?', tekst: 'Ich helfe dir mit einer Beschwerde.', knop: 'Start', beeld: 'Werde gehört' } }
};
export const hookTekst = (h, taal) => { const x = HOOKS[h]; if (!x) return null; return x[taal] || x.en; };

// Advertentiebeeld met @vercel/og: v=icon (192x192) of v=img (492x328, 3:2). Vlak, groot woord, merk klein.
export async function beeld(h, taal, v) {
  const x = HOOKS[h] || HOOKS.regelaar; const t = x[taal] || x.en;
  const [{ ImageResponse }, { INTER_500, INTER_800 }] = await Promise.all([import('@vercel/og'), import('./pinfont.js')]);
  const fonts = [{ name: 'Inter', data: Buffer.from(INTER_500, 'base64'), weight: 500, style: 'normal' }, { name: 'Inter', data: Buffer.from(INTER_800, 'base64'), weight: 800, style: 'normal' }];
  const el = (type, style, children) => ({ type, props: { style: Object.assign({ display: 'flex' }, style), children } });
  if (v === 'icon') {
    const tree = el('div', { width: 192, height: 192, background: x.kleur, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', borderRadius: 0 }, [
      el('div', { color: '#fff', fontSize: 64, fontWeight: 800, letterSpacing: -2, fontFamily: 'Inter' }, 'WAM'),
      el('div', { color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: 500, marginTop: 4, fontFamily: 'Inter' }, 'we are many')]);
    return new ImageResponse(tree, { width: 192, height: 192, fonts });
  }
  const tree = el('div', { width: 492, height: 328, background: x.kleur, padding: 34, flexDirection: 'column', justifyContent: 'space-between' }, [
    el('div', { color: '#fff', fontSize: t.beeld.length > 16 ? 46 : 54, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1, fontFamily: 'Inter', maxWidth: 424 }, t.beeld),
    el('div', { alignItems: 'center', justifyContent: 'space-between', width: 424 }, [
      el('div', { color: 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: 500, fontFamily: 'Inter' }, 'wearemany.now'),
      el('div', { background: '#fff', color: x.kleur, fontSize: 22, fontWeight: 800, padding: '10px 18px', borderRadius: 999, fontFamily: 'Inter' }, t.knop)])]);
  return new ImageResponse(tree, { width: 492, height: 328, fonts });
}
