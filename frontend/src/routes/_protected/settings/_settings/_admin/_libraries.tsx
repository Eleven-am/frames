import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_protected/settings/_settings/_admin/_libraries',
)({
  component: Outlet,
})
