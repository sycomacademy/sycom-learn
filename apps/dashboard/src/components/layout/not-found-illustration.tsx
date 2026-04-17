import { cn } from "@sycom/ui/lib/utils";

const styles = `
@keyframes notFoundIllusFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes notFoundIllusDrift {
  0%, 100% { transform: translateX(0); opacity: 0.35; }
  50% { transform: translateX(4px); opacity: 0.85; }
}
@keyframes notFoundIllusBlink {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 1; }
}
.not-found-illus-root .not-found-illus-scene {
  animation: notFoundIllusFloat 5s ease-in-out infinite;
  will-change: transform;
}
.not-found-illus-root .not-found-illus-q1,
.not-found-illus-root .not-found-illus-q2,
.not-found-illus-root .not-found-illus-q3 {
  animation: notFoundIllusBlink 2.4s ease-in-out infinite;
}
.not-found-illus-root .not-found-illus-q2 {
  animation-delay: 0.35s;
}
.not-found-illus-root .not-found-illus-q3 {
  animation-delay: 0.7s;
}
.not-found-illus-root .not-found-illus-mag {
  animation: notFoundIllusDrift 3.5s ease-in-out infinite;
  transform-origin: 120px 100px;
  will-change: transform, opacity;
}
@media (prefers-reduced-motion: reduce) {
  .not-found-illus-root .not-found-illus-scene,
  .not-found-illus-root .not-found-illus-q1,
  .not-found-illus-root .not-found-illus-q2,
  .not-found-illus-root .not-found-illus-q3,
  .not-found-illus-root .not-found-illus-mag {
    animation: none !important;
  }
  .not-found-illus-root .not-found-illus-mag {
    opacity: 0.75;
    transform: none;
  }
}
`;

type NotFoundIllustrationProps = {
  className?: string;
};

/**
 * Decorative animated illustration for the not-found page.
 * Motion is disabled when the user prefers reduced motion.
 */
export function NotFoundIllustration({ className }: NotFoundIllustrationProps) {
  return (
    <div className={cn("not-found-illus-root text-primary", className)}>
      <style>{styles}</style>
      <svg
        aria-labelledby="not-found-illus-title not-found-illus-desc"
        className="mx-auto h-auto w-full max-w-[min(100%,280px)]"
        role="img"
        viewBox="0 0 240 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title id="not-found-illus-title">Page not found illustration</title>
        <desc id="not-found-illus-desc">
          A floating document with a magnifying glass and drifting question marks suggesting a
          missing page.
        </desc>
        <defs>
          <linearGradient
            id="notFoundPaper"
            x1="48"
            x2="192"
            y1="32"
            y2="168"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient
            id="notFoundFloor"
            x1="0"
            x2="240"
            y1="180"
            y2="200"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <g className="text-muted-foreground">
          <ellipse cx="120" cy="188" fill="url(#notFoundFloor)" rx="96" ry="10" />
        </g>

        <g className="not-found-illus-scene">
          <g transform="translate(0, 4)">
            <rect
              fill="url(#notFoundPaper)"
              height="120"
              rx="8"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="1.5"
              width="144"
              x="48"
              y="40"
            />
            <path
              d="M 48 52 L 60 40 L 60 52 Z"
              fill="currentColor"
              fillOpacity="0.08"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="1"
            />
            <g
              fill="none"
              opacity="0.45"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="3"
            >
              <path d="M 72 72 h 48" />
              <path d="M 72 88 h 72" />
              <path d="M 72 104 h 56" />
            </g>
          </g>

          <g className="not-found-illus-q1" fill="currentColor" opacity="0.55">
            <circle cx="188" cy="58" r="3" />
          </g>
          <g className="not-found-illus-q2" fill="currentColor" opacity="0.55">
            <circle cx="200" cy="78" r="3" />
          </g>
          <g className="not-found-illus-q3" fill="currentColor" opacity="0.55">
            <circle cx="194" cy="98" r="3" />
          </g>

          <g className="not-found-illus-mag">
            <circle
              cx="150"
              cy="118"
              fill="none"
              r="28"
              stroke="currentColor"
              strokeOpacity="0.55"
              strokeWidth="5"
            />
            <line
              stroke="currentColor"
              strokeLinecap="round"
              strokeOpacity="0.55"
              strokeWidth="6"
              x1="170"
              x2="196"
              y1="138"
              y2="164"
            />
            <circle
              cx="150"
              cy="118"
              fill="none"
              opacity="0.35"
              r="28"
              stroke="currentColor"
              strokeWidth="2"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
