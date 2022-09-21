import CollectionList from "../client/next/components/grid/collectionList";
import {CollectionGrid} from "../client/next/components/grid/grid";
import ErrorBoundary from "../client/next/components/misc/ErrorBoundary";

export default function Collections() {

    return (
        <ErrorBoundary>
            <CollectionList/>
            <CollectionGrid/>
        </ErrorBoundary>
    )
}
