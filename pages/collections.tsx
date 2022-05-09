import HomeLayout from "../client/next/components/navbar/navigation";
import CollectionList from "../client/next/components/grid/collectionList";
import {CollectionGrid} from "../client/next/components/grid/grid";

export default function Collections() {

    return (
        <HomeLayout>
            <CollectionList />
            <CollectionGrid />
        </HomeLayout>
    )
}