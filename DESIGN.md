---
name: Institutional Integrity
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#564242'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#897172'
  outline-variant: '#dcc0c0'
  surface-tint: '#a23b45'
  primary: '#300007'
  on-primary: '#ffffff'
  primary-container: '#570013'
  on-primary-container: '#e06a72'
  inverse-primary: '#ffb3b5'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d2e1fa'
  on-secondary-container: '#556379'
  tertiary: '#101415'
  on-tertiary: '#ffffff'
  tertiary-container: '#25282a'
  on-tertiary-container: '#8d8f91'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdada'
  primary-fixed-dim: '#ffb3b5'
  on-primary-fixed: '#40000c'
  on-primary-fixed-variant: '#83232f'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#e1e2e5'
  tertiary-fixed-dim: '#c5c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
  surface-main: '#f9f9ff'
  status-success-bg: '#E8F5E9'
  status-success-text: '#2E7D32'
  status-info-bg: '#E3F2FD'
  status-info-text: '#1976D2'
  status-warning-bg: '#FFF8E1'
  accent-pattern: '#e0bfbf'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The brand identity is rooted in **Corporate / Modern** principles with a specific focus on governmental transparency and academic professionalism. It balances the weight of a prestige film institution (SRFTI) with the accessibility required for a grievance portal. 

The visual style is characterized by "Academic Precision"—combining a deep, authoritative burgundy palette with clean, structured layouts. It utilizes high-contrast typography and subtle background patterns (radial dot grids) to evoke a sense of organized, official documentation. The emotional response should be one of trust, calm, and procedural clarity.

## Colors
The palette is dominated by **Primary Burgundy (#570013)**, used for brand identity, primary actions, and structural accents. This is supported by a sophisticated suite of **Cool Greys** and **Off-Blue Whites** that prevent the interface from feeling heavy.

We use a functional semantic system for status indicators:
- **Success:** Forest green tones for resolved timelines.
- **Information:** Sky blue tones for faculty-related matters.
- **Alert/Warning:** Soft amber for regulatory notices.
The background uses a "Surface-Tinted White" (#f9f9ff) to reduce eye strain compared to pure hex-white, reinforcing the professional, institutional feel.

## Typography
The system employs a dual-typeface strategy:
- **Hanken Grotesk** is the voice of the institution, used for large headlines and titles. Its sharp terminals and modern geometry provide a sense of forward-thinking authority.
- **Inter** handles all functional and body text. Chosen for its exceptional legibility at small sizes and neutral, utilitarian character, it ensures that complex grievance information remains accessible.

Hierarchy is maintained through strict weight differentiation—Bold (700) for headers, Semi-Bold (600) for sub-headers, and Regular (400) for long-form content.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop, centered within a 1200px container, transitioning to a fluid single-column layout on mobile devices. 

Key spacing rules:
- **Vertical Rhythm:** Content sections are separated by `stack-lg` (48px) to maintain a breathy, readable flow.
- **Gutters:** A consistent 24px gap is used for grid-based card layouts (Bento style).
- **Safe Areas:** On mobile, a 16px horizontal margin is enforced to prevent content from touching screen edges.
- **Mobile Navigation:** A dedicated 64px (h-16) bottom navigation bar is used on small screens to ensure primary actions remain within thumb-reach.

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and **Low-Contrast Outlines** rather than aggressive shadows. 

- **Level 0 (Background):** The base `#f9f9ff` surface.
- **Level 1 (Cards/Containers):** Uses `#ffffff` (lowest surface) with a 1px border of `#e0bfbf` (outline-variant). A `shadow-sm` is applied for subtle lift.
- **Level 2 (Interactive):** Primary buttons and active FAQ items use higher contrast and `shadow-lg` to indicate tappability.
- **Decorative Depth:** Backdrop blurs (40% opacity primary) and radial dot patterns are used in hero areas to create visual interest without breaking the flat, professional hierarchy.

## Shapes
The shape language is **Rounded**, leaning towards a friendly yet structural feel. 
- **Standard Radius:** 0.5rem (8px) for cards and most containers.
- **Button Radius:** 0.75rem (12px) for primary actions to make them feel more "tactile" and modern.
- **Extreme Radius:** 1.5rem (24px) for decorative sections and full-width imagery to soften the institutional look.
- **Utility Radius:** Small badges and chips use a "full" pill-shape to distinguish them from structural elements.

## Components
### Buttons
- **Primary:** High-contrast Burgundy background, white text, 12px radius. Must include an icon for clarity.
- **Secondary:** 2px stroke using the secondary color, no fill, 12px radius.

### Cards
- Bento-style layout. Always feature a 4px top-border accent that changes color based on the category (e.g., Student = Primary, Faculty = Blue, Staff = Green).

### FAQ / Accordions
- Bordered containers with internal dividers. Use a 300ms transition for height expansion and a rotating chevron icon (180-degree flip).

### Status Chips
- Small, uppercase, bold labels. Background should be 10-15% opacity of the text color to ensure "tonal" harmony.

### Navigation
- **Desktop:** Fixed top-bar with active state indicated by a 2px bottom border in the primary color.
- **Mobile:** Fixed bottom-bar using `surface-container` background with distinct icon-and-label pairs for ergonomic accessibility.