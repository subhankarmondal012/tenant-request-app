// Triage a maintenance request.
// If VITE_TRIAGE_URL points at the n8n workflow (see ../n8n-ai-maintenance-triage),
// the AI decides urgency and drafts a reply. Otherwise a simple keyword rule is used,
// so the demo always works offline.

const TRIAGE_URL = import.meta.env.VITE_TRIAGE_URL;

const URGENT_WORDS = ['leak', 'flood', 'gas', 'smoke', 'fire', 'spark', 'no heat', 'no water', 'locked out', 'broken lock'];
const HIGH_WORDS = ['heat', 'ac', 'fridge', 'refrigerator', 'toilet', 'electric', 'power', 'door'];

export function ruleBasedTriage({ category, description }) {
  const text = `${category} ${description}`.toLowerCase();
  let urgency = 'normal';
  if (URGENT_WORDS.some((w) => text.includes(w))) urgency = 'urgent';
  else if (HIGH_WORDS.some((w) => text.includes(w))) urgency = 'high';

  const reply =
    urgency === 'urgent'
      ? 'Thanks for reporting this. It has been marked urgent and our maintenance team will contact you within 2 hours.'
      : urgency === 'high'
        ? 'Thanks for your request. A technician will be scheduled within 24 hours.'
        : 'Thanks for your request. We will schedule a visit within 3 business days.';

  return { urgency, reply, source: 'rules' };
}

export async function triageRequest(request) {
  if (!TRIAGE_URL) return ruleBasedTriage(request);
  try {
    const res = await fetch(TRIAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Triage failed: ${res.status}`);
    const data = await res.json();
    if (!['urgent', 'high', 'normal'].includes(data.urgency)) throw new Error('Unexpected response');
    return { urgency: data.urgency, reply: data.reply, source: 'ai' };
  } catch (err) {
    console.warn(err);
    return ruleBasedTriage(request);
  }
}
