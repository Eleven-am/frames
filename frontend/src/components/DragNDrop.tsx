import { ComponentType, useCallback, CSSProperties, useMemo } from 'react';

import { DragEndEvent, closestCenter, DndContext, DraggableAttributes } from '@dnd-kit/core';
import { type SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { arrayMove, verticalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type IdObject = { id: string };

export interface DragNDropElementProps<T extends IdObject> {
    item: T;
    isLastItem: boolean;
    style: CSSProperties;
    attributes: DraggableAttributes;
    listeners: SyntheticListenerMap | undefined;
    setNodeRef: (node: (HTMLElement | null)) => void;
}

interface DragNDropProps<T extends IdObject> {
    elements: T[];
    className?: string;
    Component: ComponentType<DragNDropElementProps<T>>;
    onDrop: (props: T[]) => void;
}

interface DragNDropWrapperProps<T extends IdObject> {
    item: T;
    isLasItem: boolean;
    Component: ComponentType<DragNDropElementProps<T>>;
}

function DragNDropWrapper<T extends IdObject> ({ item, Component, isLasItem }: DragNDropWrapperProps<T>) {
    const { attributes, setNodeRef, listeners, transform, transition } = useSortable({
        id: item.id,
    });

    const style = useMemo((): CSSProperties => ({
        transform: CSS.Transform.toString(transform),
        transition,
    }), [transform, transition]);

    return (
        <Component
            item={item}
            style={style}
            isLastItem={isLasItem}
            attributes={attributes}
            listeners={listeners}
            setNodeRef={setNodeRef}
        />
    );
}

export function DragNDropProvider<T extends IdObject> ({ className, elements, Component, onDrop }: DragNDropProps<T>) {
    const onDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        const activeIndex = elements.findIndex((video) => video.id === active.id);
        const overIndex = elements.findIndex((video) => video.id === over?.id);

        if (activeIndex === -1 || overIndex === -1) {
            return;
        }

        const array = arrayMove(elements, activeIndex, overIndex);

        onDrop(array);
    }, [elements, onDrop]);


    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
        >
            <ul className={className}>
                <SortableContext
                    items={elements.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {elements.map((item, index) => <DragNDropWrapper key={item.id} item={item} Component={Component} isLasItem={index === elements.length - 1} />)}
                </SortableContext>
            </ul>
        </DndContext>
    );
}
