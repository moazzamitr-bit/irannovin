"use client";

import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimateOnScroll({ children, className = "", delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay: delay / 1000, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
