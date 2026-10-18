import { team } from "@/lib/crm-data";

import type {
  ActivityType,
  AutomationRule,
  DashboardConfig,
  NotificationSettings,
  PipelineStage,
  QuotationConfig,
  WorkspaceSetupState,
} from "./workspace-setup-types";

export const eligibleAssignees = team.map((member) => ({
  id: member.id,
  name: member.name,
  role: member.role,
}));

export const defaultPipeline: PipelineStage[] = [
  { id: "new-lead", name: "New Lead", type: "OPEN", probability: 10, system: true },
  { id: "contacted", name: "Contacted", type: "OPEN", probability: 20, system: true },
  { id: "qualified", name: "Qualified", type: "OPEN", probability: 35, system: false },
  {
    id: "requirement-identified",
    name: "Requirement Identified",
    type: "OPEN",
    probability: 50,
    system: false,
  },
  { id: "quotation-sent", name: "Quotation Sent", type: "OPEN", probability: 65, system: false },
  { id: "negotiation", name: "Negotiation", type: "OPEN", probability: 80, system: false },
  { id: "won", name: "Won", type: "WON", probability: 100, system: true },
  { id: "lost", name: "Lost", type: "LOST", probability: 0, system: true },
];

export const defaultActivityTypes: ActivityType[] = [
  { id: "call", label: "Call", enabled: true, core: true },
  { id: "email", label: "Email", enabled: true, core: true },
  { id: "whatsapp", label: "WhatsApp", enabled: true, core: true },
  { id: "meeting", label: "Meeting", enabled: true, core: true },
  { id: "follow-up", label: "Follow-up", enabled: true, core: true },
  { id: "demo", label: "Demo", enabled: true, core: false },
  { id: "site-visit", label: "Site Visit", enabled: false, core: false },
  { id: "quotation-follow-up", label: "Quotation Follow-up", enabled: true, core: false },
  { id: "payment-follow-up", label: "Payment Follow-up", enabled: false, core: false },
  { id: "order-follow-up", label: "Order Follow-up", enabled: false, core: false },
  { id: "task", label: "Task", enabled: true, core: true },
];

export const defaultQuotationConfig: QuotationConfig = {
  currency: "INR",
  taxDisplay: "exclusive",
  discountEnabled: true,
  validityDays: 15,
  paymentTerms: "50% advance, balance before dispatch",
  deliveryTerms: "Ex-works, 7-10 business days",
  numberPrefix: "SYN-QTN-",
  numberStart: 1,
  access: {
    create: ["owner", "manager", "executive"],
    edit: ["owner", "manager"],
    send: ["owner", "manager", "executive"],
    approve: ["owner", "manager"],
    cancel: ["owner", "manager"],
    convert: ["owner", "manager"],
  },
};

export const defaultNotifications: NotificationSettings = {
  "New Lead": { inApp: true, email: true },
  "New Message": { inApp: true, email: false },
  "Missed Follow-up": { inApp: true, email: true },
  "Task Due": { inApp: true, email: false },
  "Meeting Reminder": { inApp: true, email: true },
  "Quotation Update": { inApp: true, email: true },
  "Team Approval": { inApp: true, email: true },
  "Channel Error": { inApp: true, email: true },
  "Assignment Change": { inApp: true, email: false },
};

export const defaultAutomations: AutomationRule[] = [
  {
    id: "new-lead-assignment",
    name: "New Lead Assignment",
    trigger: "Lead created",
    action: "Assign lead using the active assignment rule",
    enabled: true,
    recommended: true,
  },
  {
    id: "new-lead-follow-up",
    name: "New Lead Follow-up",
    trigger: "Lead created",
    action: "Create a follow-up task for the assigned executive",
    enabled: true,
    recommended: true,
  },
  {
    id: "quotation-follow-up",
    name: "Quotation Follow-up Reminder",
    trigger: "Quotation sent",
    action: "Create a follow-up reminder after the configured period",
    enabled: true,
    recommended: true,
  },
  {
    id: "missed-activity",
    name: "Missed Activity Reminder",
    trigger: "No activity on a lead for the configured period",
    action: "Notify the assigned salesperson and their manager",
    enabled: true,
    recommended: true,
  },
  {
    id: "new-conversation-assignment",
    name: "New Conversation Assignment",
    trigger: "New conversation received on a connected channel",
    action: "Route to the channel's default team, then an eligible executive",
    enabled: true,
    recommended: true,
  },
  {
    id: "new-website-lead",
    name: "New Website Lead",
    trigger: "Website enquiry submitted",
    action: "Create lead, assign salesperson, create follow-up",
    enabled: false,
    recommended: false,
  },
];

export const defaultDashboardConfig: DashboardConfig = {
  owner: [
    "Total Leads",
    "New Leads",
    "Open Deals",
    "Won Deals",
    "Lost Deals",
    "Revenue",
    "Pending Follow-ups",
    "Today's Activities",
    "Team Performance",
    "Channel Performance",
  ],
  manager: [
    "Team Leads",
    "Team Deals",
    "Team Activities",
    "Team Follow-ups",
    "Team Performance",
    "Pipeline",
    "Conversion",
  ],
  executive: [
    "My Leads",
    "My Deals",
    "My Activities",
    "My Follow-ups",
    "My Calendar",
    "My Inbox",
    "My Quotations",
  ],
};

export function createDefaultWorkspaceSetupState(): WorkspaceSetupState {
  return {
    status: "SETUP_IN_PROGRESS",
    completedSections: [],
    pipeline: defaultPipeline,
    assignment: {
      strategy: "manual",
      productRouting: [
        { category: "Herbal Products", assigneeId: eligibleAssignees[0]?.id ?? "" },
        { category: "Industrial Products", assigneeId: eligibleAssignees[1]?.id ?? "" },
      ],
      channelRouting: [
        { channel: "WhatsApp", teamId: "whatsapp-sales" },
        { channel: "Website", teamId: "website-sales" },
        { channel: "Email", teamId: "email-sales" },
      ],
      teams: [
        {
          id: "whatsapp-sales",
          name: "WhatsApp Sales Team",
          memberIds: [team[0]?.id, team[1]?.id].filter((id): id is string => !!id),
        },
        {
          id: "website-sales",
          name: "Website Sales Team",
          memberIds: [team[2]?.id].filter((id): id is string => !!id),
        },
        {
          id: "email-sales",
          name: "Email Sales Team",
          memberIds: [team[3]?.id].filter((id): id is string => !!id),
        },
      ],
    },
    inbox: [
      {
        channel: "WhatsApp",
        connected: true,
        defaultOwnerId: "unassigned",
        defaultTeamId: "whatsapp-sales",
        assignmentRule: "round-robin",
        businessHoursOnly: false,
        autoAssign: true,
      },
      {
        channel: "Business Email",
        connected: true,
        defaultOwnerId: "unassigned",
        defaultTeamId: "email-sales",
        assignmentRule: "round-robin",
        businessHoursOnly: true,
        autoAssign: true,
      },
      {
        channel: "Website",
        connected: true,
        defaultOwnerId: "unassigned",
        defaultTeamId: "website-sales",
        assignmentRule: "same-as-lead",
        businessHoursOnly: false,
        autoAssign: true,
      },
      {
        channel: "Outlook",
        connected: true,
        defaultOwnerId: "unassigned",
        defaultTeamId: "none",
        assignmentRule: "manual",
        businessHoursOnly: true,
        autoAssign: false,
      },
    ],
    calendar: {
      defaultView: "week",
      callDurationMinutes: 15,
      meetingDurationMinutes: 30,
      demoDurationMinutes: 45,
      followUpReminder: "2d",
      followUpReminderCustomDays: 5,
    },
    activityTypes: defaultActivityTypes,
    requiredActivityFields: {
      activityType: true,
      subject: true,
      dueDate: true,
      assignedUser: true,
      relatedLead: false,
      relatedCustomer: false,
      notes: false,
    },
    quotations: defaultQuotationConfig,
    notifications: defaultNotifications,
    automations: defaultAutomations,
    dashboard: defaultDashboardConfig,
    channelHealth: {
      WhatsApp: "healthy",
      "Business Email": "healthy",
      Website: "healthy",
      Outlook: "attention",
    },
    activatedAt: null,
  };
}
