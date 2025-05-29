interface PriceDisplayProps {
  themeColor: string
  currentPrice: number
}

export default function PriceDisplay({ themeColor, currentPrice }: PriceDisplayProps) {
  return (
    <div className="p-4" style={{ border: `1px solid ${themeColor}` }}>
      <div className="text-xs mb-2">CURRENT PRICE</div>
      <div className="p-2" style={{ border: `1px solid ${themeColor}` }}>
        <div className="text-xl font-bold">{currentPrice} ETH</div>
        <div className="text-xs" style={{ color: themeColor }}>
          ▲ +133.33%
        </div>
      </div>
    </div>
  )
}
