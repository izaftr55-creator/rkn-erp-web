/* RKN_GLOBAL_BUSINESS_ENGINE_V1 */

import type { RknEmailTemplateDefinition } from "./contracts";

export const RKN_EMAIL_ENGINE = {
  mode: "SHADOW" as const,
  provider: "UNCONFIGURED" as const,
  credentialConfigured: false,
  outboxPersistenceWired: false,
  deliveryLogPersistenceWired: false,
  retryWorkerWired: false,
  liveSendEnabled: false,
  directSendFromBusinessDomainAllowed: false,
  requiredFlow: [
    "BUSINESS_EVENT",
    "AUTOMATION_RULE",
    "EMAIL_OUTBOX",
    "PROVIDER_ADAPTER",
    "DELIVERY_LOG",
  ] as const,
};

export const RKN_EMAIL_TEMPLATES: readonly RknEmailTemplateDefinition[] = [
  {
    key: "USER_APPROVED",
    eventKey: "USER_APPROVED",
    audience: "USER",
    subject: "Akun RKN ERP disetujui",
    purpose: "Inform approved user that access is available.",
  },
  {
    key: "TEMP_PASSWORD_CREATED",
    eventKey: "TEMP_PASSWORD_CREATED",
    audience: "USER",
    subject: "Password sementara RKN ERP",
    purpose: "Deliver a controlled temporary-password notification.",
  },
  {
    key: "ORDER_REVIEW_REQUIRED",
    eventKey: "ORDER_REVIEW_REQUIRED",
    audience: "OPS",
    subject: "Pesanan perlu dicek",
    purpose: "Notify operations that an order is waiting for review.",
  },
  {
    key: "INVENTORY_LOW",
    eventKey: "INVENTORY_LOW",
    audience: "OWNER",
    subject: "Stok mulai menipis",
    purpose: "Notify owner or operations about low inventory.",
  },
  {
    key: "INVENTORY_RECONCILIATION_FAILED",
    eventKey: "INVENTORY_RECONCILIATION_FAILED",
    audience: "SYSTEM_ADMIN",
    subject: "Selisih stok perlu diperiksa",
    purpose: "Escalate inventory reconciliation failure.",
  },
  {
    key: "HPP_MISSING",
    eventKey: "HPP_MISSING",
    audience: "FINANCE",
    subject: "HPP belum tersedia",
    purpose: "Block finance workflow until historical HPP is resolved.",
  },
  {
    key: "BORROW_DUE",
    eventKey: "BORROW_DUE",
    audience: "OPS",
    subject: "Peminjaman barang perlu diselesaikan",
    purpose: "Notify operations about a due borrow or transfer obligation.",
  },
  {
    key: "PAYROLL_READY",
    eventKey: "PAYROLL_READY",
    audience: "PAYROLL",
    subject: "Payroll siap dicek",
    purpose: "Notify payroll officer that calculation is ready.",
  },
  {
    key: "PAYROLL_APPROVAL_REQUIRED",
    eventKey: "PAYROLL_APPROVAL_REQUIRED",
    audience: "OWNER",
    subject: "Payroll menunggu persetujuan",
    purpose: "Notify owner that payroll is waiting for approval.",
  },
  {
    key: "SETTLEMENT_MISMATCH",
    eventKey: "SETTLEMENT_MISMATCH",
    audience: "FINANCE",
    subject: "Settlement tidak cocok",
    purpose: "Escalate settlement mismatch.",
  },
  {
    key: "AUTOMATION_FAILED",
    eventKey: "AUTOMATION_FAILED",
    audience: "SYSTEM_ADMIN",
    subject: "Automasi gagal",
    purpose: "Escalate exhausted safe automation execution.",
  },
  {
    key: "CONNECTOR_DEGRADED",
    eventKey: "CONNECTOR_DEGRADED",
    audience: "SYSTEM_ADMIN",
    subject: "Koneksi marketplace bermasalah",
    purpose: "Notify System Admin about connector degradation.",
  },
  {
    key: "SHOPEE_SYNC_FAILED",
    eventKey: "SHOPEE_SYNC_FAILED",
    audience: "SYSTEM_ADMIN",
    subject: "Sinkronisasi Shopee gagal",
    purpose: "Notify System Admin about Shopee synchronization failure.",
  },
  {
    key: "TIKTOK_SYNC_FAILED",
    eventKey: "TIKTOK_SYNC_FAILED",
    audience: "SYSTEM_ADMIN",
    subject: "Sinkronisasi TikTok gagal",
    purpose: "Notify System Admin about TikTok synchronization failure.",
  },
];