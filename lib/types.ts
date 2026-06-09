export type UserRole = "admin" | "agent";
export type AccountStatus = "invited" | "active" | "deactivated";
export type VerificationOutcome = "verified" | "not_verified";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
};

export type FeedbackFilters = {
  q?: string;
  outcome?: VerificationOutcome;
  agent?: string;
  from?: string;
  to?: string;
  page?: number;
};

export type NimcResult =
  | {
      status: "verified";
      identity: {
        fullName: string;
        dateOfBirth: string;
        gender: string;
      };
      rawPayload: unknown;
    }
  | {
      status: "not_verified";
      reasonCode: string;
      rawPayload: unknown;
    }
  | {
      status: "service_unavailable";
      reasonCode: string;
    };
