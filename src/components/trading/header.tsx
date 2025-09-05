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
        <div className="flex justify-center items-center w-full mb-4">
          <img 
            src="/ascii-art-image.png" 
            alt="T3MPL3" 
            className="max-w-full h-auto block mx-auto"
            style={{ 
              filter: `drop-shadow(0 0 10px ${themeColor})`,
              imageRendering: 'pixelated',
              maxHeight: '270px',
              display: 'block'
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
