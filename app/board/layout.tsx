import type {ReactNode} from "react";
import BoardSubnav from "./BoardSubnav";

export default function BoardLayout({children}:{children:ReactNode}){
 return <><BoardSubnav/>{children}</>;
}
