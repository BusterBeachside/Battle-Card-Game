import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { playSound } from '../../utils/soundUtils';

interface CountUpProps {
  end: number;
  duration?: number; // in milliseconds
  prefix?: string;
  suffix?: string;
  delay?: number; // delay before count-up starts
  soundTicks?: boolean; // play a subtle sound as it rolls up
  className?: string;
  onComplete?: () => void;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 1000,
  prefix = '',
  suffix = '',
  delay = 150,
  soundTicks = true,
  className = '',
  onComplete,
}) => {
  const [count, setCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let started = false;
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    let lastPlayedVal = -1;
    let lastSoundTime = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = timestamp - startTimestamp;
      
      // Calculate eased progression (easeOutCubic)
      const t = Math.min(progress / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      
      const currentVal = Math.floor(ease * end);
      
      if (currentVal !== lastPlayedVal) {
        setCount(currentVal);
        // Play tick sound with a rhythm-preserving tick threshold
        const now = performance.now();
        if (soundTicks && currentVal > lastPlayedVal && (now - lastSoundTime >= 85)) {
          try {
            playSound('menu_click');
            lastSoundTime = now;
          } catch (e) {}
        }
        lastPlayedVal = currentVal;
      }

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(end);
        setIsCompleted(true);
        if (onComplete) onComplete();
      }
    };

    const delayTimeout = setTimeout(() => {
      started = true;
      animationFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(delayTimeout);
      if (started) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [end, duration, delay, soundTicks]);

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: isCompleted ? [1, 1.12, 1] : 1, 
        opacity: 1,
      }}
      transition={{ 
        opacity: {
          type: "spring",
          stiffness: 400,
          damping: 15,
          delay: delay / 1000
        },
        scale: {
          type: "tween",
          duration: 0.35,
          ease: "easeInOut"
        }
      }}
      className={`inline-block font-black tracking-tight ${className}`}
    >
      {prefix}
      {count}
      {suffix}
    </motion.span>
  );
};
