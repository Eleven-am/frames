import { UnScannedList } from '@/components/settings/libraries';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_protected/settings/_settings/_admin/_libraries/unscanned',
)({
  component: UnScannedList,
})
