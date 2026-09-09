# Design System & Visual Specification 2.0: Massage Reservation (ZenFlow / Revive Spa)

> **Document Purpose:** This document serves as the master design specification and prompt guide for **Google Stitch** (and modern frontend design tools). It defines the visual identity, UI design tokens, component guidelines, and screen layouts for the redesigned **Massage Reservation System 2.0**, inspired by top-tier modern iOS apps (such as **Opal iOS**).

---

## 1. Executive Vision & Aesthetic Philosophy

**Core Theme:** *Zen Organic Luxury meets Opal iOS Iridescent Craftsmanship*

The redesign transforms the massage reservation platform into an atmospheric, high-end wellness experience. The interface evokes calmness, serenity, and premium hospitality—like stepping into an exclusive spa sanctuary—while retaining lighting-fast performance and touch-first usability.

### Design Principles (Inspired by Opal iOS & Modern Luxury Apps):
1. **Atmospheric Illumination & Ambient Radial Aura:** Subdued obsidian dark background with glowing warm radial aura circles (amber gold, sage emerald, and rose gold) floating softly behind frosted cards.
2. **Opal-Style Iridescent Glassmorphism:** Translucent frosted glass surfaces (`backdrop-blur-xl`), subtle metallic gradient borders (`linear-gradient(135deg, rgba(255,255,255,0.18), rgba(212,175,55,0.25), rgba(255,255,255,0.05))`), and multi-layered depth.
3. **Floating Segmented Pills & Touch Controls:** Floating pill tab bars and duration toggles with active sliding gold states and high-contrast micro-typography (`tracking-wider`).
4. **Tactile Haptic Micro-Interactions:** Feel-good press-down feedback (`active:scale-[0.97]`), smooth spring physics transitions, and subtle glowing halos around selected choices.
5. **Effortless Booking Flow:** 3-step intuitive wizard (Experience & Pressure → Package & Add-ons → Calendar & Therapist → Instant QR Pass).
6. **Gamified Member Experience:** Elegant loyalty tier cards, Opal-inspired circular progress rings, achievement badges, and seamless QR code check-in.

---

## 2. Design Tokens & Visual Identity

### 2.1 Color Palette

#### Dark Mode (Primary Sanctuary Experience)
- **Canvas Background:** `#0B0F17` (Obsidian Charcoal)
- **Elevated Card Surface:** `#121824` (Deep Velvet Navy)
- **Glass Panel Surface:** `rgba(18, 24, 36, 0.75)` with `backdrop-filter: blur(16px)`
- **Border & Glass Divider:** `rgba(255, 255, 255, 0.08)` / `rgba(212, 175, 55, 0.2)`
- **Primary Text:** `#F8FAFC` (Pure Pearl White)
- **Secondary Text:** `#94A3B8` (Muted Slate)

#### Accent & State Colors
- **Warm Gold (Primary Highlight):** `#D4AF37` / `#E6C875` (Champagne Gold Glow)
- **Emerald Sage (Wellness Accent):** `#2E5A44` / `#4A7C59` (Zen Herbal Accent)
- **Rose Gold (Warm Touch):** `#E8A598`
- **Success / Confirmed:** `#10B981` (Emerald Glow)
- **Warning / Last Slots:** `#F59E0B` (Warm Amber)
- **Disabled / Unavailable:** `#334155` (Slate Muted)

#### Light Mode (Clean Daylight Calm)
- **Canvas Background:** `#FDFBF7` (Warm Organic Cream)
- **Elevated Card Surface:** `#FFFFFF` (Pure Porcelain)
- **Accent Highlight:** `#B8860B` (Rich Ochre Gold)
- **Text Primary:** `#1A202C` (Deep Espresso Charcoal)

---

### 2.2 Typography Hierarchy

- **Primary Font Family (UI & Body):** `Plus Jakarta Sans`, `Inter`, sans-serif
- **Display / Heading Font Family:** `Cormorant Garamond`, `Outfit`, serif/sans hybrid

| Element | Font Weight | Size (Mobile) | Size (Desktop) | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title (H1)** | SemiBold (600) | 28px / 1.75rem | 44px / 2.75rem | 1.15 | -0.02em |
| **Section Header (H2)** | Medium (500) | 22px / 1.375rem | 30px / 1.875rem | 1.25 | -0.01em |
| **Card Title (H3)** | SemiBold (600) | 18px / 1.125rem | 20px / 1.25rem | 1.3 | 0em |
| **Body Large** | Regular (400) | 16px / 1.0rem | 16px / 1.0rem | 1.5 | 0em |
| **Body Small / Captions**| Regular (400) | 13px / 0.8125rem | 14px / 0.875rem | 1.4 | +0.01em |
| **Pill / Button Text** | Medium (500) | 14px / 0.875rem | 15px / 0.9375rem | 1.0 | +0.02em |

---

### 2.3 Shapes, Borders & Shadow Tokens

- **Border Radius:**
  - Standard Cards: `20px` (`rounded-2xl`)
  - Modals & Sheets: `28px` (`rounded-3xl`)
  - Buttons & Chips: `9999px` (`rounded-full` pill shape)
  - Input Fields: `14px` (`rounded-xl`)
- **Shadows:**
  - Ambient Card Elevation: `0 10px 30px -5px rgba(0, 0, 0, 0.4)`
  - Active Glow Elevation: `0 0 25px rgba(212, 175, 55, 0.25)`
  - Modal Overlay Shadow: `0 25px 50px -12px rgba(0, 0, 0, 0.7)`

---

## 3. Core Component Library Specifications

### 3.1 Floating Navigation Bar (`Navbar.tsx`)
- **Visual Style:** Floating pill header at the top with `backdrop-blur-md`, subtle 1px border.
- **Left Element:** Brand Logo "ZenFlow" with glowing gold dot accent.
- **Center Element:** Quick step indicator or tab navigation (Rezervácia, Cenník, O nás).
- **Right Elements:**
  - Multi-language switcher pill (SK / EN / DE).
  - User Loyalty Status badge (Bronze / Silver / Gold icon with glow).
  - Profile Avatar / Login action button.

### 3.2 Booking Step Cards & Interactive Controls
- **Step 1: Experience & Focus (`Step1Level.tsx`)**
  - Interactive body anatomy grid or icon cards (Chrbát & Šija, Celé telo, Nohy & Chodidlá, Hlava & Tvárik).
  - Intensity Slider (Jemná relaxačná → Stredná → Hlboká / Deep Tissue) with ambient glow changing color according to pressure level.
- **Step 2: Package Cards & Duration Selector (`Step2Packages.tsx`)**
  - Luxury service cards displaying title, description, price, duration pills (30 / 60 / 90 / 120 min).
  - Optional Add-on toggles (Aromaterapeutické oleje, Horúce lávové kamene, CBD zábal).
- **Step 3: Interactive Calendar & Time Slot Picker (`Step3Calendar.tsx`)**
  - Horizontal scrolling week/month date picker with selected day in active gold border.
  - Time Slot Grid grouped by period: Ráno (08:00 - 12:00), Poobede (12:00 - 16:00), Večer (16:00 - 20:00).
  - Availability indicators: Green pill for Available, Amber pill for "Posledný voľný termín", Gray stroke for Booked.
  - Masér / Masérka (Therapist) selector cards with avatar photo, rating stars, and specialty tags.

### 3.3 Instant Confirmation Pass & QR Generator (`SuccessModal.tsx`, `QrCodeGenerator.tsx`)
- **Visual Style:** Luxury boarding-pass style ticket with subtle side notches.
- **Elements:**
  - Glowing checkmark animation on successful booking.
  - Dynamic QR code generation for instant check-in at salon terminal.
  - "Pridať do Google / Apple Kalendára" instant action button.
  - SMS & Email notification status confirmation badge.

### 3.4 Gamification & Member Loyalty System (`BadgesGrid.tsx`, `BadgeModal.tsx`)
- **Loyalty Progress Card:** Visual ring meter showing progress to next tier (e.g. 3 / 5 masáží do Zlatej Úrovne).
- **Achievement Badges Grid:** Glowing hexagonal or circular metal badge icons (e.g. "Prvá Návšteva", "Nočný Relax", "Víkendový Gurmán").
- **Interactive Badge Details Modal:** Shows unlocked perks (e.g. 10% zľava, nápoj zadarmo, 15 min navyše).

### 3.5 Staff / Admin Scanner Portal (`ScannerModal.tsx`, `admin/`)
- **Camera Viewfinder:** Sleek dark scanner interface with laser-style scanning frame.
- **Agenda Timeline:** Daily view of reservations with filter tabs (Všetky, Potvrdené, Vybavené, Zrušené).
- **Quick Actions:** One-tap check-in, block slot, or contact client.

---

## 4. Google Stitch AI Prompt Specifications

*Use the following structured prompts directly in **Google Stitch** to generate screen layouts, HTML mockups, and UI components.*

### 4.1 Master Screen Prompt: Customer Booking Experience
```text
Design a luxury, modern spa & massage reservation web application screen in Dark Mode.
Color palette: Obsidian dark background (#0B0F17), rich navy surface cards (#121824), champagne gold glow accents (#D4AF37), and serene sage green highlights (#4A7C59).
Typography: Plus Jakarta Sans for UI elements and elegant serif Cormorant Garamond for titles.

Header:
- Floating glassmorphism navbar with blur effect, brand logo "ZenFlow Spa", language selector dropdown (SK/EN), and glowing member loyalty status badge (Gold VIP).

Main Content:
- Hero Section: "Obnovte rovnováhu tela a mysle". Subtitle: "Premiové masáže a regenerácia v srdci mesta."
- Stepper Progress Bar: 3 steps (1. Výber masáže -> 2. Termín & Masér -> 3. Potvrdenie).
- Step 1 Card: Massage service selection card for "Aromaterapeutická Hĺbková Masáž".
  - Duration selector pill buttons: [30 min - 35€] [60 min - 55€ (Selected with gold outline)] [90 min - 75€].
  - Massage Pressure Slider with 3 levels: Relaxačná | Stredná | Deep Tissue.
- Step 2 Card: Interactive Calendar & Time Slot Picker.
  - Horizontal day carousel: Mon 10, Tue 11, Wed 12 (Active gold pill), Thu 13.
  - Grid of available time slots: [09:00 - Voľné] [11:30 - Posledné 1 miesto (Amber)] [14:00 - Voľné].
  - Preferred Therapist selector with round avatar, rating 4.9★, name "Elena M.".

Footer & Actions:
- Bottom floating sticky bar with summary "Celkom: 55 € (60 min)", and prominent rounded gold button "Pokračovať k rezervácii ->".
```

---

### 4.2 Master Screen Prompt: Reservation Ticket & QR Pass Modal
```text
Design a luxury digital spa ticket modal card for a confirmed massage reservation in Dark Mode.
Theme: Obsidian charcoal canvas (#0B0F17), glassmorphism card with gold foil border accent (#D4AF37).

Ticket Card Structure:
- Top: Success celebration icon with subtle glowing gold checkmark animation. Heading: "Rezervácia Potvrdená!".
- Ticket Header: "ZenFlow Spa Sanctuary", Booking ID: #ZF-88421.
- Details Grid:
  - Služba: Športová & Hĺbková Masáž (60 min)
  - Dátum a Čas: Streda, 12. August 2026 o 14:00
  - Masér: Elena M.
  - Miesto: Hlavná 42, Bratislava
- QR Code Section: Centered crisp vector QR code inside a rounded white glass container with text "Predložte tento QR kód pri príchode do salónu".
- Action Buttons:
  - Primary button (Gold outline): "Pridať do Kalendára (Apple / Google)"
  - Secondary text button: "Stiahnuť Lístok (PDF)"
```

---

### 4.3 Master Screen Prompt: User Profile & Loyalty Badges Dashboard
```text
Design a mobile-first spa member loyalty dashboard screen in dark mode with gold and emerald accents.

Components:
- User Profile Card: Avatar image, user name "Adam Jopek", Member Tier Badge "Zlatý Člen" with shiny metallic texture.
- Loyalty Progress Ring / Bar: "4 / 5 Masáží" to reach Platinum level. Subtext: "Už len 1 masáž k získaniu 30 min masáže zdarma!".
- Badges Grid Section (Section Title: "Vaše Získané Odznaky"):
  - Badge 1: "Prvý Krok" (Unlocked - Glowing Gold Shield Icon)
  - Badge 2: "Verný Klient" (Unlocked - Glowing Emerald Leaf Icon)
  - Badge 3: "Víkendový Relax" (Unlocked - Sunburst Icon)
  - Badge 4: "Spa Majster" (Locked - Translucent Gray Lock Icon)
- Recent Reservations History List with date, service name, status badge ("Vybavené"), and "Opakovať rezerváciu" button.
```

---

## 5. Implementation Roadmap & Technical Guidelines

1. **CSS Infrastructure:** Update `app/globals.css` and `app/theme.css` with CSS variables for all design tokens (colors, gradients, glassmorphism utilities).
2. **Typography Setup:** Import `Plus_Jakarta_Sans` and `Cormorant_Garamond` fonts in `app/layout.tsx`.
3. **Component Refactoring:** Update `Navbar.tsx`, `Step1Level.tsx`, `Step2Packages.tsx`, `Step3Calendar.tsx`, `SuccessModal.tsx`, `BadgesGrid.tsx` to match the new visual tokens.
4. **Micro-Animations:** Use Framer Motion / CSS transitions for smooth step navigation, modal spring physics, and hover state elevations.
