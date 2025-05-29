interface PriceDisplayProps {
  themeColor: string
  currentPrice: number
}

export default function PriceDisplay({ themeColor, currentPrice }: PriceDisplayProps) {
  return (
    <div className="self-start">
      <div className="text-xs mb-2">CURRENT PRICE</div>
      <div 
        className="p-2" 
        style={{ 
          border: `1px solid ${themeColor}`,
          boxShadow: `2px 2px 0px ${themeColor}`
        }}
      >
        <div className="text-xl font-bold">{currentPrice} ETH</div>
        <div className="text-xs" style={{ color: themeColor }}>
          ▲ +133.33%
        </div>
      </div>
    </div>
  )
}
