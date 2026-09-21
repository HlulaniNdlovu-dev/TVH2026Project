# PowerLink: Smart Outage Management (prototype)

PowerLink joins **citizens**, **technicians** and the **municipality** on one live platform, from the moment the power
goes off until it is back on. Smart meters, transformer sensors and substation sensors report automatically, so faults
are found before anyone calls.

```
Report outage -> Verify / deduplicate -> Prioritise -> Dispatch -> Assign technician
   -> Track -> Repair -> Notify customer -> Close -> Analyse
```

## Three separate applications

| Folder | What it is | Port |
| --- | --- | --- |
| `client/` | React (Vite) web app: landing, citizen PWA, technician PWA, admin portal. Plain CSS. | 5173 |
| `server/` | Express API backed by a **MySQL** database, reached only through `server/src/db/stubs.js`. | 4000 |
| `simulator/` | Pretends to be the sensors and technician phones. Has its own control panel. | 5050 |

## Run it

You need Node 18 or newer and a MySQL server (8.x or MariaDB) on localhost. Open three terminals from this folder.

```bash
# one time
npm --prefix server install
npm --prefix client install
npm --prefix simulator install
```

Copy `server/.env.example` to `server/.env` and set `DB_PASSWORD` if your MySQL root user has one. The `powerlink` database, its tables and
the demo data are created automatically on first start.

```bash
npm --prefix server run dev
```

```bash
npm --prefix client run dev
```

```bash
npm --prefix simulator run dev
```

Then open:

- App: <http://localhost:5173>
- Simulator control panel: <http://localhost:5050>
- On a phone on the same Wi-Fi: `http://<your-computer-ip>:5173` (Vite prints the address).

Data now lives in MySQL and survives restarts. Use **Reset demo data** in the admin sidebar (or the
simulator panel) to reset without restarting.

## Demo accounts

| Role | Phone | Password |
| --- | --- | --- |
| Citizen (Thandi, 2 meters) | 082 123 4567 | `password` |
| Citizen (Sipho, same transformer as Thandi) | 083 123 4567 | `password` |
| Citizen (Lerato, same transformer) | 084 123 4567 | `password` |
| Technician (all skills) | 071 111 1111 | `password` |
| Technician | 072 222 2222 | `password` |
| Technician | 073 333 3333 | `password` |
| Technician (starts unavailable) | 074 444 4444 | `password` |
| Admin | 070 000 0000 | `admin` |

Citizens can register themselves. A meter number that already exists in the grid (for example `04100000005`) links you
to that sensor. A new 8 to 13 digit number creates a new sensor at your address pin, and the simulator picks it up
within 10 seconds.

## Suggested demo script

Log in as a citizen on a phone, a technician on another window and the admin on the laptop. Keep the simulator panel open.

1. **Single house fault.** Simulator: *Trip a customer's meter*. After ~10 s an incident appears (low priority). The
   citizen sees the card; the technician gets a job.
2. **Transformer failure.** Simulator: *Fail transformer* (Transformer 2 is Thandi's rental). Six houses go dark and
   become **one** incident (no duplicates). Reports from neighbours are grouped into it.
3. **Verification and priority.** Report an outage as Sipho and Lerato: the second reporter verifies it. Report a
   *downed power line* to see it jump to critical. Admin overrides the priority (a reason is required).
4. **Repair.** Technician accepts (or declines with a reason), taps *Navigate*, the simulator drives them to the site
   (the citizen sees stages and an ETA, never a location), taps *Start Job*, pauses with a delay code, resumes and
   completes with the close-task form.
5. **Restoration.** Closing the job asks the simulator to restore power; sensors report ON. The citizen gets
   "Power restored" and the dashboard card stays until that notification is opened.
6. **Loadshedding.** Simulator: *Start loadshedding* (tick the overrun box to see it become a real fault after the
   grace period). Outages inside the window are marked loadshedding and nobody is dispatched.
7. **Flicker.** *Flicker* drops power for 6 s. It is ignored and counted on the Sensors page.
8. **Analyse.** Admin dashboard, live map, analytics (30 days of seeded history), audit log.

## How it works (short version)

- **Grid model:** substation -> transformer -> house. Every node has a sensor.
- **Root cause:** when nodes report OFF for more than 10 s, the highest failed node becomes the incident. 20 dark
  houses under a dead transformer are one incident, not 20.
- **Priority:** an explainable score (customers, critical facilities, vulnerable customers, danger reports, weighted
  citizen reports, sensor confirmation, waiting time). Reports made away from the registered meter count for less
  than reports from the property. Admins can override with a reason.
- **Auto-assignment:** closest available, least busy, qualified technician, highest priority first. Declined or
  unanswered jobs move to the next technician.
- **Real time:** screens poll the API every 2 to 5 seconds (no websockets needed).

## Configuration (all optional)

| Where | Variable | Default | Purpose |
| --- | --- | --- | --- |
| server | `PORT` | 4000 | API port |
| server | `DEVICE_KEY` | `powerlink-sim-key` | shared key the simulator sends |
| server | `OUTAGE_DEBOUNCE_SECONDS` | 10 | how long a sensor must stay off before it counts |
| server | `LOADSHEDDING_GRACE_MINUTES` | 2 | how long after a slot before an outage is treated as a fault |
| client | `VITE_API_URL` | `http://<host>:4000/api` | API address when the app is hosted |
| simulator | `API_URL` | `http://localhost:4000/api` | API address to send readings to |
| simulator | `DEVICE_KEY` | `powerlink-sim-key` | must match the server |

## Hosting on Render

| Piece | Render type | URL |
| --- | --- | --- |
| MySQL | external (Render has no MySQL) e.g. Aiven, TiDB Cloud, Railway | connection string |
| `server/` | **Web Service** | https://tvh2026project-backend.onrender.com |
| `client/` | **Static Site** | https://tvh2026project.onrender.com |
| `simulator/` | **Web Service** (Node, always running) | your choice |

**Backend** (Root Directory `server`, Build `npm install`, Start `npm start`). Environment: `DATABASE_URL`, `DB_SSL=true` (if the
host needs TLS), `DEVICE_KEY` (any secret). Health check path: `/health`.

**Frontend** (Root Directory `client`, Build `npm install && npm run build`, Publish Directory `dist`). No variables needed: on
`localhost` or a Wi-Fi address it uses port 4000 of that machine, anywhere else it uses the hosted backend. Set `VITE_API_URL`
to override. Rewrite rule: `/*` to `/index.html` (the `_redirects` file covers this).

**Simulator** (Root Directory `simulator`, Build `npm install`, Start `npm start`). Environment:
`API_URL=https://tvh2026project-backend.onrender.com/api`, `DEVICE_KEY` (same as the backend).

## Prototype limits (by design)

- Data is stored in MySQL (tables in `server/src/db/schema.sql`, created automatically). The server loads the tables into memory at
  start and serves reads from there; writes are saved to MySQL in the background (and flushed on shutdown). This needs exactly ONE
  backend instance. Photos are read from MySQL on demand.
- No real authentication: the browser stores the user in `localStorage` and sends the id in a header. Passwords are
  stored as plain text. Do not use with real data.
- SMS and push are simulated (in-app notifications and an SMS inbox on the Notifications page).
- Technician GPS comes from the simulator; navigation opens Google Maps.
