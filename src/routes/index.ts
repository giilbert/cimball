import { createRootRoute, createRouter } from "@tanstack/react-router";
import { homeRoute } from "./home";
import { layoutRoute } from "./layout";
import { adminRoute, adminVideoRoute } from "./admin";

export const rootRoute = createRootRoute({});

export const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    homeRoute,
    adminRoute.addChildren([adminVideoRoute]),
  ]),
]);

export const router = createRouter({
  routeTree,
});
