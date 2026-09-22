import { create } from "zustand";

interface CursorState {
  isActive: boolean;
  text: string;
  isHovering: boolean;
  magneticTarget: { x: number; y: number } | null;
  setIsActive: (active: boolean) => void;
  setText: (text: string) => void;
  setIsHovering: (hovering: boolean) => void;
  setMagneticTarget: (target: { x: number; y: number } | null) => void;
}

export const useCursorStore = create<CursorState>((set) => ({
  isActive: false,
  text: "",
  isHovering: false,
  magneticTarget: null,
  setIsActive: (isActive) => set({ isActive }),
  setText: (text) => set({ text }),
  setIsHovering: (isHovering) => set({ isHovering }),
  setMagneticTarget: (magneticTarget) => set({ magneticTarget }),
}));
