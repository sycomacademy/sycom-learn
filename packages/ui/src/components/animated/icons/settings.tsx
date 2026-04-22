"use client";

import { m, type Variants } from "motion/react";

import {
  getVariants,
  IconWrapper,
  useAnimateIconContext,
  type IconProps,
} from "@sycom/ui/components/animated/icons/icon";

type SettingsProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {
      initial: { rotate: 0 },
      animate: { rotate: 30, transition: { duration: 0.55, ease: "easeInOut" } },
    },
    circle: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: SettingsProps) {
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
      <m.path
        d="M12.22 2h-.44a2 2 0 0 0-2 1.72l-.09.66a2 2 0 0 1-1.43 1.66 2 2 0 0 1-2.02-.43l-.49-.46a2 2 0 0 0-2.83 0l-.31.31a2 2 0 0 0 0 2.83l.46.49a2 2 0 0 1 .43 2.02 2 2 0 0 1-1.66 1.43l-.66.09a2 2 0 0 0-1.72 2v.44a2 2 0 0 0 1.72 2l.66.09a2 2 0 0 1 1.66 1.43 2 2 0 0 1-.43 2.02l-.46.49a2 2 0 0 0 0 2.83l.31.31a2 2 0 0 0 2.83 0l.49-.46a2 2 0 0 1 2.02-.43 2 2 0 0 1 1.43 1.66l.09.66a2 2 0 0 0 2 1.72h.44a2 2 0 0 0 2-1.72l.09-.66a2 2 0 0 1 1.43-1.66 2 2 0 0 1 2.02.43l.49.46a2 2 0 0 0 2.83 0l.31-.31a2 2 0 0 0 0-2.83l-.46-.49a2 2 0 0 1-.43-2.02 2 2 0 0 1 1.66-1.43l.66-.09a2 2 0 0 0 1.72-2v-.44a2 2 0 0 0-1.72-2l-.66-.09a2 2 0 0 1-1.66-1.43 2 2 0 0 1 .43-2.02l.46-.49a2 2 0 0 0 0-2.83l-.31-.31a2 2 0 0 0-2.83 0l-.49.46a2 2 0 0 1-2.02.43 2 2 0 0 1-1.43-1.66l-.09-.66A2 2 0 0 0 12.22 2z"
        variants={variants.path1}
        initial="initial"
        animate={controls}
        style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}
      />
      <m.circle
        cx={12}
        cy={12}
        r={3}
        variants={variants.circle}
        initial="initial"
        animate={controls}
      />
    </m.svg>
  );
}

function Settings(props: SettingsProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Settings,
  Settings as SettingsIcon,
  type SettingsProps,
  type SettingsProps as SettingsIconProps,
};
