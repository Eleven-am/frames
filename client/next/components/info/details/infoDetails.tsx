import {
    GroupWatch,
    MyList,
    PlayButton,
    PLayList,
    Rating,
    Seen,
    Shuffle,
    Template,
    TrailerButton
} from "../../buttons/Buttons";
import info from '../Info.module.css';
import {useRecoilValue} from "recoil";
import {SpringMedia} from "../../../../../server/classes/media";
import {infoUserContext} from "../infoContext";
import useUser from "../../../../utils/userTools";
import {MediaType, Role} from "@prisma/client";
import useModify, {useGetContext} from "../../../../utils/modify";

interface InfoType {
    trailer: boolean;
    response: SpringMedia,
    loadTrailer: () => void
}

export default function InfoDetails({response, loadTrailer, trailer}: InfoType) {
    const infoUser = useRecoilValue(infoUserContext);
    const {getMedia} = useModify();
    const {downloadEpisodes} = useGetContext();
    const {user} = useUser();

    return (
        <>
            <div className={info.infoNaming}>
                {response.logo ? <img src={response.logo} alt={response.name}/> :
                    <span className="infoLogo">{response.name}</span>}
            </div>
            <div className={info.infoButtons}
                 style={response.type === 'MOVIE' ? infoUser?.myList ? {width: '44%'} : {width: '44%'} : {width: '58%'}}>
                <PlayButton id={response.id}/>
                <TrailerButton id={response.id} trailer={trailer} onClick={loadTrailer}/>
                <Shuffle id={response.id} type={response.type}/>
                <MyList id={response.id} myList={infoUser?.myList}/>
                <Seen id={response.id} seen={infoUser?.seen}/>
                <GroupWatch id={response.id} />
                <PLayList id={response.id} type={response.type}/>
                {infoUser === null && user?.role === Role.ADMIN || infoUser?.canEdit ?
                    <Template id={2} type={'edit'} name={'edit ' + response.name}
                              onClick={() => getMedia(response.id)}/> : null}
                {(infoUser === null && user?.role === Role.ADMIN && response.type === MediaType.SHOW) || infoUser?.download ?
                    <Template id={2} type={'down'} name={'download more episodes for ' + response.name}
                              onClick={() => downloadEpisodes(response.id, response.name)}/> : null}
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