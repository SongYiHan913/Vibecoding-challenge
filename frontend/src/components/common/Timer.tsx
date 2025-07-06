import React, { useEffect, useState, useRef } from 'react';
import { formatTimeRemaining } from '@/utils';

interface TimerProps {
  initialTime: number; // 초 단위
  onTimeUp?: () => void;
  onTimeUpdate?: (timeLeft: number) => void; // 시간 업데이트 콜백
  className?: string;
  warningThreshold?: number; // 경고 표시 임계값 (초)
}

export const Timer: React.FC<TimerProps> = ({
  initialTime,
  onTimeUp,
  onTimeUpdate,
  className = '',
  warningThreshold = 300, // 기본 5분
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // initialTime이 변경될 때만 timeLeft 업데이트
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  // 타이머 시작/정지 로직
  useEffect(() => {
    // 기존 interval 정리
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // 새 interval 시작
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev <= 1 ? 0 : prev - 1;
        
        if (newTime <= 0) {
          onTimeUp?.();
        } else {
          onTimeUpdate?.(newTime); // 시간 업데이트 콜백 호출
        }
        
        return newTime;
      });
    }, 1000);

    // cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // 빈 dependency array로 한 번만 실행

  // 시간이 0이 되면 타이머 정지
  useEffect(() => {
    if (timeLeft <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timeLeft]);

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