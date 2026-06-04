# Design System Strategy: Bauhaus Constructivist (FAN Club)

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"Bauhaus Constructivist."** This concept bridges the gap between high-performance sportswear (Nike), the clinical precision of technology (Apple), and the spacious, rhythmic layouts of high-fashion print (Zara). 

Unlike traditional e-commerce templates that rely on rigid grids and heavy containment, this system thrives on **Intentional Asymmetry**, **Tonal Depth**, and **High Contrast**. We prioritize breathing room, utilizing bold geometry and striking accents. 

---

## 2. Colors & Surface Architecture
The palette is a sophisticated interplay of cool, atmospheric neutrals punctuated by high-energy accents.

### Tonal Hierarchy
- **Primary Background (`surface` / `#f6fafc`):** The foundational canvas.
- **Secondary Surfaces (`secondary_container` / `#c0e9fc`):** Used for large structural blocks to define regions without lines.
- **The Accents (`primary_container` / `#2ae34b` or `--bauhaus-blue` / `#1349ec`):** High-contrast waypoints for conversion points and critical status indicators.

### The "No-Line" Rule & Borders
**Explicit Instruction:** Do not use 1px solid borders to separate sections. Boundaries must be defined through:
1. **Background Shifts:** Placing a `surface_container_low` card on a `surface` background.
2. **Negative Space:** Using the Spacing Scale (e.g., `spacing-16` or `spacing-20`) to create a cognitive break between content blocks.
*Exception*: In Bauhaus context, thick, black, deliberate borders (2-3px solid #121212) can be used for explicit structural emphasis.

### Glassmorphism & Depth
To emulate floating navigation bars and bottom sheets, apply **Glassmorphism**.
- **Effect:** Apply `surface_container_lowest` at 80% opacity with a 20px-30px backdrop blur.
- **Shadows:** Hard offset, no blur (e.g., `6px 6px 0px 0px #121212`).

---

## 3. Typography: The Editorial Voice
We use a structured typographic scale treated with the discipline of a magazine layout.

- **Display Scales (`display-lg` to `display-sm`):** Use for hero statements with tight letter-spacing (-0.02em) to create an authoritative, premium feel. (Font: Space Grotesk / Inter)
- **Headline & Title:** Used to anchor product names and category sections.
- **Body & Labels:** Designed for maximum legibility on mobile. Never go below `body-sm` (0.75rem).
- **Numbers/Prices:** Monospaced (JetBrains Mono).

**Typography as Grid:** Allow display type to partially overlap product imagery. This creates a layered, "physical" depth that moves away from a flat web look.

---

## 4. Components

### Buttons
- **Primary:** High-contrast background with contrasting text. Roundedness: `full` or `none` (binary).
- **Interaction:** Mechanical, snappy (0.15s–0.3s ease-out). On hover/tap, apply a subtle scale-down (0.98) to mimic a physical press.

### The Editorial Product Card
- **Style:** Thick bold borders or completely borderless floating on a background container. 
- **Structure:** The image sits on `surface_container_low`. The text is placed with generous padding (`spacing-3`) below.
- **Hover/Active:** A subtle shift or hard shadow displacement on hover.

### Floating Navigation Bar
- **Roundedness:** `xl` (1.5rem) or pill-shaped.
- **Surface:** Glassmorphic `surface_container_lowest` (80% opacity) + Backdrop Blur.
- **Icons:** 24px stroke-based icons.

---

## 5. Do's and Don'ts

### Do
- **Do** use asymmetrical spacing. If the left margin is `spacing-4`, try a `spacing-8` on the right for certain hero elements to create tension.
- **Do** leverage high-quality lifestyle photography as a structural element of the page.
- **Do** use mechanical, snappy animations.

### Don't
- **Don't** use standard "Select" dropdowns. Use custom bottom sheets with `xl` rounded corners for a mobile-first premium feel.
- **Don't** cram content. If a screen feels busy, increase the background `surface` area.
- **Don't** use soft, highly blurred drop shadows. Use hard offset shadows or extremely diffused ambient shadows depending on the specific element focus.
