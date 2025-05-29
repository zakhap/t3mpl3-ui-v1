interface TickerProps {
  themeColor: string
  themeBg: string
}

export default function Ticker({ themeColor, themeBg }: TickerProps) {
  return (
    <div
      className="bg-black overflow-hidden whitespace-nowrap sticky top-0 z-50"
      style={{ border: `1px solid ${themeColor}` }}
    >
      <div className="ticker py-1 px-4">
        <a 
          href="https://t3mpl3.netlify.app/" 
          target="_blank"
          rel="noopener noreferrer"
          className={`hover:${themeBg} hover:text-black px-2`}
        >
          {'MANIFESTO ░░░ '.repeat(20)}
        </a>
      </div>
    </div>
  )
}
