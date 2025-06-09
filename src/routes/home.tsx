import { createRoute } from "@tanstack/react-router";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { layoutRoute } from "./layout";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMafClient } from "../lib/maf-context";
import { useStoreSuspense } from "../lib/maf";
import { ControlsDisplay } from "../components/controls-display";
import { getRtcConfig } from "../lib/rtc-helper";
import { PointsDisplay } from "../components/points-display";

const Sidebar: React.FC = () => {
  return (
    <div className="col-span-1 p-4 space-y-4">
      <h1 className="font-['Carter_One'] text-6xl text-slate-950">CIMBALL</h1>

      <PointsDisplay />

      <ControlsDisplay />

      {/* <div className="space-y-1">
        <p className="text-xl">up next..</p>

        <Suspense fallback={<p>loading queue...</p>}>
          <Queue />
        </Suspense>
      </div> */}
    </div>
  );
};

const HomePage = () => {
  return (
    <div className="grid grid-cols-3 xl:grid-cols-4 h-screen">
      <Sidebar />
      <VideoThing />
    </div>
  );
};

const VideoThing: React.FC = () => {
  const hasRun = useRef(false);
  const maf = useMafClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function runViewer() {
      maf.rpc("start_viewer");

      const sdp = (await maf
        .channel("viewer_offer_response")
        .once("message")) as string;

      console.log("got sdp:\n", sdp);

      const connection = new RTCPeerConnection(await getRtcConfig());

      connection.addEventListener("icecandidate", (event) => {
        // console.log("icecandidate", event);
        if (event.candidate)
          maf.rpc("viewer_send_ice_candidate", event.candidate.toJSON());
      });

      // connection.addEventListener("iceconnectionstatechange", () => {
      //   console.log("iceconnectionstatechange", connection.iceConnectionState);
      // });

      connection.addEventListener("track", (event) => {
        // console.log("got track", event);
        videoRef.current!.srcObject = event.streams[0];
        videoRef.current!.play();
      });

      maf.channel("ice_candidate").on("message", async (message) => {
        // console.log("got remote ice candidate", message);
        const candidate = message as RTCIceCandidateInit;
        await connection.addIceCandidate(new RTCIceCandidate(candidate));
      });

      await connection.setRemoteDescription({ type: "offer", sdp });
      const answer = await connection.createAnswer({ sdp });

      await connection.setLocalDescription(answer);

      maf.rpc("viewer_answer", answer.sdp);
      // console.log("answer:", answer);
    }

    if (hasRun.current) return;
    hasRun.current = true;
    runViewer();
  }, [maf]);

  return (
    <div className="col-span-3 bg-neutral-900 relative">
      <video ref={videoRef} autoPlay playsInline className="h-full w-auto" />
    </div>
  );
};

export const Queue: React.FC = () => {
  const { data } = useStoreSuspense<string[]>("queue");
  const [inQueue, setInQueue] = useState(false);
  const maf = useMafClient();
  const [nameInput, setNameInput] = useState("");

  const joinQueue = useCallback(
    async (name: string) => {
      maf.rpc("join_queue", name);
    },
    [maf]
  );

  return (
    <>
      <div className="border p-2">
        <ol className="list-decimal list-inside">
          {data.map((item, index) => (
            <li key={index} className="text-sm">
              {item}
            </li>
          ))}
        </ol>

        {data.length === 0 && (
          <p className="text-sm text-neutral-700">no one in queue. join it!</p>
        )}
      </div>

      {!inQueue && (
        <form
          className="mt-3 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            if (nameInput.length < 1) return;
            joinQueue(nameInput);
            setNameInput("");
            setInQueue(true);
          }}
        >
          <label htmlFor="nickname">nickname</label>
          <div className="flex gap-1 w-full">
            <Input
              className="w-full"
              id="nickname"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <Button className="h-full" type="submit">
              join
            </Button>
          </div>
        </form>
      )}
    </>
  );
};

export const homeRoute = createRoute({
  path: "/",
  getParentRoute: () => layoutRoute,
  component: HomePage,
});
