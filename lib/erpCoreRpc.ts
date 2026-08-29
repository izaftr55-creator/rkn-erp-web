import { getCloudflareContext } from "@opennextjs/cloudflare";

const RKN_ERP_CORE_OBJECT_NAME =
  "rkn-f8c-local-only";

export type RknErpKernelStatus = {
  ok: true;
  className: "RknErpCore";
  storage: "SQLITE";
  schemaVersion: string;
  schemaSha256: string;
  rpcSurface: "KERNEL_ONLY_W1_R3";

  coreMethodCounts: {
    globalBusiness: number;
    inventory: number;
    transaction: number;
  };
};

type RknErpKernelStub = {
  kernelStatus():
    Promise<RknErpKernelStatus>;
};

type RknErpCoreNamespace = {
  getByName(
    name: string
  ): RknErpKernelStub;
};

type RknErpRuntimeEnv = {
  RKN_ERP_CORE:
    RknErpCoreNamespace;
};

export function getErpCoreKernelStub():
  RknErpKernelStub {

  const context =
    getCloudflareContext();

  const env =
    context.env as unknown as
      RknErpRuntimeEnv;

  if (
    !env.RKN_ERP_CORE ||
    typeof env.RKN_ERP_CORE.getByName !== "function"
  ) {

    throw new Error(
      "RKN_ERP_CORE_BINDING_UNAVAILABLE"
    );
  }

  return env.RKN_ERP_CORE
    .getByName(
      RKN_ERP_CORE_OBJECT_NAME
    );
}


export type RknRpcAccessLevel =
  | "VIEW"
  | "OPERATE"
  | "MANAGE"
  | "OWNER";


export type RknServerDerivedRpcAccess = {
  actorUserId: string;
  permissionCode: string;
  businessUnitId?: string | null;
  allowedAccessLevels?: RknRpcAccessLevel[];
};


export type RknRpcSessionUser = {

  id: string;

  name?: string | null;

  email?: string | null;

  username?: string | null;
};


type RknRpcRequest = Request<any, any>;

export type RknErpCoreRpcStub = {

  kernelStatus():
    Promise<unknown>;


  getErpAccessContext(
    actorUserId: string
  ): Promise<any>;


  ingestCanonicalOrderObservationV11(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  resolveActiveStoreBusinessScopeV11(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  applyInventoryAdjustment(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  confirmAllocation(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  getAllocation(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  getInventoryBalance(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  getInventoryCoreStats(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  getRecentInventoryLedger(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  upsertAllocationDraft(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  getRecentTransactions(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  getTransactionCoreStats(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  lookupHistoricalHpp(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  upsertTransactionLine(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;

  upsertTransactionLines(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ): Promise<any>;


getPublicWorkerRegistrationByToken(
    request: RknRpcRequest,
    token: string
  ): Promise<Response>;

  submitPublicWorkerRegistration(
    request: RknRpcRequest,
    token: string
  ): Promise<Response>;

  getCanonicalProductMasterStatus(
    actorUserId: string
  ): Promise<any>;

  seedCanonicalProductMasterV1(
    actorUserId: string,
    seed: any
  ): Promise<any>;

  getCanonicalMasterResource(
    actorUserId: string,
    resourceName: string
  ): Promise<any[]>;
  getPlasticTradingView(actorUserId:string,view?:string,periodKey?:string):Promise<any>;
  mutatePlasticTrading(actorUserId:string,command:string,payload?:unknown):Promise<any>;
  getPlasticTradingDashboard(
    actorUserId: string,
    periodKey?: string
  ): Promise<any>;
  getRoleWorkspaceReport(
    actorUserId: string
  ): Promise<any>;
  getAdminModuleReport(
    actorUserId: string,
    featureKey: string,
    businessUnitId: string
  ): Promise<any>;

  getAdminAccessDirectory(
    actorUserId: string
  ): Promise<any>;

  provisionPendingErpUserAccess(
    actorUserId: string,
    targetUserId: string,
    fullName: string,
    roleCode: string,
    businessUnitId: string,
    accessLevel: RknRpcAccessLevel
  ): Promise<any>;

  recordPasswordChangeCompletion(
    actorUserId: string
  ): Promise<any>;

  getHppManagementState(
    sessionUser: RknRpcSessionUser | null,
    request: RknRpcRequest
  ): Promise<Response>;

  upsertHppRecord(
    sessionUser: RknRpcSessionUser | null,
    request: RknRpcRequest
  ): Promise<Response>;

  getInventoryRouteReadModel(
    access: RknServerDerivedRpcAccess,
    businessUnitId: string,
    warehouseId: string,
    limit: number
  ): Promise<any>;

  getWhatsappOutbox(
    sessionUser: RknRpcSessionUser | null,
    request: RknRpcRequest
  ): Promise<Response>;

  updateWorkerRegistrationInvite(
    sessionUser: RknRpcSessionUser | null,
    request: RknRpcRequest,
    inviteId: string
  ): Promise<Response>;

  listWorkerRegistrationInvites(
    sessionUser: RknRpcSessionUser | null,
    request: RknRpcRequest
  ): Promise<Response>;

  createWorkerRegistrationInvite(
    sessionUser: RknRpcSessionUser | null,
    request: RknRpcRequest
  ): Promise<Response>;

  reviewWorkerRegistration(
    sessionUser: RknRpcSessionUser | null,
    request: RknRpcRequest,
    registrationId: string
  ): Promise<Response>;

  listWorkerRegistrations(
    sessionUser: RknRpcSessionUser | null,
    request: RknRpcRequest
  ): Promise<Response>;

  listWorkers(
    sessionUser: RknRpcSessionUser | null,
    request: RknRpcRequest
  ): Promise<Response>;

  createWorker(
    sessionUser: RknRpcSessionUser | null,
    request: RknRpcRequest
  ): Promise<Response>;
};


export function getErpCoreRpcStub():
  RknErpCoreRpcStub {

  return getErpCoreKernelStub() as unknown as
    RknErpCoreRpcStub;
}

