"use client";

import { m, type Variants } from "motion/react";

import {
  getVariants,
  IconWrapper,
  useAnimateIconContext,
  type IconProps,
} from "@sycom/ui/components/animated/icons/icon";

type ThemeToggleProps = IconProps<keyof typeof animations>;

const rotateTransition = {
  duration: 0.35,
  ease: "easeInOut",
} as const;

const animations = {
  default: {
    group: {
      initial: {
        rotate: 0,
      },
      animate: {
        rotate: [0, 20, -14, 12, 0],
        transition: {
          duration: 0.55,
          ease: "easeInOut",
        },
      },
    },
    circle: {},
  } satisfies Record<string, Variants>,
  light: {
    group: {
      initial: {
        rotate: 180,
      },
      animate: {
        rotate: 0,
        transition: rotateTransition,
      },
    },
    circle: {},
  } satisfies Record<string, Variants>,
  dark: {
    group: {
      initial: {
        rotate: 0,
      },
      animate: {
        rotate: 180,
        transition: rotateTransition,
      },
    },
    circle: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ThemeToggleProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <m.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <m.circle
        cx={12}
        cy={12}
        r={9}
        variants={variants.circle}
        initial="initial"
        animate={controls}
      />
      <m.g
        variants={variants.group}
        initial="initial"
        animate={controls}
        style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}
      >
        <path d="M12 3v18" />
        <path d="m12 9 4.65-4.65" />
        <path d="m12 14.3 7.37-7.37" />
        <path d="m12 19.6 8.85-8.85" />
      </m.g>
    </m.svg>
  );
}

function ThemeToggle(props: ThemeToggleProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  ThemeToggle,
  ThemeToggle as ThemeToggleIcon,
  type ThemeToggleProps,
  type ThemeToggleProps as ThemeToggleIconProps,
};
