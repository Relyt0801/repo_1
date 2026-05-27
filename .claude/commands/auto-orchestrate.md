# Auto-Orchestrate

Analysiere die Aufgabe und spawne automatisch das optimale Agenten-Team.

## Ablauf

1. **Aufgabe klassifizieren**
   - Was ist das Ziel?
   - Welche Expertise wird benötigt?
   - Wie viele parallele Streams sinnvoll?

2. **Team-Typ wählen**
   - `feature` → Neue Funktionalität
   - `review` → Code-Qualität prüfen
   - `debug` → Fehler finden
   - `research` → Informationen sammeln
   - `security` → Sicherheit prüfen
   - `fullstack` → Frontend + Backend + Tests
   - `custom` → Spezialfall

3. **Agenten spawnen** (immer parallel)
   - Team erstellen via TeamCreate
   - Jeden Agenten mit klarem Scope starten
   - File-Ownership definieren (kein Konflikt)

4. **Ergebnisse evaluieren**
   - Alle Outputs vergleichen
   - Besten Ansatz wählen oder kombinieren
   - Zusammenfassung an User

## Nutzung

```
/auto-orchestrate <Aufgabenbeschreibung>
```

Beispiele:
- `/auto-orchestrate Optimiere die Performance der API`
- `/auto-orchestrate Erstelle eine Landing Page für SaaS`
- `/auto-orchestrate Finde alle Sicherheitslücken im Code`
