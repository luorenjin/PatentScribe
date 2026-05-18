
export const Logo = ({ size = 24, className = "" }: { size?: number; className?: string }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="512" height="512" rx="128" fill="#4F46E5"/>
      <path d="M150 362L150 150L250 150C300 150 330 180 330 220C330 260 300 290 250 290L200 290L200 362L150 362Z" fill="white"/>
      <path d="M260 210L362 210L362 312L260 312L260 210Z" fill="white" fillOpacity="0.2"/>
      <circle cx="362" cy="312" r="40" fill="#818CF8"/>
      <path d="M342 292L382 332M382 292L342 332" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  );
};
