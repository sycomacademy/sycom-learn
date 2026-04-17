import { cn } from "@sycom/ui/lib/utils";

const styles = `
@keyframes transientErrCloud {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-5px) scale(1.02); }
}
@keyframes transientErrArc {
  0%, 100% { stroke-opacity: 0.15; transform: translateY(0); }
  50% { stroke-opacity: 0.75; transform: translateY(-3px); }
}
@keyframes transientErrBolt {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}
.transient-err-illus-root .transient-err-illus-cloud {
  animation: transientErrCloud 4.5s ease-in-out infinite;
  transform-origin: 120px 90px;
  will-change: transform;
}
.transient-err-illus-root .transient-err-illus-arc {
  animation: transientErrArc 2.8s ease-in-out infinite;
  transform-origin: 120px 132px;
  will-change: transform;
}
.transient-err-illus-root .transient-err-illus-arc2 {
  animation-delay: 0.25s;
}
.transient-err-illus-root .transient-err-illus-bolt {
  animation: transientErrBolt 1.8s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .transient-err-illus-root .transient-err-illus-cloud,
  .transient-err-illus-root .transient-err-illus-arc,
  .transient-err-illus-root .transient-err-illus-bolt {
    animation: none !important;
  }
  .transient-err-illus-root .transient-err-illus-arc {
    stroke-opacity: 0.45;
    transform: none;
  }
  .transient-err-illus-root .transient-err-illus-bolt {
    opacity: 0.85;
  }
}
`;

type TransientErrorIllustrationProps = {
  className?: string;
};

/**
 * Decorative animated illustration for transient route errors.
 */
export function TransientErrorIllustration({ className }: TransientErrorIllustrationProps) {
  return (
    <div className={cn("transient-err-illus-root text-primary", className)}>
      <style>{styles}</style>
      <svg
        aria-labelledby="transient-err-illus-title transient-err-illus-desc"
        className="mx-auto h-auto w-full max-w-[min(100%,280px)]"
        role="img"
        viewBox="0 0 240 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title id="transient-err-illus-title">Connection issue illustration</title>
        <desc id="transient-err-illus-desc">
          A soft cloud with animated signal arcs and a brief flash suggesting an interrupted
          connection.
        </desc>
        <defs>
          <linearGradient
            id="transientErrSky"
            x1="0"
            x2="240"
            y1="0"
            y2="200"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.06" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id="transientErrGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect fill="url(#transientErrSky)" height="200" width="240" />

        <g className="transient-err-illus-cloud" fill="currentColor" opacity="0.14">
          <ellipse cx="98" cy="102" rx="44" ry="30" />
          <ellipse cx="142" cy="96" rx="54" ry="36" />
          <ellipse cx="182" cy="104" rx="40" ry="28" />
        </g>

        <g
          className="text-muted-foreground"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
        >
          <path
            className="transient-err-illus-arc"
            d="M 64 148 Q 120 120 176 148"
            strokeWidth="3"
          />
          <path
            className="transient-err-illus-arc transient-err-illus-arc2"
            d="M 72 160 Q 120 132 168 160"
            strokeOpacity="0.55"
            strokeWidth="2.5"
          />
        </g>

        <g className="transient-err-illus-bolt" fill="currentColor">
          <path
            d="M 118 56 L 134 56 L 124 78 L 138 78 L 108 118 L 118 86 L 104 86 Z"
            filter="url(#transientErrGlow)"
            opacity="0.85"
          />
        </g>
      </svg>
    </div>
  );
}
