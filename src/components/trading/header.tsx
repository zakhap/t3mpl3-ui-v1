interface HeaderProps {
  themeColor: string
}

export default function Header({ themeColor }: HeaderProps) {
  return (
    <div 
      className="p-4 mb-8" 
      style={{ 
        border: `1px solid ${themeColor}`,
        boxShadow: `4px 4px 0px ${themeColor}`
      }}
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <img 
            src="/monochrome-temple.png" 
            alt="TEMPLE" 
            width={200} 
            height={60}
            style={{ 
              filter: `drop-shadow(0 0 10px ${themeColor})`,
              imageRendering: 'pixelated'
            }}
          />
        </div>
        <p className="text-sm">TRADE MEMES, ACCRUE DEDUCTIONS. INVEST IN FUTURE WRITE-OFFS.</p>
        <p className="text-xs mt-1" style={{ color: themeColor }}>
          TAX-ADVANTAGED SPECULATION v1.0
        </p>
      </div>
    </div>
  )
}
