import '@testing-library/jest-dom'

// Mock Web3 globals
Object.defineProperty(window, 'ethereum', {
  value: {},
  writable: true,
})

global.globalThis = globalThis