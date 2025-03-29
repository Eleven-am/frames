import { ReactNode } from 'react';

import { Navigate } from '@tanstack/react-router';

interface RedirectToProps {
    shouldRedirect: boolean;
    redirectPath: string;
    children: ReactNode;
}

export function RedirectTo ({ shouldRedirect, redirectPath, children }: RedirectToProps) {
    if (shouldRedirect) {
        return (
            <Navigate
                to={redirectPath}
                search={
                    {
                    }
                }
            />
        );
    }

    return children;
}
