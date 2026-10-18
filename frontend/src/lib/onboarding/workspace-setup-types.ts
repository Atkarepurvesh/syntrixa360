export type StageType = "OPEN" | "WON" | "LOST";

export type PipelineStage = {
  id: string;
  name: string;
  type: StageType;
  probability: number;
  /** System-critical stages require confirmation before deletion. */
  system: boolean;
};

export type AssignmentStrategy =
  "manual" | "round-robin" | "team" | "product" | "channel" | "territory";

export type AssignmentRules = {
  strategy: AssignmentStrategy;
  productRouting: { category: string; assigneeId: string }[];
  channelRouting: { channel: string; teamId: string }[];
  teams: { id: string; name: string; memberIds: string[] }[];
};

export type InboxChannelConfig = {
  channel: string;
  connected: boolean;
  defaultOwnerId: string | "unassigned";
  defaultTeamId: string | "none";
  assignmentRule: "same-as-lead" | "round-robin" | "manual";
  businessHoursOnly: boolean;
  autoAssign: boolean;
};

export type CalendarConfig = {
  defaultView: "day" | "week" | "month";
  callDurationMinutes: number;
  meetingDurationMinutes: number;
  demoDurationMinutes: number;
  followUpReminder: "1d" | "2d" | "3d" | "7d" | "custom";
  followUpReminderCustomDays: number;
};

export type ActivityType = {
  id: string;
  label: string;
  enabled: boolean;
  core: boolean;
};

export type RequiredActivityFields = {
  activityType: boolean;
  subject: boolean;
  dueDate: boolean;
  assignedUser: boolean;
  relatedLead: boolean;
  relatedCustomer: boolean;
  notes: boolean;
};

export type QuotationAccessRole = "owner" | "manager" | "executive";
export type QuotationAction = "create" | "edit" | "send" | "approve" | "cancel" | "convert";

export type QuotationConfig = {
  currency: string;
  taxDisplay: "inclusive" | "exclusive";
  discountEnabled: boolean;
  validityDays: number;
  paymentTerms: string;
  deliveryTerms: string;
  numberPrefix: string;
  numberStart: number;
  access: Record<QuotationAction, QuotationAccessRole[]>;
};

export type NotificationCategory =
  | "New Lead"
  | "New Message"
  | "Missed Follow-up"
  | "Task Due"
  | "Meeting Reminder"
  | "Quotation Update"
  | "Team Approval"
  | "Channel Error"
  | "Assignment Change";

export type NotificationSettings = Record<NotificationCategory, { inApp: boolean; email: boolean }>;

export type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  recommended: boolean;
};

export type DashboardRole = "owner" | "manager" | "executive";
export type DashboardConfig = Record<DashboardRole, string[]>;

export type WorkspaceSetupSectionId =
  | "pipeline"
  | "assignment"
  | "inbox"
  | "calendar"
  | "activity"
  | "quotations"
  | "notifications"
  | "automations"
  | "dashboard";

export type ChannelHealth = "healthy" | "attention";

export type WorkspaceSetupState = {
  status: "SETUP_IN_PROGRESS" | "ACTIVE";
  completedSections: WorkspaceSetupSectionId[];
  pipeline: PipelineStage[];
  assignment: AssignmentRules;
  inbox: InboxChannelConfig[];
  calendar: CalendarConfig;
  activityTypes: ActivityType[];
  requiredActivityFields: RequiredActivityFields;
  quotations: QuotationConfig;
  notifications: NotificationSettings;
  automations: AutomationRule[];
  dashboard: DashboardConfig;
  channelHealth: Record<string, ChannelHealth>;
  activatedAt: string | null;
};
