import { AnimatePresence, motion } from "framer-motion";

export interface ThemeTransitionState {
  key: number;
  x: number;
  y: number;
  /** Color of the expanding circle (the incoming theme background) */
  color: string;
}

interface Props {
  state: ThemeTransitionState | null;
  onDone: () => void;
}

export function ThemeTransitionOverlay({ state, onDone }: Props) {
  return (
    <AnimatePresence onExitComplete={onDone}>
      {state && (
        <motion.div
          key={state.key}
          className="pointer-events-none fixed inset-0 z-[100]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, delay: 0.55 }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              left: state.x,
              top: state.y,
              width: 0,
              height: 0,
              backgroundColor: state.color,
              translateX: "-50%",
              translateY: "-50%",
            }}
            initial={{ width: 0, height: 0 }}
            animate={{
              width: "300vmax",
              height: "300vmax",
            }}
            transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
