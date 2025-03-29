import { getClient } from '@/hooks/useClientAction';
import { routeTree } from '@/routeTree.gen';
import { createRouter } from '@tanstack/react-router';

declare global {
    interface Window {
        tsRouter: typeof router;
    }
}

const router = createRouter({
    context: getClient(),
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
});

window.tsRouter = router;

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

export function getRouter () {
    return router;
}
