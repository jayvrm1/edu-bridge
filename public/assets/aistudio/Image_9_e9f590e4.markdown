---
name: Warm Neobrutalist Learning
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#554334'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#887362'
  outline-variant: '#dbc2ae'
  surface-tint: '#8d4f00'
  primary: '#8d4f00'
  on-primary: '#ffffff'
  primary-container: '#f28c00'
  on-primary-container: '#5a3100'
  inverse-primary: '#ffb875'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd664'
  on-secondary-container: '#745c00'
  tertiary: '#50606e'
  on-tertiary: '#ffffff'
  tertiary-container: '#97a7b7'
  on-tertiary-container: '#2d3d4a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc0'
  primary-fixed-dim: '#ffb875'
  on-primary-fixed: '#2d1600'
  on-primary-fixed-variant: '#6b3b00'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e7c353'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#d4e4f5'
  tertiary-fixed-dim: '#b8c8d9'
  on-tertiary-fixed: '#0c1d29'
  on-tertiary-fixed-variant: '#394956'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e5e2e1'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a warm, inclusive, and encouraging AI-driven learning environment tailored for students. It balances approachable gamification with mature, distraction-free productivity. The aesthetic fuses softened neobrutalism with friendly editorial minimalism: defined 1px to 1.5px outlines, generous radii, sunny pastel accent modules, and clear visual hierarchy.

The target audience spans diverse learners who benefit from positive reinforcement, visual structure, and high contrast without clinical sterility. The interface instills a sense of momentum, achievement, and emotional safety—celebrating micro-accomplishments like streaks, module milestones, and peer encouragement.

## Colors

The palette relies on high-contrast grounding neutrals complemented by warm, cheerful pastels:

- **Primary Canvas & Framing**: The outer desk environment uses `#F1F1F1` (Off-White/Warm Canvas), encasing the main application canvas in `#FFFFFF`.
- **Text & Structure**: Pure dark charcoal `#222222` serves as high-contrast body text and crisp container borders (`#222222` at 100% or `rgba(34, 34, 34, 0.8)`). Muted labels and secondary descriptions use `#666666`.
- **Action & Momentum (Primary)**: `#F28C00` (Vibrant Tangerine) powers primary buttons, active streak highlights, progress fills, and status badges.
- **Warm Accents & Containers**:
  - Warm Yellow: `#FFD966` (Streak cards, trophy badges)
  - Light Cream: `#FFF0C9` (Secondary hero banners, active navigation highlights)
  - Peach: `#FFE0BD` (Media cards, video player placeholders)
  - Soft Pink: `#F6C4C4` (Rank cards, milestone notifications)
  - Pastel Blue: `#D9EAFB` (Level badges, skill modules, trainee status)
- **Dividers & Structural Borders**: Subtle structural delineations utilize `#E5E5E5` for solid internal partitions and `rgba(34, 34, 34, 0.25)` for signature dashed vertical separators.

## Typography

Typography is set entirely in **Plus Jakarta Sans**, providing clean geometric clarity, generous x-height, and warm humanistic terminals suited for all age brackets.

- **Headlines**: Set in bold (`700`) weights with tight line heights to ground user orientation (e.g., student greetings, section titles).
- **Body Text**: Tuned for maximum legibility at regular (`400`) weight, using dark charcoal `#222222` for standard reading and muted gray `#666666` for auxiliary supporting copy.
- **Labels & Numbers**: Stat counters, metric values (XP counts, streak days, ranking positions), and section subtitles rely on semibold (`600`) and bold (`700`) styling with uppercase tracking for section categorizers (e.g., `LEARNING`, `ACCOUNT`).

## Layout & Spacing

The layout follows a 3-column architecture within a consolidated, elevated dashboard container:

1. **Left Navigation Rail (Width: ~220px–260px)**: Displays user profile header, structured route links, and session actions. Separated from the workspace by a vertical dashed border (`1.5px dashed rgba(34,34,34,0.3)`).
2. **Main Workspace (Flexible Center Pane)**: Hosts greeting headers, dynamic metric stat tiles (4-up horizontal strip), active course progress modules, and interactive practice blocks.
3. **Right Activity & Leaderboard Rail (Width: ~300px–340px)**: Houses calendar heatmaps, streak recaps, and weekly gamified leaderboards. Separated from the center pane by an identical vertical dashed separator.

### Breakpoints & Adaptations
- **Desktop (>= 1280px)**: 3-column structured canvas encapsulated in an outer `#F1F1F1` frame with `margin: 1.5rem` and internal layout gutters of `1.25rem`.
- **Tablet (768px – 1279px)**: Left rail collapses into a compact icon rail or accessible drawer; center and right rail stack vertically.
- **Mobile (< 768px)**: Single-column linear flow. Metrics shift into a 2x2 grid or horizontal scroll track. Outlines and radii reduce slightly for screen compactness.

## Elevation & Depth

The design system minimizes heavy 3D drop shadows in favor of crisp boundaries and gentle, diffused grounding:

- **Border Hierarchy**: Containers rely on structural outlines (`1.5px solid #222222` or `1px solid rgba(34,34,34,0.85)`). This delivers distinct graphic presence without visual noise.
- **Soft Ambient Shadows**: Elevated cards feature an ultra-soft offset shadow: `box-shadow: 0 4px 16px rgba(34, 34, 34, 0.04)`.
- **Tonal Layering**: Depth is reinforced by resting light cards on top of tinted background cards (such as peach `#FFE0BD` player blocks nested within `#FFFFFF` cards, or yellow `#FFD966` calendar headers nesting inside white metric widgets).

## Shapes

The interface embraces generous, playful curvature that balances technical precision with warmth:

- **Main Dashboard Shell**: Enclosed in an expansive radius (`rounded-3xl` / `24px` to `28px`).
- **Cards & Primary Modules**: Styled with prominent corners (`rounded-2xl` / `16px` to `20px`).
- **Interactive Buttons & Badges**: Small tags and streak banners use pill geometry (`rounded-full`), while form inputs and standard buttons utilize `rounded-xl` (`12px`) or full pills (`9999px`) for action chips.
- **Avatar Badges & Icons**: Encased in circular badges (`rounded-full`) or squircle tiles with `rounded-xl` corners.

## Components

### Buttons & Action Controls
- **Primary Button**: Solid vibrant orange background (`#F28C00`), white bold text (`#FFFFFF`), full pill shape (`rounded-full`), padding `10px 24px`. Subtle hover state shifts to `#DE7F00`.
- **Icon Action Buttons**: Circular containers (`rounded-full`) with dark outline (`1.5px solid #222222`) and light background, housing directional arrows or icon glyphs.

### Metric Cards & Pastel Tiles
- **Stat Tiles**: Compact cards (`p-4`, `rounded-2xl`, `border: 1.5px solid #222222`) tinted in pastel surfaces:
  - Trainee Level: `#D9EAFB`
  - Streak: `#FFD966`
  - Rank: `#F6C4C4`
  - XP Metric: `#FFFFFF`
- **Illustration Anchor**: Each tile includes an illustrative mascot badge or gamified icon anchored bottom-right or top-right.

### Progress Bars & Rings
- **Linear Track**: Muted cream or light gray track (`#F1F1F1` or `#FFE0BD`, height `8px`, `rounded-full`) filled with vibrant orange (`#F28C00`).
- **Efficiency Circular Ring**: Radial donut gauge featuring a clean `1.5px` border outline around an orange progress arc (`#F28C00`), with center-aligned percentage value in `headline-md`.

### Navigation Items
- **Inactive Links**: Transparent fill, dark charcoal text (`#222222`), muted icon stroke.
- **Active State**: Pill-shaped container filled with soft cream (`#FFF0C9`), dark active label, with an optional left indicator bar or subtle border.

### Search & Form Inputs
- **Global Search Field**: Large pill input (`rounded-full`), `1.5px solid #222222`, white fill, inset search icon, and muted placeholder text (`#888888`).

### Leaderboard Rows & List Items
- **Podium Showcase**: Top 3 learners displayed via numbered columns (1st in `#F28C00`, 2nd in `#8C531B`, 3rd in `#FFD966`) crowned with avatar badges and XP counters.
- **List Items**: Rounded cards (`rounded-xl`, `border: 1px solid #E5E5E5`) with user avatar, name, flame streak indicator, and XP pills. Current active user highlighted in a dark contrasting card (`bg-[#222222]` with white text).