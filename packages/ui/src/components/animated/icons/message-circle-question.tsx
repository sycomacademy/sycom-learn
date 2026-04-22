"use client";

import { m, type Variants } from "motion/react";

import {
  getVariants,
  IconWrapper,
  useAnimateIconContext,
  type IconProps,
} from "@sycom/ui/components/animated/icons/icon";

type MessageCircleQuestionProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {},
    path2: {
      initial: { y: 0 },
      animate: { y: [-0.8, 0.4, 0], transition: { duration: 0.45, ease: "easeInOut" } },
    },
    path3: {
      initial: { opacity: 1 },
      animate: { opacity: [1, 0.4, 1], transition: { duration: 0.45, ease: "easeInOut" } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: MessageCircleQuestionProps) {
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
        d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <m.path
        d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3"
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <m.path d="M12 17h.01" variants={variants.path3} initial="initial" animate={controls} />
    </m.svg>
  );
}

function MessageCircleQuestion(props: MessageCircleQuestionProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  MessageCircleQuestion,
  MessageCircleQuestion as MessageCircleQuestionIcon,
  type MessageCircleQuestionProps,
  type MessageCircleQuestionProps as MessageCircleQuestionIconProps,
};
