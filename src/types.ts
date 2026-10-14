export type UserRole = "ADMIN" | "VERIFIER" | "USER";

export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type IPFSStatus = "PINNED" | "PENDING" | "FAILED" | "LOCAL_ONLY";

export type VerificationResultType = "MATCH" | "MISMATCH" | "NOT_FOUND" | "PENDING_APPROVAL" | "IPFS_UNAVAILABLE" | "INSUFFICIENT_DATA";

export interface HistoryEvent {
  timestamp: string;
  action: string;
  actor: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface DocumentItem {
  id: string;
  tracking_code: string;
  title: string;
  original_filename: string;
  file_size: number;
  file_extension: string;
  mime_type: string;
  sha256_hash: string;
  ipfs_cid?: string | null;
  ipfs_status: IPFSStatus;
  owner_id: string;
  owner_email: string;
  owner_name: string;
  status: DocumentStatus;
  status_description: string;
  is_encrypted: boolean;
  verifier_id?: string | null;
  verifier_name?: string | null;
  verifier_notes?: string | null;
  created_at: string;
  updated_at: string;
  verified_at?: string | null;
  history: HistoryEvent[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_email: string;
  action: string;
  document_id?: string | null;
  ip_address: string;
  status: "SUCCESS" | "FAILED";
  details: string;
}

export interface VerificationRecord {
  id: string;
  timestamp: string;
  document_id?: string;
  result: VerificationResultType;
  provided_hash?: string;
  recorded_hash?: string;
  ipfs_cid?: string | null;
  verifier_status?: string;
  client_ip: string;
  notes?: string;
}
