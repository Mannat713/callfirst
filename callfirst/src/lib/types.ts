export type FieldKey =
  | "name"
  | "phone"
  | "email"
  | "budget"
  | "config"
  | "location"
  | "source"
  | "message"
  | "createdAt";

export type ColumnMapping = Partial<Record<FieldKey, string>>;

export type LeadStatus =
  | "new"
  | "called"
  | "no_answer"
  | "visit_booked"
  | "not_interested";

export type Bucket = "call_today" | "this_week" | "nurture" | "skip";

/** A lead as imported, plus what the team has done with it. */
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  budget: string;
  config: string;
  location: string;
  source: string;
  message: string;
  createdAt: string;
  status: LeadStatus;
  notes: string;
}

export interface ProjectSettings {
  projectName: string;
  agentName: string;
  /** Project price range in lakh rupees. 0 means "not set". */
  priceMinLakh: number;
  priceMaxLakh: number;
  /** Configurations on offer, e.g. ["3 BHK", "4 BHK"]. */
  configs: string[];
  /** Cities or localities the project sells into. */
  locations: string[];
}

export interface Reason {
  text: string;
  tone: "good" | "bad" | "neutral";
}

export interface ScoredLead {
  lead: Lead;
  intent: number;
  fit: number;
  score: number;
  bucket: Bucket;
  reasons: Reason[];
  phoneE164: string | null;
  international: boolean;
  duplicateOf: string | null;
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Not called",
  called: "Called",
  no_answer: "No answer",
  visit_booked: "Visit booked",
  not_interested: "Not interested",
};

export const BUCKET_LABEL: Record<Bucket, string> = {
  call_today: "Call today",
  this_week: "This week",
  nurture: "Nurture",
  skip: "Skip",
};

export const FIELD_LABEL: Record<FieldKey, string> = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  budget: "Budget",
  config: "Configuration (BHK)",
  location: "City or locality",
  source: "Source",
  message: "Message or notes",
  createdAt: "Enquiry date",
};

export const DEFAULT_SETTINGS: ProjectSettings = {
  projectName: "",
  agentName: "",
  priceMinLakh: 0,
  priceMaxLakh: 0,
  configs: [],
  locations: [],
};
