import { CentreControls } from '@/components/watch/centreControls';
import { LeftControls } from '@/components/watch/leftControls';
import { ProgressBar } from '@/components/watch/progressBar';
import { RightControls } from '@/components/watch/rightControls';
import { usePlayerUI } from '@/providers/watched/playerUI';

interface LowerControlsProps {
    thumbnails: any[];
    episodeName: string | null;
    playbackId: string;
    mediaId: string;
    videoId: string;
    name: string;
}

export function LowerControls ({ thumbnails, playbackId, mediaId, videoId, name, episodeName }: LowerControlsProps) {
    const blocked = usePlayerUI((state) => state.playbackBlocked);

    if (blocked) {
        return null;
    }

    return (
        <div className={'absolute bottom-0 left-0 w-full h-1/6 bg-gradient-to-t from-darkD/80 to-transparent px-10 flex flex-col'}>
            <ProgressBar thumbnails={thumbnails} />
            <div
                className={'flex justify-between items-center w-full flex-grow my-2'}
            >
                <LeftControls mediaId={mediaId} videoId={videoId} name={name} playbackId={playbackId} episodeName={episodeName} />
                <CentreControls />
                <RightControls playbackId={playbackId} />
            </div>
        </div>
    );
}
