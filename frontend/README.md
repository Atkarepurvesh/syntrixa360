# Syntrixa360 — Single Unified App

Ab **ek hi app** hai — website aur dashboard dono usi mein merge kar diye
gaye hain. Ek hi `npm run dev` se poora product chalega.

## Route map

| Path | Kya hai |
|---|---|
| `/` | Website home (marketing) |
| `/features`, `/pricing`, `/industries`, `/solutions`, `/managers-owners`, `/sales-executives`, `/book-demo` | Marketing pages |
| `/resources/*` | Help center, FAQs, guides, etc. |
| `/login` | Login form → submit hone par `/app` pe le jaata hai |
| `/app` | Dashboard home (jo pehle standalone "owner dashboard" tha) |
| `/app/leads` | Leads module |
| `/app/customers` | Customers list |
| `/app/customers/:slug` | Customer detail page |
| `/app/pipeline`, `/app/tasks`, `/app/calendar`, `/app/inbox`, `/app/quotations`, `/app/reports`, `/app/settings`, `/app/team`, `/app/activity`, `/app/ai-assistant`, `/app/notifications`, `/app/follow-ups` | Baaki saare dashboard modules |

## Kya kiya gaya (is baar)

Pehle website aur dashboard do alag apps the (dono ka apna `/` route tha,
isliye ek app mein force nahi ho sakte the bina clash ke). Ab:

1. **Dashboard ke saare routes `/app/*` ke andar move kiye gaye** —
   `routes/index.tsx` → `routes/app/index.tsx`, `routes/leads.tsx` →
   `routes/app/leads.tsx`, etc. Isse website apna `/` rakh sakta hai aur
   dashboard `/app` ke neeche live karta hai — koi path clash nahi.
2. **Sab internal links update kiye** — dashboard ke andar jahan bhi
   `to="/leads"`, `to="/customers"` type links the, sabko `/app/...` prefix
   diya gaya (sidebar nav, widgets, breadcrumbs — sab jagah).
3. **Customers module** (jo pichli baar merge kiya tha) is single-app
   structure mein bhi saath aaya: `/app/customers` (list) +
   `/app/customers/:slug` (detail).
4. **Shared code merge** — `components/ui`, `lib/utils.ts`,
   `lib/error-*.ts` — ye dono projects mein identical the, so ek hi copy
   rakhi. Dashboard-specific cheezein (`components/dashboard`,
   `components/leads`, `app-shell.tsx`, `crm-data.ts`, `leads-data.ts`,
   `customers-data.ts`, etc.) website ke src mein add ki gayin.
5. **Login page** ab external URL pe redirect nahi karta — same-app
   navigation se seedha `/app` pe le jaata hai.
6. **`package.json`, `vite.config.ts`, `tsconfig.json`** — dono projects
   mein already identical the, so koi conflict/merge nahi karna pada.

## Run karna

```bash
cd syntrixa360
npm install
npm run dev
```

Ye ek hi dev server start karega jisme website + dashboard dono chalenge
(default: `http://localhost:3000`).

```bash
npm run build      # production build
npm run preview    # built version preview
```

**Verified:** `npm install`, `npm run build`, aur `npm run dev` — teeno
maine actually chala kar test kiye hain. Dev server pe in routes ko hit
kiya aur sab `200 OK` aaye: `/`, `/app`, `/app/leads`, `/app/customers`,
`/app/customers/shreeji-traders`, `/login`, `/pricing`, `/features`,
`/book-demo`.
