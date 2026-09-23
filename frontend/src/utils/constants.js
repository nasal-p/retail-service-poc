// Constants for roles, statuses, colors, and option arrays

export const ROLES = {
  CUSTOMER: "CUSTOMER",
  STAFF: "STAFF",
  ADMIN: "ADMIN",
};

export const ORDER_STATUSES = [
  { value: "PENDING", label: "Pending", badge: "warning" },
  { value: "CONFIRMED", label: "Confirmed", badge: "info" },
  { value: "PROCESSING", label: "Processing", badge: "primary" },
  { value: "READY_FOR_COLLECTION", label: "Ready for Collection", badge: "purple" },
  { value: "COMPLETED", label: "Completed", badge: "success" },
  { value: "CANCELLED", label: "Cancelled", badge: "danger" },
];

export const SERVICE_REQUEST_STATUSES = [
  { value: "RECEIVED", label: "Received", badge: "info" },
  { value: "DIAGNOSING", label: "Diagnosing", badge: "warning" },
  { value: "WAITING_FOR_PARTS", label: "Waiting for Parts", badge: "orange" },
  { value: "IN_REPAIR", label: "In Repair", badge: "primary" },
  { value: "READY_FOR_COLLECTION", label: "Ready for Collection", badge: "purple" },
  { value: "COMPLETED", label: "Completed", badge: "success" },
  { value: "CANCELLED", label: "Cancelled", badge: "danger" },
];

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash on Collection / Delivery", icon: "DollarSign" },
  { value: "CARD", label: "Credit / Debit Card (Mock Pay)", icon: "CreditCard" },
  { value: "ONLINE", label: "Online Mobile Transfer", icon: "Smartphone" },
];

export const ORDER_STATUS_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_COLLECTION",
  "COMPLETED",
];

export const REPAIR_STATUS_STEPS = [
  "RECEIVED",
  "DIAGNOSING",
  "IN_REPAIR",
  "READY_FOR_COLLECTION",
  "COMPLETED",
];
