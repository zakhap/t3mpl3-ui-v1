'use client'

import { useState } from "react"

interface TickerProps {
  themeColor: string
  themeBg: string
}

export default function Ticker({ themeColor, themeBg }: TickerProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      {/* Ticker Tooltip */}
      {showTooltip && (
        <div
          className="fixed z-50 pointer-events-none text-xs px-2 py-1 border"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y + 20,
            backgroundColor: '#1c1c1c',
            border: `1px solid ${themeColor}`,
            color: themeColor,
          }}
        >
          READ THE MANIFESTO
        </div>
      )}

      <a 
        href="https://t3mpl3.netlify.app/" 
        target="_blank"
        rel="noopener noreferrer"
        className="overflow-hidden whitespace-nowrap sticky top-0 z-50 block cursor-pointer"
        style={{ 
          backgroundColor: '#1c1c1c',
          border: `1px solid ${themeColor}`,
          boxShadow: `0px 3px 0px ${themeColor}`
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="ticker py-1 px-4" style={{ color: themeColor }}>
          {'MANIFESTO ░░░ '.repeat(20)}
        </div>
      </a>
    </>
  )
}
