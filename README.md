# T3MPL3 Trading Interface 🔥

A retro terminal-themed trading interface for the $T3MPL3 meme token built with React, TypeScript, and Vite. Features Web3 wallet integration, real-time price data, and Uniswap V4 trading capabilities.

![Terminal Trading Interface](https://img.shields.io/badge/UI-Terminal%20Aesthetic-green?style=for-the-badge)
![Blockchain](https://img.shields.io/badge/Blockchain-Base-blue?style=for-the-badge)
![DEX](https://img.shields.io/badge/DEX-Uniswap%20V4-purple?style=for-the-badge)

## ✨ Features

- **🎮 Retro Terminal UI**: Classic green/amber terminal aesthetic with ASCII borders
- **🔗 Web3 Integration**: Seamless wallet connection via Privy
- **📊 Real-time Trading**: Live ETH/USDC price feeds with dynamic theming
- **🦄 Uniswap V4**: Advanced trading using latest Uniswap protocol
- **💚 Charitable Trading**: All fees donated to charity (tax-deductible)
- **🎨 Dynamic Theming**: Colors change based on buy (green) vs sell (red) mode
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Web3 wallet (MetaMask, Coinbase Wallet, etc.)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd t3mpl3-trading

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173` to see the application.

## 🛠️ Development Commands

```bash
pnpm dev      # Start development server on port 5173
pnpm build    # Build for production
pnpm start    # Preview production build
pnpm lint     # Run ESLint checks
pnpm test     # Run tests with Vitest
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Web3**: Privy (wallet connection), Viem (blockchain interactions)
- **Trading**: Uniswap V4 SDK, Universal Router
- **State**: React Query for data fetching, React Context for UI state
- **Network**: Base mainnet (Ethereum L2)

### Key Components

```
src/
├── components/
│   ├── trading/           # Trading interface components
│   │   ├── header.tsx     # App header with logo
│   │   ├── ticker.tsx     # Price ticker display
│   │   ├── trading-panel.tsx  # Main trading interface
│   │   └── wallet-section.tsx # Wallet connection & balances
│   └── ui/                # Shadcn/ui component library
├── hooks/
│   ├── use-eth-price.ts   # Real-time ETH price data
│   └── use-wallet-balances.ts # Wallet balance management
├── lib/
│   └── uniswap-v4/        # Uniswap V4 integration
│       ├── core/          # Core trading logic
│       ├── contracts/     # Contract ABIs and addresses
│       └── utils/         # Encoding and calculation utilities
└── globals.css            # Terminal-style CSS
```

### Web3 Integration

The app uses **Privy** as the primary wallet provider with external wallet support:

- **Supported Wallets**: MetaMask, Coinbase Wallet, WalletConnect
- **Network**: Base mainnet (Chain ID: 8453)
- **RPC**: Alchemy provider for reliable connectivity
- **Trading Pairs**: ETH/USDC via Uniswap V4

## 🎨 UI Design

### Terminal Aesthetic

- **Typography**: Monospace fonts throughout
- **Colors**: Dynamic green (rgba(139, 183, 137, 1)) for buy mode, red (#cc7744) for sell mode  
- **Borders**: ASCII-style characters and box drawing
- **Animations**: Subtle terminal-inspired effects

### Theme System

The interface dynamically changes colors based on trading mode:

```typescript
// Buy mode (green theme)
themeColor: 'rgba(139, 183, 137, 1)'

// Sell mode (red theme)  
themeColor: '#cc7744'
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
```

### Network Configuration

The app is configured for Base mainnet:

```typescript
// Base mainnet configuration
const BASE_MAINNET = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
    public: { http: ['https://mainnet.base.org'] }
  }
}
```

## 🦄 Uniswap V4 Integration

### Trading Flow

1. **Price Quotation**: Real-time quotes via V4 Quoter contract
2. **Token Approval**: USDC approval for Permit2 contract
3. **Permit2 Signature**: User signs permit for gasless approvals
4. **Universal Router**: Execute swap via Uniswap's Universal Router
5. **Transaction Confirmation**: Real-time transaction status updates

### Key Contracts

- **Universal Router**: `0x6ff5693b99212da76ad316178a184ab56d299b43`
- **Permit2**: `0x000000000022D473030F116dDEE9F6B43aC78BA3`
- **V4 Pool Manager**: Contract addresses in `src/lib/uniswap-v4/contracts/`

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

## 📦 Building for Production

```bash
# Build the application
pnpm build

# Preview the production build
pnpm start
```

The build outputs to the `dist/` directory and can be deployed to any static hosting service.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Uniswap** for the V4 protocol and SDK
- **Privy** for seamless wallet integration
- **Shadcn/ui** for beautiful React components
- **Base** for the scalable L2 infrastructure

---

**⚠️ Disclaimer**: This is experimental software. Trade at your own risk. All trading fees are donated to charity for tax-deductible benefits.