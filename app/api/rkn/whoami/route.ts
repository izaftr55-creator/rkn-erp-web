import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

export const dynamic = "force-dynamic";

type ProfileRow = {
  person_key: string;
  identity_code: string | null;
  full_name: string;
  username: string;
  primary_role_code: string | null;
  primary_role_name: string | null;
  active: number;
  must_change_password: number;
};

type RoleRow = {
  role: string;
  scope: string;
};

type ScopeRow = {
  business_unit: string;
  access_level: string;
};

export async function GET() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 401,
      }
    );
  }

  const erpContext =
    await getErpCoreRpcStub()
      .getErpAccessContext(
        session.user.id
      ) as any;

  const erpProfile =
    erpContext?.profile ?? null;

  const erpRoles =
    Array.isArray(
      erpContext?.roles
    )
      ? erpContext.roles
      : [];

  const erpUserRoles =
    Array.isArray(
      erpContext?.userRoles
    )
      ? erpContext.userRoles
      : [];

  const erpScopes =
    Array.isArray(
      erpContext?.scopes
    )
      ? erpContext.scopes
      : [];

  const erpBusinessUnits =
    Array.isArray(
      erpContext?.businessUnits
    )
      ? erpContext.businessUnits
      : [];

  const roleById =
    new Map(
      erpRoles.map(
        (row: any) => [
          String(
            row.id ?? ""
          ),
          row,
        ]
      )
    );

  const businessUnitById =
    new Map(
      erpBusinessUnits.map(
        (row: any) => [
          String(
            row.id ?? ""
          ),
          row,
        ]
      )
    );

  const primaryRoleCode =
    String(
      erpProfile?.primary_role_code ??
      ""
    );

  const profile =
    erpProfile
      ? {
          ...erpProfile,
          username:
            String(
              (session.user as any)
                .username ??
              ""
            ),
          primary_role_name:
            erpRoles.find(
              (row: any) =>
                String(
                  row.code ?? ""
                ) ===
                  primaryRoleCode
            )?.name ?? null,
        } as ProfileRow
      : undefined;

  if (!profile || profile.active !== 1) {
    return NextResponse.json(
      {
        authenticated: true,
        authorized: false,
        reason: "ERP_PROFILE_NOT_ACTIVE",
      },
      {
        status: 403,
      }
    );
  }

  const typedRoleById =
    roleById as Map<string, Record<string, unknown>>;

  const typedBusinessUnitById =
    businessUnitById as Map<string, Record<string, unknown>>;

  const roles =
    erpUserRoles
      .map(
        (row: any) => {
          const role =
            typedRoleById.get(
              String(
                row.role_id ?? ""
              )
            );

          const businessUnit =
            row.business_unit_id
              ? typedBusinessUnitById.get(
                  String(
                    row.business_unit_id
                  )
                )
              : null;

          return {
            role:
              String(
                role?.code ?? ""
              ),
            scope:
              businessUnit
                ? String(
                    businessUnit.code ??
                    row.business_unit_id
                  )
                : "GLOBAL",
          };
        }
      )
      .filter(
        (row: any) =>
          Boolean(
            row.role
          )
      ) as RoleRow[];

  const scopes =
    erpScopes
      .map(
        (row: any) => ({
          business_unit:
            String(
              typedBusinessUnitById.get(
                String(
                  row.business_unit_id ?? ""
                )
              )?.code ??
              row.business_unit_id ??
              ""
            ),
          access_level:
            String(
              row.access_level ?? ""
            ),
        }))
      .filter(
        (row: any) =>
          Boolean(
            row.business_unit
          )
      ) as ScopeRow[];

  return NextResponse.json({
    authenticated: true,
    authorized: true,

    user: {
      id: session.user.id,

      personKey:
        profile.person_key,

      identityCode:
        profile.identity_code,

      name:
        profile.full_name,

      username:
        profile.username,

      primaryRoleCode:
        profile.primary_role_code,

      primaryRoleName:
        profile.primary_role_name,

      mustChangePassword:
        profile.must_change_password === 1,
    },

    roles,
    scopes,
  });
}