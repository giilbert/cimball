import { createRoute, Outlet, useRouter } from "@tanstack/react-router";
import { layoutRoute } from "./layout";
import { useMafClient } from "../lib/maf-context";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../components/button";
import type { MafClient } from "@maf/client";
import { getRtcConfig } from "../lib/rtc-helper";

const AdminPage: React.FC = () => {
  const maf = useMafClient();
  const router = useRouter();
  const hasRun = useRef(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function run() {
      const success = await maf.rpc<boolean>(
        "join_admin",
        localStorage.getItem("cimball_admin_secret")
      );

      if (success) {
        console.log("joined admin");
        setAuthenticated(true);
      } else {
        console.error("failed to join admin");
        router.navigate({ to: "/" });
      }
    }

    if (hasRun.current) return;
    hasRun.current = true;
    run();
  }, [maf, router]);

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-3xl text-slate-950">Loading admin...</h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="font-['Carter_One'] text-2xl text-slate-950">
        CIMBALL ADMIN
      </h1>

      <Outlet />
    </div>
  );
};

type VideoStatus =
  | {
      type: "idle";
    }
  | {
      type: "broadcasting";
    }
  | {
      type: "error";
    };

const VideoThing: React.FC = () => {
  const [status, setStatus] = useState<VideoStatus>({
    type: "idle",
  });
  const [[pointX, pointY], setPoint] = useState<number[]>([0, 0]);
  const maf = useMafClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const startVideoBroadcast = useCallback(async () => {
    if (!videoRef.current) return;

    setStatus({ type: "broadcasting" });

    const media = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    // const media = await navigator.mediaDevices.getDisplayMedia({
    //   video: true,
    //   audio: false,
    // });

    // TODO: these should be kept separate
    const connections = new Connections(maf, media);

    videoRef.current.srcObject = media;
    await videoRef.current.requestPictureInPicture();
  }, [maf]);

  useEffect(() => {
    startVideoBroadcast();
  }, [startVideoBroadcast]);

  return (
    <div className="space-y-2">
      <p>video</p>

      <div className="grid grid-cols-2 gap-2">
        <div className="relative col-span-1">
          <div
            className="w-1 h-1 bg-red-500 absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: pointX,
              top: pointY,
            }}
          />

          <video
            autoPlay
            playsInline
            className="w-full h-auto inline-block bg-neutral-700"
            id="video"
            onMouseMove={(e) => {
              const rect = videoRef.current?.getBoundingClientRect();
              if (!rect) return;

              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;

              setPoint([x, y]);
            }}
            ref={videoRef}
          ></video>

          {status.type === "idle" && (
            <Button onClick={startVideoBroadcast}>start broadcast</Button>
          )}
          {status.type === "broadcasting" && (
            <>
              <div className="text-neutral-50 bg-red-600 p-2 flex">
                <span>LIVE</span>
              </div>
              <p className="">
                x: {pointX}, y: {pointY}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

class Connections {
  media: MediaStream;
  maf: MafClient;
  connections: Map<string, RTCPeerConnection>;

  constructor(maf: MafClient, media: MediaStream) {
    this.media = media;
    this.maf = maf;
    this.connections = new Map();

    maf.channel<string>("new_viewer").on("message", async (viewerId) => {
      console.log("new viewer", viewerId, "creating offer...");

      const connection = new RTCPeerConnection(await getRtcConfig());

      connection.addEventListener("icecandidate", (event) => {
        console.log("got local icecandidate", event.candidate);

        if (event.candidate)
          maf.rpc(
            "admin_send_ice_candidate",
            viewerId,
            event.candidate.toJSON()
          );
      });

      connection.addEventListener("iceconnectionstatechange", () =>
        console.log("iceconnectionstatechange", connection.iceConnectionState)
      );

      this.media.getTracks().forEach((track) => {
        console.log("adding track", track);
        connection.addTrack(track, media);
      });

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      await maf.rpc("viewer_offer_response", viewerId, offer.sdp);

      this.connections.set(viewerId, connection);
    });

    maf.channel("finalize_viewer").on("message", async (message) => {
      console.log("finalize viewer", message);
      const [viewerId, sdp] = message as [string, string];

      const connection = this.connections.get(viewerId);
      if (!connection) throw new Error("no connection for viewer");

      await connection.setRemoteDescription({ type: "answer", sdp });
    });

    maf.channel("ice_candidate").on("message", async (message) => {
      console.log("got remote ice candidate", message);

      const [viewerId, candidate] = message as [string, RTCIceCandidateInit];

      const connection = this.connections.get(viewerId);
      if (!connection) throw new Error("no connection for viewer");

      await connection.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }
}

export const adminRoute = createRoute({
  path: "/admin",
  getParentRoute: () => layoutRoute,
  component: AdminPage,
});

export const adminVideoRoute = createRoute({
  path: "/video",
  getParentRoute: () => adminRoute,
  component: VideoThing,
});
