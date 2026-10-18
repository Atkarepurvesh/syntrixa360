import { team } from "@/lib/crm-data";
import { leadSourcesList, normalizeLeadSource, type CaptureMethod, type LeadSource } from "@/lib/lead-sources";

// Source catalog lives in lead-sources.ts; re-exported so existing imports keep working.
export { leadSourcesList };
export type { CaptureMethod, LeadSource };

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Quotation Sent"
  | "Negotiation"
  | "Converted"
  | "Lost";


export type LeadPriority = "Low" | "Medium" | "High";
export const leadPriorityList: LeadPriority[] = ["Low", "Medium", "High"];

export type ActivityItem = {
  id: string;
  type:
    | "created"
    | "call"
    | "whatsapp"
    | "email"
    | "note"
    | "followup-created"
    | "followup-done"
    | "status-changed"
    | "owner-changed"
    | "updated"
    | "quotation"
    | "converted";
  description: string;
  user: string;
  date: string;
  time: string;
};

export type LinkedConversation = {
  id: string;
  channel: "whatsapp" | "email" | "website";
  contact: string;
  linkedAt: string; // ISO
  linkedBy: string;
};

export type NoteItem = {
  id: string;
  text: string;
  by: string;
  date: string;
  time: string;
};

export type FileItem = {
  id: string;
  name: string;
  type: "PDF" | "Image" | "Excel" | "Doc";
  by: string;
  date: string;
};

export type DealItem = {
  id: string;
  title: string;
  value: string;
  stage: string;
  closeDate: string;
};

export type TaskItem = {
  id: string;
  /** "follow-up" tasks are the ones created/managed by scheduling a follow-up. */
  kind?: "follow-up" | undefined;
  title: string;
  due: string;
  assignedTo: string;
  status: "Pending" | "Completed";
};

export type Lead = {
  id: string;
  name: string;
  company: string;
  contactPerson: string;
  mobile: string;
  whatsapp: string;
  email: string;
  website: string;
  /** Where the inquiry originally came from. Immutable after creation. */
  source: LeadSource;
  /** How the lead was entered into Syntrixa360. */
  captureMethod: CaptureMethod;
  owner: string;
  status: LeadStatus;
  rating: number; // 1-5
  /** 0-100, or null when the lead has not been scored (never invented). */
  score: number | null;
  industry: string;
  city: string;
  state: string;
  budget: string;
  /** Customer inquiry / message. */
  requirement: string;
  /** Optional fields captured by the Add Lead form. */
  priority?: LeadPriority | undefined;
  productInterest?: string | undefined;
  estimatedRequirement?: string | undefined;
  quantity?: string | undefined;
  country?: string | undefined;
  /** Inbox conversations linked to this lead (the lead's origin `source` is never changed by linking). */
  linkedConversations?: LinkedConversation[] | undefined;
  createdOn: string;
  createdTime: string;
  /** ISO timestamp; createdOn/createdTime stay as display strings. */
  createdAt: string;
  /** ISO timestamp of the last change to this record (create, edit, assign, note, ...). */
  updatedAt: string;
  lastContact: string;
  lastContactTime: string;
  nextFollowUp: string | null;
  nextFollowUpTime: string | null;
  followUpOverdueDays: number;
  tags: string[];
  notes: NoteItem[];
  activity: ActivityItem[];
  files: FileItem[];
  deals: DealItem[];
  tasks: TaskItem[];
  ai: {
    summary: string[];
    recommendation: string;
    engagement: number;
    responseRate: number;
    purchaseIntent: number;
    budgetFit: number;
    followUpRisk: number;
  };
};

// Assignable team members come from the existing team roster (crm-data.ts `team`).
export const salesOwners: string[] = team.map((m) => m.name);

// Seed data keeps drawing from the original 10 sources (same RNG sequence => same sample
// records as before); "Manual" is normalised to "Other" since it is a capture method now.
const seedSources = ["WhatsApp","Website","Email","Phone","Referral","Meta","Google","IndiaMART","TradeIndia","Manual"];


export const leadStatusList: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Quotation Sent",
  "Negotiation",
  "Converted",
  "Lost",
];

export const industriesList = [
  "Wholesale",
  "Distribution",
  "Manufacturing",
  "Export",
  "Import",
  "Pharma",
  "FMCG",
  "Chemicals",
  "Industrial",
  "Retail",
  "Trading",
  "Textiles",
];

// Aggregate counts shown as hero stats (represents the full 8,742-lead book of business).
export const leadStatTotals: Record<"all" | LeadStatus, number> = {
  all: 8742,
  New: 342,
  Contacted: 1978,
  Qualified: 1252,
  "Quotation Sent": 842,
  Negotiation: 312,
  Converted: 128,
  Lost: 74,
};

export const quickFilterCounts = {
  myLeads: 1246,
  leadsToday: 342,
  hotLeads: 1125,
  withoutFollowUp: 2325,
  withoutActivity: 1783,
};

const companies: Array<[string, string, string, string]> = [
  ["Shreeji Traders", "Rajesh Patel", "Surat", "Gujarat"],
  ["Global Exports Ltd.", "Meera Iyer", "Mumbai", "Maharashtra"],
  ["Maharashtra Distributors", "Ajay Kulkarni", "Pune", "Maharashtra"],
  ["Kisan Agro Pvt. Ltd.", "Sushil Patil", "Nashik", "Maharashtra"],
  ["Agro Fresh Supplies", "Kiran Deshmukh", "Aurangabad", "Maharashtra"],
  ["Vardhman Brothers", "Manoj Vardhman", "Ludhiana", "Punjab"],
  ["Sahyadri Agencies", "Nitin Gokhale", "Kolhapur", "Maharashtra"],
  ["Pioneer Imports", "Farhan Sheikh", "Ahmedabad", "Gujarat"],
  ["R.K. Enterprises", "Ramesh Kumar", "Jaipur", "Rajasthan"],
  ["Bright Steel Pvt. Ltd.", "Rohit Jain", "Nagpur", "Maharashtra"],
  ["Kuber Traders", "Devang Mehta", "Rajkot", "Gujarat"],
  ["Sharma Industries", "Vikram Sharma", "Indore", "Madhya Pradesh"],
  ["Nirmal Textiles", "Sneha Rao", "Coimbatore", "Tamil Nadu"],
  ["Om Sai Distributors", "Prakash Joshi", "Nagpur", "Maharashtra"],
  ["Diamond Chemicals", "Kavita Shah", "Vapi", "Gujarat"],
  ["Everest Pharma", "Anil Bhandari", "Baddi", "Himachal Pradesh"],
  ["Suvidha Retail Hub", "Poonam Gupta", "Lucknow", "Uttar Pradesh"],
  ["National Hardware Co.", "Suresh Nair", "Kochi", "Kerala"],
  ["Radiant Plastics", "Deepak Malhotra", "Delhi", "Delhi"],
  ["Coastal Foods Pvt. Ltd.", "Ramya Shetty", "Mangalore", "Karnataka"],
  ["Sunrise Fabrics", "Alok Mishra", "Kanpur", "Uttar Pradesh"],
  ["Trident Engineering", "Harpreet Singh", "Chandigarh", "Punjab"],
  ["Ganga Enterprises", "Vinod Tiwari", "Varanasi", "Uttar Pradesh"],
  ["Metro Fresh Mart", "Divya Menon", "Chennai", "Tamil Nadu"],
  ["Zenith Industrial Supplies", "Karan Oberoi", "Faridabad", "Haryana"],
  ["Aravali Minerals", "Sanjay Rathore", "Udaipur", "Rajasthan"],
  ["Blue Ocean Exports", "Fatima Sheikh", "Kochi", "Kerala"],
  ["Silverline Electricals", "Yash Kapoor", "Bhopal", "Madhya Pradesh"],
  ["Green Valley Organics", "Rekha Nambiar", "Mysore", "Karnataka"],
  ["Prime Auto Parts", "Gurpreet Kaur", "Amritsar", "Punjab"],
  ["Continental Packaging", "Imran Qureshi", "Hyderabad", "Telangana"],
  ["Falcon Logistics", "Aditya Rane", "Nashik", "Maharashtra"],
  ["Amber Glassworks", "Sunita Reddy", "Vijayawada", "Andhra Pradesh"],
  ["Ivory Ceramics", "Manish Agarwal", "Morbi", "Gujarat"],
  ["Crescent Foods", "Zoya Ahmed", "Bengaluru", "Karnataka"],
];

const activityTemplates = (company: string, owner: string, createdOn: string, createdTime: string): ActivityItem[] => [
  { id: "act-1", type: "created", description: `Lead created for ${company}`, user: "System", date: createdOn, time: createdTime },
  { id: "act-2", type: "followup-created", description: "Follow-up scheduled", user: owner, date: createdOn, time: createdTime },
  { id: "act-3", type: "whatsapp", description: "WhatsApp message sent", user: owner, date: createdOn, time: createdTime },
];

let seed = 42;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)] as T;
}
function randInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

const dates = [
  "25 May 2025", "24 May 2025", "23 May 2025", "22 May 2025", "21 May 2025",
  "20 May 2025", "19 May 2025", "18 May 2025", "17 May 2025", "16 May 2025",
];
const times = ["09:15 AM", "10:00 AM", "10:30 AM", "11:10 AM", "11:45 AM", "12:30 PM", "02:20 PM", "03:00 PM", "03:40 PM", "04:45 PM", "05:30 PM"];

function seedCaptureMethod(source: LeadSource, i: number): CaptureMethod {
  if (source === "IndiaMART" || source === "TradeIndia") return "api";
  if (source === "Website") return "webhook";
  if (source === "Email") return "email_parser";
  return i % 7 === 0 ? "csv_import" : "manual";
}

function toIso(date: string, time: string): string {
  const d = new Date(`${date} ${time}`);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

function scoreToRating(score: number) {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 55) return 3;
  if (score >= 40) return 2;
  return 1;
}

export const leads: Lead[] = companies.map((entry, i) => {
  const [company, contactPerson, city, state] = entry;
  const source = normalizeLeadSource(pick(seedSources));
  const owner = pick(salesOwners);
  const status = pick(leadStatusList);
  const score = randInt(20, 96);
  const createdOn = dates[i % dates.length] as string;
  const createdTime = times[i % times.length] as string;
  const hasFollowUp = rand() > 0.22;
  const overdue = hasFollowUp && rand() > 0.7;
  const followUpDate = dates[(i + 2) % dates.length] as string;
  const industry = pick(industriesList);
  const budgetLakh = randInt(1, 15);
  const mobile = `98${randInt(10000000, 99999999)}`;

  return {
    id: `L-${8742 - i}`,
    name: company,
    company,
    contactPerson,
    mobile,
    whatsapp: mobile,
    email: `${company.toLowerCase().replace(/[^a-z]+/g, "")}@gmail.com`,
    website: `www.${company.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
    source,
    captureMethod: seedCaptureMethod(source, i),
    owner,
    status,
    rating: scoreToRating(score),
    score,
    industry,
    city,
    state,
    budget: `₹${budgetLakh}–${budgetLakh + 4} Lakh`,
    requirement: "Premium product range — bulk order",
    createdOn,
    createdTime,
    createdAt: toIso(createdOn, createdTime),
    updatedAt: toIso(createdOn, createdTime),
    lastContact: createdOn,
    lastContactTime: createdTime,
    nextFollowUp: hasFollowUp ? followUpDate : null,
    nextFollowUpTime: hasFollowUp ? (times[(i + 3) % times.length] as string) : null,
    followUpOverdueDays: overdue ? randInt(1, 4) : 0,
    tags: rand() > 0.6 ? ["High Value"] : [],
    notes: [
      {
        id: "n-1",
        text: "Interested in our premium product range.",
        by: owner,
        date: createdOn,
        time: createdTime,
      },
      { id: "n-2", text: `Budget: ${`₹${budgetLakh}–${budgetLakh + 4} Lakh`}`, by: owner, date: createdOn, time: createdTime },
      { id: "n-3", text: `Decision Maker: Mr. ${contactPerson.split(" ")[0]}`, by: owner, date: createdOn, time: createdTime },
    ],
    activity: activityTemplates(company, owner, createdOn, createdTime),
    files: [
      { id: "f-1", name: `${company.replace(/\s+/g, "_")}_Quotation.pdf`, type: "PDF", by: owner, date: createdOn },
      { id: "f-2", name: "Product_Catalogue.pdf", type: "PDF", by: "System", date: createdOn },
    ],
    deals:
      status === "Negotiation" || status === "Quotation Sent" || status === "Converted"
        ? [
            {
              id: "d-1",
              title: "Premium Product Order",
              value: `₹${(budgetLakh + 3) * 1}.5 Lakh`,
              stage: status === "Converted" ? "Won" : status,
              closeDate: "30 Jun 2025",
            },
          ]
        : [],
    tasks: [
      {
        id: "t-1",
        title: "Send updated quotation",
        due: followUpDate,
        assignedTo: owner,
        status: rand() > 0.5 ? "Pending" : "Completed",
      },
    ],
    ai: {
      summary: [
        "Lead is actively discussing pricing",
        score > 60 ? "Budget appears suitable" : "Budget fit needs confirmation",
        "Decision maker identified",
        "Follow-up recommended within 24 hours",
      ],
      recommendation: `Call ${contactPerson.split(" ")[0]} tomorrow at 11:00 AM and send the revised quotation after the call.`,
      engagement: Math.min(98, score + randInt(-6, 8)),
      responseRate: Math.min(98, score + randInt(-12, 4)),
      purchaseIntent: Math.min(98, score + randInt(-4, 10)),
      budgetFit: Math.min(98, score + randInt(-15, 2)),
      followUpRisk: Math.max(10, 100 - score + randInt(-10, 10)),
    },
  };
});

export function scoreTier(score: number) {
  if (score >= 80) return { label: "High", className: "text-success", ring: "var(--success)" };
  if (score >= 60) return { label: "Medium", className: "text-info", ring: "var(--info)" };
  if (score >= 40) return { label: "Low", className: "text-warning", ring: "var(--warning)" };
  return { label: "Very Low", className: "text-destructive", ring: "var(--destructive)" };
}
