import {FramesButton, Rating} from "../../buttons/Buttons";
import info from '../Info.module.css';
import {useRecoilValue} from "recoil";
import {InfoContext, infoUserContext, useInfoContext} from "../infoContext";
import {MediaType, Role} from "@prisma/client";
import useModify, {useGetContext} from "../../../../utils/modify";
import useUser from "../../../../utils/user";
import {useState} from "react";
import {useGroupWatch} from "../../../../utils/groupWatch";

interface InfoType {
    trailer: boolean;
    loadTrailer: () => void
}

export default function InfoDetails({loadTrailer, trailer}: InfoType) {
    const response = useRecoilValue(InfoContext);
    const infoUser = useRecoilValue(infoUserContext);
    const {toggleSeen, toggleAddToList} = useInfoContext();
    const {getMedia} = useModify();
    const {downloadEpisodes} = useGetContext();
    const [seen, setSeen] = useState(false);
    const [list, setList] = useState(false);
    const {connected, openSession} = useGroupWatch();
    const {user} = useUser();

    if (!response) return null;

    return (
        <>
            <div className={info.infoNaming}>
                {response.logo ? <img src={response.logo} alt={response.name}/> :
                    <span className="infoLogo">{response.name}</span>}
            </div>
            <div className={info.infoButtons}
                 style={response.type === 'MOVIE' ? infoUser?.myList ? {width: '44%'} : {width: '44%'} : {width: '58%'}}>
                <FramesButton type='primary' icon='play' tooltip={`play ${response.name}`} label='play'
                              link={{href: '/watch?mediaId=' + response.id}}/>
                <FramesButton type='secondary' icon='roll' label={trailer ? 'stop' : 'trailer'}
                              tooltip={trailer ? 'stop trailer' : 'trailer'} onClick={loadTrailer}/>
                {response.type === MediaType.SHOW &&
                    <FramesButton type='round' icon='shuffle' tooltip='shuffle playback'
                                  link={{href: '/watch?shuffleId=' + response.id}}/>}
                <FramesButton type='round' onClick={toggleAddToList}
                              icon={infoUser?.myList ? list ? 'close' : 'check' : 'add'}
                              onHover={setList} tooltip={infoUser?.myList ? 'remove' : 'add to list'}/>
                <FramesButton type='round' onHover={setSeen} onClick={toggleSeen}
                              tooltip={`mark as ${infoUser?.seen ? 'un' : ''}seen`}
                              icon={(seen && !infoUser?.seen) || (!seen && infoUser?.seen) ? 'seen' : 'unseen'}/>
                <FramesButton type='round' icon='user' isFill tooltip='Group Watch' state={{id: response.id}}
                              onClick={openSession} style={connected ? {fill: '#3cab66'} : {}}/>
                <FramesButton type='round' icon='square' tooltip={'add to playlist'}/>
                {infoUser === null && user?.role === Role.ADMIN || infoUser?.canEdit ?
                    <FramesButton type={'round'} icon={'edit'} tooltip={'edit ' + response.name} state={response.id}
                                  onClick={getMedia}/> : null}
                {(infoUser === null && user?.role === Role.ADMIN && response.type === MediaType.SHOW) || infoUser?.download ?
                    <FramesButton type={'round'} icon={'down'} tooltip={'download more episodes for ' + response.name}
                                  state={response} onClick={downloadEpisodes}/> : null}
            </div>
            <div className={info.detailsHolder}>
                <div className={info.infoDetails}>
                    <div className={info.rating}>{response.rating}</div>
                    <span>-</span>
                    <div>{response.release}</div>
                    <span>-</span>
                    <div>{response.genre}</div>
                    <span>-</span>
                    <div>{response.runtime}</div>
                    <Rating {...{id: response.id, review: response.vote_average, myRating: infoUser?.rating}}/>
                </div>
            </div>
            <div className={info.infoOverview}>
                <p>{response.overview}</p>
            </div>
        </>
    )
}