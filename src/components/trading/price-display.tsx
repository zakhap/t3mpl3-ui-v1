interface PriceDisplayProps {
  themeColor: string
  currentPrice: number
  formattedPrice?: string
  loading?: boolean
}

export default function PriceDisplay({ themeColor, currentPrice, formattedPrice, loading }: PriceDisplayProps) {
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
        <div className="text-xl font-bold">
          {loading ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            formattedPrice || `$${currentPrice.toLocaleString()}`
          )} <span className="text-sm">USDC</span>
        </div>
        <div className="text-xs" style={{ color: themeColor }}>
          {loading ? (
            <span className="animate-pulse">● LIVE</span>
          ) : (
            <>● LIVE PRICE</>
          )}
        </div>
      </div>
    </div>
  )
}
