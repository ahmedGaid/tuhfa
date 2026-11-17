import './Mascot.css';

export type MascotPose = 'idle' | 'happy' | 'think' | 'stretch';

/**
 * «نقطة» — an ink dot from Arabic calligraphy (tuhfa-brand). Four poses: idle · happy (bounce) ·
 * think · stretch (madd length: `stretch` = 1/2/3 → width ×1/×2/×3). Placeholder drawing; refined in M4.
 */
export function Mascot({
  pose = 'idle',
  size = 96,
  stretch = 1,
}: {
  pose?: MascotPose;
  size?: number;
  stretch?: 1 | 2 | 3;
}) {
  const w = pose === 'stretch' ? 64 * stretch : 64;
  return (
    <svg
      class={`mascot mascot--${pose}`}
      width={(size * w) / 64}
      height={size}
      viewBox={`0 0 ${w} 64`}
      role="img"
      aria-label="نقطة"
    >
      {pose === 'stretch' ? (
        <g>
          <rect class="mascot__ink" x="10" y="16" width={w - 20} height="34" rx="17" />
          <circle class="mascot__eye" cx={w / 2 - 6} cy="31" r="2.6" />
          <circle class="mascot__eye" cx={w / 2 + 6} cy="31" r="2.6" />
          <path class="mascot__mouth" d={`M${w / 2 - 5} 39h10`} />
        </g>
      ) : (
        <g transform="rotate(-18 32 32)">
          <path
            class="mascot__ink"
            d="M32 12c10 0 19 9 19 20 0 12-9 20-19 20S13 44 13 32c0-7 4-13 9-16 3-2 6-4 10-4z"
          />
          <circle class="mascot__eye" cx="26" cy="30" r="2.6" />
          <circle class="mascot__eye" cx="38" cy="30" r="2.6" />
          {pose === 'happy' ? (
            <path class="mascot__mouth" d="M26 38q6 6 12 0" />
          ) : pose === 'think' ? (
            <path class="mascot__mouth" d="M28 39q4-2 8 0" />
          ) : (
            <path class="mascot__mouth" d="M27 39h10" />
          )}
        </g>
      )}
    </svg>
  );
}
