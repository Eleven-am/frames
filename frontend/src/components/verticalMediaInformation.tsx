import { Link } from '@tanstack/react-router';

import { VerticalInformation, useVerticalInformationLink, LinkType } from '@/hooks/useMediaLink';

interface VerticalMediaInformationProps {
    label: string;
    type: LinkType;
    backdropBlur: string;
    people: VerticalInformation[];
}

interface ItemProps {
    data: VerticalInformation;
    type: LinkType;
}

interface CollectionProps {
    content: { name: string, tmdbId: number };
}

function Item ({ data, type }: ItemProps) {
    const linkData = useVerticalInformationLink(type, data);

    return (
        <Link to={linkData.pathname} params={linkData.params} mask={linkData.mask}>
            <li className={'w-full transition-colors duration-300 ease-in-out cursor-pointer hover:text-light-500/70'}>
                <span>{data.name}</span>
                <br />
            </li>
        </Link>
    );
}

export function VerticalMediaInformation ({ label, people, type }: VerticalMediaInformationProps) {
    if (people.length === 0) {
        return null;
    }

    return (
        <div className={'flex flex-col m-4'}>
            <span className={'mb-2 text-light-700'}>
                {label}:
            </span>
            <ul>
                {people.map((person) => <Item key={person?.id ?? person.tmdbId} data={person} type={type} />)}
            </ul>
        </div>
    );
}

export function Collection ({ content }: CollectionProps) {
    const linkData = useVerticalInformationLink(LinkType.COLLECTION, content);

    return (
        <Link to={linkData.pathname} params={linkData.params} mask={linkData.mask}>
            <div className={'m-4 w-full transition-colors duration-300 ease-in-out cursor-pointer hover:text-light-500/70'}>
                <span>{content.name}</span>
            </div>
        </Link>
    );
}
