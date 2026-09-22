import React, { useRef } from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { useCursorStore } from "../store/useCursorStore";

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = "",
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { setIsHovering, setMagneticTarget } = useCursorStore();

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const { left, top, width, height } =
      buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    setMagneticTarget({ x: centerX, y: centerY });
    if (onMouseMove) onMouseMove(e);
  };

  return (
    <motion.button
      ref={buttonRef}
      className={className}
      onMouseEnter={(e) => {
        setIsHovering(true);
        if (onMouseEnter) onMouseEnter(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={(e) => {
        setIsHovering(false);
        setMagneticTarget(null);
        if (onMouseLeave) onMouseLeave(e);
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};
