# OpenMontage Architecture

> Last updated: 2026-03-28 | Derived from code exploration, not prior documentation.

OpenMontage is an **agent-orchestrated video production platform**. An LLM coding assistant (Claude Code, Cursor, Copilot, etc.) acts as the orchestrator — reading pipeline manifests, following skill instructions, calling Python tools, and checkpointing state. There is no runtime Python orchestrator; the agent _is_ the control plane.

---

## High-Level Flow

```
User gives topic/idea
        |
        v
Agent reads pipeline manifest (YAML)
        |
        v
For each stage:
   1. Agent reads stage-director skill (Markdown)
   2. Agent calls Python tools via tool registry
   3. Agent writes checkpoint (JSON) with artifacts
   4. Agent self-reviews using meta/reviewer skill
   5. Human approval gate (if configured)
        |
        v
Final video output
```

---

## Repository Layout

```
OpenMontage/
├── lib/                    # Core runtime infrastructure (Python)
│   ├── config_model.py     # Pydantic config: LLM, budget, checkpoint, output, paths
│   ├── checkpoint.py       # Pipeline state persistence & stage transitions
│   ├── pipeline_loader.py  # YAML manifest loading & validation
│   ├── media_profiles.py   # Platform-specific render profiles (YouTube, TikTok, etc.)
│   ├── env_loader.py       # .env variable management
│   └── providers/          # (Reserved for future provider abstractions)
│
├── tools/                  # 57+ Python tool implementations
│   ├── base_tool.py        # Abstract base class — the tool contract
│   ├── tool_registry.py    # Auto-discovery singleton registry
│   ├── cost_tracker.py     # Budget governance (estimate → reserve → reconcile)
│   ├── analysis/           # Transcription, scene detection, frame sampling, video understanding
│   ├── audio/              # TTS (ElevenLabs, OpenAI, Piper), music gen, mixing, enhancement
│   ├── avatar/             # Talking head animation, lip sync
│   ├── enhancement/        # Upscale, bg removal, face enhance/restore, color grading
│   ├── graphics/           # Image gen (FLUX, DALL-E, Recraft, local diffusion), stock, diagrams, code snippets, math animation
│   ├── publishers/         # (Reserved)
│   ├── subtitle/           # SRT/VTT generation from timestamps
│   └── video/              # 13 video gen providers, composition, stitching, trimming
│
├── pipeline_defs/          # YAML pipeline manifests
├── schemas/                # JSON Schema definitions for validation
│   ├── artifacts/          # 11 artifact schemas (brief → publish_log)
│   ├── checkpoints/        # Checkpoint state schema
│   ├── pipelines/          # Pipeline manifest schema
│   ├── styles/             # Style playbook schema
│   └── tools/              # Tool-specific schemas
│
├── skills/                 # Layer 2: OpenMontage-specific agent instructions
│   ├── core/               # FFmpeg, Remotion, WhisperX, color grading skills
│   ├── creative/           # Video editing, enhancement, data viz, prompt engineering
│   ├── meta/               # reviewer, checkpoint-protocol, skill-creator
│   └── pipelines/          # Per-pipeline stage-director skills
│
├── .agents/skills/         # Layer 3: external technology skills (FFmpeg, HyperFrames, GSAP, etc.)
├── styles/                 # Visual style playbooks (YAML) + loader
├── remotion-composer/      # Node.js/React — Remotion video composition renderer
├── tests/                  # Contract tests, QA integration tests, eval harness
├── docs/                   # Best-practices guides, session handoffs, audits
└── config.yaml             # Global runtime configuration
```
