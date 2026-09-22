import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { useCursorStore } from "../store/useCursorStore";

export const CustomCursor: React.FC = () => {
  const { isActive, text, isHovering } = useCursorStore();
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for the trailing effect
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      let targetX = e.clientX;
      let targetY = e.clientY;

      const target = useCursorStore.getState().magneticTarget;
      if (target) {
        // pull slightly towards the center of the button
        targetX = e.clientX + (target.x - e.clientX) * 0.4;
        targetY = e.clientY + (target.y - e.clientY) * 0.4;
      }

      mouseX.set(targetX);
      mouseY.set(targetY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [mouseX, mouseY, isVisible]);

  if (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  ) {
    // Disable on touch devices
    return null;
  }

  // Variants for different cursor states
  const variants = {
    default: {
      width: 16,
      height: 16,
      x: "-50%",
      y: "-50%",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      mixBlendMode: "difference" as const,
    },
    active: {
      width: 64,
      height: 64,
      x: "-50%",
      y: "-50%",
      backgroundColor: "rgba(255, 255, 255, 1)",
      mixBlendMode: "normal" as const,
    },
    hover: {
      width: 48,
      height: 48,
      x: "-50%",
      y: "-50%",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      border: "1px solid rgba(255,255,255,0.5)",
      mixBlendMode: "normal" as const,
    },
  };

  let currentState = "default";
  if (isActive) currentState = "active";
  else if (isHovering) currentState = "hover";

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[100] flex items-center justify-center shadow-lg"
        style={{
          left: cursorX,
          top: cursorY,
          opacity: isVisible ? 1 : 0,
        }}
        variants={variants}
        animate={currentState}
        transition={{ type: "tween", ease: "backOut", duration: 0.3 }}
      >
        {isActive && text && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="text-[10px] font-bold text-zinc-950 uppercase tracking-widest whitespace-nowrap"
          >
            {text}
          </motion.span>
        )}
      </motion.div>
    </>
  );
};
