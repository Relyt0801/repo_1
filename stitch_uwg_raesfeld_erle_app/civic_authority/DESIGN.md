---
name: Civic Authority
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#a73a00'
  on-secondary: '#ffffff'
  secondary-container: '#fd651e'
  on-secondary-container: '#571a00'
  tertiary: '#004f35'
  on-tertiary: '#ffffff'
  tertiary-container: '#006948'
  on-tertiary-container: '#76eab6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#ffb599'
  on-secondary-fixed: '#370e00'
  on-secondary-fixed-variant: '#7f2b00'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Fira Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.01em
  display-lg-mobile:
    fontFamily: Fira Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Fira Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.005em
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-bold:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: '0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1200px
---

## Brand & Style

This design system is built for the **UWG Raesfeld-Erle** political platform, prioritizing municipal dependability, local transparency, and professional governance. The aesthetic is a fusion of **Corporate Modern** and **Print-Journalism Brutalism**, optimized for high information density and absolute clarity.

The visual narrative avoids the "softness" of typical consumer apps in favor of a structured, authoritative interface that mirrors the reliability of official documents and broadsheet newspapers. It evokes an emotional response of trust, local rootedness, and civic seriousness. Every element is designed to facilitate quick information retrieval for local council resolutions, news, and community initiatives.

**Design Principles:**
- **High Density:** Maximize screen real estate to show comprehensive data at a glance.
- **Structured Hierarchy:** Use rigid alignment and clear borders to organize complex information.
- **Authoritative Tone:** Rely on crisp typography and a solid, traditional color palette to convey institutional strength.

## Colors

The palette is anchored in **UWG Royal Blue**, representing stability and governance. **Community Orange** is reserved strictly for high-priority calls to action and citizen engagement, while **Forest Green** serves as a specialized accent for ecological and local heritage topics.

The background system uses a "Paper & Ink" approach:
- **Primary Surface:** Pure white (`#FFFFFF`) cards and content blocks.
- **App Canvas:** A subtle slate-tinted white (`#F8FAFC`) to provide contrast for the primary surfaces.
- **Text:** Deep Slate Navy (`#0F172A`) for maximum contrast and legibility, adhering to strict accessibility standards.
- **Functional States:** Use semantic colors (Green/Amber/Red) for council motion statuses, ensuring they are high-contrast and instantly recognizable.

## Typography

This design system utilizes two high-performance sans-serifs to establish its authoritative voice. 

**Fira Sans** is used for all headlines and display elements. Its crisp, humanist character provides a modern German aesthetic that feels both official and accessible. For headings, use tight letter-spacing to maintain a cohesive visual mass.

**Inter** is the workhorse for body text and UI components. It is chosen for its exceptional legibility in high-density environments. 
- Use **body-base** for long-form news and motion descriptions.
- Use **label-caps** for category tags, dates, and metadata to create a clear "scan-line" for the eye.
- Maintain a strict vertical rhythm by locking all line heights to a 4px baseline.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model on desktop, restricted to a `1200px` max-width to preserve optimal reading line lengths characteristic of broadsheet newspapers.

- **Grid System:** A 12-column grid with a `16px` gutter. On desktop, content should favor multi-column layouts to maximize information density.
- **Spacing Rhythm:** All margins and padding must be multiples of the `4px` base unit.
- **Desktop vs Mobile:** On mobile, margins reduce to `16px`, and multi-column grids collapse into a single vertical stack. 
- **Density:** Elements are spaced tightly (e.g., `16px` between cards) to ensure as much content as possible is visible "above the fold" without feeling cluttered.

## Elevation & Depth

To maintain the professional and "flat" municipal aesthetic, this design system avoids soft shadows and realistic depth. Instead, it uses **Bold Borders** and **Tonal Layers** to establish hierarchy.

- **Borders:** All content containers, cards, and input fields use a crisp `1px` border (`#CBD5E1`).
- **Layers:** Depth is communicated by placing White (`#FFFFFF`) surfaces on top of the Slate Ice (`#F8FAFC`) background. 
- **Hover States:** Interaction is signaled by changing border colors (e.g., from Slate to Royal Blue) rather than increasing shadow depth.
- **Flatness:** Avoid any use of blur, translucency, or drop shadows. The UI should feel like a well-organized physical folder or document.

## Shapes

The shape language is conservative and disciplined. A **Soft (0.25rem)** roundedness is the default for UI components, providing just enough refinement to feel modern without losing the professional "document" feel.

- **Primary Buttons & Cards:** Use `rounded-sm` (4px).
- **Status Tags/Pills:** Can use `rounded-lg` for distinct visual categorization, but should remain compact.
- **Images:** Strictly rectangular with `1px` hairline borders. Avoid circular avatars or decorative cropping.

## Components

### Buttons
- **Primary (Orange):** Solid `#EA580C` fill, white text, bold weight. High-contrast and reserved for "Join Us" or "Submit Petition."
- **Secondary (Blue):** Solid `#1D4ED8` fill, white text. Used for standard navigation actions.
- **Tertiary (Outline):** 1px Royal Blue border, blue text, transparent background.

### News Cards
Cards feature a vertical stack: a `label-caps` category pill at the top, followed by a `headline-md` title, a metadata row (Date/Author), and a high-density text snippet. Cards must have a 1px border and no shadow.

### Council Motion Tracker (Table)
A specialized component for tracking political progress.
- **Structure:** Tight rows with alternating subtle background tints.
- **Status Badges:** Use high-contrast background/text pairings:
  - *Approved:* Light Green background / Dark Green text.
  - *Pending:* Light Amber background / Dark Amber text.
  - *Rejected:* Light Red background / Dark Red text.

### Inputs & Forms
Inputs use a white background, 1px slate border, and `4px` corner radius. Labels must be placed directly above the field in `body-bold` for rapid vertical scanning. Focus states are indicated by a 2px `#1D4ED8` solid outline.

### Navigation
The navigation header is dense and functional. The active state is marked by a thick (3px) bottom border in Royal Blue, rather than a color change of the text itself.