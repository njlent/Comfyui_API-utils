# ComfyUI_API-utils

Frontend-only ComfyUI custom node pack for Comfy credits visibility and API node pricing hints.

## Features

- Top-bar credits widget with current balance and USD value.
- Optional top-bar refresh button.
- Manual refresh command for credits data.
- Auto-refresh while ComfyUI is visible.
- Sign-in shortcut to `Settings > User` when no Comfy auth token is available.
- Bottom-panel `Credits Analytics` tab.
- `Extensions > Credits Analytics` menu commands.
- Preset analytics windows: last hour, day, week, month, and all time.
- Custom analytics window from 1 to 3650 days.
- Provider and model filters.
- Overview dashboard with balance, top model, run count, and spend.
- Stacked usage chart grouped by provider or model.
- Provider/model share donut chart.
- Top model leaderboard with credits, USD, share, and run count.
- Window snapshot cards for quick range comparison.
- Activity table with paginated API usage and cloud workflow events.
- Recent billing ledger with top-ups and usage charges.
- Credits-added view with total added, USD value, top-up count, latest top-up, and paginated history.
- API node USD estimate badges next to Comfy credit badges.
- Settings toggles for:
  - credits widget
  - estimated USD badges on API nodes
  - widget refresh button
- Personal Comfy credits support via `/customers/*` billing endpoints.
- Workspace billing support via `/billing/*` endpoints.
- Firebase/auth-store discovery for current Comfy cloud sessions.
- No extra Python dependencies.

## Pricing Estimates

- Uses the current Comfy UI conversion ratio: `211 credits = $1`.
- Uses raw billing events when Comfy exposes usable credit or USD values.
- When raw credit values cannot be read, credits are estimated from available price, token count, duration, endpoint, model, and provider metadata.
- Estimation support currently covers known OpenAI, Gemini/Vertex AI, xAI, BytePlus, Stability, WaveSpeed, Kling, and Comfy Cloud workflow patterns present in billing events.

## Accuracy Disclaimer

Credit and USD numbers are estimates, not official billing records.

Some Comfy API billing events do not expose raw credit values in a directly readable form. For those events this extension estimates credits from current or known price tables and token/count/duration metadata. These numbers are not completely exact and can deviate by around 10% for some nodes.

Deviations are more likely when API prices changed over time, especially when a model or provider became cheaper after older runs. The extension does not have historical API pricing data, so older events may be recalculated with newer assumptions.

For exact billing, use Comfy's official credits and billing pages.

## Install

1. Keep this folder in `ComfyUI/custom_nodes/ComfyUI_api-enhance`.
2. Restart ComfyUI.
3. Sign in to your Comfy account in `Settings > User`.
4. Open the analytics panel from the top-bar widget or `Extensions > Credits Analytics`.

## Notes

- This extension reads Comfy billing/account endpoints already used by the official UI.
- API node USD badges are only shown for API nodes that already expose a Comfy credits price badge.
- The extension is frontend-only: `__init__.py` only registers the `web/` directory.
