const TO_EMAIL   = process.env.TO_EMAIL   || 'info@arsolving.it';
const FROM_EMAIL = process.env.FROM_EMAIL || 'info@arsolving.it';
const FROM_NAME  = process.env.FROM_NAME  || 'ARSOLVING';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://arsolving.it,https://www.arsolving.it')
  .split(',').map(s => s.trim());

const escape = (s = '') => String(s).replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };

  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {});
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON non valido' }) };
  }

  // honeypot anti-spam
  if (body.website) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  const { nome, azienda, email, telefono, contesto, problema, struttura, priorita } = body;
  if (!nome || !email || !problema) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Compila Nome, Email e Descrizione del problema.' }) };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email non valida.' }) };
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (!SENDGRID_API_KEY) {
    console.error('Missing SENDGRID_API_KEY');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  const sendEmail = async (payload) => {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SendGrid ${res.status}: ${text}`);
    }
  };

  const ctx = contesto || 'non specificato';
  const notification = {
    personalizations: [{ to: [{ email: TO_EMAIL }] }],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    reply_to: { email, name: nome },
    subject: `Nuova richiesta analisi — ${ctx} — ${nome}`,
    content: [{ type: 'text/html', value: notificationHtml({ nome, azienda, email, telefono, contesto: ctx, problema, struttura, priorita }) }],
  };

  const autoReply = {
    personalizations: [{ to: [{ email, name: nome }] }],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: 'Abbiamo ricevuto la tua richiesta — ARSOLVING',
    content: [{ type: 'text/html', value: autoReplyHtml({ nome, contesto: ctx }) }],
  };

  try {
    await Promise.all([sendEmail(notification), sendEmail(autoReply)]);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('SendGrid error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Errore invio email' }) };
  }
};

function notificationHtml({ nome, azienda, email, telefono, contesto, problema, struttura, priorita }) {
  const row = (label, value) => value
    ? `<tr><td style="padding:10px 0;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">${escape(label)}</td></tr>
       <tr><td style="padding:0 0 18px;color:#fff;font-size:15px;font-weight:500;">${escape(value)}</td></tr>`
    : '';
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0E1D34;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0E1D34;padding:40px 20px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="background:#0B1A2E;border-radius:14px;border:1px solid rgba(199,162,74,0.18);">
  <tr><td style="height:3px;background:linear-gradient(90deg,#0E1D34,#C7A24A,#0E1D34);border-radius:14px 14px 0 0;"></td></tr>
  <tr><td style="padding:32px 40px 22px;border-bottom:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0 0 6px;color:#C7A24A;font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">Avvia Analisi</p>
    <h1 style="margin:0;font-size:22px;color:#fff;font-weight:800;letter-spacing:-0.3px;">Nuova richiesta dal sito</h1>
  </td></tr>
  <tr><td style="padding:28px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${row('Nome', nome)}
      ${row('Azienda / progetto', azienda)}
      ${row('Email', email)}
      ${row('Telefono', telefono)}
      ${row('Tipo di problema', contesto)}
      ${row('Stato attuale', struttura)}
      ${row('Urgenza / tempistiche', priorita)}
      <tr><td style="padding:10px 0;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">Descrizione</td></tr>
      <tr><td style="padding:0 0 6px;color:#e2e8f0;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escape(problema)}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:18px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);">
    <a href="mailto:${escape(email)}?subject=Re: richiesta analisi"
       style="display:inline-block;background:#C7A24A;color:#0E1D34;padding:12px 26px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;">Rispondi a ${escape(nome)} →</a>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

function autoReplyHtml({ nome, contesto }) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0E1D34;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0E1D34;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0B1A2E;border-radius:16px;border:1px solid rgba(199,162,74,0.2);overflow:hidden;">
  <tr><td style="height:3px;background:linear-gradient(90deg,#0E1D34,#C7A24A,#0E1D34);"></td></tr>
  <tr><td align="center" style="padding:38px 40px 14px;">
    <h1 style="margin:0;font-size:30px;font-weight:900;letter-spacing:2px;color:#fff;">
      <span style="font-weight:800;">AR</span><span style="color:#C7A24A;font-weight:300;">SOLVING</span>
    </h1>
    <p style="margin:8px 0 0;color:#94a3b8;font-size:10px;letter-spacing:3px;text-transform:uppercase;">Premium Multiservice Group</p>
  </td></tr>
  <tr><td style="padding:24px 40px 10px;">
    <h2 style="margin:0 0 14px;font-size:22px;color:#fff;font-weight:800;letter-spacing:-0.3px;">Ciao ${escape(nome)},</h2>
    <p style="margin:0 0 14px;color:#cbd5e1;font-size:15px;line-height:1.75;">
      Abbiamo ricevuto la tua richiesta di analisi${contesto && contesto !== 'non specificato' ? ` su ambito <strong style="color:#C7A24A;">${escape(contesto)}</strong>` : ''}.
      Il nostro team sta già esaminando il contesto.
    </p>
    <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.75;">
      Ti rispondiamo <strong style="color:#fff;">entro 30 minuti</strong> nei nostri orari operativi con i prossimi passi.
    </p>
  </td></tr>
  <tr><td style="padding:22px 40px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(199,162,74,0.06);border:1px solid rgba(199,162,74,0.18);border-radius:10px;padding:18px 22px;">
      <tr><td>
        <p style="margin:0 0 4px;color:#C7A24A;font-size:10px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;">Cosa succede ora</p>
        <p style="margin:8px 0 0;color:#e2e8f0;font-size:13px;line-height:1.7;">
          <strong style="color:#fff;">01.</strong> Capiamo il contesto in 30 minuti.<br/>
          <strong style="color:#fff;">02.</strong> Ti proponiamo come muoverci.<br/>
          <strong style="color:#fff;">03.</strong> Operativi dal primo giorno utile.
        </p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 40px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>
  <tr><td style="padding:22px 40px 30px;">
    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.7;">
      <strong style="color:#94a3b8;">ARSOLVING — Multiservice Group S.R.L.S.</strong><br/>
      Strada della Bonifica 48/1, 65129 Pescara (PE)<br/>
      <a href="mailto:info@arsolving.it" style="color:#C7A24A;text-decoration:none;">info@arsolving.it</a> · <a href="https://arsolving.it" style="color:#C7A24A;text-decoration:none;">arsolving.it</a>
    </p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}
