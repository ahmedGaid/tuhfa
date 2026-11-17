import './Mascot.css';

export type MascotPose = 'idle' | 'happy' | 'think';

/** «نقطة» — an ink dot from Arabic calligraphy (tuhfa-brand). Placeholder drawing; refined in M4. */
export function Mascot({ pose = 'idle', size = 96 }: { pose?: MascotPose; size?: number }) {
  return (
    <svg
      class={`mascot mascot--${pose}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="نقطة"
    >
      <g transform="rotate(-18 32 32)">
        <path
          class="mascot__ink"
          d="M32 12c10 0 19 9 19 20 0 12-9 20-19 20S13 44 13 32c0-7 4-13 9-16 3-2 6-4 10-4z"
        />
        <circle class="mascot__eye" cx="26" cy="30" r="2.6" />
        <circle class="mascot__eye" cx="38" cy="30" r="2.6" />
        {pose === 'happy' ? (
          <path class="mascot__mouth" d="M26 38q6 6 12 0" />
        ) : (
          <path class="mascot__mouth" d="M27 39h10" />
        )}
      </g>
    </svg>
  );
}
