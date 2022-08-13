import styles from './Button.module.css';
import React, {useCallback, useMemo} from "react";
import {Link} from "../misc/Loader";
import {mutate} from "swr";
import {useGroupWatch} from "../../../utils/groupWatch";
import {useRouter} from "next/router";

export const BackButton = ({response}: { response: { mediaId: number, episodeName: string | null, logo: string | null, name: string } }) => {
    const router = useRouter();
    const {disconnect} = useGroupWatch();

    const routeOut = useCallback(async (ev: any) => {
        ev.stopPropagation();
        const url = '/' + (response.episodeName ? 'show' : 'movie') + '=' + response.name.replace(/\s/g, '+');
        await router.push('/info?mediaId=' + response.mediaId, url);
        document.body.removeAttribute('style');
        await mutate('/api/load/continue');
        await disconnect();
    }, [response, router, disconnect]);

    return (
        <svg className={styles.bb} viewBox="0 0 512 512" onClick={routeOut}>
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

interface HoverContainerProps<S = undefined> {
    children: React.ReactNode;
    className?: string;
    state?: S;
    style?: React.CSSProperties;
    element?: keyof HTMLElementTagNameMap
    onHover?: (isHover: boolean, state: S) => void;
    onHoverEvent?: (e: React.MouseEvent<HTMLElement>, isHover: boolean, state: S) => void;
    onClick?: (state: S) => void;
    onClickEvent?: (e: React.MouseEvent<HTMLElement>, state: S) => void;
    onMove?: (state: S) => void;
    onMoveEvent?: (e: React.MouseEvent<HTMLElement>, state: S) => void;
    tooltip?: string;
    disabled?: boolean;
}

interface FramesButtonProps<S = undefined> extends Omit<HoverContainerProps<S>, 'element' | 'children'> {
    type: 'primary' | 'secondary' | 'round';
    icon?: 'play' | 'square' | 'info' | 'add' | 'edit' | 'scan' | 'down' | 'user' | 'roll' | 'shuffle' | 'seen' | 'unseen' | 'close' | 'check';
    isFill?: boolean;
    label?: string;
    link?: { href: string, as?: string };
    style?: React.CSSProperties;
    contentStyle?: React.CSSProperties;
    children?: React.ReactNode;
}

export function Icon<S>({
                            icon,
                            style,
                            onClick,
                            state
                        }: Pick<FramesButtonProps<S>, 'icon' | 'style' | 'onClick' | 'state'>) {
    const viewBox = icon === 'add' ? '0 0 409.6 409.6' : icon === 'play' || icon === 'shuffle' ? '0 0 494.148 494.148' : icon === 'roll' ? '0 0 461.492 461.492' : '0 0 24 24';

    const handleClick = useCallback(() => {
        if (onClick && state)
            onClick(state);
    }, [onClick, state]);

    return (
        <svg style={style} viewBox={viewBox} onClick={handleClick}>
            {icon === 'down' && <>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </>}
            {icon === 'scan' && <>
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </>}
            {icon === 'edit' && <>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </>}
            {icon === 'add' && <g>
                <path
                    d="M392.533,187.733H221.867V17.067C221.867,7.641,214.226,0,204.8,0s-17.067,7.641-17.067,17.067v170.667H17.067
                                C7.641,187.733,0,195.374,0,204.8s7.641,17.067,17.067,17.067h170.667v170.667c0,9.426,7.641,17.067,17.067,17.067
                                s17.067-7.641,17.067-17.067V221.867h170.667c9.426,0,17.067-7.641,17.067-17.067S401.959,187.733,392.533,187.733z"
                />
            </g>}
            {icon === 'play' && <g>
                <path
                    d="M405.284,201.188L130.804,13.28C118.128,4.596,105.356,0,94.74,0C74.216,0,61.52,16.472,61.52,44.044v406.124
            c0,27.54,12.68,43.98,33.156,43.98c10.632,0,23.2-4.6,35.904-13.308l274.608-187.904c17.66-12.104,27.44-28.392,27.44-45.884
            C432.632,229.572,422.964,213.288,405.284,201.188z"
                    data-original="#000000"
                    className="active-path"
                    data-old_color="#000000"
                />
            </g>}
            {icon === 'info' && <>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </>}
            {icon === 'square' && <>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
            </>}
            {icon === 'user' && <>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </>}
            {icon === 'roll' && <g>
                <path
                    d="M306.104,455.438h155.388v-50h-73.774C363.821,427.739,336.119,444.62,306.104,455.438z"/>
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
            </g>}
            {icon === 'shuffle' && <>
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
            </>}
            {icon === 'seen' && <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            </>}
            {icon === 'unseen' && <>
                <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </>}
            {icon === 'close' && <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </>}
            {icon === 'check' && <polyline points="20 6 9 17 4 12"/>}
        </svg>
    )
}

export function FramesButton<S>(props: FramesButtonProps<S>) {
    let {tooltip, label, icon, isFill, link, children, onClick, onClickEvent, ...rest} = props;
    label = label || tooltip;
    tooltip = tooltip || label;
    isFill = isFill || (icon === 'play' || icon === 'add' || icon === 'roll' || icon === 'shuffle');

    return (
        <>
            {
                link ?
                    <Link href={link.href} as={link.as}>
                        <HoverContainer element={'button'} {...rest} tooltip={tooltip} style={props.contentStyle}
                            className={`${(props.type === 'primary' ? styles.playButton : props.type === 'secondary' ? styles.trailerButton : styles.roundGuys)} ${!isFill ? styles.noFill : ''}`}>
                            {icon && <Icon icon={icon} style={props.style} state={props.state}/>}
                            {children && !icon && children}
                            {props.type !== 'round' && label}
                        </HoverContainer>
                    </Link> :
                    <HoverContainer element={'button'} {...rest} tooltip={tooltip} onClick={onClick} onClickEvent={onClickEvent}
                        className={`${(props.type === 'primary' ? styles.playButton : props.type === 'secondary' ? styles.trailerButton : styles.roundGuys)} ${!isFill ? styles.noFill : ''}`}>
                        {icon && <Icon icon={icon} style={props.style} state={props.state}/>}
                        {children && !icon && children}
                        {props.type !== 'round' && label}
                    </HoverContainer>
            }
        </>
    )
}

export function HoverContainer<S>({
  children,
  className,
  state, element,
  onHover,
  onHoverEvent,
  onClick,
  onClickEvent,
  onMove,
  onMoveEvent,
  tooltip,
  disabled, style,
}: HoverContainerProps<S>) {

    const handleOnMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if (onHover)
            onHover(true, state as any);

        if (onHoverEvent)
            onHoverEvent(e, true, state as any);
    }, [onHover, onHoverEvent, state]);

    const handleOnMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if (onHover)
            onHover(false, state as any);

        if (onHoverEvent)
            onHoverEvent(e, false, state as any);
    }, [onHover, onHoverEvent, state]);

    const handleOnClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if (onClick)
            onClick(state as any);

        if (onClickEvent)
            onClickEvent(e, state as any);
    }, [onClick, onClickEvent, state]);

    const handleOnMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if (onMove)
            onMove(state as any);

        if (onMoveEvent)
            onMoveEvent(e, state as any);
    }, [onMove, onMoveEvent, state]);

    const Element = useMemo(() => {
        if (element === 'button')
            return 'button';
        else if (element === 'a')
            return 'a';
        else
            return 'div';
    }, [element]);

    return (
        <Element className={className ? className : ''} onClick={handleOnClick}
                 onMouseEnter={handleOnMouseEnter} onMouseLeave={handleOnMouseLeave}
                 onMouseMove={handleOnMove} title={tooltip} disabled={disabled} style={style}>
            {children}
        </Element>
    )
}
