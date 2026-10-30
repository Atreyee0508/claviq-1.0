
# claviq-1.0
=======
# Taskflow

Taskflow is a full-stack to-do list with a React/Vite frontend, an Express REST API, and persistent SQLite storage through `better-sqlite3`.

## Local Development

Install workspace dependencies once:

```bash
cd /Users/atreyeepaul/react-app
npm install
```

Backend terminal:

```bash
cd /Users/atreyeepaul/react-app
npm run dev:backend
```

Frontend terminal:

```bash
cd /Users/atreyeepaul/react-app
npm run dev:frontend
```

The local API runs on `http://localhost:3001` and the Vite app normally runs on `http://localhost:5173`.

## Environment Configuration

Copy the frontend example when local Vite overrides are needed. Vite loads `frontend/.env` automatically; backend hosting variables should be exported in the shell or entered in the Render dashboard. Do not commit the resulting `.env` files.

```bash
cp frontend/.env.example frontend/.env
```

Frontend variables:

- `VITE_API_URL`: API base URL including `/api`. Development defaults to `http://localhost:3001/api`; production requires this variable.

Backend variables:

- `PORT`: hosting-provided HTTP port; defaults to `3001` locally.
- `HOST`: bind host; defaults to `0.0.0.0` for Render compatibility.
- `CORS_ORIGIN`: comma-separated allowed browser origins. Leave empty for permissive local development, set it to the Vercel URL in production.
- `DATA_DIR`: directory containing `tasks.db`. Set this to the Render persistent disk mount.
- `DB_PATH`: optional explicit database file path. It takes precedence over `DATA_DIR` and preserves compatibility with existing deployments.

For a local backend shell, set variables explicitly, for example `DATA_DIR=/absolute/path/to/backend/data npm run dev:backend`. The `.env.example` file documents the backend names for Render and other process managers.

## Vercel Frontend

Create a Vercel project from this repository with the project **Root Directory** set to `frontend`. The included `frontend/vercel.json` configures Vite, `npm run build`, `dist`, and SPA route rewrites.

Set this Vercel environment variable for Preview and Production:

```text
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
```

The value is a public API URL, not a secret. Redeploy after changing it because Vite injects `VITE_*` variables at build time.

## Render Backend

The root `render.yaml` describes an Express web service using the repository root workspace scripts. It uses `npm ci --omit=dev`, starts `npm run start:backend`, checks `/api/health`, and mounts a 1 GB persistent disk at `/var/data`.

The Blueprint sets:

- `DATA_DIR=/var/data`, so SQLite survives deploys and restarts on the mounted disk.
- `NODE_ENV=production`.
- `CORS_ORIGIN` as a required dashboard value. Set it to the exact Vercel origin, such as `https://your-taskflow.vercel.app`.

Persistent disks require a paid Render service plan. Do not use an ephemeral filesystem for production SQLite data.

## Verification

```bash
npm run build
npm run lint
```

The API endpoints remain under `/api`: `GET /health`, `GET /tasks`, `GET /stats`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`, `GET/PATCH /notes`, and `GET/PATCH /self-care`.

## GitHub Setup

This checkout currently has no `.git` directory, so Git commands must be initialized manually. Review the staged file list before committing; `.env` files, SQLite databases, `backend/data`, build output, and Vercel metadata are ignored.

Replace the repository URL placeholder with the URL for the new empty GitHub repository. These commands do not run automatically:

```bash
cd /Users/atreyeepaul/react-app
git init
git add .
git status
git commit -m "Prepare Taskflow for deployment"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

If a remote already exists, inspect it with `git remote -v` before using `git remote set-url origin ...`; do not push until the remote and staged files are confirmed.

