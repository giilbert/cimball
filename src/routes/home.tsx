import { createRoute } from "@tanstack/react-router";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { layoutRoute } from "./layout";
import { useEffect, useRef } from "react";
import { useMafClient } from "../lib/maf-context";
import { video } from "motion/react-client";

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

      const remoteConfiguration = {};
      const connection = new RTCPeerConnection(remoteConfiguration);
      connection.addEventListener("icecandidate", (event) => {
        console.log("icecandidate", event);
        if (event.candidate)
          maf.rpc("viewer_send_ice_candidate", event.candidate.toJSON());
      });
      connection.addEventListener("iceconnectionstatechange", () =>
        console.log("iceconnectionstatechange", connection.iceConnectionState)
      );
      connection.addEventListener("track", (event) => {
        console.log("got track", event);
        videoRef.current!.srcObject = event.streams[0];
        videoRef.current!.play();
      });

      maf.channel("ice_candidate").on("message", async (message) => {
        console.log("got remote ice candidate", message);
        const candidate = message as RTCIceCandidateInit;
        await connection.addIceCandidate(new RTCIceCandidate(candidate));
      });

      await connection.setRemoteDescription({ type: "offer", sdp });
      const answer = await connection.createAnswer({ sdp });

      await connection.setLocalDescription(answer);

      maf.rpc("viewer_answer", answer.sdp);
      console.log("answer:", answer);
    }

    if (hasRun.current) return;
    hasRun.current = true;
    runViewer();
  }, [maf]);

  return (
    <div className="col-span-2 bg-neutral-900 relative">
      <video ref={videoRef} autoPlay playsInline className="h-full w-auto" />
    </div>
  );
};

export const homeRoute = createRoute({
  path: "/",
  getParentRoute: () => layoutRoute,
  component: HomePage,
});
