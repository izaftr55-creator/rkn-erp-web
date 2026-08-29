import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PlasticTradingApp from "@/components/PlasticTradingApp";
import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";
export const dynamic = "force-dynamic";
export default async function PlasticTradingPage(){const s=await getAuth().api.getSession({headers:await headers()});if(!s)redirect("/");const c=await getErpCoreRpcStub().getErpAccessContext(s.user.id) as any;if(!c?.profile||Number(c.profile.active)!==1)redirect("/");if(Number(c.profile.must_change_password)===1)redirect("/change-password");try{return <PlasticTradingApp initialDashboard={await getErpCoreRpcStub().getPlasticTradingView(s.user.id,"DASHBOARD")}/>}catch{redirect("/")}}