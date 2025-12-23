'use client';

interface LevelProgressBarProps {
  totalXp: number;
  className?: string;
  showLevel?: boolean;
}

export function LevelProgressBar({ totalXp, className = "", showLevel = true }: LevelProgressBarProps) {
  const level = Math.floor((totalXp || 0) / 100) + 1;
  const progress = (totalXp || 0) % 100;

  return (
    <div className={`w-full ${className}`}>
      {showLevel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">Nivel {level}</span>
          <span className="text-sm text-muted-foreground">{progress} / 100 XP</span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(var(--primary),0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
