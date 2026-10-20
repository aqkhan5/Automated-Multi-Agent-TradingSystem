---
name: frontend-design
description: Crafts distinctive, production-grade frontend interfaces, components, and interactive applications with bespoke aesthetics and high design fidelity. This skill should be used when building web interfaces, landing pages, dashboards, UI components, data visualizations, or styling web applications to avoid generic AI aesthetics.
---

# Frontend Design Skill

Engineer distinctive, visually striking, and production-grade frontend interfaces that eliminate generic "AI slop" aesthetics.

## What This Skill Does

- Translates user requirements into bespoke visual architectures with deliberate aesthetic direction.
- Designs cohesive typography scales, customized color token systems, and atmospheric layered backgrounds.
- Implements micro-interactions, fluid staggered entrance animations, and tactile component hover states.
- Ensures cross-browser responsiveness, semantic DOM structure, and strict WCAG 2.1 AA accessibility.

## What This Skill Does NOT Do

- Generate unstyled or generic boilerplate templates.
- Rely on cookie-cutter patterns (e.g. standard Inter font with generic purple gradients).
- Sacrifice performance or accessibility in pursuit of purely decorative flourishes.

---

## Before Implementation

Gather context to anchor the design system:

| Source | Gather |
|---|---|
| **Codebase** | Existing CSS/Tailwind configs, component libraries, asset pipelines, and themes |
| **Conversation** | Intended audience, brand tone, core user tasks, and technical stack (React, Vue, plain HTML/CSS) |
| **Skill References** | Typography in `references/typography-pairings.md`, palettes in `references/color-themes-design-tokens.md`, motion in `references/ui-components-animations.md`, and accessibility in `references/accessibility-wcag.md` |
| **User Guidelines** | Specific design system constraints or branding guidelines |

---

## Required Clarifications

### Required
1. **Interface Scope**: Full page, dashboard, modal widget, or standalone component.
2. **Aesthetic Tone**: Desired direction (e.g. Industrial Utilitarian/Fintech, Minimal Luxury, Editorial Brutalist, Cyberpunk, Warm Organic).
3. **Tech Stack**: Vanilla HTML/CSS/JS, React, Tailwind CSS, or Vue.

### Optional
4. **Motion Density**: High dynamic motion vs subtle micro-interactions.
5. **Theme Mode**: Strict dark mode, light mode, or adaptive theme switcher.

---

## Design & Implementation Workflow

```
[ 1. Select Aesthetic Archetype ] ──► [ 2. Configure Design Tokens ] ──► [ 3. Structural Layout & Hierarchy ]
                                                                                   │
[ 5. Accessible Audit & Polish ] ◄──── [ 4. Orchestrate Motion & Detail ] ◄────────┘
```

### Step 1: Commit to a Distinct Conceptual Archetype
Select a bold visual personality rather than converging toward middle-of-the-road defaults:
- **Industrial Utilitarian**: Monospace metrics, dark slate surfaces, neon status accents, compact data density.
- **Editorial Brutalist**: High-contrast serifs, asymmetric grid breakouts, raw structural lines.
- **Minimal Luxury**: Muted sand/espresso, generous whitespace, understated micro-typography.

### Step 2: Establish Design Tokens
- Define CSS custom properties using tokens from [assets/tokens-template.css](assets/tokens-template.css) or custom Tailwind extensions.
- Select expressive font pairings from [references/typography-pairings.md](references/typography-pairings.md).
- Formulate dominant surface colors and sharp semantic accents using [references/color-themes-design-tokens.md](references/color-themes-design-tokens.md).

### Step 3: Architect Layout & Spatial Rhythm
- Employ fluid typography (`clamp()`) to avoid brittle pixel breakpoints.
- Create atmospheric depth using layered radial gradients or micro-dot grids rather than flat solid backgrounds.
- Ensure natural visual hierarchy where the primary call-to-action or critical metric commands immediate attention.

### Step 4: Orchestrate Motion & Micro-Interactions
- Consult [references/ui-components-animations.md](references/ui-components-animations.md).
- Use staggered entrance reveals (`animation-delay`) for dashboards and lists.
- Apply smooth cubic-bezier transitions for hover, focus, and active states.

### Step 5: Accessibility & Cross-Device Audit
- Consult [references/accessibility-wcag.md](references/accessibility-wcag.md).
- Verify contrast ratios (minimum 4.5:1 for body copy).
- Provide visible focus rings for all interactive elements.
- Ensure animations gracefully degrade under `prefers-reduced-motion`.

---

## Output Checklist & Quality Gates

Before delivering frontend code, confirm:

- [ ] Typography pairs distinctive display and body fonts; no fallback to generic defaults.
- [ ] Color tokens are centralized in CSS variables or theme configuration.
- [ ] Background features atmospheric depth (radial glow, subtle texture, or glassmorphism).
- [ ] Interactive elements feature tactile hover, focus, and active states.
- [ ] Keyboard navigation is fully functional with visible focus indicators.
- [ ] Layout is fully responsive across mobile, tablet, and widescreen viewports.
- [ ] Reduced motion media query (`prefers-reduced-motion`) is respected.
