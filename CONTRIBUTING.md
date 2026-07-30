# Contributing to sorostream-app

Thank you for your interest! This repo participates in the **Stellar Wave Program** on [Drips Wave](https://drips.network/wave).

## Wave Contributor Workflow

1. **Browse open issues** — pick one labelled `Stellar Wave`.
2. **Apply via Drips Wave** — do **not** begin coding until assigned by the maintainer.
3. **Fork & branch** — `feat/N-description` or `fix/N-description`.
4. **Code** — `npm run build` must pass. All layouts must be mobile responsive.
5. **PR** — title references the issue, body includes `Closes #N`.

## Local Setup

```bash
cp .env.example .env.local
# Fill in your contract ID and network

npm install
npm run dev    # http://localhost:3000
npm run build  # verify production build
npm run lint   # ESLint check
```

## Env Vars

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` or `mainnet` |
| `NEXT_PUBLIC_CONTRACT_ID` | Deployed StreamContract address |
| `NEXT_PUBLIC_RPC_URL` | Soroban RPC endpoint |
| `NEXT_PUBLIC_ADMIN_ADDRESS` | Comma-separated list of admin wallet public keys for `/admin` |

## Project Structure

```
sorostream-app/
├── components/          # Reusable UI components
│   ├── ui/              # Base UI components (buttons, inputs, etc.)
│   └── __tests__/       # Component tests
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── dashboard/   # Dashboard page with stream list
│   │   ├── stream/      # Stream creation and detail pages
│   │   └── settings/    # User settings page
│   ├── components/      # Page-specific components
│   ├── context/         # React context providers (wallet, bookmarks, etc.)
│   ├── lib/             # Utility functions and business logic
│   │   └── __tests__/   # Unit tests for utilities
│   └── locales/         # i18n translation files
├── e2e/                 # Playwright end-to-end tests
└── public/              # Static assets
```

## Component Conventions

### File Organization

- **Colocation**: Keep components close to where they're used
  - Page-specific components go in `src/app/[page]/components/`
  - Shared components go in `components/`
  - Utility functions go in `src/lib/`

- **Naming**:
  - Use PascalCase for component files: `StreamCard.tsx`
  - Use kebab-case for utility files: `stream-utils.ts`
  - Test files should be `__tests__/filename.test.ts` or `filename.test.ts`

### Component Structure

```tsx
"use client"; // Add if component uses hooks or browser APIs

import { useState, useEffect } from "react";

interface ComponentProps {
  // Define props interface
}

export default function Component({ prop }: ComponentProps) {
  // Component logic
  
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

### Styling Conventions

- Use Tailwind CSS for all styling
- Follow the existing color scheme (gray-900 background, green-700 accents)
- Ensure all components are mobile-responsive
- Use semantic HTML elements
- Include proper ARIA labels for accessibility

## Testing

### Unit Tests

- **Required for**: All utility functions in `src/lib/`
- **Framework**: Vitest
- **Location**: `src/lib/__tests__/` or alongside the file
- **Run**: `npm run test` or `npm run test:ui`

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:ui

# Run tests once
npm run test:run
```

Example test structure:
```ts
import { describe, it, expect } from "vitest";

describe("Utility Function", () => {
  it("should handle valid input", () => {
    expect(functionName(input)).toBe(expected);
  });

  it("should handle edge cases", () => {
    expect(functionName(edgeCase)).toBe(expected);
  });
});
```

### End-to-End Tests

- **Required for**: New user flows and critical paths
- **Framework**: Playwright
- **Location**: `e2e/`
- **Run**: `npm run test:e2e` or `npm run test:e2e:ui`
- **Visual baselines**: update the create-stream dark-mode snapshot with `npx playwright test e2e/visual-regression.spec.ts --update-snapshots`

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Test Coverage Requirements

- **Utility functions**: 100% coverage for core logic
- **Components**: Test critical paths and user interactions
- **New features**: At least one E2E test for the main user flow
- **Visual regression**: create-stream form changes should include the dark-mode screenshot baseline update when the styling change is intentional

## Contributing Translations (i18n)

We support multi-language (i18n) localization to make SoroStream accessible to communities around the world.

### 1. Translation File Location & Key Format

All translation keys are stored as JSON files under [src/locales/](file:///Users/marvellous/Desktop/sorostream-app-1/src/locales/).

Keys follow a nested JSON structure that maps to a **`namespace.element`** pattern:
- **Namespaces**: The top-level keys in the JSON objects represent namespaces corresponding to pages or feature areas (e.g. `dashboard`, `settings`, `stream_new`, `stream_detail`, `wallet`).
- **Elements**: Under each namespace, the leaf nodes represent specific text string keys, named using `snake_case` (e.g., `hero_title`, `no_streams`).
- **Placeholders**: Dynamic variables in translation strings are enclosed in curly braces (e.g., `{wallet}`, `{count}`).

### 2. How to Add a New Locale (Worked Example)

Here is a step-by-step worked example of adding support for French (`fr`):

#### Step A: Create the JSON Translation File
Create a new file at `src/locales/fr.json` using `src/locales/en.json` as a base reference. Make sure all namespaces and keys match exactly:
```json
{
  "dashboard": {
    "title": "Tableau de bord",
    "no_streams": "Aucun flux disponible."
  },
  "wallet": {
    "connect": "Connecter {wallet}"
  }
}
```

#### Step B: Register the Translation File in the App Code
Update [src/lib/i18n.ts](file:///Users/marvellous/Desktop/sorostream-app-1/src/lib/i18n.ts) to import the new JSON locale file and add it to the `translations` registry mapping:
```ts
import en from "../locales/en.json";
import pt from "../locales/pt.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json"; // 1. Import new locale file

const translations: Record<string, typeof en> = {
  en,
  pt,
  es,
  fr, // 2. Register new mapping
};
```

#### Step C: Expose the Locale in User Settings
Open [src/app/settings/page.tsx](file:///Users/marvellous/Desktop/sorostream-app-1/src/app/settings/page.tsx) and add the new language option inside the selector component:
```tsx
<select
  value={language}
  onChange={(e) => setLanguage(e.target.value)}
  className="..."
>
  <option value="en">English</option>
  <option value="es">Español</option>
  <option value="pt">Português</option>
  <option value="fr">Français</option> {/* Register option */}
</select>
```

### 3. How to Test and Preview in Development

1. **Verify key alignment**: Run the translation validation command:
   ```bash
   npm run lint
   ```
   Or run the standalone validation script:
   ```bash
   node scripts/check-i18n.mjs
   ```
   This script compares all locale files against `en.json` to ensure there are no missing or extra keys. If a key is missing, it will output validation errors.
2. **Visual testing**: Launch the app locally (`npm run dev`), go to the **Settings** page, select the new language from the dropdown, save settings, and navigate around to preview the translated pages in the browser.

### 4. Review Process for Translation PRs

All submitted translation contributions go through the following review process:
1. **Automated Key Validation Check**: Continuous Integration (CI) runs `npm run lint` automatically. Any missing or extraneous keys will fail the build.
2. **Review & Proofreading**: Maintainers or native speakers in the community will review translations for style, correctness, and natural phrasing.
3. **No Placeholders Altered**: Reviewers will ensure that placeholders (e.g. `{wallet}`) are kept intact and are not translated or deleted.


## PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows the project structure and naming conventions
- [ ] All tests pass (`npm run test` and `npm run test:e2e`)
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Components are mobile-responsive
- [ ] Accessibility requirements are met (ARIA labels, keyboard navigation)
- [ ] Translation keys are added/updated if UI text changed
- [ ] If the create-stream form changed, the dark-mode visual baseline was reviewed and updated intentionally

## How to Add a New SAC Token to the Token Selector Dropdown

When you need to support a new Stellar Asset Contract (SAC) token in the app's
create-stream form, you must update the token registry and several surrounding
files.  This section lists every touchpoint so nothing gets missed.

### Files That Must Be Updated

| # | File | What to change |
|---|------|----------------|
| 1 | `src/app/stream/new/page.tsx` | Add the token to the `SUPPORTED_TOKENS` array |
| 2 | `src/app/settings/page.tsx` | Add a `<option>` for the default-token dropdown |
| 3 | `src/lib/sorostream.ts` (optional) | Add the token to `MOCK_CONTRACT_STATE.whitelistedTokens` for admin-area testing |
| 4 | `src/lib/streamTemplates.ts` (optional) | Add stream templates that use the new token |
| 5 | `src/locales/en.json` (optional) | If the token name appears in user-facing text, add a translation key |

### Worked Example — Adding `EURC`

#### Step 1 – Register the token

Open `src/app/stream/new/page.tsx` and locate the `SUPPORTED_TOKENS` array
(around line 35).  Append a new entry:

```ts
const SUPPORTED_TOKENS = [
  { symbol: "USDC", name: "USD Coin",        address: "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU" },
  { symbol: "XLM",  name: "Stellar Lumens",  address: "native" },
  { symbol: "AQUA", name: "Aquarius",        address: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA" },
  { symbol: "yXLM", name: "Yield XLM",       address: "GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55" },
  // 👇 Add the new token here
  { symbol: "EURC", name: "Euro Coin",       address: "CCW67SZVBUIC7FNJPZXNBGRAV3HMPF4Y7XYE44CUMVHWKRSOGF4RDOIV" },
] as const;
```

Each entry requires:
- **`symbol`** — ticker shown in the dropdown and throughout the UI (e.g. `EURC`)
- **`name`** — human-readable token name (e.g. `Euro Coin`)
- **`address`** — Stellar contract address of the SAC token (use `"native"` for XLM)

#### Step 2 – Expose in Settings

Open `src/app/settings/page.tsx`, find the `<select>` for the default token
(around line 275), and add a new `<option>`:

```tsx
<option value="EURC">EURC (Euro Coin)</option>
```

This lets users set the new token as their default for the create-stream form.

#### Step 3 – Add to token whitelist (Admin area)

If the token should appear in the admin panel's whitelist for testing, open
`src/lib/sorostream.ts`, find `MOCK_CONTRACT_STATE.whitelistedTokens`, and add
the symbol:

```ts
whitelistedTokens: ["USDC", "XLM", "AQUA", "EURC"],
```

#### Step 4 – Verify

1. Run `npm run build` — the build must pass.
2. Run `npm run lint` — no new lint violations.
3. Start the dev server (`npm run dev`), open `/stream/new`, and confirm the
   new token appears in the dropdown.
4. Create a stream with the new token and verify the stream detail page shows
   the correct token symbol.

### Important Notes

- **No icon asset needed** — the dropdown uses text-only option labels; icons
  are not rendered for individual tokens.
- **The token address should be the Stellar Asset Contract address**, not the
  classic asset issuer.
- On testnet, make sure the token has been deployed before adding it.
- After adding a token here, run the Playwright E2E tests to verify the
  create-stream flow still works: `npm run test:e2e`.

## Getting Help

- Check existing issues for similar problems
- Review the codebase for examples of similar implementations
- Ask questions in the PR description if something is unclear
