import ss from './Loading.module.css';
import FLink from "next/link";
import react, {ComponentType, ForwardedRef, memo, ReactNode} from "react";
import FImage from "next/image";

export const Loading = memo(() => {
    return (
        <div className={ss.bb1}>
            <div className={ss.bb2}>
                <div className={ss.circle}/>
                <div className={ss.circle}/>
            </div>
        </div>
    )
})


export const WithForwardingRef = <Props extends { [_: string]: any }, T extends Element>(BaseComponent: ComponentType<Props>) =>
    react.forwardRef((props: Props, ref: ForwardedRef<T>) => <BaseComponent {...props} forwardRef={ref}/>);

export const Link = memo(({children, href, as}: { href: string, as?: string, children: ReactNode }) => {
    return (
        <FLink href={href} as={as}>
            <a className={ss.anchor}>
                {children}
            </a>
        </FLink>
    )
})

export const Image = memo(({
                          src,
                          className,
                          loading,
                          alt
                      }: { src: StaticImageData | string, className: string, loading?: "lazy" | "eager", alt?: string }) => {

    return (
        <div className={className}>
            <FImage src={src} loading={loading} alt={alt}/>
        </div>
    )
})
