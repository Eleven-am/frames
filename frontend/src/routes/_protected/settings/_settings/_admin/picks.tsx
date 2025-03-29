import { PicksPage } from '@/components/settings/picks';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_protected/settings/_settings/_admin/picks',
)({
  component: PicksPage,
})
