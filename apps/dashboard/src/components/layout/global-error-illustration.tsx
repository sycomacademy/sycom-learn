import { cn } from "@sycom/ui/lib/utils";

const styles = `
@keyframes globalErrBar {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(6px); }
}
@keyframes globalErrWrench {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}
.global-err-illus-root .global-err-illus-bars {
  animation: globalErrBar 3.2s ease-in-out infinite;
  will-change: transform;
}
.global-err-illus-root .global-err-illus-wrench {
  animation: globalErrWrench 2.6s ease-in-out infinite;
  transform-origin: 150px 96px;
  will-change: transform;
}
@media (prefers-reduced-motion: reduce) {
  .global-err-illus-root .global-err-illus-bars,
  .global-err-illus-root .global-err-illus-wrench {
    animation: none !important;
  }
  .global-err-illus-root .global-err-illus-wrench {
    transform: rotate(0deg);
  }
}
`;

type GlobalErrorIllustrationProps = {
  className?: string;
};

/**
 * Decorative animated illustration for global maintenance or fatal errors.
 */
export function GlobalErrorIllustration({ className }: GlobalErrorIllustrationProps) {
  return (
    <div className={cn("global-err-illus-root text-primary", className)}>
      <style>{styles}</style>
      <svg
        aria-labelledby="global-err-illus-title global-err-illus-desc"
        className="mx-auto h-auto w-full max-w-[min(100%,280px)]"
        role="img"
        viewBox="0 0 240 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title id="global-err-illus-title">Maintenance illustration</title>
        <desc id="global-err-illus-desc">
          Diagonal caution stripes and a gently moving wrench suggesting scheduled maintenance.
        </desc>
        <defs>
          <pattern
            height="12"
            id="globalErrStripes"
            patternTransform="rotate(-35)"
            patternUnits="userSpaceOnUse"
            width="12"
          >
            <rect fill="currentColor" height="12" opacity="0.12" width="6" x="0" y="0" />
            <rect fill="currentColor" height="12" opacity="0.04" width="6" x="6" y="0" />
          </pattern>
          <linearGradient
            id="globalErrBarrierGrad"
            x1="40"
            x2="200"
            y1="150"
            y2="170"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        <g className="text-muted-foreground">
          <rect fill="url(#globalErrStripes)" height="200" opacity="0.9" width="240" />
          <rect fill="url(#globalErrBarrierGrad)" height="18" rx="4" width="200" x="20" y="154" />
        </g>

        <g className="global-err-illus-bars" fill="currentColor" opacity="0.55">
          <rect height="34" rx="3" width="8" x="52" y="118" />
          <rect height="44" rx="3" width="8" x="68" y="108" />
          <rect height="52" rx="3" width="8" x="84" y="100" />
        </g>

        <g
          className="global-err-illus-wrench text-muted-foreground"
          fill="currentColor"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.2"
        >
          <path
            d="M 150 56
               L 162 68
               L 154 76
               L 142 64
               Z
               M 142 64
               C 128 50 108 52 98 66
               C 88 80 90 100 104 112
               L 120 128
               L 128 120
               L 112 104
               C 104 96 104 84 112 76
               C 122 66 136 64 142 64 Z"
            fillOpacity="0.12"
          />
          <path d="M 150 56 L 162 68 L 154 76 L 142 64" fill="none" strokeOpacity="0.65" />
          <path
            d="M 142 64 C 128 50 108 52 98 66 C 88 80 90 100 104 112 L 120 128 L 128 120 L 112 104 C 104 96 104 84 112 76 C 122 66 136 64 142 64"
            fill="none"
            strokeOpacity="0.65"
          />
        </g>
      </svg>
    </div>
  );
}
