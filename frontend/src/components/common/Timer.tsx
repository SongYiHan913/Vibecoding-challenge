import React, { useEffect, useState } from 'react';
import { formatTimeRemaining } from '@/utils';

interface TimerProps {
  initialTime: number; // 초 단위
  onTimeUp?: () => void;
  className?: string;
  warningThreshold?: number; // 경고 표시 임계값 (초)
}

export const Timer: React.FC<TimerProps> = ({
  initialTime,
  onTimeUp,
  className = '',
  warningThreshold = 300, // 기본 5분
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp]);

  const isWarning = timeLeft <= warningThreshold && timeLeft > 0;
  const isDanger = timeLeft <= 60 && timeLeft > 0; // 1분 이하

  const getTimerColor = () => {
    if (isDanger) return 'text-red-600 bg-red-50 border-red-200';
    if (isWarning) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  return (
    <div
      className={`inline-flex items-center px-3 py-2 rounded-md border ${getTimerColor()} ${className}`}
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="font-mono font-medium">
        {formatTimeRemaining(timeLeft)}
      </span>
    </div>
  );
}; 