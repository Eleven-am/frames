import { ChangeEvent, useCallback, useMemo } from 'react';

import { useRouter } from '@tanstack/react-router';
import { BiCoffeeTogo } from 'react-icons/bi';
import { FiEdit3, FiLogOut, FiSearch, FiSettings, FiUser } from 'react-icons/fi';
import { IoMdNotificationsOutline } from 'react-icons/io';

import { Role } from '@/api/data-contracts';
import Logo from '@/assets/frames.png';
import { AvatarIcon } from '@/components/avatar';
import { DropdownContent, DropdownMenu, NotificationBadge, PopupButton } from '@/components/button';
import { LazyImage } from '@/components/lazyImage';
import { Tabs } from '@/components/tabs';
import { UsersNotifications } from '@/components/usersNotifications';
import { useNavbarRoutes } from '@/hooks/useNavbarRoutes';
import { useNavbarActions, useNavbarState } from '@/providers/navbarProvider';
import { useUser, useUserActions } from '@/providers/userProvider';


function Branding () {
    return (
        <div
            className={'flex items-center h-10 text-lightest text-xl font-bold cursor-pointer transition-all duration-300 ease-in-out hover:scale-110'}
        >
            <LazyImage
                className={'w-10 h-10 aspect-square mr-2'}
                loading={'eager'}
                src={Logo}
                alt="Frames"
            />
            <span className={'hidden ipadPro:block font-frames'}>
                frames
            </span>
        </div>
    );
}

function SearchBar () {
    const { search } = useNavbarState();
    const { setSearch } = useNavbarActions();
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value), [setSearch]);

    return (
        <div
            className={'group flex items-center mr-4 h-10 text-lightest/60 text-lg font-medium border-2 border-transparent rounded-xl px-2 cursor-pointer hover:text-lightest/100 hover:border-lightest focus-within:border-lightest transition-all duration-300 ease-in-out'}
        >
            <input
                className={'flex w-60 ipadPro:w-96 h-10 py-1 mr-2 text-lightest text-md bg-transparent focus:outline-none focus:border-lightest/100 group-hover:placeholder-lightest transition-all duration-300 ease-in-out placeholder-transparent'}
                placeholder="see what's available"
                onChange={handleChange}
                value={search}
                type={'text'}
            />
            <FiSearch className={'w-5 h-5 text-lightest'} strokeWidth={3} />
        </div>
    );
}

function AccountInfo () {
    const router = useRouter();
    const { logout } = useUserActions();
    const session = useUser((state) => state.session);

    const popUpElements = useMemo((): DropdownContent[] => [
        {
            key: 'profile',
            onClick: () => router.navigate({
                to: '/settings/profile',
            }),
            Component: (
                <>
                    <FiUser className={'w-5 h-5'} strokeWidth={3} />
                    <span className={'ml-3'}>Profile</span>
                </>
            ),
        },
        {
            key: 'notifications',
            onClick: console.log,
            Component: (
                <>
                    <NotificationBadge count={2}>
                        <IoMdNotificationsOutline className={'w-5 h-5'} strokeWidth={3} />
                    </NotificationBadge>
                    <span className={'ml-3'}>Notifications</span>
                </>
            ),
        },
        {
            key: 'preferences',
            onClick: () => router.navigate({
                to: '/settings',
            }),
            Component: (
                <>
                    <FiSettings className={'w-5 h-5'} />
                    <span className={'ml-3'}>Preferences</span>
                </>
            ),
        },
        {
            key: 'coffee',
            onClick: console.log,
            Component: (
                <>
                    <BiCoffeeTogo className={'w-5 h-5'} />
                    <span className={'ml-3'}>Buy me a coffee</span>
                </>
            ),
        },
        {
            key: 'suggestion',
            onClick: console.log,
            Component: (
                <>
                    <FiEdit3 className={'w-5 h-5'} />
                    <span className={'ml-3'}>Make a suggestion</span>
                </>
            ),
        },
        {
            key: 'logout',
            onClick: logout,
            seperated: true,
            Component: (
                <>
                    <FiLogOut className={'w-5 h-5'} />
                    <span className={'ml-3'}>Logout</span>
                </>
            ),
        },
    ], [logout, router]);

    return (
        <PopupButton
            count={2}
            className={'mr-2'}
            Content={
                <AvatarIcon
                    className={'w-5 h-5 text-lightest'}
                    sessionColor={!session ? '#f54e4e' : session.role === Role.GUEST ? '#c4c362' : '#3cab66'}
                />
            }
        >
            <DropdownMenu
                title={session?.username}
                elements={popUpElements}
            />
        </PopupButton>
    );
}

export function Navbar () {
    const { opacity, hideNav, forceNav } = useNavbarState();
    const { isAuthRoute, activeRoute, routes, isPlayerRoute } = useNavbarRoutes();

    const style = useMemo(() => ({
        boxShadow: opacity > 0.8 ? '0 0 10px 0 rgba(0, 0, 0, 0.5)' : 'none',
        background: `linear-gradient(to bottom, rgba(1, 16, 28, 1),  rgba(1, 16, 28, ${opacity}))`,
    }), [opacity]);

    if ((isPlayerRoute || hideNav) && !forceNav) {
        return null;
    }

    return (
        <nav
            style={style}
            className={'fixed top-0 w-full h-14 flex items-center p-2 ipadMini:px-4 ipadPro:px-6'}
        >
            <Branding />
            {
                !isAuthRoute && (
                    <>
                        <Tabs
                            tabs={routes}
                            activeTabIndex={activeRoute}
                            activeLiClassName={'text-lightest/100'}
                            liClassName={'text-lightest/60 hover:text-lightest/100'}
                            holderClassName={'h-10 hidden ipadMini:flex items-center ipadMini:ml-4 ipadPro:ml-6'}
                            ulClassName={'h-full text-lg font-medium gap-x-4'}
                            underlineClassName={'h-[2px] bg-lightest/100'}
                        />
                        <div className={'flex-grow h-full items-center flex justify-end'}>
                            <SearchBar />
                            <UsersNotifications />
                            <AccountInfo />
                        </div>
                    </>
                )
            }
        </nav>
    );
}

/*
export const MobileNavBar = memo(({ toggleNav }: { toggleNav: () => void }) => {
    const username = useUser((state) => state.session?.username);
    const { activeRoute, routes } = useNavbarRoutes();
    const { logout } = useUserActions();

    const handleLogout = useCallback(async () => {
        toggleNav();
        await logout();
    }, [logout, toggleNav]);

    return (
        <div className={'flex flex-col w-full h-full bg-darkM/60'}>
            <div className={'relative h-24 flex items-center shadow-black/50 bg-darkM shadow-md'}>
                <div className={'h-1/2 w-1/4 ml-6 flex justify-center items-center top-0 left-0'}>
                    <div className={'h-14 w-14 border-lightest border rounded-full shadow-sm bg-lightD flex items-center justify-center'}>
                        <span className={`text-4xl font-bold text-lightest ${font.className}`}>
                            {username?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className={'h-1/2 w-3/5 flex flex-col justify-center gap-4 pr-4'}>
                    <div className={'w-full flex items-center justify-end gap-6 text-lightest'}>
                        <UsersNotifications isMobile />
                        <NotificationIcon strokeWidth={2} />
                        <PreferencesIcon strokeWidth={2} />
                    </div>
                </div>
            </div>
            <div className={'relative max-h-3/6 flex flex-col justify-center items-start text-xl text-lightest/50 px-6 py-3'}>
                {
                    routes.map((route, index) => (
                        <ButtonBase
                            span
                            key={route.path}
                            data-active={activeRoute === index}
                            onClick={toggleNav}
                            className={'flex items-center px-2 w-full h-8 pb-2 border-b justify-between border-lightest/50 cursor-pointer my-2 data-[active="true"]:text-lightest'}
                            href={route.path}
                            label={route.name}
                            hrefClassName={'w-full'}
                            iconPosition={'right'}
                            icon={route.Icon}
                        />
                    ))
                }
                <ButtonBase
                    span
                    label={'logout'}
                    handleClick={handleLogout}
                    className={'flex items-center px-2 w-full h-8 pb-2 border-b justify-between border-lightest/50 cursor-pointer my-2'}
                    iconPosition={'right'}
                    icon={<LogOutIcon strokeWidth={2} />}
                />
            </div>
        </div>
    );
});*/
