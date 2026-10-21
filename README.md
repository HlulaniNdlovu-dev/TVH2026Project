# PowerLink: Smart Outage Management (prototype)

PowerLink joins **citizens**, **technicians** and the **municipality** on one live platform, from the moment the power
goes off until it is back on. Smart meters, transformer sensors and substation sensors report automatically, so faults
are found before anyone calls.

```
Report outage -> Verify / deduplicate -> Prioritise -> Dispatch -> Assign technician
   -> Track -> Repair -> Notify customer -> Close -> Analyse
```

## Three parts

| Folder | What it is | Port |
| --- | --- | --- |
| `client/` | React (Vite) web app: landing, citizen PWA, technician PWA, admin portal, and the simulator control panel at `/simulator`. Plain CSS. | 5173 |
| `server/` | Express API. All data is kept **in memory** and loaded from the demo seed every time it starts (no database). Reached only through `server/src/db/stubs.js`. | 4000 |
| `simulator/` | Pretends to be the sensors and technician phones. The API runs it inside its own process by default; it can still run on its own. | (5050 when standalone) |

## Run it

You need Node 18 or newer. Nothing else: there is no database to install.

```bash
# one time
npm --prefix server install
npm --prefix client install
```

Then, in two terminals from this folder:

```bash
npm --prefix server run dev
```

```bash
npm --prefix client run dev
```

Then open:

- App: <http://localhost:5173>
- Simulator control panel: <http://localhost:5173/simulator> (also the **Open the sensor simulator** button on the login page)
- On a phone on the same Wi-Fi: `http://<your-computer-ip>:5173` (Vite prints the address).

Every restart of the server (and **Reset demo data** in the admin sidebar or the simulator) puts all data back to the seed.

## Logging in (no sessions)

There are no sessions and nothing is saved in the browser. Logging in looks up the account and opens that person's pages,
and the user id is part of the address:

- `/citizen/U-1001/dashboard`
- `/technician/T-101/tasks/JOB-1043`
- `/admin/A-001/grid`

Refreshing keeps you on the same page as the same person, and every tab can be a different person, so a citizen, a technician
and the admin can sit side by side in one browser. An id that does not exist (for example an account registered before the
server restarted) shows "account not found" with a link back to login.

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
within 5 seconds.

## Suggested demo script

Log in as a citizen on a phone (or a tab), a technician in another tab and the admin on the laptop. Keep `/simulator` open.

1. **Single house fault.** Simulator: *Trip a customer's meter*. An incident appears straight away (low priority). The
   citizen sees the card; the technician gets a job.
2. **Transformer failure.** Simulator: *Fail transformer* (Transformer 2 is Thandi's rental). Six houses go dark and
   become **one** incident (no duplicates). Reports from neighbours are grouped into it.
3. **Verification and priority.** Report an outage as Sipho and Lerato: the second reporter verifies it. Report a
   *downed power line* to see it jump to critical. Admin overrides the priority (a reason is required).
4. **Repair.** Technician accepts (or declines with a reason), taps *Start travelling*, the simulator drives them to the
   site in about 12 seconds (the citizen sees stages and an ETA, never a location), taps *Start Job*, pauses with a delay
   code, resumes and completes with the close-task form.
5. **Restoration.** Closing the job asks the simulator to restore power; sensors report ON. The citizen gets
   "Power restored" and the dashboard card stays until that notification is opened.
6. **Loadshedding.** Simulator: *Start loadshedding* (tick the overrun box to see it become a real fault as soon as the
   slot ends). Outages inside the window are marked loadshedding and nobody is dispatched.
7. **Analyse.** Admin dashboard, live map, analytics (30 days of seeded history), audit log.

## How it works (short version)

- **Grid model:** substation -> transformer -> house. Every node has a sensor.
- **Root cause:** when nodes report OFF, the highest failed node becomes the incident. 20 dark houses under a dead
  transformer are one incident, not 20.
- **Priority:** an explainable score (customers, critical facilities, vulnerable customers, danger reports, weighted
  citizen reports, sensor confirmation, waiting time). Reports made away from the registered meter count for less
  than reports from the property. Admins can override with a reason.
- **Auto-assignment:** closest available, least busy, qualified technician, highest priority first. Technicians
  qualified for substations are kept free for transformer and substation faults where possible. A declined job moves
  to the next technician; an unanswered offer stays with its technician until they respond or an admin reassigns it.
- **Real time:** the server checks the grid every second and screens poll the API every 1.5 to 3 seconds (no websockets needed).

## Configuration (all optional)

| Where | Variable | Default | Purpose |
| --- | --- | --- | --- |
| server | `PORT` | 4000 | API port |
| server | `RUN_SIMULATOR` | `true` | `false` runs the API without the built-in simulator (then run `simulator/` on its own) |
| server | `OUTAGE_DEBOUNCE_SECONDS` | 0 | how long a sensor must stay off before it counts |
| server | `LOADSHEDDING_GRACE_MINUTES` | 0 | how long after a slot before an outage is treated as a fault |
| server | `DEVICE_KEY` | `powerlink-sim-key` | shared key a standalone simulator sends |
| server | `DRIVE_SECONDS` | 12 | how long a technician's simulated drive to the site takes |
| client | `VITE_API_URL` | `http://<host>:4000/api` | API address when the app is hosted |
| simulator (standalone) | `API_URL` | `http://localhost:4000/api` | API address to send readings to |
| simulator (standalone) | `DEVICE_KEY` | `powerlink-sim-key` | must match the server |

## Hosting on Render

| Piece | Render type | URL |
| --- | --- | --- |
| `server/` (with the built-in simulator) | **Web Service** | https://tvh2026project-server.onrender.com |
| `client/` | **Static Site** | https://tvh2026project-client.onrender.com |

Deploy from the `dev` branch. There is no database and no separate simulator service any more.

**Backend** (Web Service, one instance only). Leave **Root Directory empty** (the server loads the simulator from the
`simulator/` folder next to it), Build `npm --prefix server install`, Start `npm --prefix server start`. No environment
variables are needed. Health check path: `/health`. The allowed frontend defaults to
`https://tvh2026project-client.onrender.com`; set `FRONTEND_URL` if the site lives elsewhere. Pick the **Frankfurt** region
(closest to South Africa).

**Frontend** (Root Directory `client`, Build `npm install && npm run build`, Publish Directory `dist`). No variables needed: on
`localhost` or a Wi-Fi address it uses port 4000 of that machine, anywhere else it uses
`https://tvh2026project-server.onrender.com/api`. Set `VITE_API_URL` to override (it is read at build time, so redeploy after
changing it). Render does not read the `_redirects` file, so add the rewrite rule in the dashboard under Redirects/Rewrites:
source `/*`, destination `/index.html`, action Rewrite. This also makes `/simulator` work.

**Free plan sleep.** A free web service sleeps after about 15 minutes without requests and takes up to a minute to wake.
The client pings the server as soon as it loads and shows "Waking up the server" on the login page until it answers. Open
the site a few minutes before presenting. Waking up is a restart, so the data goes back to the seed.

## Prototype limits (by design)

- Data lives in memory only (`server/src/db/stubs.js`). A restart, a deploy or a Render sleep resets everything to the seed.
  Every other file goes through `stubs.js`, so a real database can be plugged in there later without touching the services.
- No real authentication: the user id in the address says who you are, and the client sends it in a header. Passwords
  are stored as plain text. Do not use with real data.
- SMS and push are simulated (in-app notifications).
- Technician GPS comes from the simulator; navigation opens Google Maps.
