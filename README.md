# FixFlow — Tenant Maintenance Requests with AI Triage

A small React app where tenants report maintenance problems and each request is triaged automatically — **urgent**, **high** or **normal** — with a drafted reply.

Triage runs through an **n8n AI workflow** ([n8n-ai-maintenance-triage](https://github.com/subhankarmondal012/n8n-ai-maintenance-triage)). Without it, the app falls back to simple keyword rules, so the demo always works.

## Features

- Request form with validation and accessible labels
- AI triage: urgency + suggested reply (via n8n webhook), with an offline fallback
- Request list with status filters (Open / In progress / Done) and live counts
- Change status or delete a request
- Saves to the browser (localStorage), responsive down to mobile

## Tech

React 18 · Vite · plain CSS · n8n (AI workflow) · Fetch API

## Run locally

```bash
npm install
npm run dev
```

To connect the AI workflow, create a `.env` file:

```
VITE_TRIAGE_URL=https://<your-n8n-host>/webhook/maintenance-triage
```

## How I built it

Built with an AI-assisted workflow: I described each feature to an AI coding tool, reviewed the generated code, tested it in the browser and refined it — then wired it to an n8n workflow I set up for the AI triage.

## Project structure

```
src/
  App.jsx      # form, list, filters, status changes
  triage.js    # calls the n8n webhook, falls back to keyword rules
  App.css      # layout and styles
```
