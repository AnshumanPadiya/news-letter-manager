# Newsletter Manager — Extension UI Revamp (Side‑Panel First) — Design Doc

**Audience:** Coding agent (implementation), you (review)  
**Status:** Ready for implementation  
**Last updated:** 2026-02-12

---

## 1) Problem

The extension UI currently relies on a crowded top bar with many icons/tabs. As more features are added:
- discoverability drops (icons become ambiguous),
- misclicks increase (dense targets),
- navigation doesn’t scale inside the toolbar popup.

Also, the toolbar popup is inherently constrained and transient: its size is limited (25×25 to 800×600) and it **auto-closes** as soon as focus leaves the popup—making it a bad place for multi-step flows.

---

## 2) Decision (no “website”)

We will **not** build a hosted dashboard/website. Instead, we’ll use **extension-native surfaces**:

1. **Toolbar Popup** → quick actions + status (fast, minimal)  
2. **Side Panel (Primary workspace)** → full navigation and day-to-day management (persistent)  
3. **Options Page** → settings/configuration  
4. *(Optional)* **Manager Window (extension popup window)** → rare “big views” like analytics / bulk export

Side Panel is purpose-built for a persistent extension UI and can be opened programmatically on user interaction (Chrome 116+) and/or on action click via panel behavior.

---

## 3) Goals / Non-goals

### Goals
- Keep the toolbar popup lightweight and instantly usable.
- Move “many sections” into a scalable navigation structure.
- Reduce icon sprawl (only a few top-bar actions; rest in overflow).
- Make complex tasks possible without a hosted web app.

### Non-goals
- No hosted backend changes for UI only.
- No “full-fledged website” deployment.

---

## 4) UX Surfaces & Responsibilities

### 4.1 Toolbar Popup (Quick Actions Only)
**Purpose:** single-step actions + quick status.

**Why:** popup is size-limited and auto-closes when user clicks outside, so it’s a bad fit for multi-step navigation and dense toolbars.

**Must include**
- 1 primary CTA (choose one): **Save current page** / **Add newsletter** / **Open Inbox**
- Minimal status: sync state, connected account, last error (if any)
- Recent items (3–5)
- Buttons:
  - **Open Side Panel**
  - **Settings** (Options page)

**Must NOT include**
- global navigation tabs
- heavy lists/tables/analytics
- multi-step editors

---

### 4.2 Side Panel (Primary Workspace)
**Purpose:** the real “app” UX without becoming a website.

**Key properties**
- Extension UI hosted in the browser side panel.
- Can remain open while navigating between tabs (depending on how you configure behavior).
- Can be opened via action-click behavior or programmatically via `chrome.sidePanel.open()` (Chrome 116+).

**Navigation model inside side panel**
- Left **navigation rail/drawer** with groups
- Top bar with **2–3 actions max** + overflow `⋯`
- Tabs only as **secondary navigation** within a section (not global)

---

### 4.3 Options Page (Settings)
Settings live in an options page (either full page or embedded). You can open it via `chrome.runtime.openOptionsPage()`.

**Put here**
- account/integration config
- sync schedule
- privacy/storage choices
- theme/UI toggles
- import/export defaults

---

### 4.4 Optional: Manager Window (Extension “Popup” Window)
For rare screens that are uncomfortable in a side panel (wide tables, complex analytics), open an extension page in its own window:

- `chrome.windows.create({ type: "popup", url, width, height })`

This is **not a website**—it’s still packaged with the extension.

---

## 5) Information Architecture (Side Panel)

### 5.1 Primary destinations (stable)
Keep top-level destinations limited and recognizable:

1. **Inbox / Queue**
2. **Collections / Lists**
3. **Rules / Automations**
4. **Insights** *(lightweight analytics; heavy analytics → Manager Window if needed)*
5. **Settings** *(or link to Options)*

### 5.2 Secondary destinations (group or overflow)
- Import / Export
- Integrations
- Help / Feedback / About

### 5.3 Tabs policy (strict)
Tabs are only for sibling views inside a destination:
- Inbox → `Unread | Saved | Archived`
- Insights → `Overview | Sources | Trends`

No global “tab strip” for the whole app.

---

## 6) Top Bar & Icon Rules (Fixing the crowded navbar)

### Rules
1. **Max 2–3 visible actions** in the side panel top bar.
2. Everything else goes into overflow `⋯`.
3. Icon-only buttons must have:
   - tooltip
   - `aria-label`
4. Primary actions should be labeled (icon + text) where possible.

---

## 7) Core Flows

### Flow A: First run
1. User opens popup
2. If not configured:
   - show **Open Settings**
   - show **Open Side Panel**
3. Side panel shows onboarding checklist

### Flow B: Quick save (popup)
1. Click extension icon
2. Press **Save this page**
3. Confirm toast + “View in Side Panel”

### Flow C: Triage (side panel)
1. Side panel → Inbox
2. List + keyboard shortcuts
3. Bulk select + actions

### Flow D: Rules
1. Side panel → Rules
2. Create/edit rule
3. Test rule on sample
4. Enable toggle

### Flow E: Heavy analytics / export (optional window)
1. Side panel overflow → “Open Analytics” or “Open Export”
2. Opens Manager Window (popup window)
3. Complete task without cramped layout

---

## 8) Implementation Notes (for coding agent)

### 8.1 `manifest.json` (MV3)

**Side panel**
- Add `"permissions": ["sidePanel"]`
- Add:
```json
"side_panel": { "default_path": "sidepanel.html" }
```

**Options**
Pick one:
- Full page:
```json
"options_page": "options.html"
```
- Embedded:
```json
"options_ui": { "page": "options.html", "open_in_tab": false }
```

**Popup**
```json
"action": { "default_popup": "popup.html", "default_title": "Newsletter Manager" }
```

---

### 8.2 Open side panel from popup (recommended)
From `popup.html`, on button click:
- call `chrome.sidePanel.open({ windowId })` (requires user gesture; supported Chrome 116+)

If you want “click toolbar icon opens side panel”:
- set:
```js
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
```

> Note: If you enable open-on-action-click, you may choose to remove the action popup entirely, but keeping the popup is useful for “quick save” UX.

---

### 8.3 Options open
From popup or side panel:
```js
chrome.runtime.openOptionsPage()
```

---

### 8.4 Optional Manager Window
For “big views”:
```js
chrome.windows.create({
  type: "popup",
  url: chrome.runtime.getURL("manager.html"),
  width: 1100,
  height: 800
})
```

---

## 9) Acceptance Criteria (Definition of Done)

### Popup
- No global navigation tabs.
- 1 primary action + status + 3–5 recent items.
- Has **Open Side Panel** and **Settings**.
- Works cleanly within popup limits; avoids multi-step flows.

### Side Panel
- Has drawer/rail navigation for all major sections.
- Top bar actions ≤ 3 + overflow.
- Tabs only inside sections.
- Main management tasks possible without leaving browsing context.

### Options
- All settings available here; opened via `openOptionsPage()`.

### Optional Manager Window
- Opens only for “big” tasks (heavy analytics/export), via `windows.create({ type: "popup" })`.

---

## 10) Phased Rollout

### Phase 1 (Fast win)
- Replace icon-row “tabs” in popup with:
  - 1 primary CTA
  - overflow menu
  - Open Side Panel
- Add Side Panel shell + navigation groups

### Phase 2
- Move all multi-step workflows into side panel
- Add keyboard shortcuts + bulk actions for Inbox

### Phase 3 (Optional)
- Add Manager Window for heavy analytics/export
- Polish onboarding + power-user UX

---

## 11) Reference Links (authoritative)
```text
chrome.sidePanel API: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
Side panel launch blog: https://developer.chrome.com/blog/extension-side-panel-launch
Add a popup (auto-close behavior): https://developer.chrome.com/docs/extensions/develop/ui/add-popup
chrome.action API (popups): https://developer.chrome.com/docs/extensions/reference/api/action
Options page guide: https://developer.chrome.com/docs/extensions/develop/ui/options-page
chrome.windows API: https://developer.chrome.com/docs/extensions/reference/api/windows
```
