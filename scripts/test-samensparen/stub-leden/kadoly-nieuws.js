export const MAILS = [];
const LOGO = 'https://cdn.kadoly.com/icon/shop/apple-180.png?v=1';
const BEDRIJF = 'Kadoly Shop · ADSFAIR B.V. · Albert Plesmanplein 20, 2805 AB Gouda · KVK 60126035';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function mailSchil({ titel, voorkop, inhoud, voet }) {
  const F = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif';
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(titel)}</title></head><body style="margin:0;padding:0;background:#E8F4FD"><span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(voorkop)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E8F4FD"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;border:1px solid #D6ECFC">
<tr><td style="padding:24px 28px 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td><img src="${LOGO}" width="32" height="32" alt="" style="display:block;border-radius:8px"></td><td style="padding-left:10px;font:700 18px/1 ${F};color:#0B0D12">Kadoly</td></tr></table></td></tr>
<tr><td style="padding:18px 28px 28px;font:16px/1.55 ${F};color:#0B0D12">${inhoud}</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="padding:18px 28px 6px;font:13px/1.55 ${F};color:#0B0D12">${voet}</td></tr></table>
</td></tr></table></body></html>`;
}
const knop = (href, tekst) => `<a href="${href}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:999px">${esc(tekst)}</a>`;
export { mailSchil, knop, BEDRIJF as KADOLY_BEDRIJF };
export async function mailKlaar() { return globalThis.MAILKLAAR !== false; }
export async function stuurMails(mails, idem) { for (const m of mails) MAILS.push({ ...m, idem }); return { id: 'x' }; }
