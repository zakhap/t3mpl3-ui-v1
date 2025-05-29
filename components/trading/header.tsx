interface HeaderProps {
  themeColor: string
}

export default function Header({ themeColor }: HeaderProps) {
  return (
    <div 
      className="p-4 mb-4" 
      style={{ 
        border: `1px solid ${themeColor}`,
        boxShadow: `4px 4px 0px ${themeColor}`
      }}
    >
      <div className="text-center">
        <pre className="text-2xl mb-2">
          {`
 ████████╗██████╗ ███╗   ███╗██████╗ ██╗     ██████╗ 
 ╚══██╔══╝╚════██╗████╗ ████║██╔══██╗██║     ╚════██╗
    ██║    █████╔╝██╔████╔██║██████╔╝██║      █████╔╝
    ██║    ╚═══██╗██║╚██╔╝██║██╔═══╝ ██║      ╚═══██╗
    ██║   ██████╔╝██║ ╚═╝ ██║██║     ███████╗██████╔╝
    ╚═╝   ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚══════╝╚═════╝ 
`}
        </pre>
        <p className="text-sm">TRADE MEMES, ACCRUE DEDUCTIONS. INVEST IN FUTURE WRITE-OFFS.</p>
        <p className="text-xs mt-1" style={{ color: themeColor }}>
          TAX-ADVANTAGED SPECULATION v1.0
        </p>
      </div>
    </div>
  )
}
