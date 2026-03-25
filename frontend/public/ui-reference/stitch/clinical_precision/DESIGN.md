# Design System Specification: High-Precision Clinical Monospace

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Lab Notebook"**

This design system rejects the "softness" of modern consumer SaaS in favor of an uncompromising, high-precision aesthetic rooted in medical research and developer-centric tools. It is an editorial take on clinical documentation—where whitespace is a functional tool for data isolation, and typography is the primary vehicle for authority.

The system breaks the "template" look through **Rigid Technicality**. By leaning into the fixed-width nature of 'Space Mono' and a strictly enforced 1px border-grid, we create an environment that feels like a high-end lab instrument: reliable, calibrated, and devoid of unnecessary decoration. 

---

## 2. Colors & Surface Logic

The palette is rooted in sterility and high contrast. We utilize a "Terminal-Light" approach where the primary canvas is near-white, punctuated by razor-sharp black accents and muted functional washes.

### Primary Palette
- **Primary (Medical Blue):** `#316289` — Used exclusively for high-intent actions and active data states.
- **Surface:** `#F9F9F9` — The base laboratory environment.
- **On-Surface:** `#2D3435` — Deep charcoal for maximum legibility.

### Surface Hierarchy & Nesting
Instead of using depth or shadows, we define hierarchy through **Tonal Layering**. 
- **Surface Container Lowest (#FFFFFF):** Used for the most critical interactive elements (e.g., the active data entry cell).
- **Surface Container Low (#F2F4F4):** The standard background for content cards.
- **Surface Container Highest (#DDE4E5):** Used for sidebar navigation or utility headers to create a "recessed" look.

### The "Precision Line" Rule
Unlike traditional editorial systems that rely on whitespace alone, this system uses **1px Solid Borders** (`outline-variant`) as a core structural element. However, these are not used for decoration; they are used to "box" data. 
- **Constraint:** Never use borders and shadows simultaneously.
- **Constraint:** Every border must align to the 4px (0.25rem) grid.

---

## 3. Typography

The system utilizes a dual-font strategy to balance technical precision with structural hierarchy. **Space Mono** provides the "Developer-Centric" soul, while **Inter** manages dense information sets.

| Level | Font | Size | Intent |
| :--- | :--- | :--- | :--- |
| **Display-LG** | Space Mono | 3.5rem | High-level metrics or lab IDs. |
| **Headline-MD** | Space Mono | 1.75rem | Section headers. Upper-case optional for impact. |
| **Title-SM** | Inter | 1.0rem | Descriptive sub-headers and metadata labels. |
| **Body-MD** | Inter | 0.875rem | Standard research notes and documentation. |
| **Label-MD** | Space Mono | 0.75rem | Technical data points, timestamps, and status tags. |

**Editorial Note:** Use Space Mono for all numerical data. The tabular (monospaced) nature of the font ensures that columns of figures align perfectly, reinforcing the "High-Precision" brand personality.

---

## 4. Elevation & Depth (The "Non-Shadow" Approach)

In a clinical environment, "glows" and "soft shadows" suggest imprecision. We achieve elevation through **Structural Framing**.

- **Tonal Layering:** To lift an element, place a `#FFFFFF` container (Surface-Lowest) on a `#F2F4F4` background (Surface-Low).
- **The Sharp Border:** Use a 1px border (`#757C7D`) to define the boundary. 
- **The "Ghost Border" Fallback:** For secondary groupings, use the `outline-variant` at 20% opacity. This creates a "hairline" effect that is visible but not distracting.
- **Zero-Shadow Policy:** No box-shadows are permitted in the primary UI. The only exception is the **Command Palette** or **Global Search**, which may use a 4% opacity ambient tint to indicate it is "floating" above the research environment.

---

## 5. Components

### Buttons
- **Primary:** Background: `primary` (#316289), Text: `on-primary` (#F4F8FF). Radius: 2px. No gradient.
- **Secondary:** Border: 1px solid `primary`, Background: Transparent. 
- **Tertiary:** Text: `primary`, no border, no background. Use for "Cancel" or low-priority actions.

### Input Fields
- **Default State:** 1px solid `outline-variant`. Background: `surface-container-lowest`.
- **Focus State:** 1px solid `primary`. 0px offset.
- **Error State:** 1px solid `error` (#9F403D). Space Mono for error helper text.

### Cards & Data Grids
- **Forbid Divider Lines:** Within a card, separate content using the **Spacing Scale** (e.g., 2rem/8 spacing) or a subtle background shift to `surface-container-high`.
- **Data Points:** Always display technical values (e.g., "74.2 mg/dL") in Space Mono.

### Technical Chips
- **Status Tags:** Use a "Outline-Fill" hybrid. A 1px border of the status color (e.g., `tertiary` for success) with a 10% opacity background of the same color. 

---

## 6. Do’s and Don’ts

### Do
- **Do** align every element to a strict 4px grid. If a label is 1px off, the "precision" feel is lost.
- **Do** use generous whitespace (Spacers 6, 8, and 10) to separate unrelated research modules.
- **Do** treat numerical data as a first-class citizen—give it the largest scale and the most prominent weight.

### Don't
- **Don't** use gradients, glows, or blurs. The UI should look like it was printed on high-grade technical paper.
- **Don't** use 8px or 16px border-radii. Stick to **2px or 4px** to maintain a sharp, "machined" edge.
- **Don't** use emojis. Use specialized SVG iconography with a 1px stroke weight to match the border system.

---

## 7. Signature Layout Pattern: The Asymmetric Lab Sheet
To move beyond a generic grid, utilize an **Asymmetric Split**. A narrow left column (3 units) for technical metadata and timestamps, and a wide right column (9 units) for the primary research narrative. This mimics a professional medical ledger and provides a signature editorial rhythm unique to this design system.