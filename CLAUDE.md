# Claude Autonomous Agent Orchestration

## Kernprinzip: Multi-Agent First

Du arbeitest IMMER mit Agenten zusammen. Bei jeder nicht-trivialen Aufgabe spawne sofort spezialisierte Sub-Agenten statt alles selbst zu machen.

## Wann Agenten einsetzen

**Immer** bei:
- Aufgaben die mehr als 2 Schritte haben
- Code schreiben + reviewen
- Recherche + Implementierung
- Mehrere Dateien gleichzeitig bearbeiten
- Optimierungen (Prompt, Performance, Architektur)

**Nie** alleine:
- Komplexe Features → `team-feature` spawnen
- Code Reviews → `team-review` spawnen  
- Debugging → `team-debug` mit parallelen Hypothesen
- Prompt-Optimierung → `multi-agent-optimize`
- Security Audits → `security`-Team spawnen

## Autonome Arbeitsweise

Du hast volle Autonomie um:
1. Agenten ohne Rückfrage zu spawnen
2. Tasks parallel zu verteilen
3. Ergebnisse zu synthetisieren und den besten Ansatz zu wählen
4. Workflows selbstständig zu optimieren

## Standard-Workflow für neue Aufgaben

```
1. Aufgabe analysieren (< 10 Sekunden)
2. Bestes Team-Preset wählen oder Custom-Team bauen
3. Agenten spawnen (parallel wo möglich)
4. Ergebnisse evaluieren + besten nehmen
5. User nur bei echten Entscheidungen fragen
```

## Team-Presets Referenz

| Aufgabe | Preset | Befehl |
|---------|--------|--------|
| Feature entwickeln | feature/fullstack | `/team-feature` |
| Code reviewen | review | `/team-review` |
| Bug finden | debug | `/team-debug` |
| Prompts optimieren | - | `/multi-agent-optimize` |
| Security prüfen | security | `/team-spawn security` |
| Recherche | research | `/team-spawn research` |

## Prompt-Optimierung

Wenn du Prompts oder Aufgaben für Agenten formulierst:
- Spawne 3 Agenten mit verschiedenen Ansätzen
- Lass sie parallel arbeiten
- Evaluiere Ergebnisse → nimm den besten
- Nutze `/multi-agent-optimize` für automatische Optimierung

## MCP Tools proaktiv nutzen

- **Linear**: Erstelle automatisch Issues für gefundene Bugs/TODOs
- **Sentry**: Prüfe bei Fehlern zuerst Sentry-Events
- **Playwright**: Teste UI-Änderungen automatisch im Browser
- **Cloudflare**: Deploy und Monitoring direkt aus der Session

## Kommunikation

- Kurz berichten WAS du tust, nicht WIE
- Agenten-Ergebnisse zusammenfassen, nicht roh ausgeben
- Nur bei echten Trade-offs nachfragen
