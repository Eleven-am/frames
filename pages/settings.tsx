import HomeLayout from "../client/next/components/navbar/navigation";
import {useNavBar} from "../client/utils/customHooks";
import Accounts from "../client/next/components/settings/accounts";
import {ManageHolders} from "../client/next/components/misc/editMedia";

export default function Settings () {
    useNavBar('others', 1);

    return (
        <HomeLayout>
            <Accounts />
            <ManageHolders />
        </HomeLayout>
    )
}
