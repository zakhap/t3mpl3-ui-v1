# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
pnpm dev                 # Start development server on port 3000
pnpm build              # Build production bundle
pnpm start              # Start production server
pnpm lint               # Run ESLint checks
```

## Architecture Overview

This is a Next.js 15 trading interface for the $T3MPL3 meme token with Web3 wallet integration. The app uses a retro terminal aesthetic with dynamic theming based on buy/sell modes.

### Web3 Integration Strategy

The app uses **Privy** as the primary wallet connection provider (not Web3Modal). Key files:

- `components/privy-web3-provider.tsx` - Main Web3 provider using Privy
- `lib/web3.ts` - Contains Web3Modal config (legacy, not actively used)
- `components/web3-provider.tsx` - Alternative Web3Modal provider (not actively used)

**Current wallet setup**: External wallets only (MetaMask, Coinbase Wallet), no embedded wallets or WalletConnect to avoid connection issues.

### UI Architecture

- **Theme System**: Dynamic color theming based on trading mode
  - Green theme (`#44cc77`) for buy mode
  - Red theme (`#cc7744`) for sell mode
  - Terminal aesthetic with monospace fonts and retro styling

- **Components Structure**:
  - `app/page.tsx` - Main trading interface with state management
  - `components/trading/` - Trading-specific components (header, ticker, trading panel, etc.)
  - `components/ui/` - Shadcn/ui component library
  - Custom terminal-style CSS in `app/globals.css` and `app/patterns.css`

### Key Features

- **Wallet Connection**: Privy integration with external wallet support
- **Trading Interface**: Buy/sell tabs with ETH ↔ $T3MPL3 conversion calculations
- **Dynamic Theming**: Color scheme changes based on buy/sell mode
- **Terminal UI**: Retro computing aesthetic with ASCII-style borders and effects
- **Donation Tracking**: All trading fees are donated to charity (tax-deductible feature)

### State Management

- React state in main page component for trading mode, tooltips, and mouse tracking
- Privy hooks for wallet authentication state
- No external state management library (Redux, Zustand, etc.)

### Styling Approach

- Tailwind CSS for utility classes
- Custom CSS variables for terminal effects
- Inline styles for dynamic theming (colors change based on trading mode)
- Shadcn/ui components with terminal-style overrides