import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useMafClient } from "../lib/maf-context";

const randomRotation = () => Math.random() * 18 - 9;

const Key: React.FC<{ content: string; isPressed: boolean }> = ({
  content,
  isPressed,
}) => {
  const [rotation, setRotation] = useState(randomRotation());

  return (
    <motion.div
      className="min-w-8 h-8 text-lg bg-amber-50 font-bold border flex items-center justify-center px-3"
      initial={{ scale: 1 }}
      animate={{
        scale: isPressed ? 0.8 : 1,
        rotate: isPressed ? rotation : 0,
        transition: { duration: 0.1 },
      }}
      onAnimationComplete={() => {
        setRotation(randomRotation());
      }}
    >
      {content}
    </motion.div>
  );
};

export const ControlsDisplay: React.FC = () => {
  const [controls, setControls] = useState<[boolean, boolean, boolean]>([
    false,
    false,
    false,
  ]);
  const keysPressed = useRef<Record<string, boolean>>({});
  const maf = useMafClient();

  useEffect(() => {
    const updateControls = () => {
      console.log(keysPressed.current);
      const newControls = [
        keysPressed.current["f"] || false,
        keysPressed.current["j"] || false,
        keysPressed.current[" "] || false,
      ] as [boolean, boolean, boolean];

      setControls(newControls);
      maf.rpc("set_controls", newControls);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.current[event.key.toLowerCase()] = true;
      updateControls();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      delete keysPressed.current[event.key.toLowerCase()];
      updateControls();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [maf]);

  return (
    <div className="space-y-2">
      <p>CONTROLS</p>

      <div className="flex gap-2 items-center">
        <Key content="F" isPressed={controls[0]} /> <p>to flip left paddle</p>
      </div>

      <div className="flex gap-2 items-center">
        <Key content="J" isPressed={controls[1]} /> <p>to flip right paddle</p>
      </div>

      <div className="flex gap-2 items-center">
        <Key content="Space" isPressed={controls[2]} /> <p>to launch</p>
      </div>
    </div>
  );
};
