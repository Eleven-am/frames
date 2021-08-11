import HomeLayout from "../../next/states/navigation";
import Grid from "../../next/components/grid/grid";
import LibraryList from "../../next/components/grid/library";

export default function Library() {
    return (
        <HomeLayout>
            <LibraryList/>
            <Grid/>
        </HomeLayout>
    )
}