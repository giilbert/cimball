import { MafClient } from "@maf/client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type MafState =
  | {
      type: "connecting";
    }
  | {
      type: "error";
      error: {
        message: string;
      };
    }
  | {
      type: "connected";
    };

export const MafProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const clientRef = useRef<MafClient | null>(null);

  const [state, setState] = useState<MafState>({
    type: "connecting",
  });

  useEffect(() => {
    if (clientRef.current) {
      return;
    }

    const client = new MafClient({
      app: "gilbert/cimball",
      url: "http://localhost:3000",
    });
    clientRef.current = client;

    setState({ type: "connecting" });

    Promise.all([
      client.connect(),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ])
      .then(() => {
        setState({ type: "connected" });
      })
      .catch((err) => {
        console.error(err);
        setTimeout(() => {
          setState({ type: "error", error: { message: "failed to connect" } });
        }, 1000);
      });
  }, []);

  return (
    <AnimatePresence>
      {state.type === "connected" && (
        <motion.div
          layout
          key="connected"
          initial={{ opacity: 0 }}
          animate={{ opacity: 100, transition: { duration: 0.1 } }}
          className="fixed top-0 left-0 w-screen h-screen"
        >
          {children}
        </motion.div>
      )}

      {state.type === "connecting" && (
        <motion.div
          layout
          key="connecting"
          className="w-screen h-screen flex items-center justify-center fixed top-0 left-0"
          exit={{ opacity: 0 }}
        >
          <LoadingAnimation />
        </motion.div>
      )}

      {state.type === "error" && (
        <motion.div
          layout
          key="error"
          className="w-screen h-screen flex items-center justify-center fixed top-0 left-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 100, transition: { duration: 0.1 } }}
          exit={{ opacity: 0 }}
        >
          <p className="p-4 text-4xl font-bold">error: {state.error.message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const LoadingAnimation: React.FC = () => {
  const text = "Connecting...";

  return (
    <motion.p
      className="text-3xl font-bold"
      animate="animate"
      transition={{
        duration: 0.3,
        repeat: Infinity,
        staggerChildren: 0.1,
        delayChildren: 0,
      }}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          className="inline-block"
          variants={{
            animate: {
              rotate: [0, -1, 0, 1, -1, 0],
              y: [0, -1, 1, 0],
            },
          }}
          transition={{
            duration: 1,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.p>
  );
};
