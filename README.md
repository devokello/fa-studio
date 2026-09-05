# K&D PlansVista — Website

A one-page site for K&D PlansVista, an architectural design and construction
company based in Kigali - Kabuga, Rwanda. Built with React, Vite, and
Tailwind CSS.

## What's inside

- Blueprint-themed hero and "What We Design" section with hand-built SVG
  architectural diagrams (floor plan, elevation, site plan)
- Services, process, and team sections (Shema Fabrice "Kida" — CEO,
  Asimwe Derrick — Asset Manager)
- A contact form (name, email, phone, project type, message) with a
  confirmation message on submit — no backend is wired up yet, it just
  holds state in the browser

## Requirements

- [Node.js](https://nodejs.org) 18 or newer
- npm (comes with Node)

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
```

This outputs a `dist/` folder with static files you can upload to any web
host (Netlify, Vercel, GitHub Pages, cPanel, etc.).

## Where to edit things

- `src/App.jsx` — the entire site (all sections, copy, and the SVG diagrams)
- `src/index.css` — global styles / Tailwind entry point
- `tailwind.config.js` — Tailwind configuration
- Contact details, team names, and copy all live directly in `App.jsx`
  as plain text/JSX, so they're easy to find and change.

## Connecting the contact form

Right now, submitting the contact form just shows a confirmation message
in the browser — it doesn't send an email anywhere yet. To make it actually
deliver messages, you'd want to wire the `handleSubmit` function in
`App.jsx` up to a form service (e.g. Formspree, EmailJS) or your own
backend endpoint.
