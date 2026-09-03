import {redirect} from "next/navigation";

export default function StaffAbsenceRedirect(){
 redirect("/calendar?view=absence");
}
