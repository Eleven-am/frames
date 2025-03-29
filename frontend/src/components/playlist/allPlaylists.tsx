import { useSuspenseQuery } from '@tanstack/react-query';
import { IoAddOutline } from 'react-icons/io5';

import { PrimaryButton } from '@/components/button';
import { PlaylistList } from '@/components/playlist/playlistList';
import { TabsHolder } from '@/components/tabs';
import { playlistInfiniteQueries, playlistQueries } from '@/queries/playlist';
import { tw } from '@/utils/style';

interface AllPlaylistsProps {
    className?: string;
}

export function AllPlaylists ({ className }: AllPlaylistsProps) {
    const { data: privatePlaylists } = useSuspenseQuery(playlistQueries.getPlaylists);
    const { data: publicPlaylists } = useSuspenseQuery(playlistQueries.getPublicPlaylists);

    return (
        <div
            className={tw('flex flex-col pt-4 items-center w-full h-full gap-y-8 text-lightL', className)}
        >
            <PrimaryButton
                title={'Create new playlist'}
                label={'Create playlist'}
                to={'/playlist/create'}
            >
                <IoAddOutline className={'w-6 h-6 mr-1'} />
            </PrimaryButton>
            <TabsHolder
                tabs={['your playlists', 'public playlists']}
                holderClassName={'min-w-full items-center text-lightest/60 text-lg font-medium relative'}
                underlineClassName={'absolute h-[2px] bottom-0 bg-lightest transition-all duration-300 rounded-full'}
                ulClassName={'flex items-center gap-x-4 w-full justify-center border-b-2 border-lightest/10'}
                liClassName={'cursor-pointer hover:text-lightest/100 transition-all duration-300 whitespace-nowrap mb-1'}
                activeLiClassName={'text-lightest/100'}
                wrapperClassName={'w-full px-4 h-full overflow-clip scrollbar-hide'}
                componentWrapperClassName={'my-2 w-full h-full overflow-y-auto scrollbar-hide'}
                components={
                    [
                        {
                            activeWhen: ['your playlists'],
                            component: <PlaylistList options={playlistInfiniteQueries.privatePlaylists(privatePlaylists)} />,
                        },
                        {
                            activeWhen: ['public playlists'],
                            component: <PlaylistList isPublic options={playlistInfiniteQueries.publicPlaylists(publicPlaylists)} />,
                        },
                    ]
                }
            />
        </div>
    );
}
