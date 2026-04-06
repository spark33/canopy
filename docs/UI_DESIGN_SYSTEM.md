# UI Design System

## Design Philosophy

AgentOps has a utilitarian, ops-tool aesthetic — closer to Datadog or Linear than to a consumer app. Clean surfaces, thin borders, generous whitespace, no decorative elements. The UI should feel like a control panel: dense with information but never cluttered. Every pixel earns its place.

The key tension: the dashboard needs to show a lot of live state (agents running, plans updating, checkpoints appearing) without feeling chaotic. We solve this with consistent card patterns, predictable layout regions, and color that encodes meaning rather than decoration.

## Reference Prototypes

Three HTML prototypes exist in `docs/prototypes/`. These are the source of truth for visual direction. When building components, open these files in a browser and match their look and feel.

- `prototype-a-task-dashboard.html` — **Primary reference.** The dashboard layout with plan sidebar + agent cards. This is the main view users will see. Match this layout, spacing, and card design.
- `prototype-b-canvas.html` — Dark-themed canvas view. Not building this for MVP, but shows the inspector panel pattern that the trace tab should reference.
- `prototype-c-document.html` — Document-first view. Reference for the Output tab: serif typography for document content, source annotations, inline conflict markers, activity sidebar pattern.

## Typography

**Primary font**: DM Sans (Google Fonts)
- Weights: 400 (body), 500 (headings, labels, emphasis), 600 (logo only)
- Never use 700/bold — 500 is the maximum for UI elements

**Document font**: Source Serif 4 (Google Fonts)  
- Used only inside the Output tab for artifact content
- Weights: 400 (body), 600 (section headings)

**Monospace**: IBM Plex Mono (for trace payloads, code blocks, technical metadata)
- Weight: 400 only

**Scale**:
| Use | Size | Weight | Line height |
|-----|------|--------|-------------|
| Page title | 18px | 500 | 1.3 |
| Section label | 11px | 600 | 1 |
| Card title | 13-14px | 500 | 1.4 |
| Body text | 13px | 400 | 1.6 |
| Metadata / captions | 11-12px | 400-500 | 1.4 |
| Badge text | 10-11px | 500 | 1 |
| Document body (Output tab) | 15px | 400 | 1.75 |
| Document heading (Output tab) | 18px | 600 | 1.3 |

**Section labels** are always: 11px, weight 600, uppercase, letter-spacing 0.5px, color text-tertiary. Used for "Execution plan", "Agent outputs", "Activity", etc.

## Color System

### Base palette (light theme — dark theme is a stretch goal)

```
Background:
  bg:           #FAFAF8     Page background
  surface:      #FFFFFF     Cards, panels, inputs
  surface-alt:  #F5F4F0     Subtle surface differentiation (plan sidebar, stat cards)

Text:
  text:           #1A1A18   Primary text
  text-secondary: #6B6A65   Body text, descriptions
  text-tertiary:  #9C9A92   Metadata, timestamps, placeholders

Borders:
  border:         rgba(0,0,0,0.08)   Default borders
  border-strong:  rgba(0,0,0,0.15)   Emphasized borders, input borders
```

### Semantic colors

Each color has three stops: a background tint (for badges/fills), a text color (for text on that tint), and a dot/accent color (for status indicators).

```
Purple (orchestrator):
  accent:     #534AB7
  accent-bg:  #EEEDFE
  accent-text:#3C3489

Teal (agents):
  teal:       #0F6E56
  teal-bg:    #E1F5EE
  teal-text:  #085041

Amber (checkpoints, warnings, running):
  amber:      #854F0B
  amber-bg:   #FAEEDA
  amber-text: #633806
  amber-dot:  #EF9F27

Green (success, done):
  green:      #3B6D11
  green-bg:   #EAF3DE
  green-text: #27500A

Red (errors, conflicts):
  red:        #A32D2D
  red-bg:     #FCEBEB

Coral (failures, blocked):
  coral:      #993C1D
  coral-bg:   #FAECE7
```

### Color assignment rules

Color encodes meaning, not decoration:
- **Purple** = orchestrator activity (orchestrator dot, reasoning blocks, orchestrator trace events)
- **Teal** = agent activity (agent dots, agent cards when completed, researcher trace events)
- **Amber** = needs attention (checkpoints, running tasks, awaiting input badges)
- **Green** = success/done (completed badges, done step indicators)
- **Red** = errors and conflicts (conflict detected trace events, failed tasks)
- **Gray** = neutral/structural (pending steps, tool call events, metadata)

Never use color for purely decorative purposes. If something is colored, it communicates status.

## Spacing & Layout

### Spacing scale
```
4px   — tight (inside badges, between dot and label)
8px   — compact (between metadata items, inside small cards)
12px  — default gap (between cards, between sections)
16px  — comfortable (panel padding, between major sections)
20px  — generous (workspace padding, plan panel padding)
24-28px — page padding (workspace horizontal padding)
```

### Border radius
```
6px   — small (badges, step indicators, inner elements)
8px   — default (buttons, inputs, small cards)
10-12px — cards (agent cards, stat cards)
14px  — large cards (orchestrator section, checkpoint cards)
16px  — panels (plan sidebar border-radius on inner sections)
20px  — page-level containers
```

### Border width
- Default: `1px solid var(--border)` for cards and panels
- Emphasized: `1.5px` for checkpoint cards (amber border)
- Subtle: `0.5px` used in prototypes but `1px` is fine for implementation

## Component Patterns

### Cards

**Agent card** (reference: prototype A, `.agent-card`):
```
Container: white bg, 1px border, 12-14px radius, 18px 20px padding
Header row: 8px colored dot + 13px bold name + right-aligned status badge
Body: 13px secondary-color text, 1.6 line height
Footer: flex row of 11px tertiary metadata items with 16px gap
```

**Agent card with checkpoint** (reference: prototype A, `.agent-card.checkpoint`):
```
Same as agent card but:
- Border: 1.5px amber (#EF9F27)
- Below the agent body, add checkpoint section:
  - Checkpoint label: 11px, amber, uppercase, with icon
  - Description: 13px, primary text color
  - Action buttons row: flex, 8px gap
    - Primary button: dark bg, light text
    - Secondary buttons: outlined, transparent bg
```

**Stat card** (reference: prototype A, `.stat-card`):
```
Container: white bg, 1px border, 12px radius, 14px 16px padding
Label: 11px uppercase, tertiary color, 0.3px letter-spacing
Value: 22px, weight 500, primary color
Sub-label: 11px, tertiary color
Grid: 4 columns, 12px gap
```

### Plan sidebar (reference: prototype A, `.plan-panel`)

```
Container: white bg, right border, 300px wide, 20px padding
Steps are stacked vertically with 4px margin-bottom
Each step: flex row, 12px gap, 10px 12px padding, 10px radius
  - Status indicator: 24px circle with icon/symbol
    - Done: green bg, checkmark
    - Running: amber bg, pulsing dot
    - Blocked: red bg, exclamation mark
    - Pending: surface-alt bg, dash
  - Content: step title (13px 500), agent type (11px tertiary), time (11px tertiary)
Active step: highlighted with accent-bg
Between steps: thin connector line (1px, 12px tall, centered under the circle)
```

### Status badges

```
Container: pill shape (border-radius: 20px), padding 4px 10px
Font: 11px, weight 500
Variants:
  - Done:    green-bg + green-text
  - Running: amber-bg + amber-text (text can pulse)
  - Blocked: red-bg + red text
  - Awaiting: amber-bg + amber-text
  - Mode badge: accent-bg + accent-text
```

### Input bar (reference: prototype A, `.input-bar`)

```
Container: flex row, white bg, 1px border-strong, 14px radius, 6px padding (right/top/bottom), 18px left padding
Input: no border, transparent bg, 14px text
Send button: 36px circle, dark bg, white arrow icon, 10px radius
Position: sticky bottom or fixed bottom of sprint view
```

### Trace events (reference: prototype C activity panel, prototype B inspector)

```
Each event: flex row with 10px gap, 14px padding-bottom, bottom border
  - Dot: 8px circle, colored by source_type
  - Content: flex column
    - Title: 12px weight 500
    - Description: 11px tertiary
    - Timestamp: 10px tertiary
    - Optional expand link: 11px accent color
  - Time: right-aligned, 10px tertiary
```

### Document view (reference: prototype C, `.doc-area`)

```
Container: max-width 800px, centered, 40px 60px padding
Title: Source Serif 4, 28px, weight 600
Subtitle: 14px, tertiary, 32px margin-bottom
Section title: Source Serif 4, 18px, weight 600, 12px margin-bottom
Paragraph: 15px, secondary color, 1.75 line height, 14px margin-bottom
Source ref: inline superscript badge, teal-bg, 10px, 1px 6px padding, 4px radius
Conflict marker: 3px left border (amber), amber-bg, 14px 18px padding, 10px radius on right
Skeleton placeholder: animated shimmer, surface-alt color, rounded
```

## Animations

Keep animations minimal and functional:
- **Pulsing dot**: for "running" status indicators. `opacity 1→0.4→1`, 1.8s ease-in-out infinite.
- **Skeleton shimmer**: for loading placeholders. Linear gradient sliding left-to-right, 1.8s.
- **Badge/card transitions**: `border-color 0.15s`, `background 0.15s` for hover states.
- No page transitions, no slide-ins, no spring animations. This is an ops tool.

## Responsive Behavior

For the course project, optimize for desktop (1200px+). The layout assumptions:
- Plan sidebar: fixed 300px
- Workspace: fluid, fills remaining space
- Agent cards grid: 3 columns at 1200px+, 2 columns at 900px, 1 column below
- Stats row: 4 columns, shrink to 2×2 grid on narrow screens
- Document view: max-width 800px, centered

Mobile is a stretch goal. Don't invest time here for the MVP.

## Tailwind Config Reference

```typescript
// tailwind.config.ts — key custom values
{
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF8',
        surface: '#FFFFFF',
        'surface-alt': '#F5F4F0',
        border: 'rgba(0,0,0,0.08)',
        'border-strong': 'rgba(0,0,0,0.15)',
        'text-primary': '#1A1A18',
        'text-secondary': '#6B6A65',
        'text-tertiary': '#9C9A92',
        accent: { DEFAULT: '#534AB7', bg: '#EEEDFE', text: '#3C3489' },
        teal: { DEFAULT: '#0F6E56', bg: '#E1F5EE', text: '#085041' },
        amber: { DEFAULT: '#854F0B', bg: '#FAEEDA', text: '#633806', dot: '#EF9F27' },
        green: { DEFAULT: '#3B6D11', bg: '#EAF3DE', text: '#27500A' },
        red: { DEFAULT: '#A32D2D', bg: '#FCEBEB' },
        coral: { DEFAULT: '#993C1D', bg: '#FAECE7' },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
}
```
