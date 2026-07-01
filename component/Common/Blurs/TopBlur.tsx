"use client";

type TopBlurProps = {
  height?: number;
  color?: string;
  className?: string;
};

export default function TopBlur({
  height = 200,
  color = "#000000",
  className = "",
}: TopBlurProps) {
  return (
    <div
      className={`absolute top-0 left-0 w-full pointer-events-none z-50 ${className}`}
      style={{
        height: `${height}px`,
        background: `linear-gradient(
          to bottom,
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