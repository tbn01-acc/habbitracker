import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ActivityRingsProps {
  habitsProgress: number; // 0-100
  tasksProgress: number; // 0-100
  financeProgress: number; // 0-100
  dayQuality?: number; // 0-100 - overall day quality
  size?: number;
}

// Get color based on day quality value
function getDayQualityColor(value: number): string {
  if (value <= 20) return 'hsl(0, 85%, 55%)'; // Red
  if (value <= 40) return 'hsl(30, 90%, 55%)'; // Orange
  if (value <= 60) return 'hsl(50, 90%, 50%)'; // Yellow
  if (value <= 80) return 'hsl(270, 70%, 60%)'; // Purple
  if (value <= 90) return 'hsl(195, 80%, 55%)'; // Light blue
  if (value <= 99) return 'hsl(220, 85%, 55%)'; // Blue
  return 'hsl(140, 75%, 50%)'; // Green (100)
}

export function ActivityRings({ 
  habitsProgress,
  tasksProgress,
  financeProgress,
  dayQuality = 0,
  size = 84,
}: ActivityRingsProps) {
  const navigate = useNavigate();
  
  // Ring configuration (from outer to inner)
  const rings = [
    { progress: habitsProgress, color: 'hsl(var(--habit))', paleColor: 'hsla(var(--habit) / 0.2)', name: 'habits' },
    { progress: tasksProgress, color: 'hsl(var(--task))', paleColor: 'hsla(var(--task) / 0.2)', name: 'tasks' },
    { progress: financeProgress, color: 'hsl(var(--finance))', paleColor: 'hsla(var(--finance) / 0.2)', name: 'finance' },
  ];
  
  const strokeWidth = 6;
  const gap = 2;
  const center = size / 2;
  
  // Gap at 9 o'clock position (left side)
  // Gap size in degrees
  const gapDegrees = 25;
  
  return (
    <motion.button
      onClick={() => navigate('/life-focus')}
      className="relative flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
      style={{ width: size, height: size }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        width={size}
        height={size}
        className="transform rotate-180"
      >
        {rings.map((ring, index) => {
          // Calculate radius for each ring (outer to inner)
          const radius = (size / 2) - (strokeWidth / 2) - (index * (strokeWidth + gap));
          const circumference = 2 * Math.PI * radius;
          
          // Calculate arc length considering the gap
          const availableAngle = 360 - gapDegrees;
          const availableCircumference = (availableAngle / 360) * circumference;
          const progressDash = (ring.progress / 100) * availableCircumference;
          
          // Gap offset - we start the arc after the gap
          const gapStartOffset = (gapDegrees / 2 / 360) * circumference;
          
          return (
            <g key={ring.name}>
              {/* Background track with gap */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.paleColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${availableCircumference} ${circumference}`}
                strokeDashoffset={-gapStartOffset}
              />
              
              {/* Progress arc with sequential animation */}
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${progressDash} ${circumference}`}
                strokeDashoffset={-gapStartOffset}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${progressDash} ${circumference}` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + index * 0.2 }}
              />
            </g>
          );
        })}
      </svg>
      
      {/* Day Quality Indicator in center */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: 'none' }}
      >
        <motion.span
          className="font-bold text-sm leading-none"
          style={{ color: getDayQualityColor(dayQuality) }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.3 }}
        >
          {Math.round(dayQuality)}
        </motion.span>
      </div>
    </motion.button>
  );
}