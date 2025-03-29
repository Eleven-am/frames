import { App } from '@/app';
import { createRootRouteWithContext } from '@tanstack/react-router';

export const Route = createRootRouteWithContext()({
    component: App,
});