import { ReactNode, useRef, createContext, useContext, useCallback, useState, CSSProperties, forwardRef } from 'react';

interface BoundContextState {
    items: Bounds[];
    add: (id: string, el: HTMLElement | null) => void;
    addObstacle: (el: Bounds) => void;
    setContainerBounds: (el: Bounds) => void;
}

interface BoundsContainerProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}

interface BoundsElementProps extends BoundsContainerProps {
    id: string;
}

const BoundContext = createContext<BoundContextState>({
    items: [],
    add: () => {},
    addObstacle: () => {},
    setContainerBounds: () => {},
});

class Bounds {
    readonly w: number;

    readonly h: number;

    readonly id: string;

    private l: number;

    private t: number;

    private r: number;

    private b: number;

    private el: HTMLElement | null;

    constructor (id: string, el: HTMLElement | null) {
        const box = el?.getBoundingClientRect() ?? {
            left: 0,
            top: 0,
            right: innerWidth,
            bottom: innerHeight,
            width: innerWidth,
            height: innerHeight,
        };

        this.l = box.left;
        this.t = box.top;
        this.r = box.right;
        this.b = box.bottom;
        this.w = box.width;
        this.h = box.height;
        this.el = el;
        this.id = id;
    }

    collides (bounds: Bounds) {
        const first = this.el?.getBoundingClientRect();
        const second = bounds.el?.getBoundingClientRect();

        if (!first || !second) {
            return false;
        }

        const { top: t1, left: l1, right: r1, bottom: b1 } = first;
        const { top: t2, left: l2, right: r2, bottom: b2 } = second;

        return (
            (t1 >= t2 && t1 <= b2 && l1 >= l2 && l1 <= r2) ||
            (t1 >= t2 && t1 <= b2 && r1 >= l2 && r1 <= r2) ||
            (b1 >= t2 && b1 <= b2 && l1 >= l2 && l1 <= r2) ||
            (b1 >= t2 && b1 <= b2 && r1 >= l2 && r1 <= r2)
        );
    }

    placeElement () {
        if (this.el) {
            this.el.style.top = `${this.t}px`;
            this.el.style.left = `${this.l}px`;
            this.el.style.opacity = '1';
            this.el.classList.add('placed');
        }

        return this;
    }

    hideElement () {
        if (this.el) {
            this.el.style.opacity = '0';
            this.el.classList.remove('placed');
        }

        return this;
    }

    updateElement (el: HTMLElement | null) {
        this.el = el;
        this.placeElement();

        return this;
    }

    moveWithin (bounds: Bounds) {
        const x = this.randomRange(0, bounds.w);
        const y = this.randomRange(0, bounds.h);

        this.l = x;
        this.t = y;
        this.r = x + this.w;
        this.b = y + this.h;

        return this;
    }

    randomRange (min: number, max: number) {
        return Math.random() * (max - min) + min;
    }
}

function useBounds () {
    const context = useContext(BoundContext);

    if (!context) {
        throw new Error('useBounds must be used within a BoundProvider');
    }

    return context;
}

export function BoundsProvider ({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<Bounds[]>([]);
    const [obstacles, setObstacles] = useState<Bounds[]>([]);
    const containerBounds = useRef<Bounds>(new Bounds('AREA_TO_FIT', null));
    const setContainerBounds = useCallback((el: Bounds) => containerBounds.current = el, []);

    const add = useCallback((id: string, el: HTMLElement | null) => {
        const existing = items.find((item) => item.id === id);

        if (existing) {
            existing.updateElement(el);

            return;
        }

        let tries = 50;
        const box = new Bounds(id, el);
        const areaToFit = containerBounds.current;

        box.moveWithin(areaToFit);
        box.placeElement();

        const bounds = items.concat(obstacles);

        while (bounds.some((bound) => box.collides(bound)) && tries--) {
            box.moveWithin(areaToFit);
            box.placeElement();
        }

        if (tries > 0) {
            box.placeElement();
        } else {
            box.hideElement();
        }

        setItems((prevItems) => [...prevItems, box]);
    }, [items, obstacles]);

    const addObstacle = useCallback((el: Bounds) => {
        setObstacles((prevObstacles) => {
            const filtered = prevObstacles.filter((obstacle) => obstacle.id !== el.id);

            return [...filtered, el];
        });
    }, []);

    return (
        <BoundContext.Provider
            value={
                {
                    items,
                    add,
                    addObstacle,
                    setContainerBounds,
                }
            }
        >
            {children}
        </BoundContext.Provider>
    );
}

export function BoundsElement ({ children, style, className, id }: BoundsElementProps) {
    const { add } = useBounds();

    const elRef = useCallback((el: HTMLElement | null) => add(id, el), [add, id]);

    return (
        <div ref={elRef} style={style} className={className}>
            {children}
        </div>
    );
}

export const BoundsObstacle = forwardRef<HTMLDivElement, BoundsElementProps>(({ children, style, className, id }, ref) => {
    const { addObstacle } = useBounds();
    const elRef = useCallback((el: HTMLDivElement | null) => {
        addObstacle(new Bounds(id, el));

        if (ref) {
            if (typeof ref === 'function') {
                ref(el);
            } else {
                ref.current = el;
            }
        }
    }, [addObstacle, id, ref]);

    return (
        <div ref={elRef} style={style} className={className}>
            {children}
        </div>
    );
});

export function BoundsContainer ({ children, className, style }: BoundsContainerProps) {
    const { setContainerBounds } = useBounds();
    const elRef = useCallback((el: HTMLElement | null) => setContainerBounds(new Bounds('AREA_TO_FIT', el)), [setContainerBounds]);

    return (
        <div ref={elRef} style={style} className={className}>
            {children}
        </div>
    );
}
