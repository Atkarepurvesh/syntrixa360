// ---------------------------------------------------------------------------
// Syntrixa 360 · Unified Inbox · Part 2 — Conversation & Messaging data layer
// ---------------------------------------------------------------------------
// This mirrors the backend schema described in the Part 2 spec (messages,
// message_drafts, message_attachments, conversation_notes, templates) so the
// UI can be lifted onto a real API/DB later with minimal changes. For now
// everything is served from in-memory mock data, consistent with the rest
// of this app.

export type Channel = "whatsapp" | "email" | "website";

export type Priority = "Low" | "Medium" | "High";

export type ConversationStatus = "Open" | "Waiting for Sales" | "Waiting for Customer" | "Closed";

/** messages.status */
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

/** messages.message_type */
export type MessageKind = "text" | "image" | "document" | "system" | "internal_note";

export type SenderType = "customer" | "sales" | "system";

export type Attachment = {
  id: string;
  fileName: string;
  fileType: string;
  /** bytes */
  fileSize: number;
  kind: "image" | "document";
};

export type Message = {
  id: string;
  conversationId: string;
  senderType: SenderType;
  /** Display name — contact name for customer, executive name for sales, empty for system */
  senderName: string;
  type: MessageKind;
  body: string;
  attachments?: Attachment[] | undefined;
  status?: MessageStatus | undefined;
  /** Reason shown to the user when status === "failed" */
  failureReason?: string | undefined;
  createdAtISO: string;
  sentAtISO?: string | undefined;
  deliveredAtISO?: string | undefined;
  readAtISO?: string | undefined;
  /** Present when this message is a retry of an earlier failed attempt (message_retry_protection) */
  retryOfId?: string | undefined;
};

export type TemplateCategory =
  | "Introduction"
  | "Product Information"
  | "Price Inquiry"
  | "Quotation"
  | "Follow-up"
  | "Payment Reminder"
  | "Order Confirmation"
  | "Delivery Update"
  | "Thank You"
  | "Meeting";

export type MessageTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  body: string;
};

export type Conversation = {
  id: string;
  company: string;
  contact: string;
  channel: Channel;
  priority: Priority;
  status: ConversationStatus;
  assigned: string;
  unread: number;
  messages: Message[];
};

const owners = ["Rahul", "Neha", "Arjun", "Pooja", "Sandeep"] as const;

let seq = 1000;
const nextId = (prefix: string) => `${prefix}-${seq++}`;

function textMsg(
  conversationId: string,
  senderType: SenderType,
  senderName: string,
  body: string,
  createdAtISO: string,
  status?: MessageStatus,
): Message {
  return {
    id: nextId("m"),
    conversationId,
    senderType,
    senderName,
    type: "text",
    body,
    status: senderType === "sales" ? (status ?? "read") : undefined,
    createdAtISO,
    sentAtISO: senderType === "sales" ? createdAtISO : undefined,
    deliveredAtISO: senderType === "sales" && status !== "failed" ? createdAtISO : undefined,
    readAtISO: senderType === "sales" && status === "read" ? createdAtISO : undefined,
  };
}

function systemMsg(conversationId: string, body: string, createdAtISO: string): Message {
  return {
    id: nextId("m"),
    conversationId,
    senderType: "system",
    senderName: "",
    type: "system",
    body,
    createdAtISO,
  };
}

function noteMsg(
  conversationId: string,
  senderName: string,
  body: string,
  createdAtISO: string,
): Message {
  return {
    id: nextId("m"),
    conversationId,
    senderType: "sales",
    senderName,
    type: "internal_note",
    body,
    createdAtISO,
  };
}

// Relative timestamps anchored to "now" so the demo always looks current.
const now = new Date();
const iso = (daysAgo: number, hour: number, minute: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const conversations: Conversation[] = [
  {
    id: "shreeji-traders",
    company: "Shreeji Traders",
    contact: "Nilesh Shah",
    channel: "whatsapp",
    priority: "High",
    assigned: "Rahul",
    status: "Waiting for Sales",
    unread: 2,
    messages: [
      systemMsg("shreeji-traders", "Conversation assigned to Rahul", iso(2, 9, 0)),
      textMsg(
        "shreeji-traders",
        "customer",
        "Nilesh Shah",
        "Hello, we need 100 MT coconut.",
        iso(2, 10, 25),
      ),
      textMsg(
        "shreeji-traders",
        "sales",
        "Rahul",
        "Sure. Please confirm destination.",
        iso(2, 10, 30),
        "read",
      ),
      textMsg(
        "shreeji-traders",
        "customer",
        "Nilesh Shah",
        "Dubai. Please send CIF price.",
        iso(2, 10, 42),
      ),
      systemMsg("shreeji-traders", "Priority changed to High", iso(1, 9, 15)),
      textMsg(
        "shreeji-traders",
        "sales",
        "Rahul",
        "Working on the CIF quote for Dubai, will share shortly.",
        iso(1, 9, 20),
        "read",
      ),
      noteMsg(
        "shreeji-traders",
        "Rahul",
        "Customer price negotiate kar raha hai. Manager approval required.",
        iso(1, 9, 22),
      ),
      {
        ...textMsg(
          "shreeji-traders",
          "sales",
          "Rahul",
          "Here is the quotation as discussed.",
          iso(0, 9, 5),
          "delivered",
        ),
        attachments: [
          {
            id: nextId("att"),
            fileName: "Quotation.pdf",
            fileType: "application/pdf",
            fileSize: 245_000,
            kind: "document",
          },
        ],
      },
      textMsg("shreeji-traders", "customer", "Nilesh Shah", "Thanks for the update", iso(0, 9, 40)),
    ],
  },
  {
    id: "global-exports",
    company: "Global Exports Ltd.",
    contact: "Meera Iyer",
    channel: "email",
    priority: "Medium",
    assigned: "Neha",
    status: "Open",
    unread: 0,
    messages: [
      systemMsg("global-exports", "Conversation assigned to Neha", iso(3, 11, 0)),
      textMsg(
        "global-exports",
        "customer",
        "Meera Iyer",
        "Could you share your product catalogue and current price list?",
        iso(3, 11, 5),
      ),
      {
        ...textMsg(
          "global-exports",
          "sales",
          "Neha",
          "Absolutely, please find the catalogue and price list attached.",
          iso(3, 11, 40),
          "read",
        ),
        attachments: [
          {
            id: nextId("att"),
            fileName: "Product-Catalogue.pdf",
            fileType: "application/pdf",
            fileSize: 1_840_000,
            kind: "document",
          },
          {
            id: nextId("att"),
            fileName: "Price-List.xlsx",
            fileType: "application/vnd.ms-excel",
            fileSize: 96_000,
            kind: "document",
          },
        ],
      },
      textMsg("global-exports", "customer", "Meera Iyer", "Quotation shared", iso(0, 15, 45)),
    ],
  },
  {
    id: "maharashtra-distributors",
    company: "Maharashtra Distributors",
    contact: "Ajay Kulkarni",
    channel: "whatsapp",
    priority: "High",
    assigned: "Arjun",
    status: "Waiting for Sales",
    unread: 4,
    messages: [
      systemMsg("maharashtra-distributors", "Conversation assigned to Arjun", iso(1, 8, 0)),
      textMsg(
        "maharashtra-distributors",
        "customer",
        "Ajay Kulkarni",
        "Need 50 units by next week, is that possible?",
        iso(1, 8, 10),
      ),
      textMsg(
        "maharashtra-distributors",
        "sales",
        "Arjun",
        "Checking stock, will confirm in a bit.",
        iso(1, 8, 30),
        "failed",
      ),
      textMsg("maharashtra-distributors", "customer", "Ajay Kulkarni", "Any update?", iso(0, 7, 0)),
      textMsg(
        "maharashtra-distributors",
        "customer",
        "Ajay Kulkarni",
        "Will connect tomorrow",
        iso(0, 7, 5),
      ),
    ],
  },
  {
    id: "kisan-agro",
    company: "Kisan Agro Pvt. Ltd.",
    contact: "Sushil Patil",
    channel: "email",
    priority: "Medium",
    assigned: "Pooja",
    status: "Waiting for Customer",
    unread: 1,
    messages: [
      systemMsg("kisan-agro", "Conversation assigned to Pooja", iso(4, 10, 0)),
      textMsg(
        "kisan-agro",
        "customer",
        "Sushil Patil",
        "We are evaluating a few suppliers, share your certifications too.",
        iso(4, 10, 5),
      ),
      textMsg(
        "kisan-agro",
        "sales",
        "Pooja",
        "Sharing our FSSAI and export certificates along with the quote.",
        iso(4, 10, 50),
        "delivered",
      ),
      textMsg("kisan-agro", "customer", "Sushil Patil", "Need more details", iso(0, 12, 0)),
    ],
  },
  {
    id: "bright-steel",
    company: "Bright Steel Pvt. Ltd.",
    contact: "Rohit Jain",
    channel: "whatsapp",
    priority: "Low",
    assigned: "Rahul",
    status: "Closed",
    unread: 0,
    messages: [
      systemMsg("bright-steel", "Conversation assigned to Rahul", iso(6, 9, 0)),
      textMsg(
        "bright-steel",
        "customer",
        "Rohit Jain",
        "Please send revised pricing",
        iso(4, 16, 0),
      ),
      textMsg(
        "bright-steel",
        "sales",
        "Rahul",
        "Revised pricing shared over email, please check.",
        iso(4, 16, 20),
        "read",
      ),
      systemMsg("bright-steel", "Conversation closed", iso(3, 9, 0)),
    ],
  },
];

export const templates: MessageTemplate[] = [
  {
    id: "t-intro",
    name: "Company Introduction",
    category: "Introduction",
    body: "Hello {{customer_name}}, this is {{sales_executive}} from Syntrixa. Thanks for reaching out to {{company_name}} — how can we help you today?",
  },
  {
    id: "t-product",
    name: "Product Overview",
    category: "Product Information",
    body: "Hi {{customer_name}}, please find our product details attached. Let me know if you'd like specifications for a particular item.",
  },
  {
    id: "t-price",
    name: "Price Inquiry Response",
    category: "Price Inquiry",
    body: "Hi {{customer_name}}, could you confirm the quantity and destination so we can share accurate pricing?",
  },
  {
    id: "t-quote",
    name: "Quotation Shared",
    category: "Quotation",
    body: "Hi {{customer_name}}, please find quotation {{quotation_number}} attached for {{quotation_amount}}. Let us know if you'd like any changes.",
  },
  {
    id: "t-followup",
    name: "Gentle Follow-up",
    category: "Follow-up",
    body: "Hi {{customer_name}}, just following up on our last conversation — is there anything else you need from our side?",
  },
  {
    id: "t-payment",
    name: "Payment Reminder",
    category: "Payment Reminder",
    body: "Hi {{customer_name}}, this is a friendly reminder that payment for {{deal_name}} is pending. Please let us know if you need the invoice again.",
  },
  {
    id: "t-order",
    name: "Order Confirmation",
    category: "Order Confirmation",
    body: "Hi {{customer_name}}, your order for {{deal_name}} has been confirmed. We'll share dispatch details shortly.",
  },
  {
    id: "t-delivery",
    name: "Delivery Update",
    category: "Delivery Update",
    body: "Hi {{customer_name}}, your shipment is on its way. We'll share tracking details as soon as they're available.",
  },
  {
    id: "t-thanks",
    name: "Thank You",
    category: "Thank You",
    body: "Thank you {{customer_name}} for your business! Do reach out if you need anything else.",
  },
  {
    id: "t-meeting",
    name: "Meeting Request",
    category: "Meeting",
    body: "Hi {{customer_name}}, would you be available for a quick call this week to discuss {{deal_name}}?",
  },
];

export const templateCategories: TemplateCategory[] = [
  "Introduction",
  "Product Information",
  "Price Inquiry",
  "Quotation",
  "Follow-up",
  "Payment Reminder",
  "Order Confirmation",
  "Delivery Update",
  "Thank You",
  "Meeting",
];

/** Known template variables resolvable from a conversation. Anything else is left for the user to fill in manually — never faked. */
export function resolveTemplateVariables(
  body: string,
  conversation: Conversation,
): { text: string; hasUnresolved: boolean } {
  const known: Record<string, string | undefined> = {
    customer_name: conversation.contact,
    contact_name: conversation.contact,
    company_name: conversation.company,
    sales_executive: conversation.assigned,
    deal_name: undefined,
    quotation_number: undefined,
    quotation_amount: undefined,
  };

  let hasUnresolved = false;
  const text = body.replace(/{{\s*([a-z_]+)\s*}}/gi, (match, key: string) => {
    const value = known[key];
    if (value) return value;
    hasUnresolved = true;
    return `[${key.replace(/_/g, " ")}]`;
  });

  return { text, hasUnresolved };
}

export const MAX_MESSAGE_LENGTH = 4096; // WhatsApp-style limit; email/website can be more generous in a real integration
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export { owners };
export const genId = (prefix: string) => nextId(prefix);
