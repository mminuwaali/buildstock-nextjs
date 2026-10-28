export type UserRoleType =
  "owner_admin" | "store_manager" | "cashier" | "stock_officer" | "auditor";
export type SyncStatusType =
  "pending" | "syncing" | "synced" | "needs_review" | "rejected";
export type PaymentMethodType = "cash" | "bank_transfer" | "external_pos";
export type PaymentStatusType =
  "confirmed" | "awaiting_verification" | "failed";
export type InventoryMovementType =
  | "opening"
  | "sale"
  | "purchase_receipt"
  | "return"
  | "adjustment"
  | "transfer_out"
  | "transfer_in";
