"use client";

type BottomBlurProps = {
  height?: number;
  color?: string;
  className?: string;
};

export default function BottomBlur({
  height = 200,
  color = "#000000",
  className = "",
}: BottomBlurProps) {
  return (
    <div
      className={`absolute bottom-0 left-0 w-full pointer-events-none z-50 ${className}`}
      style={{
        height: `${height}px`,
        background: `linear-gradient(
          to top,
          ${color} 0%,
          ${color} 20%,
          ${color}CC 40%,
          ${color}80 60%,
          ${color}30 80%,
          transparent 100%
        )`,
      }}
    />
  );
}