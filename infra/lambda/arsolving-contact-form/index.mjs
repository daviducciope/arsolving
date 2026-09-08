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

  const {
    nome,
    azienda,
    email,
    telefono,
    contesto,
    problema,
    struttura,
    priorita,
    tipo,
    servizio,
    indirizzo,
    bidoni2,
    bidoni4,
    bidoni_2_ruote,
    bidoni_4_ruote,
    isola_ecologica,
    importo_stimato,
  } = body;

  if (!nome || !email || !problema) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Compila tutti i campi obbligatori.' }) };
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

  const isLavaggio = tipo === 'lavaggio-bidoni' ||
    (servizio && servizio.toLowerCase().includes('lavaggio bidoni')) ||
    (contesto && contesto.toLowerCase().includes('lavaggio bidoni')) ||
    Boolean(indirizzo && (bidoni2 !== undefined || bidoni4 !== undefined || bidoni_2_ruote !== undefined));

  const ctx = contesto || servizio || 'non specificato';
  const b2 = bidoni2 ?? bidoni_2_ruote;
  const b4 = bidoni4 ?? bidoni_4_ruote;

  const notifFields = {
    nome,
    azienda,
    email,
    telefono,
    contesto: ctx,
    problema,
    struttura,
    priorita,
    isLavaggio,
    indirizzo,
    b2,
    b4,
    isola_ecologica,
    importo_stimato,
  };

  const autoReplyFields = {
    nome,
    contesto: ctx,
    isLavaggio,
    indirizzo,
    b2,
    b4,
    isola_ecologica,
    importo_stimato,
  };

  const notification = {
    personalizations: [{ to: [{ email: TO_EMAIL }] }],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    reply_to: { email, name: nome },
    subject: isLavaggio
      ? `Nuova richiesta Lavaggio Bidoni — ${nome} — ${indirizzo || 'Area Pescara'}`
      : `Nuova richiesta analisi — ${ctx} — ${nome}`,
    content: [
      { type: 'text/plain', value: isLavaggio ? lavaggioNotifText(notifFields) : notificationText(notifFields) },
      { type: 'text/html',  value: isLavaggio ? lavaggioNotifHtml(notifFields) : notificationHtml(notifFields) },
    ],
  };

  const autoReply = {
    personalizations: [{ to: [{ email, name: nome }] }],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    reply_to: { email: FROM_EMAIL, name: FROM_NAME },
    subject: isLavaggio
      ? 'Abbiamo ricevuto la tua richiesta per il Lavaggio Bidoni — ARSOLVING'
      : 'Abbiamo ricevuto la tua richiesta — ARSOLVING',
    headers: {
      'List-Unsubscribe': `<mailto:${FROM_EMAIL}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Auto-Submitted': 'auto-replied',
      'X-Auto-Response-Suppress': 'All',
    },
    content: [
      { type: 'text/plain', value: isLavaggio ? lavaggioAutoReplyText(autoReplyFields) : autoReplyText(autoReplyFields) },
      { type: 'text/html',  value: isLavaggio ? lavaggioAutoReplyHtml(autoReplyFields) : autoReplyHtml(autoReplyFields) },
    ],
  };

  try {
    await Promise.all([sendEmail(notification), sendEmail(autoReply)]);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('SendGrid error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Errore invio email' }) };
  }
};

/* ─── EMAIL TEMPLATES STANDARD (Richiesta di Analisi) ─── */

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

function notificationText({ nome, azienda, email, telefono, contesto, problema, struttura, priorita }) {
  const line = (label, value) => value ? `${label}: ${value}\n` : '';
  return (
`Nuova richiesta dal sito ARSOLVING
==================================

${line('Nome', nome)}${line('Azienda / progetto', azienda)}${line('Email', email)}${line('Telefono', telefono)}${line('Tipo di problema', contesto)}${line('Stato attuale', struttura)}${line('Urgenza / tempistiche', priorita)}
Descrizione:
${problema}

--
Per rispondere usa il pulsante "Rispondi" (Reply-To impostato sull'email del richiedente).

ARSOLVING — Multiservice Group S.R.L.S.
Strada della Bonifica 48/1, 65129 Pescara (PE)
info@arsolving.it · https://arsolving.it
`);
}

function autoReplyText({ nome, contesto }) {
  const ctxLine = contesto && contesto !== 'non specificato'
    ? ` su ambito ${contesto}`
    : '';
  return (
`Ciao ${nome},

abbiamo ricevuto la tua richiesta di analisi${ctxLine}.
Il nostro team sta già esaminando il contesto.

Ti rispondiamo entro 30 minuti nei nostri orari operativi con i prossimi passi.

Cosa succede ora:
01. Capiamo il contesto in 30 minuti.
02. Ti proponiamo come muoverci.
03. Operativi dal primo giorno utile.

--
ARSOLVING — Multiservice Group S.R.L.S.
Strada della Bonifica 48/1, 65129 Pescara (PE)
info@arsolving.it · https://arsolving.it

Per non ricevere più questi messaggi rispondi con oggetto "unsubscribe".
`);
}

/* ─── EMAIL TEMPLATES SPECIFICI PER LAVAGGIO BIDONI ─── */

function lavaggioNotifHtml({ nome, email, telefono, indirizzo, b2, b4, isola_ecologica, importo_stimato, problema }) {
  const row = (label, value) => value
    ? `<tr><td style="padding:8px 0 4px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;">${escape(label)}</td></tr>
       <tr><td style="padding:0 0 14px;color:#fff;font-size:15px;font-weight:500;">${escape(value)}</td></tr>`
    : '';

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0E1D34;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0E1D34;padding:40px 20px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="background:#0B1A2E;border-radius:14px;border:1px solid rgba(199,162,74,0.25);">
  <tr><td style="height:3px;background:linear-gradient(90deg,#0E1D34,#C7A24A,#0E1D34);border-radius:14px 14px 0 0;"></td></tr>
  <tr><td style="padding:32px 40px 22px;border-bottom:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0 0 6px;color:#C7A24A;font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">Lead Lavaggio Bidoni</p>
    <h1 style="margin:0;font-size:22px;color:#fff;font-weight:800;letter-spacing:-0.3px;">Nuova richiesta da ${escape(nome)}</h1>
  </td></tr>
  <tr><td style="padding:28px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${row('Cliente', nome)}
      ${row('Telefono', telefono)}
      ${row('Email', email)}
      ${row('Indirizzo lavaggio', indirizzo)}
      ${row('Bidoni 2 ruote', b2 !== undefined ? `${b2} unità` : '')}
      ${row('Bidoni 4 ruote', b4 !== undefined ? `${b4} unità` : '')}
      ${row('Isola ecologica', isola_ecologica)}
      ${row('Base economica indicativa', importo_stimato)}
      <tr><td style="padding:12px 0 6px;color:#C7A24A;font-size:11px;text-transform:uppercase;font-weight:800;letter-spacing:1.5px;">Dettaglio voci &amp; Proposta commerciale</td></tr>
      <tr><td style="padding:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e2e8f0;font-size:13.5px;line-height:1.75;font-family:monospace,sans-serif;white-space:pre-wrap;">${escape(problema)}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:18px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);">
    <a href="mailto:${escape(email)}?subject=Re: Richiesta lavaggio bidoni ARSOLVING"
       style="display:inline-block;background:#C7A24A;color:#0E1D34;padding:12px 26px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;">Rispondi a ${escape(nome)} →</a>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

function lavaggioNotifText({ nome, email, telefono, indirizzo, b2, b4, isola_ecologica, importo_stimato, problema }) {
  return (
`Nuova richiesta Lavaggio Bidoni ARSOLVING
=========================================

Cliente: ${nome}
Telefono: ${telefono || '-'}
Email: ${email}
Indirizzo: ${indirizzo || '-'}
Bidoni 2 ruote: ${b2 ?? '-'}
Bidoni 4 ruote: ${b4 ?? '-'}
Isola ecologica: ${isola_ecologica || '-'}
Base economica indicativa: ${importo_stimato || '-'}

Dettaglio voci & Proposta commerciale:
${problema}

--
ARSOLVING — Multiservice Group S.R.L.S.
info@arsolving.it · https://arsolving.it
`);
}

function lavaggioAutoReplyHtml({ nome, indirizzo, b2, b4, isola_ecologica, importo_stimato }) {
  const hasIsola = isola_ecologica && (isola_ecologica.toLowerCase().includes('sì') || isola_ecologica.toLowerCase().includes('si'));

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0E1D34;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0E1D34;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0B1A2E;border-radius:16px;border:1px solid rgba(199,162,74,0.25);overflow:hidden;">
  <tr><td style="height:3px;background:linear-gradient(90deg,#0E1D34,#C7A24A,#0E1D34);"></td></tr>
  <tr><td align="center" style="padding:36px 40px 14px;">
    <h1 style="margin:0;font-size:30px;font-weight:900;letter-spacing:2px;color:#fff;">
      <span style="font-weight:800;">AR</span><span style="color:#C7A24A;font-weight:300;">SOLVING</span>
    </h1>
    <p style="margin:8px 0 0;color:#94a3b8;font-size:10px;letter-spacing:3px;text-transform:uppercase;">Lavaggio &amp; Sanificazione Bidoni a Domicilio</p>
  </td></tr>
  <tr><td style="padding:22px 40px 10px;">
    <h2 style="margin:0 0 14px;font-size:22px;color:#fff;font-weight:800;letter-spacing:-0.3px;">Ciao ${escape(nome)},</h2>
    <p style="margin:0 0 14px;color:#cbd5e1;font-size:15px;line-height:1.75;">
      Grazie per averci contattato! Abbiamo ricevuto la tua richiesta per il servizio di <strong style="color:#C7A24A;">Lavaggio e Sanificazione Bidoni a Domicilio</strong>${hasIsola ? ' con lavaggio isola ecologica' : ''}.
    </p>
    <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.75;">
      Verrai ricontattato al più presto dal nostro team per confermare i dettagli e <strong style="color:#fff;">programmare un sopralluogo gratuito o definire l'intervento</strong>.
    </p>
  </td></tr>

  <!-- Box Riepilogo Richiesta -->
  <tr><td style="padding:16px 40px 10px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px 20px;">
      <tr><td>
        <p style="margin:0 0 10px;color:#C7A24A;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Riepilogo della tua richiesta</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#cbd5e1;line-height:1.7;">
          ${indirizzo ? `<tr><td style="color:#94a3b8;width:140px;padding:3px 0;">Indirizzo:</td><td style="color:#fff;font-weight:600;padding:3px 0;">${escape(indirizzo)}</td></tr>` : ''}
          ${(b2 || b4) ? `<tr><td style="color:#94a3b8;padding:3px 0;">Bidoni richiesti:</td><td style="color:#fff;font-weight:600;padding:3px 0;">${b2 ? `${b2} da 2 ruote` : ''}${b2 && b4 ? ' · ' : ''}${b4 ? `${b4} da 4 ruote` : ''}</td></tr>` : ''}
          ${hasIsola ? `<tr><td style="color:#94a3b8;padding:3px 0;">Isola ecologica:</td><td style="color:#C7A24A;font-weight:600;padding:3px 0;">Inclusa (richiesto preventivo/sopralluogo)</td></tr>` : ''}
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- Box Cosa succede ora -->
  <tr><td style="padding:12px 40px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(199,162,74,0.06);border:1px solid rgba(199,162,74,0.18);border-radius:10px;padding:18px 22px;">
      <tr><td>
        <p style="margin:0 0 6px;color:#C7A24A;font-size:10px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;">Cosa succede adesso</p>
        <p style="margin:8px 0 0;color:#e2e8f0;font-size:13px;line-height:1.75;">
          <strong style="color:#fff;">01. Verifica dei dettagli:</strong> esaminiamo l'indirizzo indicato e le specifiche del tuo stabile o abitazione.<br/>
          <strong style="color:#fff;">02. Contatto e programmazione:</strong> ti ricontattiamo al più presto per concordare data, orario e pianificare il sopralluogo.<br/>
          <strong style="color:#fff;">03. Intervento a ciclo chiuso:</strong> laviamo e igienizziamo a fondo con enzimi naturali senza sporcare alcuno spazio esterno.
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

function lavaggioAutoReplyText({ nome, indirizzo, b2, b4, isola_ecologica, importo_stimato }) {
  const hasIsola = isola_ecologica && (isola_ecologica.toLowerCase().includes('sì') || isola_ecologica.toLowerCase().includes('si'));
  const bidoniStr = [
    b2 ? `${b2} bidone/i 2 ruote` : '',
    b4 ? `${b4} bidone/i 4 ruote` : '',
  ].filter(Boolean).join(', ');

  return (
`Ciao ${nome},

grazie per averci contattato! Abbiamo ricevuto la tua richiesta per il servizio di Lavaggio e Sanificazione Bidoni a Domicilio${hasIsola ? ' con lavaggio isola ecologica' : ''}.

Verrai ricontattato al più presto dal nostro team per confermare i dettagli e programmare un sopralluogo gratuito o definire l'intervento.

Riepilogo della richiesta:
${indirizzo ? `- Indirizzo: ${indirizzo}\n` : ''}${bidoniStr ? `- Bidoni: ${bidoniStr}\n` : ''}${hasIsola ? `- Isola ecologica: Inclusa (richiesto preventivo/sopralluogo)\n` : ''}
Cosa succede adesso:
01. Verifica dei dettagli: esaminiamo l'indirizzo indicato e le specifiche del tuo stabile o abitazione.
02. Contatto e programmazione: ti ricontattiamo al più presto per concordare data, orario e pianificare il sopralluogo.
03. Intervento a ciclo chiuso: laviamo e igienizziamo a fondo con enzimi naturali senza sporcare alcuno spazio esterno.

--
ARSOLVING — Multiservice Group S.R.L.S.
Strada della Bonifica 48/1, 65129 Pescara (PE)
info@arsolving.it · https://arsolving.it

Per non ricevere più questi messaggi rispondi con oggetto "unsubscribe".
`);
}
