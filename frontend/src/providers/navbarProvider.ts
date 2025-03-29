import { Notifier } from '@eleven-am/notifier';

interface NavbarState {
    search: string;
    opacity: number;
    hideNav: boolean;
    forceNav: boolean;
}

class NavbarProvider extends Notifier<NavbarState> {
    constructor () {
        super({
            search: '',
            opacity: 0,
            hideNav: false,
            forceNav: false,
        });
    }

    setSearch (search: string) {
        this.updateState({
            search,
        });
    }

    setOpacity (opacity: number) {
        this.updateState({
            opacity,
        });
    }

    setHideNav (hideNav: boolean) {
        this.updateState({
            hideNav,
        });
    }

    setForceNav (forceNav: boolean) {
        this.updateState({
            forceNav,
        });
    }
}

export const navbarProvider = new NavbarProvider();

export const useNavbarState = navbarProvider.createStateHook();
export const useNavbarActions = navbarProvider.createActionsHook();
