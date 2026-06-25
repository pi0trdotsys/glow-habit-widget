import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/habits")({
  component: () => <Outlet />,
});

export { Link, useRouterState };