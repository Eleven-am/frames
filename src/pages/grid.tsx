import HomeLayout from "../../next/states/navigation";
import Grid from "../../next/components/grid/grid";
import SearchList from "../../next/components/grid/list";

export default function GridPage () {

    return (
        <HomeLayout>
            <SearchList/>
            <Grid/>
        </HomeLayout>
    )
}