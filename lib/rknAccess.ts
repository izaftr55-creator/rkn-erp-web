
import "server-only";

import { headers } from "next/headers";

import {
  getAuth,
  type RknAuthSession,
} from "@/lib/auth";

import {
  getErpCoreRpcStub,
} from "@/lib/erpCoreRpc";


export type RknAccessLevel =
  | "VIEW"
  | "MANAGE"
  | "OWNER";


type ErpAccessContext = {

  profile?: {
    active?: unknown;
  } | null;

  scopes?: Array<{
    business_unit_id?: unknown;
    access_level?: unknown;
  }>;

  permissions?: Array<{
    business_unit_id?: unknown;
    permission_code?: unknown;
  }>;
};


export type RknAccessGranted = {

  ok: true;

  session:
    RknAuthSession;

  accessLevel:
    RknAccessLevel;
};


export type RknAccessDenied = {

  ok: false;

  status:
    401 | 403;

  error:
    | "UNAUTHENTICATED"
    | "PROFILE_INACTIVE"
    | "SCOPE_DENIED"
    | "PERMISSION_DENIED";
};


export type RknAccessResult =
  | RknAccessGranted
  | RknAccessDenied;


export type RknAccessReadGranted = {

  ok: true;

  session:
    RknAuthSession;

  accessLevel:
    RknAccessLevel | null;

  accessMode:
    | "BUSINESS"
    | "SYSTEM_OBSERVER";
};


export type RknAccessReadResult =
  | RknAccessReadGranted
  | RknAccessDenied;


function clean(
  value: unknown
) {

  return String(
    value ?? ""
  ).trim();
}


async function readContext(
  userId: string
): Promise<ErpAccessContext> {

  return await getErpCoreRpcStub()
    .getErpAccessContext(
      userId
    ) as ErpAccessContext;
}


function activeProfile(
  context:
    ErpAccessContext
) {

  return Number(
    context.profile?.active
  ) === 1;
}


function scopeFromContext(
  context:
    ErpAccessContext,

  businessUnitId:
    string
): RknAccessLevel | null {

  const row =
    (
      context.scopes ?? []
    )
      .find(
        item =>
          clean(
            item.business_unit_id
          ) ===
            businessUnitId
      );


  const level =
    clean(
      row?.access_level
    );


  if (
    level !== "VIEW" &&
    level !== "MANAGE" &&
    level !== "OWNER"
  ) {

    return null;
  }


  return level;
}


function hasBusinessPermissionFromContext(
  context:
    ErpAccessContext,

  businessUnitId:
    string,

  permissionCode:
    string
) {

  return (
    context.permissions ?? []
  )
    .some(
      row => {

        const rowPermission =
          clean(
            row.permission_code
          );


        const rowBusinessUnit =
          clean(
            row.business_unit_id
          );


        return (
          rowPermission ===
            permissionCode &&
          (
            !rowBusinessUnit ||
            rowBusinessUnit ===
              businessUnitId
          )
        );
      }
    );
}


function hasGlobalPermissionFromContext(
  context:
    ErpAccessContext,

  permissionCode:
    string
) {

  return (
    context.permissions ?? []
  )
    .some(
      row =>
        clean(
          row.permission_code
        ) ===
          permissionCode &&
        !clean(
          row.business_unit_id
        )
    );
}


export async function userHasBusinessPermission(
  userId: string,
  businessUnitId: string,
  permissionCode: string
) {

  const context =
    await readContext(
      userId
    );


  return (
    activeProfile(
      context
    ) &&
    hasBusinessPermissionFromContext(
      context,
      businessUnitId,
      permissionCode
    )
  );
}


export async function getUserBusinessScope(
  userId: string,
  businessUnitId: string
): Promise<RknAccessLevel | null> {

  const context =
    await readContext(
      userId
    );


  if (
    !activeProfile(
      context
    )
  ) {

    return null;
  }


  return scopeFromContext(
    context,
    businessUnitId
  );
}


export async function userHasGlobalPermission(
  userId: string,
  permissionCode: string
) {

  const context =
    await readContext(
      userId
    );


  return (
    activeProfile(
      context
    ) &&
    hasGlobalPermissionFromContext(
      context,
      permissionCode
    )
  );
}


async function currentSession() {

  return getAuth().api.getSession({

    headers:
      await headers(),
  });
}


export async function requireBusinessPermission(
  permissionCode:
    string,

  businessUnitId:
    string,

  allowedAccessLevels:
    RknAccessLevel[] = [
      "MANAGE",
      "OWNER",
    ]
): Promise<RknAccessResult> {

  const session =
    await currentSession();


  if (!session) {

    return {

      ok: false,

      status: 401,

      error:
        "UNAUTHENTICATED",
    };
  }


  const context =
    await readContext(
      session.user.id
    );


  if (
    !activeProfile(
      context
    )
  ) {

    return {

      ok: false,

      status: 403,

      error:
        "PROFILE_INACTIVE",
    };
  }


  const accessLevel =
    scopeFromContext(
      context,
      businessUnitId
    );


  if (
    !accessLevel ||
    !allowedAccessLevels.includes(
      accessLevel
    )
  ) {

    return {

      ok: false,

      status: 403,

      error:
        "SCOPE_DENIED",
    };
  }


  if (
    !hasBusinessPermissionFromContext(
      context,
      businessUnitId,
      permissionCode
    )
  ) {

    return {

      ok: false,

      status: 403,

      error:
        "PERMISSION_DENIED",
    };
  }


  return {

    ok: true,

    session,

    accessLevel,
  };
}


export async function requireBusinessReadPermission(
  permissionCode:
    string,

  businessUnitId:
    string,

  allowedAccessLevels:
    RknAccessLevel[] = [
      "VIEW",
      "MANAGE",
      "OWNER",
    ]
): Promise<RknAccessReadResult> {

  const session =
    await currentSession();


  if (!session) {

    return {

      ok: false,

      status: 401,

      error:
        "UNAUTHENTICATED",
    };
  }


  const context =
    await readContext(
      session.user.id
    );


  if (
    !activeProfile(
      context
    )
  ) {

    return {

      ok: false,

      status: 403,

      error:
        "PROFILE_INACTIVE",
    };
  }


  const accessLevel =
    scopeFromContext(
      context,
      businessUnitId
    );


  if (
    accessLevel &&
    allowedAccessLevels.includes(
      accessLevel
    ) &&
    hasBusinessPermissionFromContext(
      context,
      businessUnitId,
      permissionCode
    )
  ) {

    return {

      ok: true,

      session,

      accessLevel,

      accessMode:
        "BUSINESS",
    };
  }


  if (
    hasGlobalPermissionFromContext(
      context,
      "system.view_all_business_data"
    )
  ) {

    return {

      ok: true,

      session,

      accessLevel: null,

      accessMode:
        "SYSTEM_OBSERVER",
    };
  }


  if (
    !accessLevel ||
    !allowedAccessLevels.includes(
      accessLevel
    )
  ) {

    return {

      ok: false,

      status: 403,

      error:
        "SCOPE_DENIED",
    };
  }


  return {

    ok: false,

    status: 403,

    error:
      "PERMISSION_DENIED",
  };
}
