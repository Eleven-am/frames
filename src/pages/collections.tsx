import HomeLayout from "../../next/states/navigation";
import {CollectionGrid} from "../../next/components/grid/grid";
import CollectionList from "../../next/components/grid/collectionList";

export default function Library() {
    return (
        <HomeLayout>
            <CollectionList/>
            <CollectionGrid/>
        </HomeLayout>
    )
}