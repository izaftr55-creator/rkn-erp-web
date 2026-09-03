import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PlasticTradingApp from "@/components/PlasticTradingApp";
import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

export const dynamic = "force-dynamic";

export default async function PlasticTradingPage() {
  const s = await getAuth().api.getSession({ headers: await headers() });
  if (!s) redirect("/");

  let c;
  try {
    c = await getErpCoreRpcStub().getErpAccessContext(s.user.id) as any;
  } catch (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#07101e', color: '#fff', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '8px' }}>Layanan Sedang Sibuk (Limit Tercapai)</h2>
        <p style={{ color: '#8b9bb4', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>
          Sistem Cloudflare saat ini sedang mencapai limit harian dan menahan request. Silakan coba lagi nanti ketika limit sudah direset.
        </p>
      </div>
    );
  }

  if (!c?.profile || Number(c.profile.active) !== 1) redirect("/");
  if (Number(c.profile.must_change_password) === 1) redirect("/change-password");

  try {
    const initialDashboard = await getErpCoreRpcStub().getPlasticTradingView(s.user.id, "DASHBOARD");
    return <PlasticTradingApp initialDashboard={initialDashboard} />;
  } catch (error) {
    // If we catch here, it might be the view fetching that failed
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#07101e', color: '#fff', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '8px' }}>Gagal Memuat Dashboard</h2>
        <p style={{ color: '#8b9bb4', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>
          Gagal mengambil data dari database, kemungkinan karena limit Cloudflare tercapai.
        </p>
      </div>
    );
  }
}