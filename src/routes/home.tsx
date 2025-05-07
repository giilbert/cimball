import { createRoute } from "@tanstack/react-router";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { layoutRoute } from "./layout";

const Sidebar: React.FC = () => {
  return (
    <div className="col-span-1 p-4 space-y-4">
      <h1 className="font-['Carter_One'] text-6xl text-slate-950">CIMBALL</h1>

      <div className="space-y-1">
        <p className="text-xl">up next..</p>

        <div className="border p-2">
          <ol className="list-decimal list-inside">
            <li>
              Gilbert{" "}
              <span className="bg-orange-400 text-white font-bold px-1">
                (YOU)
              </span>
            </li>
            <li>Kyle</li>
            <li>Jeffrey</li>
            <li>Kevin</li>
            <li>Mr. Harb</li>
          </ol>

          <p>and (43) more..</p>
        </div>
      </div>

      <div className="mt-3 w-full">
        <label htmlFor="nickname">nickname</label>
        <div className="flex gap-1 w-full">
          <Input className="w-full" id="nickname" />
          <Button className="h-full">join</Button>
        </div>
      </div>
    </div>
  );
};

const GameLayout: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="grid grid-cols-4 h-screen">
      <Sidebar />
      <div className="col-span-2 bg-slate-950 text-white p-8">{children}</div>
      <div className="col-span-1"></div>
    </div>
  );
};

const HomePage = () => {
  return (
    <GameLayout>
      <p>insert video here</p>
    </GameLayout>
  );
};

export const homeRoute = createRoute({
  path: "/",
  getParentRoute: () => layoutRoute,
  component: HomePage,
});
