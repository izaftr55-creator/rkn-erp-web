import OwnerPreview from "@/components/OwnerPreview";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import ERPApp from "@/components/ERPApp";
import RknLoginScreen from "@/components/RknLoginScreen";
import RoleWorkspace from "@/components/RoleWorkspace";
import RoleWorkspaceV2 from "@/components/RoleWorkspaceV2";
import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

export const dynamic = "force-dynamic";

type ProfileState = {
  active: number;
  must_change_password: number;
};

type RoleRow = {
  role_code: string;
};

type ScopeRow = {
  business_unit: string;
  access_level: string;
};

export default async function Page() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <RknLoginScreen />;
  }

  let erpContext;
  try {
    erpContext =
      await getErpCoreRpcStub()
        .getErpAccessContext(
          session.user.id
        ) as any;
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

  const profile =
    erpContext?.profile as
      | ProfileState
      | undefined;

  const businessUnitById =
    new Map(
      (
        Array.isArray(
          erpContext?.businessUnits
        )
          ? erpContext.businessUnits
          : []
      ).map(
        (row: any) => [
          String(
            row.id ?? ""
          ),
          row,
        ]
      )
    );

  if (!profile || profile.active !== 1) {
    return <RknLoginScreen />;
  }

  if (profile.must_change_password === 1) {
    redirect("/change-password");
  }

  const roles =
    (
      Array.isArray(
        erpContext?.roles
      )
        ? erpContext.roles
        : []
    )
      .map(
        (row: any) => ({
          role_code:
            String(
              row.code ?? ""
            ),
        })
      )
      .filter(
        (row: any) =>
          Boolean(
            row.role_code
          )
      ) as RoleRow[];

  const typedBusinessUnitById =
    businessUnitById as Map<string, Record<string, unknown>>;

  const scopes =
    (
      Array.isArray(
        erpContext?.scopes
      )
        ? erpContext.scopes
        : []
    )
      .map(
        (row: any) => {
          const businessUnit =
            typedBusinessUnitById.get(
              String(
                row.business_unit_id ?? ""
              )
            );

          return {
            business_unit:
              String(
                businessUnit?.code ??
                row.business_unit_id ??
                ""
              ),
            access_level:
              String(
                row.access_level ?? ""
              ),
            active:
              Number(
                businessUnit?.active ?? 0
              ),
          };
        }
      )
      .filter(
        (row: any) =>
          Boolean(
            row.business_unit
          ) &&
          row.active === 1
      )
      .sort(
        (a: any, b: any) =>
          a.business_unit.localeCompare(
            b.business_unit
          )
      )
      .map(
        (row: any) => ({
          business_unit:
            row.business_unit,
          access_level:
            row.access_level,
        })
      ) as ScopeRow[];

  const roleCodes = new Set(
    roles.map((row) => row.role_code)
  );

  const scopeCodes = new Set(
    scopes.map((row) => row.business_unit)
  );

  if (roleCodes.has("SYSTEM_ADMIN")) {
    return <ERPApp />;
  }
  /*
   * RKN_PLASTIC_TRADING_OWNER_DEFAULT_ROUTE_V1
   * Koko / GROUP_OWNER with PLASTIC_TRADING scope lands in Plastic Trading.
   * SYSTEM_ADMIN branch above remains unchanged.
   */
  if (
    roleCodes.has("GROUP_OWNER") &&
    scopeCodes.has("PLASTIC_TRADING")
  ) {
    redirect("/plastic-trading");
  }

  /*
   * RKN_ROLE_WORKSPACE_V2_ROUTE
   * Supported non-admin roles are routed to one shared canonical shell.
   * Old role branches remain below as rollback fallback only.
   */
  /* RKN_PLASTIC_SUPERVISORY_ROUTE_V2 */
  if (
    roleCodes.has("SUPERVISORY_BOARD") &&
    scopeCodes.has("PLASTIC_TRADING")
  ) {
    redirect("/plastic-trading");
  }
  const roleWorkspaceV2Codes =
    [
      "GROUP_OWNER",
      "SELLER_OWNER",
      "SABLON_MANAGER",
      "SABLON_PAYROLL_OFFICER",
    ];

  if (
    roleWorkspaceV2Codes.some(
      (roleCode) =>
        roleCodes.has(
          roleCode
        )
    )
  ) {
    const roleWorkspaceReport =
      await getErpCoreRpcStub()
        .getRoleWorkspaceReport(
          session.user.id
        );

    return (
      <RoleWorkspaceV2
        report={
          roleWorkspaceReport
        }
      />
    );
  }

  if (
    roleCodes.has("SABLON_MANAGER") ||
    roleCodes.has("SABLON_PAYROLL_OFFICER")
  ) {
    return (
      <RoleWorkspace
        workspaceName="SABLON PLASTIK"
        subtitle="OPERASIONAL PEKERJA DAN PAYROLL SABLON"
        accessLabel="SABLON WORKSPACE"
        modules={[
          { label: "DASHBOARD SABLON", enabled: true },
          { label: "MASTER PEKERJA", enabled: true },
          { label: "SETORAN BORONGAN" },
          { label: "PAYROLL MINGGUAN" },
          { label: "KASBON" },
          { label: "PEMBAYARAN" },
          { label: "PAYSLIP" },
        ]}
      />
    );
  }

  if (roleCodes.has("GROUP_OWNER")) {
    // RKN_OWNER_PREVIEW_ROUTE_V1
    return <OwnerPreview />;
  }

  // Existing owner workspace preserved below
  if (false && roleCodes.has("GROUP_OWNER")) {
    return (
      <RoleWorkspace
        workspaceName="OWNER CONTROL"
        subtitle="MONITORING GROUP, APPROVAL, DAN FINANCE"
        accessLabel="GROUP OWNER WORKSPACE"
        modules={[
          { label: "GROUP DASHBOARD", enabled: true },
          { label: "APPROVAL PAYROLL" },
          { label: "FINANCE" },
          { label: "NERACA" },
          { label: "LABA RUGI" },
          { label: "CASH FLOW" },
        ]}
      />
    );
  }

  if (roleCodes.has("SELLER_OWNER")) {
    const sellerName =
      scopeCodes.has("ORVIELLE")
        ? "ORVIELLE"
        : scopeCodes.has("JENNA")
          ? "JENNA"
          : "SELLER";

    return (
      <RoleWorkspace
        workspaceName={sellerName}
        subtitle="SALES, ORDER, SETTLEMENT, DAN FINANCE SELLER"
        accessLabel="SELLER OWNER WORKSPACE"
        modules={[
          { label: "DASHBOARD", enabled: true },
          { label: "PENJUALAN" },
          { label: "ORDER" },
          { label: "SETTLEMENT" },
          { label: "FINANCE" },
        ]}
      />
    );
  }

  return (
    <RoleWorkspace
      workspaceName="PRIVATE WORKSPACE"
      subtitle="AKSES ERP TERBATAS SESUAI ROLE DAN BUSINESS SCOPE"
      accessLabel="ACCESS CONTROLLED"
      modules={[
        { label: "DASHBOARD", enabled: true },
      ]}
    />
  );
}