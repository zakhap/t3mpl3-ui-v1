interface ProjectInfoProps {
  themeColor: string
}

export default function ProjectInfo({ themeColor }: ProjectInfoProps) {
  return (
    <div 
      className="p-4 mb-8" 
      style={{ 
        border: `1px solid ${themeColor}`,
        boxShadow: `4px 4px 0px ${themeColor}`
      }}
    >
      <div className="text-sm font-bold mb-3">HOW IT WORKS</div>
      <div className="text-sm leading-relaxed">
        Every TEMPLE trade includes a small donation, whether you are buying or selling. As you trade, you accrue tax write-offs. The more you profit, the more you can write-off. Hold TEMPLE for more than a year and the limit of your write-off is the moon 🚀
      </div>
    </div>
  )
}