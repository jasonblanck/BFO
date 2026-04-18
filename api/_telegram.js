// Minimal Telegram Bot API wrapper for MFA code delivery.
//
// Setup (one-time):
//   1. Open Telegram → search @BotFather → send /newbot → follow prompts.
//   2. BotFather returns a token like 1234567890:AAE...     → TELEGRAM_BOT_TOKEN
//   3. Open the link BotFather gave you + send /start to the bot.
//   4. Browse to https://api.telegram.org/bot{TOKEN}/getUpdates
//   5. Copy `result[0].message.chat.id` → TELEGRAM_CHAT_ID
//   6. Paste both into Vercel env + redeploy.

const API_BASE = 'https://api.telegram.org';

export function isConfigured() {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

// Fire-and-check send. Returns { ok: true } on success or
// { ok: false, error } on failure. Never throws — callers decide how
// to map a send failure to an auth response.
export async function sendMessage(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, error: 'telegram_not_configured' };

  try {
    const r = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) {
      console.error('telegram send failed', { status: r.status, description: j?.description });
      return { ok: false, error: 'telegram_send_failed' };
    }
    return { ok: true };
  } catch (e) {
    console.error('telegram send exception', e?.message || e);
    return { ok: false, error: 'telegram_network' };
  }
}

// Plain-text escape for Telegram HTML mode. Only the four reserved
// chars need replacement; everything else passes through.
export function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
