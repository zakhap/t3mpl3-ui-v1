export function TempleLogo() {
  return (
    <div className="relative w-24 h-24 mx-auto mb-4">
      <div className="absolute inset-0 bg-teal-400 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute inset-2 border-4 border-teal-400 rounded-full"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-16 bg-gradient-to-b from-teal-400 to-teal-600 clip-temple"></div>
      </div>
    </div>
  )
}

// Add this to your globals.css or a separate CSS file
// .clip-temple {
//   clip-path: polygon(0% 100%, 100% 100%, 100% 40%, 50% 0%, 0% 40%);
// }
