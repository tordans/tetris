# Tetris

Ein kindgerechtes Tetris-Spiel als Progressive Web App (PWA). Baue Reihen aus bunten Blöcken, sammle Punkte und versuche deinen Rekord zu schlagen — optimiert für Touch-Geräte wie iPhone und iPad.

![Screenshot des Spiels](docs/screenshot.png)

> Screenshot-Platzhalter: Lege eine Bilddatei unter `docs/screenshot.png` ab.

## Entwicklung

Voraussetzungen: [Bun](https://bun.sh)

```bash
bun install
bun run dev       # Entwicklungsserver (http://localhost:5173)
bun test          # Tests ausführen
bun run typecheck # TypeScript prüfen
bun run build     # Produktions-Build nach dist/
bun run preview   # Build lokal testen
```

PWA-Icons neu generieren:

```bash
bun run generate-icons
```

## Auf dem iPhone installieren

1. Öffne die App in **Safari** (nicht in anderen Browsern).
2. Tippe auf **Teilen** (Quadrat mit Pfeil nach oben).
3. Wähle **„Zum Home-Bildschirm"**.
4. Bestätige mit **Hinzufügen**.

Die App startet dann im Vollbildmodus wie eine native App.

Layout-Hinweise für Standalone-Modus: [docs/ios-pwa-fullscreen.md](docs/ios-pwa-fullscreen.md).

## Deployment auf GitHub Pages

1. Repository auf GitHub anlegen und lokal pushen:

   ```bash
   git remote add origin git@github.com:<user>/<repo>.git
   git push -u origin main
   ```

2. In den Repository-Einstellungen unter **Pages** als Source **GitHub Actions** wählen.

3. Ab dann deployt jeder Push auf `main` automatisch über den Workflow `.github/workflows/deploy.yml`.

Die App ist danach unter `https://<user>.github.io/<repo>/` erreichbar (z. B. `https://example.github.io/game-tetris/`).

Lokal mit dem gleichen Base-Pfad wie auf GitHub Pages testen:

```bash
VITE_BASE=/game-tetris/ bun run build
bun run preview
```

## Steuerung

| Aktion | Tastatur | Touch |
|--------|----------|-------|
| Links / Rechts | Pfeiltasten | Steuerungsbuttons |
| Drehen | ↑ oder Leertaste | ⟳-Button oder Tipp aufs Spielfeld |
| Schneller fallen | ↓ halten | ↓-Button oder Wisch nach unten aufs Spielfeld |
| Pause | P | Pause-Button |

## Technik

- Vite + React 19 + TypeScript
- Spiel-Engine in `src/engine/` (reine Logik, getestet)
- Canvas-Renderer in `src/game/`
- Deutsche UI in `src/ui/`
- PWA via `vite-plugin-pwa`
