import { BaseButton } from '@/components/button';
import { tw } from '@/utils/style';

interface ObjectTag {
    key: string;
    value: string;
}

type StringTag = string;

type Tag = ObjectTag | StringTag;

export interface TagItem {
    tag: Tag;
    onClick?: () => void;
}

export interface TagProps {
    tags: TagItem[];
    className?: string;
}

function tagToString (tag: Tag): string {
    if (typeof tag === 'string') {
        return tag;
    }

    return `${tag.key}: ${tag.value}`;
}

function RenderTag ({ tagItem: { tag, onClick } }: { tagItem: TagItem }) {
    if (!onClick) {
        return (
            <span
                className={'font-semibold border border-lightest rounded-lg px-2 text-shadow-sm shadow-sm shadow-black'}
            >
                {tagToString(tag)}
            </span>
        );
    }

    return (
        <BaseButton onClick={onClick} title={tagToString(tag)}>
            <span
                className={'font-semibold border border-lightest rounded-lg px-2 text-shadow-sm shadow-sm shadow-black cursor-pointer'}
            >
                {tagToString(tag)}
            </span>
        </BaseButton>
    );
}

export function Tags ({ tags, className }: TagProps) {
    return (
        <div className={tw('flex flex-wrap gap-2', className)}>
            {
                tags.map((tag) => (
                    <RenderTag key={tagToString(tag.tag)} tagItem={tag} />
                ))
            }
        </div>
    );
}

