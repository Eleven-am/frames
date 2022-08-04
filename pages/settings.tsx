import {useNavBar} from "../client/next/components/navbar/navigation";
import Accounts from "../client/next/components/settings/accounts";
import {ManageMedia} from "../client/next/components/misc/editMedia";
import ManagePick from "../client/next/components/misc/editPicks";

export default function Settings() {
    useNavBar('others', 1);

    return (
        <>
            <Accounts/>
            <ManageMedia/>
            <ManagePick/>
        </>
    )
}
