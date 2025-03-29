import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';

import { Role } from '@/api/data-contracts';
import { Loading } from '@/components/loading-set/Loading';
import { useUser } from '@/providers/userProvider';

function AdminComponent () {
    const { session, loading } = useUser();

    if (loading) {
        return (
            <Loading />
        );
    }

    if (!session) {
        return null;
    }

    if (session.role !== Role.ADMIN) {
        return (
            <Navigate to={'/settings'} />
        );
    }

    return <Outlet />;
}

export const Route = createFileRoute('/_protected/settings/_settings/_admin')({
    component: AdminComponent,
});
