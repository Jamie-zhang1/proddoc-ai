"use client";

import { motion } from "framer-motion";
import type { ComponentProps } from "react";

type MotionSectionProps = ComponentProps<typeof motion.section>;

export function MotionSection({ children, ...props }: MotionSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.section>
  );
}
