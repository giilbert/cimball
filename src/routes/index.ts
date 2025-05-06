import { createRootRoute, createRouter } from "@tanstack/react-router";
import { homeRoute } from "./home";

export const rootRoute = createRootRoute({});

export const routeTree = rootRoute.addChildren([homeRoute]);

export const router = createRouter({
  routeTree,
});
