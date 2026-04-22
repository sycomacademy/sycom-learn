"use client";

import { m, type Variants } from "motion/react";

import {
  getVariants,
  IconWrapper,
  useAnimateIconContext,
  type IconProps,
} from "@sycom/ui/components/animated/icons/icon";

type LayoutDashboardProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    rect1: {
      initial: { y: 0 },
      animate: { y: [-0.6, 0.6, 0], transition: { duration: 0.45, ease: "easeInOut" } },
    },
    rect2: {
      initial: { x: 0 },
      animate: { x: [0.6, -0.6, 0], transition: { duration: 0.45, ease: "easeInOut" } },
    },
    rect3: {
      initial: { x: 0 },
      animate: { x: [-0.6, 0.6, 0], transition: { duration: 0.45, ease: "easeInOut" } },
    },
    rect4: {
      initial: { y: 0 },
      animate: { y: [0.6, -0.6, 0], transition: { duration: 0.45, ease: "easeInOut" } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: LayoutDashboardProps) {
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
      <m.rect
        x={3}
        y={3}
        width={7}
        height={7}
        rx={1}
        variants={variants.rect1}
        initial="initial"
        animate={controls}
      />
      <m.rect
        x={14}
        y={3}
        width={7}
        height={4}
        rx={1}
        variants={variants.rect2}
        initial="initial"
        animate={controls}
      />
      <m.rect
        x={14}
        y={10}
        width={7}
        height={11}
        rx={1}
        variants={variants.rect3}
        initial="initial"
        animate={controls}
      />
      <m.rect
        x={3}
        y={14}
        width={7}
        height={7}
        rx={1}
        variants={variants.rect4}
        initial="initial"
        animate={controls}
      />
    </m.svg>
  );
}

function LayoutDashboard(props: LayoutDashboardProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  LayoutDashboard,
  LayoutDashboard as LayoutDashboardIcon,
  type LayoutDashboardProps,
  type LayoutDashboardProps as LayoutDashboardIconProps,
};
