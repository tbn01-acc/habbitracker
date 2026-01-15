import { motion } from 'framer-motion';

interface DayQualityRingProps {
  value: number; // 0-100
  size?: number;
  habitsProgress?: number; // 0-100
  tasksProgress?: number; // 0-100
  financeProgress?: number; // 0-100
}

function getQualityColor(value: number): string {
  if (value <= 20) return 'hsl(0, 70%, 50%)'; // red
  if (value <= 40) return 'hsl(30, 90%, 50%)'; // orange
  if (value <= 60) return 'hsl(50, 90%, 50%)'; // yellow
  if (value <= 80) return 'hsl(145, 70%, 45%)'; // green
  if (value <= 90) return 'hsl(200, 80%, 50%)'; // cyan
  if (value < 100) return 'hsl(220, 80%, 55%)'; // blue
  return 'hsl(262, 80%, 55%)'; // purple (100%)
}

function getContrastColor(value: number): string {
  if (value <= 20) return 'white'; // red
  if (value <= 40) return 'white'; // orange
  if (value <= 60) return 'hsl(0, 0%, 15%)'; // yellow - dark text
  if (value <= 80) return 'white'; // green
  if (value <= 90) return 'white'; // cyan
  if (value < 100) return 'white'; // blue
  return 'white'; // purple
}

export function DayQualityRing({ 
  value, 
  size = 84,
  habitsProgress = 0,
  tasksProgress = 0,
  financeProgress = 0
}: DayQualityRingProps) {
  const color = getQualityColor(value);
  const textColor = getContrastColor(value);
  
  // SVG parameters
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  // Calculate segment sizes based on total progress
  // Each segment starts where the previous one ended (clockwise from 12 o'clock)
  const totalSegments = 3;
  const habitsAngle = (habitsProgress / 100) * (360 / totalSegments);
  const tasksAngle = (tasksProgress / 100) * (360 / totalSegments);
  const financeAngle = (financeProgress / 100) * (360 / totalSegments);
  
  // Convert to dash arrays (starting from -90deg = 12 o'clock)
  const habitsDash = (habitsProgress / 100) * (circumference / totalSegments);
  const tasksDash = (tasksProgress / 100) * (circumference / totalSegments);
  const financeDash = (financeProgress / 100) * (circumference / totalSegments);
  
  // Starting offsets for each segment (rotating clockwise)
  const segmentLength = circumference / totalSegments;
  const habitsOffset = 0;
  const tasksOffset = segmentLength;
  const financeOffset = segmentLength * 2;

  return (
    <motion.div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Background circle */}
      <svg
        width={size}
        height={size}
        className="absolute transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        
        {/* Habits segment (green) */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--habit))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${habitsDash} ${circumference}`}
          strokeDashoffset={-habitsOffset}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${habitsDash} ${circumference}` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        
        {/* Tasks segment (blue) */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--task))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${tasksDash} ${circumference}`}
          strokeDashoffset={-tasksOffset}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${tasksDash} ${circumference}` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
        
        {/* Finance segment (purple) */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--finance))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${financeDash} ${circumference}`}
          strokeDashoffset={-financeOffset}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${financeDash} ${circumference}` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      
      {/* Center value */}
      <motion.div 
        className="absolute rounded-full flex items-center justify-center shadow-lg"
        style={{ 
          width: size - strokeWidth * 3, 
          height: size - strokeWidth * 3, 
          backgroundColor: color 
        }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <span 
          className="text-xl font-bold"
          style={{ color: textColor }}
        >
          {value}
        </span>
      </motion.div>
    </motion.div>
  );
}
