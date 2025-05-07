import { createRootRoute, createRouter } from "@tanstack/react-router";
import { homeRoute } from "./home";
import { layoutRoute } from "./layout";

export const rootRoute = createRootRoute({});

export const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([homeRoute]),
]);

export const router = createRouter({
  routeTree,
});
