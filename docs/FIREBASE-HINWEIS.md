# Firebase-Reste in ArtisPlan

| Metadatum | Wert |
|-----------|------|
| **Status** | Hinweis, Aktion offen |
| **Dokumentstand** | 2026-11-19 |
| **Datenstand** | Repo-Stand `main` (23a618a). Das Live-Firebase-Projekt wurde **nicht** abgefragt. |

## Kurzfassung

ArtisPlan nutzt Firebase nicht mehr. Der Code wurde am 2026-08-24 auf Nextcloud-WebDAV umgestellt
(Commit `8e70c23`, `src/lib/firebase.ts` entfiel). Übrig blieb `firebase-applet-config.json`, die
nirgends importiert wurde. Diese PR entfernt die Datei und versioniert Sperr-Regeln für Firestore.
Weil das Repo öffentlich ist, bleiben Projekt-ID und Web-Key in der Git-Historie (Commit `6d29d38`).

## Was ist öffentlich und unkritisch, was nicht

| Wert | Einstufung | Begründung |
|------|-----------|------------|
| `apiKey` (Web-API-Key) | Öffentlich, **aber einschränken** | Firebase-Web-Keys identifizieren das Projekt und sind kein Geheimnis. Ohne Einschränkung kann ihn aber jeder für alle freigeschalteten Google-APIs des Projekts nutzen (Kosten, Missbrauch). |
| `projectId`, `appId`, `authDomain`, `storageBucket`, `messagingSenderId` | Öffentlich, unkritisch | Steckt in jedem ausgelieferten Web-Bundle. |
| `oAuthClientId` | Öffentlich, unkritisch | Ein OAuth-Client-ID ist kein Secret. Das Client-Secret stand nicht im Repo (gitleaks fand nur den API-Key). |
| `measurementId`, `recaptchaSiteKey` | Leer | Nichts zu tun. |

Der eigentliche Schutz liegt in **Firestore- und Storage-Regeln** und in der **Auth-Konfiguration**,
nicht im Verbergen des Keys. Im alten Code lief `signInAnonymously`. Ist die anonyme Anmeldung im
Projekt noch aktiv, kann jeder mit dem Key ein gültiges Auth-Token holen. Reicht eine Regel
`request.auth != null`, wäre damit Zugriff möglich. Die tatsächlich deployten Regeln liegen nicht im
Repo und sind von hier aus nicht prüfbar.

## Was in der Firebase-Konsole zu tun ist (manuell, nicht von dieser PR erledigt)

1. **Eigentum klären.** Der Commit `8e70c23` nennt `picas-9e875` ein Cloud-Projekt, an dem die App
   „keinen echten Besitz“ hat. Prüfen, ob es in deinem Google-Konto liegt. Wenn nicht, ist nur der
   Projekteigentümer handlungsfähig.
2. **API-Key einschränken** (Google Cloud Console → APIs & Dienste → Anmeldedaten): Anwendungs­einschränkung
   auf HTTP-Referrer der echten Domains, API-Einschränkung auf die tatsächlich genutzten APIs. Wird
   nichts mehr gebraucht, den Key löschen.
3. **Anonyme Anmeldung deaktivieren** (Authentication → Sign-in method), solange niemand sie nutzt.
4. **Regeln sperren**: `firestore.rules` aus diesem Repo deployen (`firebase deploy --only firestore:rules`
   nach `firebase login` und Projektwahl) oder die Regeln in der Konsole einfügen. Für Cloud Storage
   gilt dasselbe (`allow read, write: if false;`).
5. **Projekt stilllegen**, wenn es keinen Zweck mehr hat. Dann entfallen die Punkte 2 bis 4.

## Was diese PR ändert

- Entfernt `firebase-applet-config.json` (unreferenziert, `rg` ohne Treffer im Code).
- Neu: `firestore.rules` mit Vollsperre. Das ist nur Versionierung, es wirkt erst nach einem Deploy.
- Neu: dieses Dokument.

Nicht angefasst: README, `.env.example` (PR #5 entfernt dort schon den Merge-Marker) und alles Live-Seitige.
