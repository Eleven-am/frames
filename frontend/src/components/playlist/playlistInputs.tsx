import { TransformingInput } from '@/components/input';
import { usePlaylistContext } from '@/contexts/playlist';


export function PlaylistName () {
    const { playlist, canModify, changeName } = usePlaylistContext();

    return (
        <TransformingInput
            value={playlist.name}
            element={'input'}
            onChange={changeName}
            readonly={!canModify}
            className={'text-2xl text-shadow-sm font-bold'}
            inputClassName={'border border-lightest rounded-md px-2 py-1 text-light-900'}
        />
    );
}

export function PlaylistOverview () {
    const { playlist, canModify, changeOverview } = usePlaylistContext();

    return (
        <TransformingInput
            value={playlist.overview}
            onChange={changeOverview}
            readonly={!canModify}
            className={'text-sm text-shadow-sm font-medium line-clamp-3'}
            inputClassName={'border border-lightest rounded-md px-2 py-1'}
            iconClassName={'w-4 h-4'}
            element={'textarea'}
            rows={3}
        />
    );
}
