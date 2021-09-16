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
import {Role} from '@prisma/client';
import info from '../Info.module.css';
import {useRecoilValue, useSetRecoilState} from "recoil";
import {infoTrailerContext} from "../../../states/infoContext";
import {SpringMediaInfo} from "../../../../server/classes/springboard";
import useUser from "../../../utils/userTools";
import {EditMediaContext} from "../../misc/editMedia";
import {EditMedia} from "../../../../server/classes/media";
import {InformDisplayContext} from "../../misc/inform";

interface InfoType {
    response: SpringMediaInfo,
    loadTrailer: () => void
}

export default function InfoDetails ({response, loadTrailer}: InfoType) {
    const trailer = useRecoilValue(infoTrailerContext);
    const dispatch = useSetRecoilState(EditMediaContext);
    const setInform = useSetRecoilState(InformDisplayContext);
    const {user} = useUser();

    const handleEdit = () => {
        const {id, name, type, backdrop, poster, logo} = response;
        const data: EditMedia = {
            media: {
                id, name, type,
                backdrop, poster, logo
            }
        }
        dispatch(data);
    }

    const handleDownload = async () => {
        await fetch(`/api/update/epiDown?id=${response.id}`);
        setInform({
            type: "alert",
            heading: 'Library scan begun',
            message: 'Frames would begin checking for new episodes of ' + response.name
        })
    }

    return (
        <>
            <div className={info.infoNaming}>
                {response.logo ? <img src={response.logo} alt={response.name}/> : <span className="infoLogo">{response.name}</span>}
            </div>
            <div className={info.infoButtons} style={response.type === 'MOVIE' ? response.myList ? {width: '44%'}: {width: '44%'}: {width: '58%'}}>
                <PlayButton id={response.id}/>
                <TrailerButton id={response.id} trailer={trailer} onClick={loadTrailer}/>
                <PLayList id={response.id} type={response.type}/>
                <Shuffle id={response.id} type={response.type}/>
                <MyList id={response.id} myList={response.myList}/>
                <Seen id={response.id} seen={response.seen}/>
                <GroupWatch id={response.id} type={response.type}/>
                {user?.role === Role.ADMIN ?
                    <>
                        <Template id={2} type={'edit'} name={'edit ' + response.name} onClick={handleEdit}/>
                        {response.download ? <Template id={2} type={'down'} name={'download more ' + response.name} onClick={handleDownload}/>: null}
                    </>
                    : null}
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
                    <Rating {...{id: response.id, review: response.review, myRating: response.myRating}}/>
                </div>
            </div>
            <div className={info.infoOverview}>
                <p>{response.overview}</p>
            </div>
        </>
    )
}