import { buttonVariants } from "@sycom/ui/components/button";
import { cn } from "@sycom/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/*
 * SVG animations used on this page — applying the svg-animations skill.
 *
 * Hero network/shield (HeroGraphic)
 *   - Sequential SMIL chain: peripheral nodes fade in one after another via
 *     begin="prev.end" (skill §Timing and Synchronization). Centre-to-node
 *     edges then draw with stroke-dashoffset, also chained. Ring edges chain
 *     after the centre edges. No JS, no page coordination needed.
 *   - Data packet travels the perimeter ring via <animateMotion>+<mpath>
 *     with rotate="auto" (skill §animateMotion).
 *   - Shield fill is an animated <linearGradient> whose <stop>s shift via
 *     <animate attributeName="stop-color"> (skill §Gradient Animation).
 *   - Shield subtle pulse via CSS transform keyframe (inline SVG can use
 *     CSS; CSS handles transform-origin cleanly — skill §transform-origin).
 *   - Shield checkmark draws via stroke-dashoffset on mount
 *     (skill §Animated Checkmark).
 *
 * Feature icons (self-contained SMIL so they keep animating anywhere)
 *   - Multi-tenant: three <g> layers fade in sequentially via chained SMIL
 *     (skill §Staggered Multi-Path Drawing) and then loop a soft breathing
 *     opacity (skill §Breathing / Pulsing Glow).
 *   - Learning paths: <polyline> draws via stroke-dashoffset, then a dot
 *     travels the same polyline via <animateMotion><mpath/></animateMotion>
 *     (skill §Motion along a path). Checkpoint circles set their fill when
 *     the packet passes via chained <set>.
 *   - Labs: terminal cursor blink with keyTimes (skill §<animate>), and a
 *     typewriter effect using <set attributeName="visibility"> on each
 *     character chained to the previous (skill §<set>).
 *
 * How-it-works connector (HowItWorksSection)
 *   - IntersectionObserver adds .is-visible to the container on scroll,
 *     which unlocks a CSS stroke-dashoffset keyframe on the dashed
 *     connecting <path>. Scroll coordination belongs in CSS — not SMIL —
 *     so this is the right tool for this one.
 *
 * Pricing checks (PricingCard)
 *   - Each check <path> in the recommended card draws itself via
 *     stroke-dashoffset SMIL chained off the previous check, so they tick
 *     in sequentially (skill §Animated Checkmark).
 *
 * CTA footer backdrop (CtaFooterSection)
 *   - Liquid wave along the top edge via <animate attributeName="d" values="…">
 *     (skill §Wave / Liquid Effect).
 *   - A slow SMIL <animateTransform type="rotate"> on a background ring
 *     that crosses the panel (skill §Loading Spinner rotation pattern).
 *
 * Accessibility
 *   - SVGs with meaning have role="img" and <title>; decorative ones use
 *     aria-hidden="true".
 *   - usePauseSvgAnimationsOnReducedMotion() calls pauseAnimations() on
 *     every <svg> when the viewer prefers reduced motion — SMIL isn't
 *     covered by CSS's prefers-reduced-motion media query.
 *   - CSS keyframes live inside @media (prefers-reduced-motion: no-preference)
 *     and every animated element renders its final state outside that query.
 */

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const SIGN_UP_HREF = "#";
const DEMO_HREF = "#how";

function LandingPage() {
  usePauseSvgAnimationsOnReducedMotion();
  return (
    <main>
      <style>{keyframes}</style>
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CtaFooterSection />
    </main>
  );
}

function usePauseSvgAnimationsOnReducedMotion() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = (reduce: boolean) => {
      for (const svg of document.querySelectorAll<SVGSVGElement>("svg")) {
        if (reduce) svg.pauseAnimations();
        else svg.unpauseAnimations();
      }
    };
    apply(media.matches);
    const onChange = (event: MediaQueryListEvent) => apply(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
}

function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function HeroSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:py-28">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 border border-border bg-muted px-2.5 py-1 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
            <span className="size-1.5 bg-primary" aria-hidden="true" />
            Sycom LMS · v1
          </span>
          <h1 className="max-w-xl text-4xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
            Cybersecurity training built for teams.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Multi-tenant orgs, structured learning paths, and real-time progress tracking — in one
            platform your security team will actually use.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <a
              href={SIGN_UP_HREF}
              className={cn(buttonVariants({ variant: "default" }), "h-11 gap-2 px-5 text-sm")}
              aria-label="Get started with Sycom LMS"
            >
              Get Started
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a
              href={DEMO_HREF}
              className={cn(buttonVariants({ variant: "ghost" }), "h-11 px-5 text-sm")}
              aria-label="See a demo of Sycom LMS"
            >
              See a Demo
            </a>
          </div>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 font-mono text-xs text-muted-foreground">
            <div>
              <dt className="tracking-wider uppercase">Tenants</dt>
              <dd className="text-sm text-foreground">Isolated</dd>
            </div>
            <div>
              <dt className="tracking-wider uppercase">RBAC</dt>
              <dd className="text-sm text-foreground">Per-org roles</dd>
            </div>
            <div>
              <dt className="tracking-wider uppercase">Tracking</dt>
              <dd className="text-sm text-foreground">Real time</dd>
            </div>
          </dl>
        </div>
        <div className="relative">
          <HeroGraphic />
        </div>
      </div>
    </section>
  );
}

function HeroGraphic() {
  const nodes = [
    { x: 410, y: 240 },
    { x: 360, y: 360 },
    { x: 240, y: 410 },
    { x: 120, y: 360 },
    { x: 70, y: 240 },
    { x: 120, y: 120 },
    { x: 240, y: 70 },
    { x: 360, y: 120 },
  ];
  const cx = 240;
  const cy = 240;
  const edgeLen = 170;
  const nodeStep = 0.06;
  const edgeStep = 0.06;
  const firstEdgeStart = 0.2 + nodes.length * nodeStep;
  const firstRingStart = firstEdgeStart + nodes.length * edgeStep;
  const [firstNode, ...restNodes] = nodes;
  const ringPath = firstNode
    ? `M ${firstNode.x} ${firstNode.y} ${restNodes.map((n) => `L ${n.x} ${n.y}`).join(" ")} Z`
    : "";

  return (
    <svg
      viewBox="0 0 480 480"
      className="mx-auto block aspect-square w-full max-w-lg text-primary"
      role="img"
      aria-labelledby="hero-graphic-title"
    >
      <title id="hero-graphic-title">
        A network of learners connected around a central security shield
      </title>
      <defs>
        <linearGradient id="hero-shield-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28">
            <animate
              attributeName="stop-opacity"
              values="0.28;0.5;0.28"
              dur="5.2s"
              calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.03" />
        </linearGradient>
        <path id="hero-ring-path" d={ringPath} />
      </defs>

      {/* static frame */}
      <rect
        x="1"
        y="1"
        width="478"
        height="478"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.08"
      />
      <line
        x1="0"
        y1="240"
        x2="480"
        y2="240"
        stroke="currentColor"
        strokeOpacity="0.06"
        strokeDasharray="2 6"
      />
      <line
        x1="240"
        y1="0"
        x2="240"
        y2="480"
        stroke="currentColor"
        strokeOpacity="0.06"
        strokeDasharray="2 6"
      />

      {/* peripheral nodes — chained SMIL fade-in */}
      {nodes.map((node, i) => {
        const id = `hero-node-${i}`;
        const begin = i === 0 ? "0.2s" : `hero-node-${i - 1}.end`;
        return (
          <g key={id} opacity="0">
            <rect
              x={node.x - 10}
              y={node.y - 10}
              width="20"
              height="20"
              fill="var(--color-background)"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x={node.x - 4}
              y={node.y - 4}
              width="8"
              height="8"
              fill="currentColor"
              fillOpacity="0.9"
            />
            <animate
              id={id}
              attributeName="opacity"
              from="0"
              to="1"
              dur={`${nodeStep}s`}
              begin={begin}
              fill="freeze"
            />
          </g>
        );
      })}

      {/* centre-to-node edges — chained after last node */}
      {nodes.map((node, i) => {
        const id = `hero-edge-${i}`;
        const begin =
          i === 0 ? `hero-node-${nodes.length - 1}.end` : `hero-edge-${i - 1}.begin + ${edgeStep}s`;
        return (
          <line
            key={id}
            x1={cx}
            y1={cy}
            x2={node.x}
            y2={node.y}
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.25"
            strokeDasharray={edgeLen}
            strokeDashoffset={edgeLen}
          >
            <animate
              id={id}
              attributeName="stroke-dashoffset"
              from={edgeLen}
              to="0"
              dur="0.45s"
              begin={begin}
              calcMode="spline"
              keySplines="0.65 0 0.35 1"
              fill="freeze"
            />
          </line>
        );
      })}

      {/* ring edges — drawn after centre edges land */}
      {nodes.map((node, i) => {
        const next = nodes[(i + 1) % nodes.length];
        if (!next) return null;
        const id = `hero-ring-${i}`;
        const begin =
          i === 0 ? `hero-edge-${nodes.length - 1}.end` : `hero-ring-${i - 1}.begin + ${edgeStep}s`;
        return (
          <line
            key={id}
            x1={node.x}
            y1={node.y}
            x2={next.x}
            y2={next.y}
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeDasharray="140"
            strokeDashoffset="140"
          >
            <animate
              id={id}
              attributeName="stroke-dashoffset"
              from="140"
              to="0"
              dur="0.4s"
              begin={begin}
              calcMode="spline"
              keySplines="0.65 0 0.35 1"
              fill="freeze"
            />
          </line>
        );
      })}

      {/* data packet travelling the ring, fades in after the ring is drawn */}
      <g opacity="0">
        <animate
          attributeName="opacity"
          from="0"
          to="1"
          dur="0.3s"
          begin={`hero-ring-${nodes.length - 1}.end`}
          fill="freeze"
        />
        <circle r="5" fill="currentColor">
          <animateMotion
            dur="9s"
            repeatCount="indefinite"
            rotate="auto"
            begin={`hero-ring-${nodes.length - 1}.end`}
          >
            <mpath href="#hero-ring-path" />
          </animateMotion>
        </circle>
      </g>

      {/* shield — fades in mid-sequence, then pulses via CSS */}
      <g
        className="sycom-shield-pulse"
        opacity="0"
        style={{ animationDelay: `${firstRingStart}s` }}
      >
        <animate
          attributeName="opacity"
          from="0"
          to="1"
          dur="0.6s"
          begin={`${firstEdgeStart}s`}
          fill="freeze"
        />
        <path
          d="M 240 160 L 180 188 L 180 254 C 180 294 210 322 240 336 C 270 322 300 294 300 254 L 300 188 Z"
          fill="url(#hero-shield-gradient)"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M 216 248 L 234 266 L 268 226"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeDasharray="80"
          strokeDashoffset="80"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="80"
            to="0"
            dur="0.55s"
            begin={`${firstEdgeStart + 0.4}s`}
            calcMode="spline"
            keySplines="0.4 0 0.2 1"
            fill="freeze"
          />
        </path>
      </g>

      {/* corner brackets */}
      {[
        "M 0 24 L 0 0 L 24 0",
        "M 456 0 L 480 0 L 480 24",
        "M 0 456 L 0 480 L 24 480",
        "M 456 480 L 480 480 L 480 456",
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

function SocialProofSection() {
  const monograms = ["BU", "NCX", "SCO", "HLD", "GRX", "VRL"];
  return (
    <section className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <p className="text-center font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Trusted by teams at Babcock University and UK enterprises
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {monograms.map((m) => (
            <Monogram key={m} label={m} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Monogram({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center border border-border bg-background px-3 py-4 text-muted-foreground">
      <svg
        viewBox="0 0 120 32"
        className="h-6 w-auto"
        role="img"
        aria-label={`${label} logo placeholder`}
      >
        <title>{label}</title>
        <rect
          x="2"
          y="2"
          width="116"
          height="28"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.25"
        />
        <text
          x="60"
          y="22"
          textAnchor="middle"
          fill="currentColor"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="13"
          letterSpacing="2"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Platform
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything your security team needs to learn together.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Build isolated environments per organisation, roll out structured curricula, and watch
            real progress against real threats.
          </p>
        </div>

        <div className="mt-12 grid gap-px bg-border lg:grid-cols-3">
          <FeatureCard
            title="Multi-tenant Organisations"
            description="Isolated environments per org with role-based access. Admins, instructors, and learners see only what they should."
            icon={<MultiTenantIcon />}
          />
          <FeatureCard
            title="Structured Learning Paths"
            description="Courses → Sections → Lessons with progress tracking. Sequence curricula that actually move the needle on skills."
            icon={<LearningPathIcon />}
          />
          <FeatureCard
            title="Real-world Labs"
            description="Hands-on cybersecurity labs in the browser. Red-team and blue-team scenarios with zero local setup."
            icon={<LabsIcon />}
            badge="Coming soon"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  description,
  icon,
  badge,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        "group relative flex flex-col gap-6 bg-background p-8 transition-colors hover:bg-muted/30",
        visible && "is-visible",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="text-primary">{icon}</div>
        {badge ? (
          <span className="border border-border bg-muted px-2 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {badge}
          </span>
        ) : null}
      </div>
      <div>
        <h3 className="text-lg font-medium tracking-tight text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function MultiTenantIcon() {
  const rects = [
    { x: 8, y: 12, base: "var(--color-muted)", strokeOpacity: 0.45 },
    { x: 16, y: 18, base: "var(--color-background)", strokeOpacity: 0.7 },
    { x: 24, y: 24, base: "var(--color-background)", strokeOpacity: 1 },
  ];
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-14 text-primary"
      role="img"
      aria-label="Overlapping tenant boundaries"
    >
      <title>Multi-tenant organisations</title>
      {rects.map((r, i) => {
        const id = `mt-rect-${i}`;
        const begin = i === 0 ? "0.15s" : `mt-rect-${i - 1}.end`;
        return (
          <g key={id} opacity="0">
            <rect
              x={r.x}
              y={r.y}
              width="32"
              height="32"
              fill={r.base}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeOpacity={r.strokeOpacity}
            />
            <animate
              id={id}
              attributeName="opacity"
              from="0"
              to="1"
              dur="0.28s"
              begin={begin}
              fill="freeze"
            />
            <animate
              attributeName="opacity"
              values="1;0.82;1"
              dur="3.6s"
              begin={`mt-rect-${rects.length - 1}.end + ${0.4 + i * 0.2}s`}
              calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              repeatCount="indefinite"
            />
          </g>
        );
      })}
      <rect x="30" y="34" width="14" height="3" fill="currentColor" fillOpacity="0.8" />
      <rect x="30" y="40" width="20" height="3" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}

function LearningPathIcon() {
  const checkpoints = [
    { cx: 22, cy: 50, filled: false },
    { cx: 38, cy: 36, filled: false },
    { cx: 58, cy: 22, filled: true },
  ];
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-14 text-primary"
      role="img"
      aria-label="Stepped learning path with checkpoints"
    >
      <title>Structured learning paths</title>
      <polyline
        id="lp-path"
        points="6,50 22,50 22,36 38,36 38,22 58,22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeDasharray="120"
        strokeDashoffset="120"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="120"
          to="0"
          dur="1.1s"
          begin="0.2s"
          calcMode="spline"
          keySplines="0.65 0 0.35 1"
          fill="freeze"
        />
      </polyline>

      {checkpoints.map((cp, i) => (
        <circle
          key={`lp-chk-${i}`}
          cx={cp.cx}
          cy={cp.cy}
          r="4"
          fill={cp.filled ? "currentColor" : "var(--color-background)"}
          stroke="currentColor"
          strokeWidth="2"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.2s"
            begin={`${0.35 + i * 0.35}s`}
            fill="freeze"
          />
        </circle>
      ))}

      {/* packet traveling the polyline */}
      <circle r="3" fill="currentColor" opacity="0">
        <animate
          attributeName="opacity"
          from="0"
          to="1"
          dur="0.2s"
          begin="lp-path.end"
          fill="freeze"
        />
        <animateMotion dur="2.8s" repeatCount="indefinite" begin="lp-path.end" rotate="auto">
          <mpath href="#lp-path-motion" />
        </animateMotion>
      </circle>
      <path
        id="lp-path-motion"
        d="M 6 50 L 22 50 L 22 36 L 38 36 L 38 22 L 58 22"
        fill="none"
        stroke="none"
      />
    </svg>
  );
}

function LabsIcon() {
  const chars = ["$", " ", "l", "a", "b", " ", "r", "u", "n", " ", "c", "t", "f"];
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-14 text-primary"
      role="img"
      aria-label="Terminal window with a blinking cursor"
    >
      <title>Browser-based labs</title>
      <rect
        x="6"
        y="12"
        width="52"
        height="40"
        fill="var(--color-background)"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <line x1="6" y1="22" x2="58" y2="22" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="17" r="1.5" fill="currentColor" fillOpacity="0.6" />
      <circle cx="18" cy="17" r="1.5" fill="currentColor" fillOpacity="0.6" />
      <circle cx="24" cy="17" r="1.5" fill="currentColor" fillOpacity="0.6" />

      {/* typewriter: each character snaps visible in sequence via <set> */}
      {chars.map((ch, i) => {
        const id = `lab-ch-${i}`;
        const begin = i === 0 ? "0.6s" : `lab-ch-${i - 1}.end + 0.08s`;
        return (
          <text
            key={id}
            x={12 + i * 3.5}
            y="36"
            fill="currentColor"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontSize="7"
            letterSpacing="0.2"
            visibility="hidden"
          >
            {ch === " " ? "\u00a0" : ch}
            <set
              id={id}
              attributeName="visibility"
              to="visible"
              begin={begin}
              dur="0.001s"
              fill="freeze"
            />
          </text>
        );
      })}

      {/* cursor block — blinks via keyTimes */}
      <rect x={12 + chars.length * 3.5} y="30" width="5" height="8" fill="currentColor">
        <animate
          attributeName="opacity"
          values="1;1;0;0"
          keyTimes="0;0.5;0.5;1"
          dur="1s"
          repeatCount="indefinite"
          begin={`lab-ch-${chars.length - 1}.end`}
        />
      </rect>
      <rect x="12" y="42" width="28" height="2" fill="currentColor" fillOpacity="0.35" />
    </svg>
  );
}

function HowItWorksSection() {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>();
  const steps = [
    {
      n: "01",
      title: "Create your organisation",
      body: "Spin up an isolated tenant with your branding, roles, and policies in under a minute.",
    },
    {
      n: "02",
      title: "Enrol your team",
      body: "Invite members by email or SSO. Assign them to cohorts and pathways that match their role.",
    },
    {
      n: "03",
      title: "Track progress in real time",
      body: "Watch completion, scores, and skill growth update live as your team learns.",
    },
  ];
  return (
    <section id="how" className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            How it works
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            From zero to enrolled in three steps.
          </h2>
        </div>
        <div ref={ref} className={cn("relative mt-14", visible && "is-visible")}>
          <svg
            viewBox="0 0 1000 16"
            preserveAspectRatio="none"
            className="absolute inset-x-0 top-12 hidden h-4 w-full md:block"
            aria-hidden="true"
          >
            <path
              d="M 20 8 L 980 8"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="4 6"
              className="sycom-scroll-path text-primary"
            />
          </svg>
          <ol className="relative grid gap-6 md:grid-cols-3 md:gap-8">
            {steps.map((s, i) => (
              <li
                key={s.n}
                className="relative flex flex-col gap-4 border border-border bg-background p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center bg-primary font-mono text-xs text-primary-foreground">
                    {s.n}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                  <span className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-medium tracking-tight text-foreground">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const free = [
    "1 organisation",
    "Up to 5 team members",
    "Core learning paths",
    "Basic progress reports",
  ];
  const enterprise = [
    "Unlimited organisations",
    "Unlimited members and cohorts",
    "Custom curricula and labs",
    "SSO, audit logs, SLAs",
    "Dedicated success engineer",
  ];
  return (
    <section id="pricing" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Pricing
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Start free. Scale when you're ready.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Transparent tiers. No per-seat surprises. Upgrade when your programme outgrows the
            basics.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <PricingCard
            name="Free"
            price="£0"
            cadence="forever"
            description="For individuals and small teams getting started with structured training."
            features={free}
            cta={{ label: "Start Free", href: SIGN_UP_HREF, variant: "outline" }}
          />
          <PricingCard
            name="Enterprise"
            price="Custom"
            cadence="per org, per year"
            description="For security teams running company-wide training with compliance and scale requirements."
            features={enterprise}
            cta={{ label: "Book a Demo", href: DEMO_HREF, variant: "default" }}
            highlighted
          />
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  price,
  cadence,
  description,
  features,
  cta,
  highlighted,
}: {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: { label: string; href: string; variant: "default" | "outline" };
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 border p-8",
        highlighted
          ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
          : "border-border bg-background",
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium tracking-tight text-foreground">{name}</h3>
        {highlighted ? (
          <span className="border border-primary bg-primary px-2 py-0.5 font-mono text-[10px] tracking-wider text-primary-foreground uppercase">
            Recommended
          </span>
        ) : null}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight text-foreground">{price}</span>
          <span className="font-mono text-xs text-muted-foreground">{cadence}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <ul className="flex flex-col gap-3 border-t border-border pt-6">
        {features.map((f, i) => (
          <li key={f} className="flex items-start gap-3 text-sm text-foreground">
            {highlighted ? (
              <AnimatedCheck index={i} />
            ) : (
              <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <a
        href={cta.href}
        className={cn(buttonVariants({ variant: cta.variant }), "h-10 px-4 text-sm")}
      >
        {cta.label}
      </a>
    </div>
  );
}

function AnimatedCheck({ index }: { index: number }) {
  const id = `pricing-check-${index}`;
  const begin = index === 0 ? "0.15s" : `pricing-check-${index - 1}.end`;
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true">
      <path
        d="M 3 8.5 L 7 12 L 13 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeDasharray="22"
        strokeDashoffset="22"
      >
        <animate
          id={id}
          attributeName="stroke-dashoffset"
          from="22"
          to="0"
          dur="0.35s"
          begin={begin}
          calcMode="spline"
          keySplines="0.4 0 0.2 1"
          fill="freeze"
        />
      </path>
    </svg>
  );
}

function CtaFooterSection() {
  return (
    <section className="relative overflow-hidden bg-foreground text-background">
      <CtaWave />
      <CtaRotor />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center lg:py-32">
        <p className="font-mono text-[11px] tracking-[0.18em] text-background/60 uppercase">
          Ready when you are
        </p>
        <h2 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Start training your team today.
        </h2>
        <p className="max-w-xl text-base text-background/70">
          Stand up your organisation, enrol your team, and ship your first learning path this week.
        </p>
        <a
          href={SIGN_UP_HREF}
          className="mt-2 inline-flex h-12 items-center gap-2 bg-background px-6 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
          aria-label="Get started with Sycom LMS"
        >
          Get Started
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function CtaWave() {
  return (
    <svg
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full"
      aria-hidden="true"
    >
      <path fill="var(--color-background)" fillOpacity="0.06">
        <animate
          attributeName="d"
          dur="7s"
          calcMode="spline"
          keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
          repeatCount="indefinite"
          values="M 0,8 C 25,5 75,11 100,8 L 100,0 L 0,0 Z;
                  M 0,8 C 25,11 75,5 100,8 L 100,0 L 0,0 Z;
                  M 0,8 C 25,5 75,11 100,8 L 100,0 L 0,0 Z"
        />
      </path>
    </svg>
  );
}

function CtaRotor() {
  return (
    <svg
      viewBox="-100 -100 200 200"
      className="pointer-events-none absolute top-1/2 left-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 text-background opacity-[0.05]"
      aria-hidden="true"
    >
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0"
          to="360"
          dur="60s"
          repeatCount="indefinite"
        />
        <circle
          cx="0"
          cy="0"
          r="70"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.35"
          strokeDasharray="2 4"
        />
        <circle
          cx="0"
          cy="0"
          r="90"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.35"
          strokeDasharray="1 8"
        />
        <circle cx="70" cy="0" r="2" fill="currentColor" />
        <circle cx="-70" cy="0" r="2" fill="currentColor" />
        <circle cx="0" cy="90" r="1.2" fill="currentColor" />
      </g>
    </svg>
  );
}

const keyframes = `
.sycom-shield-pulse { opacity: 1; }
.sycom-scroll-path  { stroke-dashoffset: 0; stroke-dasharray: 4 6; }

@media (prefers-reduced-motion: no-preference) {
  @keyframes sycom-shield-breath {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.035); }
  }
  @keyframes sycom-scroll-draw {
    from { stroke-dashoffset: 960; }
    to   { stroke-dashoffset: 0; }
  }

  .sycom-shield-pulse {
    transform-origin: 240px 248px;
    transform-box: view-box;
    animation: sycom-shield-breath 4s ease-in-out infinite 1.4s;
    will-change: transform;
  }

  .sycom-scroll-path {
    stroke-dasharray: 960;
    stroke-dashoffset: 960;
    will-change: stroke-dashoffset;
  }
  .is-visible .sycom-scroll-path {
    animation: sycom-scroll-draw 1600ms 150ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sycom-scroll-path { stroke-dasharray: 4 6; stroke-dashoffset: 0; }
}
`;
