# Halloumi Fact-Checking Middleware

This middleware proxies fact-checking requests to the **rag-fact-checker** service (https://github.com/eea/rag-fact-check), which replaces the original Halloumi LLM-based integration.

## Architecture

```
Frontend (useQualityMarkers.js)
  → POST /_v1_ha/generate
    → Express middleware (middleware.js)
      → POST {RAG_FACT_CHECKER_URL}/halloumi/generate
        → rag-fact-checker FastAPI service
```

The rag-fact-checker's `/halloumi/generate` endpoint is a drop-in replacement for the original Halloumi API — it accepts the same request format (`{answer, sources}`) and returns a compatible response (`{claims, segments}`), so all existing frontend components (`HalloumiFeedback`, `useQualityMarkers`, `MarkdownComponents`) work without changes.

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `RAG_FACT_CHECKER_URL` | `http://localhost:8000` | Base URL of the rag-fact-checker service |

## Original Halloumi

The original implementation was based on Apache2 licensed https://github.com/oumi-ai/halloumi-demo/tree/d088e1f25e7785326a53bc120113e226ee2f54b7

It used a custom LLM model (HallOumi-8B) accessed via an LLM gateway, with complex prompt preprocessing and logprob-based postprocessing. This has been replaced by the rag-fact-checker service which uses a claim extraction + per-claim verification pipeline.
