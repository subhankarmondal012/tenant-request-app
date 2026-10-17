import { useEffect, useMemo, useState } from 'react';
import { triageRequest } from './triage.js';

const STORAGE_KEY = 'fixflow-requests';
const CATEGORIES = ['Plumbing', 'Electrical', 'Heating / AC', 'Appliance', 'Door / Lock', 'Other'];
const STATUSES = ['Open', 'In progress', 'Done'];
const FILTERS = ['All', ...STATUSES];

const SAMPLE = [
  {
    id: 's1', unit: '4B', name: 'Maria Lopez', category: 'Plumbing',
    description: 'Water leak under the kitchen sink, cabinet floor is wet.',
    urgency: 'urgent', reply: 'Marked urgent — the team will contact you within 2 hours.',
    status: 'In progress', createdAt: '2026-10-14T09:12:00Z', source: 'rules',
  },
  {
    id: 's2', unit: '2A', name: 'James Carter', category: 'Appliance',
    description: 'Dishwasher does not drain fully after a cycle.',
    urgency: 'normal', reply: 'We will schedule a visit within 3 business days.',
    status: 'Open', createdAt: '2026-10-15T15:40:00Z', source: 'rules',
  },
];

function loadRequests() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : SAMPLE;
  } catch {
    return SAMPLE;
  }
}

const emptyForm = { unit: '', name: '', category: CATEGORIES[0], description: '', entry: false };

export default function App() {
  const [requests, setRequests] = useState(loadRequests);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch {
      /* storage unavailable: keep working in memory */
    }
  }, [requests]);

  const counts = useMemo(() => {
    const c = { All: requests.length };
    STATUSES.forEach((s) => (c[s] = requests.filter((r) => r.status === s).length));
    return c;
  }, [requests]);

  const visible = filter === 'All' ? requests : requests.filter((r) => r.status === filter);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.unit.trim()) e.unit = 'Enter your unit number.';
    if (!form.name.trim()) e.name = 'Enter your name.';
    if (form.description.trim().length < 10) e.description = 'Describe the problem in at least 10 characters.';
    return e;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    const base = {
      unit: form.unit.trim(), name: form.name.trim(), category: form.category,
      description: form.description.trim(), entry: form.entry,
    };
    const triage = await triageRequest(base);
    const request = {
      ...base, ...triage, id: crypto.randomUUID(), status: 'Open', createdAt: new Date().toISOString(),
    };
    setRequests((list) => [request, ...list]);
    setForm(emptyForm);
    setFilter('All');
    setSubmitting(false);
    setNotice(`Request sent. Urgency: ${triage.urgency}.`);
  }

  function setStatus(id, status) {
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  function remove(id) {
    setRequests((list) => list.filter((r) => r.id !== id));
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span>FixFlow</span>
        </div>
        <p className="tag">Tenant maintenance requests with AI triage</p>
      </header>

      <main className="layout">
        <section className="card" aria-labelledby="new-title">
          <h1 id="new-title">New request</h1>
          <form onSubmit={handleSubmit} noValidate>
            <div className="row2">
              <Field label="Unit" error={errors.unit}>
                <input value={form.unit} onChange={(e) => update('unit', e.target.value)} placeholder="e.g. 4B" />
              </Field>
              <Field label="Your name" error={errors.name}>
                <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" />
              </Field>
            </div>
            <Field label="Category">
              <select value={form.category} onChange={(e) => update('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="What's the problem?" error={errors.description}>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Where is it, when did it start, anything we should know?"
              />
            </Field>
            <label className="check">
              <input type="checkbox" checked={form.entry} onChange={(e) => update('entry', e.target.checked)} />
              Maintenance may enter if I'm not home
            </label>
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Submit request'}
            </button>
            <p className="notice" role="status" aria-live="polite">{notice}</p>
          </form>
        </section>

        <section className="card" aria-labelledby="list-title">
          <div className="list-head">
            <h2 id="list-title">Requests</h2>
            <div className="tabs" role="tablist" aria-label="Filter by status">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  className={filter === f ? 'tab active' : 'tab'}
                  onClick={() => setFilter(f)}
                >
                  {f} <span className="count">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="empty">No {filter === 'All' ? '' : filter.toLowerCase() + ' '}requests yet.</p>
          ) : (
            <ul className="requests">
              {visible.map((r) => (
                <li key={r.id} className="request">
                  <div className="req-top">
                    <span className={`badge ${r.urgency}`}>{r.urgency}</span>
                    <strong>{r.category}</strong>
                    <span className="meta">Unit {r.unit} · {r.name} · {new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p>{r.description}</p>
                  <p className="reply"><span>{r.source === 'ai' ? 'AI reply' : 'Auto reply'}:</span> {r.reply}</p>
                  <div className="req-actions">
                    <label>
                      Status{' '}
                      <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                    <button className="link" onClick={() => remove(r.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="foot">
        Demo project by Subhankar Mondal · React + n8n AI workflow
      </footer>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className={error ? 'field has-error' : 'field'}>
      <span>{label}</span>
      {children}
      {error && <small className="error">{error}</small>}
    </label>
  );
}
