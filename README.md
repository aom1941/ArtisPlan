# ArtisPlan Studio

Unendliche Skizzen-Leinwand im Browser, gebaut für Stift und Touch. Sie verbindet freies Zeichnen mit präziser Ausrichtung: magnetische Hilfslinien, Raster, Pinsel mit Stempeln, Versionsverlauf, Mood-Board, Zeitplan und Referenzgalerie. Alles läuft lokal. KI-Funktionen und Synchronisation sind optional und nutzen nur Dienste, die du selbst betreibst (Ollama, Nextcloud).

**Stand:** Prototyp (React 19, Vite 6, Tailwind 4, kleiner Express-Server). Läuft lokal, speichert im Browser. Gebaut aus einer Google-AI-Studio-Vorlage und danach auf Selbst-Hosting umgestellt.

## Was drin ist

Die Liste folgt dem Code (`src/`) und einer Laufprobe der Oberfläche. Touch-Gesten, Apple Pencil, Ollama und Nextcloud sind im Code vorhanden, ich konnte sie nicht mit Geräten und Diensten ausprobieren.

**Leinwand**
- Unendliche Fläche mit Verschieben und Zoomen, Hand- und Auswahlwerkzeug, Rückgängig und Wiederholen
- Zeichnen mit Stift, Pinsel, Bleistift, Textmarker und Radierer, einstellbare Linienglättung (`strokeStabilizer`), Pipette
- Formen, Haftnotizen, Textfelder, Anmerkungen mit Kommentaren, angeheftete Referenzbilder
- Ebenen mit Sichtbarkeit, Sperre und Deckkraft
- Suche über alle Objekte der Leinwand (`Strg/Cmd + F`)
- Wärmekarte, die zeigt, wo viel gezeichnet wurde
- Export als PNG, SVG, JPEG oder WebP in 1× bis 4×, mit Vorschau (`Strg/Cmd + E`)

**Ausrichten**
- Eigene horizontale und vertikale Hilfslinien: setzen, ziehen, sperren, färben, per Koordinate positionieren
- Vorlagen für Hilfslinien: Drittelregel, Kinoformat, Ursprung, Druckränder
- Magnetisches Einrasten an Kanten und Mitten mit Abstandsanzeige
- Raster: Linien, Punkte, Papier, Kreuze, Isometrisch, Dreieck

**Pinsel und Stempel**
- Brush Studio: Spitzenform, Härte, Winkel, Abstand, Streuung, Druck- und Textur-Einstellungen, Probefläche
- Vorgefertigte Pinsel und Stempel, eigene Presets importieren und exportieren

**Touch und Stift**
- Gesten: Pinch zum Zoomen, Zwei-Finger-Tipp (Rückgängig), Drei-Finger-Tipp (Wiederholen), Vier-Finger-Gesten
- „Stylus Lock" mit Handballen-Erkennung, Haptik, Anzeige der Fingerpfade

**Projekt**
- Zeitmaschine: Speicherpunkte, Vergleich zweier Stände, Zweig anlegen, JSON-Export
- Mood-Board: Palette, Schlüsselwörter, Licht- und Kompositionshinweise, Übernahme als Farbfelder
- Zeitplan mit Meilensteinen, Aufgabenlisten und Fortschritt, CSV-Export
- Referenzgalerie mit Kategorien, Suche und schwebendem Referenzfenster

## Starten

Voraussetzung: Node.js `20.19` oder neuer (oder `22.12+`), so verlangt es `@vitejs/plugin-react`.

```bash
git clone https://github.com/aom1941/ArtisPlan.git
cd ArtisPlan
npm install
npm run dev
```

Dann `http://localhost:5175` öffnen (anderer Port mit `PORT=<port>`). Es braucht keine Konfiguration und keinen Schlüssel.

Der Server lauscht standardmäßig nur auf `127.0.0.1` (Änderung mit `HOST=<adresse>`, z. B. `HOST=0.0.0.0` für alle Netzwerkadressen). Siehe Abschnitt „Sicherheit“.

| Befehl | Wirkung |
|---|---|
| `npm run dev` | Entwicklungsserver (Express und Vite in einem Prozess) |
| `npm run build` | Frontend bauen und `server.ts` nach `dist/server.cjs` bündeln |
| `npm run start` | den gebauten Server starten |
| `npm run lint` | Typprüfung mit `tsc --noEmit` |

Prüfstand: Typprüfung ohne Fehler, `npm install`, `npm run build` und Entwicklungsserver laufen (Antwort auf `/api/health`, Bindung nur an `127.0.0.1`). Es gibt keine automatisierten Tests.

## Optionale Anbindungen

Alles ist ohne Konfiguration abschaltbar. Vorlage: `.env.example`.

| Anbindung | Variablen | Wirkung |
|---|---|---|
| **Ollama** (KI) | `OLLAMA_URL`, `OLLAMA_MODEL` (Standard `http://127.0.0.1:11434`, `qwen2.5vl:7b`) | Mood-Board-Generator, Zeitplan-Generator und Anmerkungs-Kritik. Ist Ollama nicht erreichbar, liefert der Server **feste Vorgabewerte** und zeigt nicht an, dass es Vorgaben sind. |
| **Nextcloud** (Sicherung, Export) | `VITE_NEXTCLOUD_URL`, `VITE_NEXTCLOUD_USER`, `VITE_NEXTCLOUD_APP_PASSWORD` | Projekt-Sicherung als JSON, Projektbeschreibung als Markdown und Zeitplan als CSV über WebDAV nach `/ArtisPlan/exports`. |
| **Companion-Dashboard** (eigenes, nicht öffentliches Projekt) | `VITE_WERKSTATT_API_URL`, `VITE_WERKSTATT_TOKEN`, `VITE_WERKSTATT_DOMAIN_TAG`, `VITE_COMPANION_API_URL` | Meilensteine an ein separates Dashboard senden, Ideen-Pool importieren, Systemstatus zeigen. Ohne Konfiguration passiert nichts. |

Die Server-Schnittstelle in `server.ts`:

| Methode | Pfad | Wirkung |
|---|---|---|
| `GET` | `/api/health` | `{ status, timestamp }` |
| `POST` | `/api/ai/moodboard` | Mood-Board über Ollama, sonst Vorgabe |
| `POST` | `/api/ai/timeline` | Zeitplan über Ollama, sonst Fünf-Phasen-Vorgabe |
| `POST` | `/api/ai/critique` | Anmerkungs-Kritik über Ollama, sonst feste Hinweise |

## Sicherheit

- **`VITE_`-Variablen landen im Browser-Code.** Wer die Seite laden kann, kann `VITE_NEXTCLOUD_APP_PASSWORD` und `VITE_WERKSTATT_TOKEN` aus dem ausgelieferten JavaScript lesen. Deshalb nur auf einem Rechner nutzen, den nur du erreichst, und ein eigenes App-Passwort mit minimalen Rechten verwenden, das du jederzeit widerrufen kannst.
- **Die KI-Schnittstellen haben keine Anmeldung** und nehmen bis zu 50 MB pro Anfrage an. Nicht ins offene Netz stellen. Deshalb bindet der Server ohne `HOST` nur an `127.0.0.1`; wer `HOST=0.0.0.0` setzt, macht sie für das ganze Netzwerk erreichbar.
- Die Seite lädt Schriften von Google Fonts und Beispielbilder von Unsplash (siehe `index.html`, `src/lib/storage.ts`). Ohne Netz erscheinen Systemschriften und Platzhalter.

## Ordner

```
server.ts               Express: /api/ai/*, liefert in der Entwicklung Vite aus
src/App.tsx             Reiter: Canvas, Mood Board, Timeline, Ref Gallery, Workspace
src/components/         Canvas, Pinsel, Zeitmaschine, Mood-Board, Zeitplan, Galerie, Nextcloud
src/lib/                Raster, Ausrichtung, Pinsel, Gesten, Export, Speicher, Anbindungen
src/hooks/              Verlauf, Projektsitzung
```

## Tastenkürzel

| Aktion | Kürzel |
|---|---|
| Verschieben | Leertaste + Ziehen oder mittlere Maustaste |
| Zoomen | `Strg/Cmd` + Mausrad oder Pinch |
| Rückgängig | `Strg/Cmd + Z` oder Zwei-Finger-Tipp |
| Wiederholen | `Strg/Cmd + Umschalt + Z` oder Drei-Finger-Tipp |
| Alles auswählen | `Strg/Cmd + A` |
| Auswahl löschen | `Entf` oder `Rück` |
| Suche | `Strg/Cmd + F` |
| Export | `Strg/Cmd + E` |

## Lizenz

Noch nicht festgelegt. Es liegt keine `LICENSE`-Datei im Repository; bis eine Lizenz gewählt ist, gilt: alle Rechte vorbehalten.
