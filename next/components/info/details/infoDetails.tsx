import {GroupWatch, MyList, PlayButton, PLayList, Rating, Seen, Shuffle, TrailerButton} from "../../buttons/Buttons";
import React from "react";
import info from '../Info.module.css';
import {useRecoilValue} from "recoil";
import {infoTrailerContext} from "../../../states/infoContext";
import {SpringMediaInfo} from "../../../../server/classes/springboard";

interface InfoType {
    response: SpringMediaInfo,
    loadTrailer: () => void
}

export default function InfoDetails ({response, loadTrailer}: InfoType) {
    const trailer = useRecoilValue(infoTrailerContext)
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
                <GroupWatch id={response.id}/>
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