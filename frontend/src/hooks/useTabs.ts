import { ReactNode, useState, useMemo } from 'react';

export interface UseTabsOptions<Tab extends string> {
    tabs: Tab[];
    components: Array<{activeWhen: Tab[], component: ReactNode}>;
}

export function useTabs<Tab extends string> ({ tabs, components }: UseTabsOptions<Tab>) {
    const [activeTab, setActiveTab] = useState(tabs[0]);

    const component = useMemo<ReactNode>(() => {
        const activeComponent = components.find((component) => component.activeWhen.includes(activeTab));

        return activeComponent?.component ?? null;
    }, [activeTab, components]);

    return [component, setActiveTab] as const;
}
