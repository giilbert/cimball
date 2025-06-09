import { Suspense, useEffect } from "react";
import { useStoreSuspense } from "../lib/maf";
import { motion, useAnimate } from "motion/react";

export const PointsDisplay: React.FC = () => {
  return (
    <div className="border px-3 py-2">
      <Suspense>
        <Inner />
      </Suspense>
    </div>
  );
};

const Inner: React.FC = () => {
  const store = useStoreSuspense<{
    points: number;
    multiplier: number;
  }>("points");
  const [scoreRef, animateScore] = useAnimate();

  useEffect(() => {
    if (store.data.points === 0) return;

    async function run() {
      const scale = Math.random() * 1.2 + 1;
      const rotation =
        Math.random() < 0.5
          ? -(Math.random() * 10 + 20)
          : Math.random() * 10 + 20; // random between [20, 30] or [20, 30]

      await animateScore(
        scoreRef.current,
        { scale: [1, scale, 1], rotate: [0, rotation, 0] },
        {
          duration: 0.2,
        }
      );

      if (store.data.multiplier > 1) {
        const multiplierRotation = Math.min(
          Math.abs(store.data.multiplier * 0.7),
          15
        );
        animateScore(
          scoreRef.current,
          { rotate: [-multiplierRotation, 0, multiplierRotation] },
          {
            duration: 0.1,
            repeat: Infinity,
          }
        );
      }
    }

    run();
  }, [animateScore, scoreRef, store.data.points, store.data.multiplier]);

  return (
    <>
      <motion.p className="font-mono text-4xl font-bold w-min" ref={scoreRef}>
        {store.data.points}
      </motion.p>
      <p>x{store.data.multiplier}</p>
    </>
  );
};
