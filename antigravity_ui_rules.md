# UX/UI Guidelines & Reservation System Redesign Rules

Based on UX/UI analysis of modern product pages and e-commerce flows (inspired by UX Peak methodology), this document outlines the core design rules for building and improving your **MassageReservation (MassageReward)** system.

---

## 1. Icon & Navigation Container Rules
- **Problem:** Navigation and action icons placed directly on top of product or background images lose contrast and visibility when the background changes from dark to light or busy.
- **Rule:** Never place raw icons directly over images. Always enclose icons in a subtle background container with sufficient contrast, a thin outline, and padding so they remain readable regardless of the underlying visual content.

## 2. Image Consistency & Grid Systems
- **Problem:** Random lifestyle photos with mixed backgrounds, heavy props, or unaligned framing clutter product grids and destroy visual hierarchy.
- **Rule:**
  - Standardize image backgrounds across the platform (clean, neutral, consistent lighting).
  - Ensure focal points are explicit (product/service focus rather than distracting background hands or props).
  - Ensure image cards maintain uniform aspect ratios inside grid layouts.

## 3. Structural Alignment & Layout Grid
- **Problem:** Inconsistent left/right margins and spacing make screens feel unstructured and untrustworthy.
- **Rule:**
  - Enforce a strict consistent margin layout (e.g., standard 24px side padding).
  - Snap all text, icons, prices, and interactive buttons onto a unified layout grid.

## 4. Color Hierarchy & Soft Palettes
- **Problem:** Over-saturated, bright colors fight for attention, making the interface harsh and hard to read.
- **Rule:**
  - Use a restrained, softer, natural color palette that supports the content rather than overpowering it.
  - Reserve high-saturation colors strictly for primary conversion actions (e.g., Book Now / Add to Cart).

## 5. Typography Foundations
- **Problem:** Using too many font styles and weights causes visual clutter and weak type hierarchy.
- **Rule:**
  - Stick to a single, clean font family (e.g., Inter, Lato, or Roboto).
  - Establish hierarchy strictly through font size, weight, line-height, and subtle color shades rather than mixing multiple font families.
  - **Headlines vs. Paragraphs:** Headlines attract attention (bold, balanced scale); body text supports understanding (increased line-height, slightly reduced contrast for readability).

## 6. Micro-Labels & Badges
- **Problem:** Overcrowded labels (e.g., redundant text like "20% off discount" plus icons) distract users.
- **Rule:**
  - Keep promotional badges concise and quick to scan (e.g., `20% off`).
  - Apply letter-spacing (tracking) to small uppercase category labels to improve legibility.
  - Eliminate redundant labels where the context is already self-evident (e.g., removing the word "Price:" before a currency amount).

## 7. Information Architecture & Trust Signals
- **Problem:** Critical trust signals (like user ratings or reviews) placed too far from the title delay decision-making.
- **Rule:**
  - Place reviews and ratings immediately adjacent to the primary title or service name.
  - Ensure users can instantly identify *what* the service is, *how* it's rated, and *who* trusts it.

## 8. Divider Lines & Whitespace Balance
- **Problem:** Heavy, dark divider lines chop the page into harsh, rigid blocks.
- **Rule:**
  - Soften borders and dividers using ultra-light neutral tones to maintain a smooth, premium flow.
  - Balance whitespace: avoid excessive gaps that disconnect related sections.

## 9. Interactive Elements & Purchase/Booking Flow
- **Problem:** Quantity or service options placed far away from the primary CTA (Call to Action) create friction.
- **Rule:**
  - **Proximity:** Place customization controls (such as duration, add-ons, or quantity selectors) directly next to or integrated with the primary action button.
  - **Total Transparency:** Include dynamic total pricing directly inside the primary CTA button (e.g., `Book Massage • 50€`) to remove uncertainty.
  - **Quick Taps:** Provide pre-defined common options (e.g., 30m, 60m, 90m slots) alongside custom selectors to reduce user taps.

## 10. Sticky Elements & Context Preservation
- **Problem:** Users lose context and have to scroll back up to take action when reading through long service descriptions or terms.
- **Rule:**
  - Implement sticky bottom action areas for mobile/tablet layouts so the booking CTA remains available as the user explores details.
  - Use scrollable container cards with subtle shadows and rounded corners that slide gracefully over hero images, keeping key information anchored.
