# ComfyUI API Enhance

Frontend-only ComfyUI custom node pack.

Features:
- top-bar credits widget
- USD conversion
- API node USD pricing badge
- manual refresh
- bottom-panel analytics for Comfy credits usage
- model/provider breakdown
- last hour/day/week/month/all usage views
- recent credit ledger for top-ups + completed usage

Install:
1. Keep this folder in `ComfyUI/custom_nodes/ComfyUI_api-enhance`
2. Restart ComfyUI
3. Sign in to your Comfy account in `Settings > User`
4. Open the `Credits` analytics panel from:
   - top-bar widget button
   - `Extensions > Credits Analytics`

Notes:
- reads Comfy billing/account endpoints already used by the official UI
- uses the same current UI conversion ratio: `211 credits = $1`
- API nodes now show both credits and USD estimate badges
- supports both legacy personal-credit routes (`/api/customers/*`) and workspace billing routes (`/api/billing/*`)
- no extra Python deps
