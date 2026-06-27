interface Props {
  /** 0–1 fill amount. */
  progress: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * SVG progress ring. The fill animates via a CSS `stroke-dashoffset`
 * transition (see `.ring__progress` in the stylesheet). Color comes from the
 * `--habit` CSS variable set by the parent.
 */
export default function CompletionRing({ progress, size = 104, strokeWidth = 9 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <svg className="ring" width={size} height={size} aria-hidden focusable="false">
      <circle
        className="ring__track"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <circle
        className="ring__progress"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
