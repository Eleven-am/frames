import styles from './Button.module.css';
import React, {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import {SpringPlay} from "../../../server/classes/springboard";
import {useSetRecoilState} from "recoil";
import {InformDisplayContext} from "../misc/inform";
import {mutate} from "swr";

interface ButtonInterfaces {
    id: number;
    name?: string;
    type?: string;
    seen?: boolean;
    myList?: boolean;
    trailer?: boolean;
    review?: number | null;
    myRating?: number;
    url?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const PlayButton = ({id, name, url}: ButtonInterfaces) => {
    return (
        <Link href={url || '/watch?id=' + id}>
            <button className={styles.playButton}>
                <svg viewBox="0 0 494.148 494.148">
                    <g>
                        <path
                            d="M405.284,201.188L130.804,13.28C118.128,4.596,105.356,0,94.74,0C74.216,0,61.52,16.472,61.52,44.044v406.124
            c0,27.54,12.68,43.98,33.156,43.98c10.632,0,23.2-4.6,35.904-13.308l274.608-187.904c17.66-12.104,27.44-28.392,27.44-45.884
            C432.632,229.572,422.964,213.288,405.284,201.188z"
                            data-original="#000000"
                            className="active-path"
                            data-old_color="#000000"
                        />
                    </g>
                </svg>
                {name ? name : 'play'}
            </button>
        </Link>
    );
};

const TrailerButton = ({onClick, trailer}: ButtonInterfaces) => {
    return (
        <button className={styles.trailerButton} onClick={onClick}>
            <svg viewBox="0 0 461.492 461.492">
                <g>
                    <path d="M306.104,455.438h155.388v-50h-73.774C363.821,427.739,336.119,444.62,306.104,455.438z"/>
                    <path
                        d="M449.922,230.746c0-124.044-100.917-224.961-224.961-224.961S0,106.702,0,230.746s100.917,224.961,224.961,224.961
                    S449.922,354.79,449.922,230.746z M54.299,158.13l22.443-38.873c5.411-9.372,17.394-12.583,26.767-7.172l49.011,28.296
                    c5.022,2.9,8.503,7.876,9.503,13.589l5.129,29.288c0.818,4.678-0.1,9.309-2.332,13.177c-2.284,3.956-5.944,7.116-10.534,8.711
                    l-27.573,9.586c-5.376,1.869-11.301,1.308-16.23-1.539l-49.012-28.297C52.099,179.485,48.888,167.502,54.299,158.13z
                     M167.452,279.153l-5.485,28.671c-1.069,5.591-4.518,10.439-9.447,13.287l-49.011,28.297c-9.373,5.41-21.355,2.199-26.767-7.172
                    l-22.443-38.874c-5.411-9.372-2.2-21.355,7.172-26.767l49.011-28.297c5.023-2.9,11.072-3.426,16.521-1.436l27.929,10.201
                    c4.46,1.631,8.012,4.74,10.245,8.607C167.459,269.631,168.365,274.381,167.452,279.153z M266.999,395.258
                    c0,10.822-8.772,19.595-19.595,19.595h-44.888c-10.821,0-19.594-8.771-19.594-19.595v-56.593c0-5.8,2.57-11.302,7.017-15.024
                    l22.801-19.086c3.642-3.047,8.11-4.568,12.576-4.568c4.569,0.001,9.135,1.591,12.812,4.769l22.089,19.087
                    c4.307,3.721,6.782,9.133,6.782,14.824V395.258z M187.386,230.746c0-20.752,16.823-37.574,37.575-37.574
                    s37.574,16.822,37.574,37.574s-16.822,37.574-37.574,37.574S187.386,251.498,187.386,230.746z M266.999,122.827
                    c0,5.8-2.569,11.302-7.019,15.024l-22.799,19.086c-3.643,3.048-8.11,4.569-12.577,4.569c-4.569,0-9.135-1.591-12.812-4.769
                    l-22.088-19.085c-4.308-3.722-6.783-9.133-6.783-14.826V66.234c0-10.822,8.772-19.594,19.594-19.594h44.888
                    c10.822,0,19.595,8.771,19.595,19.594V122.827z M282.471,182.339l5.483-28.671c1.069-5.591,4.518-10.44,9.448-13.287l49.01-28.296
                    c9.373-5.411,21.356-2.2,26.767,7.172l22.444,38.873c5.41,9.372,2.2,21.355-7.173,26.767l-49.011,28.296
                    c-5.022,2.9-11.071,3.426-16.521,1.436l-27.929-10.202c-4.46-1.63-8.014-4.74-10.245-8.607
                    C282.462,191.861,281.557,187.111,282.471,182.339z M346.412,349.408l-49.01-28.297c-5.022-2.9-8.503-7.877-9.503-13.59
                    l-5.13-29.287c-0.817-4.678,0.099-9.309,2.332-13.178c2.285-3.955,5.944-7.114,10.534-8.711l27.572-9.586
                    c5.377-1.869,11.301-1.308,16.23,1.539l49.011,28.297c9.373,5.41,12.583,17.395,7.173,26.767l-22.444,38.874
                    C367.769,351.607,355.785,354.818,346.412,349.408z"
                    />
                </g>
            </svg>
            {trailer ? "stop" : "trailer"}
        </button>
    );
};

const Shuffle = ({id, type}: ButtonInterfaces) => {
    return type !== 'MOVIE' ? (
        <Link href={'/watch?shuffle=' + id}>
            <button title={'shuffle playback'} className={styles.roundGuys}>
                <svg viewBox="0 0 494.148 494.148">
                    <g>
                        <g>
                            <path
                                d="M506.24,371.7l-96-80c-4.768-4-11.424-4.8-17.024-2.208c-5.632,2.656-9.216,8.288-9.216,14.496v48h-26.784
                                c-22.208,0-42.496-11.264-54.272-30.08l-103.616-165.76c-23.52-37.664-64.096-60.16-108.544-60.16H0v64h90.784
                                c22.208,0,42.496,11.264,54.272,30.08l103.616,165.76c23.552,37.664,64.128,60.16,108.544,60.16H384v48
                                c0,6.208,3.584,11.84,9.216,14.496c2.144,0.992,4.48,1.504,6.784,1.504c3.68,0,7.328-1.248,10.24-3.712l96-80
                                c3.68-3.04,5.76-7.552,5.76-12.288C512,379.252,509.92,374.74,506.24,371.7z"
                            />
                        </g>
                    </g>
                    <g>
                        <g>
                            <path d="M506.24,115.7l-96-80c-4.768-3.968-11.424-4.8-17.024-2.176C387.584,36.116,384,41.78,384,47.988v48h-26.784
                                c-44.448,0-85.024,22.496-108.544,60.16l-5.792,9.28l37.728,60.384l22.336-35.744c11.776-18.816,32.064-30.08,54.272-30.08H384v48
                                c0,6.208,3.584,11.872,9.216,14.496c2.144,0.992,4.48,1.504,6.784,1.504c3.68,0,7.328-1.28,10.24-3.712l96-80
                                c3.68-3.04,5.76-7.552,5.76-12.288C512,123.252,509.92,118.74,506.24,115.7z"
                            />
                        </g>
                    </g>
                    <g>
                        <g>
                            <path d="M167.392,286.164l-22.304,35.744c-11.776,18.816-32.096,30.08-54.304,30.08H0v64h90.784
			                c44.416,0,84.992-22.496,108.544-60.16l5.792-9.28L167.392,286.164z"/>
                        </g>
                    </g>
                </svg>
            </button>
        </Link>
    ) : null;
};

const PLayList = ({id, type}: ButtonInterfaces) => {
    return type === 'MOVIE' ? (
        <button className={`${styles.roundGuys} ${styles.noFill}`} title={'add to playlist'}>
            <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
        </button>
    ) : null;
}

const Seen = ({id, seen}: ButtonInterfaces) => {
    const [hover, setHover] = useState(false);
    const [see, setSee] = useState(seen);

    async function seenHandler() {
        setSee(!see)
        await fetch(`/api/media/seen?id=${id}`);
        await mutate('/api/load/continue')
    }

    return (
        <button
            title={!see ? "seen ?" : "seen"}
            onClick={() => seenHandler()}
            className={(see && !hover) || (!see && hover) ? styles.roundGuys : `${styles.roundGuys} ${styles.noFill}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {(see && !hover) || (!see && hover) ? (
                <svg viewBox="0 0 426.667 426.667">
                    <g>
                        <path
                            d="M421.876,56.307c-6.548-6.78-17.352-6.968-24.132-0.42c-0.142,0.137-0.282,0.277-0.42,0.42L119.257,334.375
                                    l-90.334-90.334c-6.78-6.548-17.584-6.36-24.132,0.42c-6.388,6.614-6.388,17.099,0,23.713l102.4,102.4
                                    c6.665,6.663,17.468,6.663,24.132,0L421.456,80.44C428.236,73.891,428.424,63.087,421.876,56.307z"
                        />
                    </g>
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" id="notSeenSvg">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
            )}
        </button>
    );
};

const MyList = ({id, myList}: ButtonInterfaces) => {
    const [hover, setHover] = useState(false);
    const [list, setList] = useState(myList);

    async function listHandler() {
        setList(!list);
        await fetch(`/api/media/list?id=${id}`);
        await mutate('/api/load/myList');
    }

    return (
        <button
            className={styles.roundGuys}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => listHandler()}
            title={list ? "remove" : "add to list"}
        >
            {list ? (
                !hover ? (
                    <svg viewBox="0 0 426.667 426.667">
                        <g>
                            <path
                                d="M421.876,56.307c-6.548-6.78-17.352-6.968-24.132-0.42c-0.142,0.137-0.282,0.277-0.42,0.42L119.257,334.375
                            l-90.334-90.334c-6.78-6.548-17.584-6.36-24.132,0.42c-6.388,6.614-6.388,17.099,0,23.713l102.4,102.4
                            c6.665,6.663,17.468,6.663,24.132,0L421.456,80.44C428.236,73.891,428.424,63.087,421.876,56.307z"
                            />
                        </g>
                    </svg>
                ) : (
                    <svg viewBox="0 0 409.806 409.806">
                        <g>
                            <path
                                d="M228.929,205.01L404.596,29.343c6.78-6.548,6.968-17.352,0.42-24.132c-6.548-6.78-17.352-6.968-24.132-0.42
                            c-0.142,0.137-0.282,0.277-0.42,0.42L204.796,180.878L29.129,5.21c-6.78-6.548-17.584-6.36-24.132,0.42
                            c-6.388,6.614-6.388,17.099,0,23.713L180.664,205.01L4.997,380.677c-6.663,6.664-6.663,17.468,0,24.132
                            c6.664,6.662,17.468,6.662,24.132,0l175.667-175.667l175.667,175.667c6.78,6.548,17.584,6.36,24.132-0.42
                            c6.387-6.614,6.387-17.099,0-23.712L228.929,205.01z"
                            />
                        </g>
                    </svg>
                )
            ) : (
                <svg viewBox="0 0 409.6 409.6">
                    <g>
                        <path
                            d="M392.533,187.733H221.867V17.067C221.867,7.641,214.226,0,204.8,0s-17.067,7.641-17.067,17.067v170.667H17.067
                                C7.641,187.733,0,195.374,0,204.8s7.641,17.067,17.067,17.067h170.667v170.667c0,9.426,7.641,17.067,17.067,17.067
                                s17.067-7.641,17.067-17.067V221.867h170.667c9.426,0,17.067-7.641,17.067-17.067S401.959,187.733,392.533,187.733z"
                        />
                    </g>
                </svg>
            )}
        </button>
    );
};

const GroupWatch = ({id}: ButtonInterfaces) => {
    const dispatch = useSetRecoilState(InformDisplayContext)

    return (
        <button title={'GroupWatch'} className={styles.roundGuys} onClick={() => dispatch({
            type: "error",
            heading: 'Function not available',
            message: 'The GroupWatch feature is currently under development'
        })}>
            <svg viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
        </button>
    )
}

const Rating = ({id, review, myRating}: ButtonInterfaces) => {
    const [string, setString] = useState('Rating');
    const [rate, setRate] = useState(review! * 10);
    const [pos, setPos] = useState(myRating!);

    async function getRating(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        const box = event.currentTarget.getBoundingClientRect();
        const pos = ((event.clientX - box.left) / (box.right - box.left)) * 100;
        setPos(pos);
        setRate(pos);
        await fetch(`/api/media/rate?id=${id}&rate=${Math.floor(pos / 10)}`);
    }

    return (
        <div className={styles.rc}
             onMouseEnter={() => {
                 setString('Rate it')
                 setRate(pos)
             }}
             onMouseLeave={() => {
                 setString('Rating')
                 setRate(+(review!) * 10)
             }}
        >
            <div className={styles.rh}>{string}:</div>
            <div className={styles.review} onClick={event => getRating(event)}>
                <div className={styles.rf} style={{width: rate + '%'}}/>
            </div>
        </div>
    )
}

const InfoButton = ({id, name, type}: ButtonInterfaces) => {
    return (
        <Link href={'/info?id=' + id} as={'/' + type + '=' + name?.replace(/\s/g, '+')}>
            <button className={`${styles.trailerButton} ${styles.noFill}`}>
                <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                see details
            </button>
        </Link>
    )
}

const BackButton = ({response}: {response?: SpringPlay}) => {
    const router = useRouter();

    const routeOut = async () => {
        if (response) {
            const url = '/' + (response.episodeName ? 'show' : 'movie') + '=' + response.name.replace(/\s/g, '+');
            document.body.removeAttribute('style');
            await router.push('/info?id=' + response.mediaId, url);

        } else await router.back();
        await mutate('/api/load/continue')
    }

    return (
        <svg className={styles.bb} viewBox="0 0 512 512" onClick={() => routeOut()}>
            <path d="M256,0C114.844,0,0,114.844,0,256s114.844,256,256,256s256-114.844,256-256S397.156,0,256,0z M256,490.667
				C126.604,490.667,21.333,385.396,21.333,256S126.604,21.333,256,21.333S490.667,126.604,490.667,256S385.396,490.667,256,490.667
				z"/>
            <path d="M394.667,245.333H143.083l77.792-77.792c4.167-4.167,4.167-10.917,0-15.083c-4.167-4.167-10.917-4.167-15.083,0l-96,96
				c-4.167,4.167-4.167,10.917,0,15.083l96,96c2.083,2.083,4.813,3.125,7.542,3.125c2.729,0,5.458-1.042,7.542-3.125
				c4.167-4.167,4.167-10.917,0-15.083l-77.792-77.792h251.583c5.896,0,10.667-4.771,10.667-10.667S400.563,245.333,394.667,245.333
				z"/>
        </svg>
    )
}

const Template = ({id, type, name, onClick}: ButtonInterfaces) => {
    if (name === 'see details')
        mutate('/api/load/continue');

    return (
        <button title={name} className={`${(id === 0 ? styles.playButton: id === 1 ? styles.trailerButton: styles.roundGuys)} ${styles.noFill}`} onClick={onClick}>
            {type === 'down' ? <svg viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>: type === 'scan' ? <svg viewBox="0 0 24 24">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>: type === 'none'? null: <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>}
            {id !== 2 && name}
        </button>
    )
}

export {Template, PLayList, BackButton, InfoButton, GroupWatch, PlayButton, TrailerButton, Shuffle, Seen, MyList, Rating};
