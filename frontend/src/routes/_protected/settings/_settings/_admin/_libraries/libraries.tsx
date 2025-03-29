import { LibrariesList } from '@/components/settings/libraries';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_protected/settings/_settings/_admin/_libraries/libraries',
)({
  component: LibrariesList,
})
