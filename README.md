# Trading Journal

Persönliches, einzelnutzer-taugliches Trading-Journal (Ersatz für eine Notion-Lösung).
Cloud-Sync über Supabase, ruhiges Dark-Theme, Desktop-first und am Handy „zur Not" nutzbar.
Fokus: sauberes, manuelles Journaling — kein Live-Trading.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · React Router · TanStack Query ·
Zustand · Recharts · date-fns · browser-image-compression · Supabase (Postgres/Auth/Storage).

---

## Einrichtung

1. **Supabase-Projekt anlegen** (neues, eigenes Projekt).
2. **Schema ausführen:** Inhalt von [`supabase/schema.sql`](supabase/schema.sql) im Supabase
   SQL-Editor laufen lassen. Danach unter *Storage* prüfen, dass der Bucket `trade-images`
   existiert und **privat** ist.
3. **`.env` anlegen:** `.env.example` nach `.env` kopieren und ausfüllen:
   - `VITE_SUPABASE_URL` — Projekt-URL
   - `VITE_SUPABASE_ANON_KEY` — der öffentliche anon/publishable Key (durch RLS geschützt, darf
     im Client stehen). **Niemals** den `service_role`-Key committen.
4. **Nutzer anlegen:** Einmalig im Supabase *Auth*-Dashboard einen Nutzer (E-Mail/Passwort)
   erstellen. Es gibt kein öffentliches Registrieren.
5. **Starten:**
   ```bash
   npm install
   npm run dev
   ```

## Deploy (GitHub Pages)

1. Repo zu GitHub pushen (Name idealerweise `trading-journal`, damit der Basis-Pfad passt).
2. Unter **Settings → Secrets and variables → Actions** zwei Repo-Secrets anlegen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (Der Deploy-Workflow schreibt daraus beim Bauen die `.env` — der Key ist öffentlich/RLS-geschützt.)
3. Unter **Settings → Pages** als Source **„GitHub Actions"** wählen.
4. Push auf `main` (oder Workflow manuell starten) → `.github/workflows/deploy.yml` baut und deployed.

- `VITE_BASE` steuert den Basis-Pfad (Standard `/trading-journal/`). Heißt das Repo anders,
  passe das im Workflow an. Für eine eigene Domain `/` verwenden.
- Der `postbuild`-Schritt kopiert `index.html` → `404.html`, damit Deep-Links auf Pages funktionieren.
- **Optional:** `.github/workflows/keep-alive.yml` verhindert die 7-Tage-Pause des Supabase-Free-Tiers
  (leichter geplanter Request alle ~5 Tage). Nutzt dieselben Secrets; einfach löschen, wenn nicht gewünscht.

## Backup

Der Free-Tier hat **kein** automatisches Backup. Deshalb: regelmäßig über den
**CSV-Export** (Button oben rechts) sichern.

---

## Standard-Entscheidungen (hier anpassbar)

- **Assets:** Vorbelegt mit `MNQ`, `MES`; eigene können beim Eintragen ergänzt werden.
  → Startwerte im Asset-Auswahlfeld der Trade-Eingabe.
- **Setup-Tags:** Starten leer; werden beim Eintragen selbst angelegt (Tabelle `setups`).
- **Währung:** Standard `USD`.
- **Bild-Kompression:** `maxWidthOrHeight: 1600`, Ziel ~0,35 MB, WebP.
  → eine Konstante `COMPRESSION` in `src/features/trades/imageCompression.ts`.
- **Zahlen:** Vorzeichen vor Währungssymbol (`-$85`), Währung auf ganze Zahlen gerundet,
  R-Multiple mit 2 Nachkommastellen. → `src/lib/format.ts`.
- **GitHub-Pages-Basis-Pfad:** `/trading-journal/` (via `VITE_BASE`).
