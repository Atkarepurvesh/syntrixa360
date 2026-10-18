export const BRAND = {
  name: "Syntrixa360",
  wordmark: "SYNTRIXA360",
  tagline: "AI-Powered Sales Operating System",
};

export const CONTACT = {
  supportEmail: "support@syntrixa360.com",
  helloEmail: "hello@syntrixa360.com",
  phoneDisplay: "+91-9202247126",
  phoneHref: "tel:+919202247126",
} as const;

export const navLinks = [
  { label: "Product", to: "/features" },
  { label: "Solutions", to: "/solutions" },
  { label: "Integrations", to: "/integrations" },
  { label: "Industries", to: "/industries" },
  { label: "Pricing", to: "/pricing" },
] as const;

export const problems = [
  {
    title: "Leads Everywhere",
    description:
      "Leads come from WhatsApp, email, calls and the website — and get scattered across tools.",
    icon: "Share2",
    tone: "violet",
  },
  {
    title: "Follow-ups Get Missed",
    description:
      "Manual follow-ups lead to delays, missed opportunities and lost potential customers.",
    icon: "Clock",
    tone: "success",
  },
  {
    title: "Conversations Are Lost",
    description: "Important customer conversations sit across different apps, inboxes and devices.",
    icon: "MessageSquare",
    tone: "warning",
  },
  {
    title: "No Clear Next Step",
    description: "Sales executives don't know what to do next or which lead to prioritise.",
    icon: "UserRound",
    tone: "brand",
  },
  {
    title: "No Visibility for Managers",
    description: "Managers lack real-time visibility into team activity and pipeline health.",
    icon: "BarChart3",
    tone: "teal",
  },
  {
    title: "Sales Forecasting Is Hard",
    description:
      "Without reliable data, forecasting future sales and planning resources is difficult.",
    icon: "TrendingUp",
    tone: "rose",
  },
] as const;

export const solutionPillars = [
  {
    title: "Capture Every Lead",
    description: "From all channels into one place.",
    icon: "Target",
    tone: "brand",
  },
  {
    title: "Understand Intently",
    description: "AI reads conversations and customer needs.",
    icon: "Brain",
    tone: "success",
  },
  {
    title: "Prioritize What Matters",
    description: "Focus on high-potential opportunities first.",
    icon: "Star",
    tone: "warning",
  },
  {
    title: "Automate Follow-ups",
    description: "Never miss a follow-up opportunity.",
    icon: "Zap",
    tone: "violet",
  },
  {
    title: "Act & Convert",
    description: "Take the right action and close more deals.",
    icon: "CircleCheck",
    tone: "teal",
  },
] as const;

export const flowSteps = [
  {
    step: "1",
    title: "Lead Capture",
    description: "Leads come from website, WhatsApp, email, calls and other sources.",
    icon: "Magnet",
    tone: "brand",
  },
  {
    step: "2",
    title: "Organize & Track",
    description: "Leads are organised, assigned and tracked in one unified system.",
    icon: "Users",
    tone: "success",
  },
  {
    step: "3",
    title: "Conversations",
    description: "Sales conversations happen across channels and are logged automatically.",
    icon: "MessageCircle",
    tone: "warning",
  },
  {
    step: "4",
    title: "AI Understands",
    description: "AI analyses conversations to understand intent, need, priority and context.",
    icon: "Brain",
    tone: "violet",
  },
  {
    step: "5",
    title: "Follow-up & Next Action",
    description: "The system suggests follow-ups and next best actions automatically.",
    icon: "ListChecks",
    tone: "teal",
  },
  {
    step: "6",
    title: "Conversion",
    description: "Take action, close the deal and build long-term customer relationships.",
    icon: "TrendingUp",
    tone: "brand",
  },
  {
    step: "7",
    title: "Repeat Business & Referrals",
    description: "Delight customers, win repeat orders and build long-term relationships.",
    icon: "Users",
    tone: "rose",
  },
] as const;

export const howItWorks = [
  { number: "01", title: "Capture", description: "A lead enters the system from any channel." },
  {
    number: "02",
    title: "Understand",
    description: "Customer and conversation context becomes organised.",
  },
  {
    number: "03",
    title: "Prioritize",
    description: "Important opportunities are identified and ranked.",
  },
  {
    number: "04",
    title: "Follow Up",
    description: "Required follow-ups are identified or suggested.",
  },
  { number: "05", title: "Act", description: "The sales executive receives a clear next action." },
] as const;

export const features = [
  {
    title: "Lead Management",
    description: "Capture leads from all channels and organise them in one centralised system.",
    icon: "UserRound",
    tone: "brand",
  },
  {
    title: "Customer 360° View",
    description: "A complete view of every customer, interaction, history and opportunity.",
    icon: "Users",
    tone: "success",
  },
  {
    title: "Conversation Intelligence",
    description: "Understand conversations and extract important insights automatically.",
    icon: "MessageSquare",
    tone: "violet",
  },
  {
    title: "AI Follow-ups",
    description: "AI identifies follow-up opportunities and suggests when to reach out.",
    icon: "Zap",
    tone: "warning",
  },
  {
    title: "Next Best Action",
    description: "Recommends the right next action for every lead and opportunity.",
    icon: "CircleCheck",
    tone: "brand",
  },
  {
    title: "Sales Pipeline",
    description: "Track every opportunity across stages and move deals forward efficiently.",
    icon: "Filter",
    tone: "rose",
  },
  {
    title: "Sales Executive Workspace",
    description: "A focused daily workspace with priorities, tasks, follow-ups and opportunities.",
    icon: "Briefcase",
    tone: "teal",
  },
  {
    title: "Manager Dashboard",
    description: "Real-time visibility into team activity, performance and pipeline health.",
    icon: "BarChart3",
    tone: "warning",
  },
  {
    title: "Sales Analytics",
    description: "Reports and insights designed to measure performance and improve execution.",
    icon: "PieChart",
    tone: "brand",
  },
  {
    title: "Sales Forecasting",
    description: "Forecast future sales with pipeline insights and historical data trends.",
    icon: "TrendingUp",
    tone: "violet",
  },
] as const;

export const salesExecBenefits = [
  {
    title: "Today's Priorities",
    description: "See your top tasks, follow-ups and high-priority leads for the day.",
    icon: "ListChecks",
    tone: "brand",
  },
  {
    title: "Smart Follow-ups",
    description: "Never miss a follow-up. Get reminders and AI-suggested actions.",
    icon: "Clock",
    tone: "success",
  },
  {
    title: "Customer History",
    description: "View complete conversation history, interactions and opportunities.",
    icon: "Users",
    tone: "violet",
  },
  {
    title: "Next Best Action",
    description: "AI recommends the right next step for every lead and opportunity.",
    icon: "Zap",
    tone: "warning",
  },
  {
    title: "Open Opportunities",
    description: "Track all your opportunities and move deals forward efficiently.",
    icon: "Target",
    tone: "teal",
  },
] as const;

export const managerBenefits = [
  {
    title: "Real-time Sales Visibility",
    description: "See what's happening across your team and pipeline in real time.",
    icon: "BarChart3",
    tone: "violet",
  },
  {
    title: "Track Team Performance",
    description: "Compare executives, monitor activities and measure results.",
    icon: "Users",
    tone: "success",
  },
  {
    title: "Monitor Pipeline Health",
    description: "Know how many opportunities are in each stage and what to focus on.",
    icon: "Filter",
    tone: "warning",
  },
  {
    title: "Forecast & Plan Better",
    description: "Use pipeline data and trends to forecast sales and plan resources.",
    icon: "TrendingUp",
    tone: "rose",
  },
  {
    title: "Take Action Faster",
    description: "Identify bottlenecks, at-risk deals and growth opportunities quickly.",
    icon: "Target",
    tone: "brand",
  },
] as const;

export const managerCapabilities = [
  {
    title: "Real-time Overview",
    description: "A snapshot of your entire sales operation in real time.",
    icon: "Eye",
    tone: "brand",
  },
  {
    title: "Team Accountability",
    description: "Know who is doing what and how every team member is performing.",
    icon: "Users",
    tone: "success",
  },
  {
    title: "Pipeline Intelligence",
    description: "See which deals are on track, at risk or stuck.",
    icon: "PieChart",
    tone: "violet",
  },
  {
    title: "Smart Forecasting",
    description: "Forecast future sales with pipeline data and historical trends.",
    icon: "CalendarDays",
    tone: "warning",
  },
  {
    title: "Data-driven Reports",
    description: "Custom reports and analytics to support better decisions.",
    icon: "Download",
    tone: "teal",
  },
] as const;

export const industries = [
  {
    title: "Wholesale & Distribution",
    description:
      "Manage enquiries, dealers, distributors and repeat orders efficiently — every lead and follow-up in one place.",
    icon: "Package",
    tone: "brand",
    points: [
      "Dealer & distributor management",
      "Repeat order tracking",
      "Enquiry to order conversion",
    ],
  },
  {
    title: "Export & International Trade",
    description:
      "Handle international enquiries, quotations, documentation and follow-ups with complete visibility.",
    icon: "Globe",
    tone: "success",
    points: [
      "International enquiries",
      "Quotation & negotiation tracking",
      "Customer communication history",
    ],
  },
  {
    title: "Manufacturing",
    description:
      "Convert product enquiries into long-term customer relationships and streamline your sales process.",
    icon: "Factory",
    tone: "warning",
    points: [
      "Product enquiry management",
      "Requirement tracking",
      "After-sales & support tracking",
    ],
  },
  {
    title: "Trading Businesses",
    description:
      "Manage multiple product lines, suppliers and customers while keeping every opportunity on track.",
    icon: "ShoppingCart",
    tone: "violet",
    points: [
      "Multi-product management",
      "Supplier & customer tracking",
      "Order & fulfilment tracking",
    ],
  },
] as const;

export const comparison = {
  traditional: [
    "Stores customer data",
    "Manual follow-up",
    "Data-centric",
    "Static reports",
    "Manual next-action decisions",
  ],
  syntrixa: [
    "Captures full sales context",
    "AI-assisted follow-up",
    "Action-centric workflow",
    "Actionable insights",
    "Next-action recommendations",
  ],
} as const;

export const businessImpact = [
  {
    title: "Fewer Missed Opportunities",
    description: "Designed to surface every pending follow-up before it goes cold.",
    icon: "Target",
    tone: "brand",
  },
  {
    title: "Better Follow-up Discipline",
    description: "Helps teams build a consistent daily follow-up rhythm.",
    icon: "Clock",
    tone: "success",
  },
  {
    title: "Faster Sales Execution",
    description: "Can reduce time spent deciding what to do next.",
    icon: "Zap",
    tone: "warning",
  },
  {
    title: "Better Customer Visibility",
    description: "Complete customer context available before every conversation.",
    icon: "Users",
    tone: "violet",
  },
  {
    title: "Stronger Team Accountability",
    description: "Activity and ownership stay visible to managers.",
    icon: "ListChecks",
    tone: "teal",
  },
  {
    title: "Better Sales Planning",
    description: "Pipeline and trend data designed to support planning.",
    icon: "TrendingUp",
    tone: "rose",
  },
] as const;

export const whoItIsFor = [
  "You sell B2B to other businesses",
  "You receive regular enquiries",
  "You have sales executives on the team",
  "Your sales depend on customer follow-ups",
  "You get repeat orders",
  "You manage many customers",
  "You need clear sales visibility",
] as const;

export const trustItems = [
  {
    title: "Role-Based Access",
    description: "Give owners, managers and executives the access level they need.",
    icon: "ShieldCheck",
  },
  {
    title: "User Permissions",
    description: "Control what each user can view, create and edit.",
    icon: "KeyRound",
  },
  {
    title: "Data Protection",
    description: "Encrypted transport and access controls around your sales data.",
    icon: "Lock",
  },
  {
    title: "Activity Tracking",
    description: "Track user activity for internal accountability.",
    icon: "Activity",
  },
  {
    title: "Secure Infrastructure",
    description: "Hosted on managed cloud infrastructure with regular backups.",
    icon: "Server",
  },
] as const;

export const faqs = [
  {
    question: "What is Syntrixa360?",
    answer:
      "Syntrixa360 is an AI-powered Sales Operating System for B2B businesses. It brings leads, customer conversations, follow-ups and next actions into one workflow so your team knows exactly what to do next.",
  },
  {
    question: "Is Syntrixa360 a CRM?",
    answer:
      "It includes CRM capabilities such as lead and customer management, but it is designed around sales execution — prioritising work, driving follow-ups and recommending next actions rather than only storing records.",
  },
  {
    question: "Who is Syntrixa360 for?",
    answer:
      "B2B companies with regular enquiries, active follow-ups and repeat orders: wholesale and distribution, export and international trade, manufacturing and trading businesses.",
  },
  {
    question: "What does the Sales Executive get?",
    answer:
      "A focused daily workspace showing today's priorities, follow-ups due, high-priority leads, customer history, open opportunities and AI-suggested next actions.",
  },
  {
    question: "What can Owners and Managers see?",
    answer:
      "A real-time overview of leads, opportunities, follow-ups, conversions, pipeline stages, lead sources, team performance and sales trends.",
  },
  {
    question: "How does AI follow-up work?",
    answer:
      "Syntrixa360 reviews conversation and activity context to identify pending follow-ups, then suggests timing and the type of follow-up. Your team stays in control of what is sent.",
  },
  {
    question: "What is Next Best Action?",
    answer:
      "A recommendation for the single most useful next step on a lead or opportunity — for example calling a customer, sending a catalogue or scheduling a demo.",
  },
  {
    question: "Can Syntrixa360 integrate with existing systems?",
    answer:
      "Integration options depend on your setup and are discussed during the demo. We can review your current tools and confirm what is possible for your business.",
  },
  {
    question: "Is a demo available?",
    answer:
      "Yes. Request a demo and our team will walk you through Syntrixa360 using examples relevant to your industry.",
  },
  {
    question: "How can I get support?",
    answer:
      "Start with the Help Center, Getting Started guide, feature guides and troubleshooting articles. If you still need help, use Contact Support to reach our team.",
  },
] as const;

export const trustedCompanies = [
  "Global Distributors",
  "Paras Industries",
  "Shreeji Import Export",
  "Nexgen Trading Co.",
  "Vardhman Enterprises",
  "Oceanic Exports",
] as const;

export const pricingPlans = [
  {
    name: "Starter Growth",
    price: "₹4,999 / month",
    description: "Essential CRM for small pharma wholesalers and growing B2B sales teams.",
    features: [
      "Up to 3 users",
      "Up to 1,000 active leads and 1,000 customers",
      "Lead and customer management",
      "Sales pipeline and activity timeline",
      "Follow-up tasks and reminders",
      "Quotation management and payment tracking",
      "Basic sales dashboard and CSV/Excel import",
      "500 AI credits/month: lead summaries and follow-up suggestions",
      "Annual billing: ₹49,990/year",
    ],
    highlighted: false,
  },
  {
    name: "Business Pro",
    price: "₹7,999 / month",
    description: "For growing distributor teams that need automation, team visibility and connected workflows.",
    features: [
      "Up to 8 users",
      "Up to 5,000 active leads and 5,000 customers",
      "Everything in Starter Growth",
      "Advanced sales pipeline and follow-up automation rules",
      "AI reply suggestions and customer 360° history",
      "Quotation-to-order workflow",
      "Invoice and payment management",
      "Team performance analytics",
      "Gmail integration, subject to connection and permissions",
      "1,500 AI credits/month and up to 15 automation rules",
      "Annual billing: ₹79,990/year",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise Intelligence",
    price: "₹11,999 / month",
    description: "Advanced sales intelligence and controls for established distributors and multi-team operations.",
    features: [
      "Up to 15 users",
      "Up to 15,000 active leads and 15,000 customers",
      "Everything in Business Pro",
      "Advanced AI Sales Copilot and lead scoring",
      "Deal risk alerts and smart follow-up timing",
      "Repeat-order signals and sales forecasting",
      "Advanced reports and data export",
      "Approval workflows, role-based permissions and audit history",
      "Order, invoice and payment insights",
      "4,000 AI credits/month and up to 40 automation rules",
      "Priority support",
      "Annual billing: ₹1,19,990/year",
    ],
    highlighted: false,
  },
] as const;

export const helpCategories = [
  "Getting Started",
  "Account Setup",
  "Lead Management",
  "Customer Management",
  "Conversations",
  "Follow-ups",
  "Sales Dashboard",
  "Analytics",
  "User Management",
] as const;

export const helpArticles = [
  { title: "Creating your first lead", category: "Lead Management", minutes: 3 },
  { title: "Inviting team members and setting roles", category: "User Management", minutes: 4 },
  { title: "Setting up your company profile", category: "Account Setup", minutes: 3 },
  { title: "Logging a customer conversation", category: "Conversations", minutes: 2 },
  { title: "Understanding follow-up priorities", category: "Follow-ups", minutes: 5 },
  { title: "Reading the sales pipeline funnel", category: "Sales Dashboard", minutes: 4 },
  { title: "Importing leads from a spreadsheet", category: "Lead Management", minutes: 6 },
  { title: "Using Customer 360° view", category: "Customer Management", minutes: 4 },
  { title: "Exporting analytics reports", category: "Analytics", minutes: 3 },
] as const;

export const gettingStartedSteps = [
  {
    title: "Create Account",
    description: "Sign up and verify your work email to open your workspace.",
  },
  {
    title: "Set Up Company",
    description: "Add company details, branding basics and sales preferences.",
  },
  {
    title: "Add Team Members",
    description: "Invite managers and sales executives, then assign roles.",
  },
  {
    title: "Configure Sales Process",
    description: "Define pipeline stages, lead sources and follow-up rules.",
  },
  {
    title: "Add / Import Leads",
    description: "Create leads manually or import your existing lead list.",
  },
  {
    title: "Start Managing Sales",
    description: "Work daily priorities, follow-ups and next actions.",
  },
] as const;

export const featureGuides = [
  {
    title: "Lead Management Guide",
    description: "Capture, assign, qualify and convert leads end to end.",
    icon: "UserRound",
    tone: "brand",
  },
  {
    title: "Customer 360 Guide",
    description: "Read customer history, interactions and open opportunities.",
    icon: "Users",
    tone: "success",
  },
  {
    title: "Conversation Guide",
    description: "Log conversations and use extracted insights.",
    icon: "MessageSquare",
    tone: "violet",
  },
  {
    title: "Follow-up Guide",
    description: "Set up reminders, priorities and follow-up workflows.",
    icon: "Clock",
    tone: "warning",
  },
  {
    title: "Next Best Action Guide",
    description: "Understand how recommendations are generated and used.",
    icon: "Zap",
    tone: "teal",
  },
  {
    title: "Analytics Guide",
    description: "Build reports and read pipeline, source and trend data.",
    icon: "PieChart",
    tone: "rose",
  },
] as const;

export const videoTutorials = [
  { title: "How to Create a Lead", duration: "4:12" },
  { title: "How to Manage Follow-ups", duration: "5:38" },
  { title: "How Customer 360 Works", duration: "3:47" },
  { title: "How AI Recommendations Work", duration: "6:05" },
  { title: "How to Use the Sales Executive Dashboard", duration: "7:21" },
  { title: "How to Use the Owner Dashboard", duration: "6:44" },
] as const;

export const troubleshooting = [
  {
    title: "Login Issue",
    description: "Can't sign in, password reset not received, session expiring.",
    icon: "KeyRound",
    tone: "brand",
  },
  {
    title: "Data Issue",
    description: "Missing leads, duplicate customers or import errors.",
    icon: "Database",
    tone: "warning",
  },
  {
    title: "User Access",
    description: "Roles, permissions and users unable to view a module.",
    icon: "ShieldCheck",
    tone: "success",
  },
  {
    title: "Follow-up Issue",
    description: "Reminders not appearing or follow-ups showing incorrectly.",
    icon: "Clock",
    tone: "violet",
  },
  {
    title: "Integration Issue",
    description: "Connected tools not syncing as expected.",
    icon: "Plug",
    tone: "teal",
  },
  {
    title: "Dashboard Issue",
    description: "Charts not loading or numbers looking incorrect.",
    icon: "BarChart3",
    tone: "rose",
  },
] as const;

export const audiences = [
  {
    title: "B2B Businesses",
    description: "Businesses that sell products or services to other businesses.",
    icon: "Building2",
    tone: "brand",
    points: [
      "Manage leads from multiple sources",
      "Track conversations in one place",
      "Improve follow-ups and conversions",
      "Build long-term customer relationships",
    ],
  },
  {
    title: "Sales Teams",
    description: "Sales teams that want to be more productive and effective.",
    icon: "UsersRound",
    tone: "success",
    points: [
      "Know what to do next",
      "Never miss an important follow-up",
      "Prioritize high-potential leads",
      "Close more deals, faster",
    ],
  },
  {
    title: "Wholesale & Distribution",
    description:
      "Distributors and wholesalers dealing with large product catalogs and repeat orders.",
    icon: "Package",
    tone: "violet",
    points: [
      "Track repeat orders and patterns",
      "Manage dealers & distributors",
      "Improve order fulfillment",
      "Increase customer retention",
    ],
  },
  {
    title: "Export & International Trade",
    description: "Exporters and importers managing global inquiries and deals.",
    icon: "Globe2",
    tone: "warning",
    points: [
      "Manage international leads",
      "Track deal status across countries",
      "Stay on top of documentation",
      "Build global customer trust",
    ],
  },
  {
    title: "Manufacturing Companies",
    description: "Manufacturers selling to dealers, distributors or end customers.",
    icon: "Factory",
    tone: "teal",
    points: [
      "Handle complex sales cycles",
      "Share product & price information",
      "Track quotations and orders",
      "Improve on-time delivery & service",
    ],
  },
  {
    title: "Trading Businesses",
    description: "Trading companies dealing in multiple products and markets.",
    icon: "ShoppingCart",
    tone: "warning",
    points: [
      "Manage multiple suppliers & buyers",
      "Track stock & deals efficiently",
      "Automate follow-ups",
      "Increase repeat business",
    ],
  },
  {
    title: "Businesses with Repeat Orders",
    description: "Businesses with existing customers and recurring business.",
    icon: "RefreshCw",
    tone: "rose",
    points: [
      "Never miss a repeat order",
      "Set reminders for re-order cycles",
      "Improve customer satisfaction",
      "Grow long-term relationships",
    ],
  },
  {
    title: "Businesses Dependent on Follow-ups",
    description: "Businesses where follow-ups are key to closing deals.",
    icon: "Clock3",
    tone: "brand",
    points: [
      "Automate follow-ups",
      "Get reminded at the right time",
      "Keep conversations warm",
      "Close more with consistency",
    ],
  },
] as const;

export const heroKpis = [
  { label: "Total Leads", value: "2,453", delta: "+12.5%" },
  { label: "Active Opportunities", value: "861", delta: "+8.2%" },
  { label: "Follow-ups Due", value: "256", delta: "+5.4%" },
  { label: "Conversions", value: "128", delta: "+15.7%" },
] as const;

export const ownerKpis = [
  { label: "Total Leads", value: "3,265", delta: "+18.6%" },
  { label: "Active Opportunities", value: "1,289", delta: "+14.3%" },
  { label: "Follow-ups Due", value: "412", delta: "+8.7%" },
  { label: "Conversions", value: "186", delta: "+21.4%" },
  { label: "Revenue (Expected)", value: "₹2.48 Cr", delta: "+16.8%" },
] as const;

export const execKpis = [
  { label: "Today's Tasks", value: "12", note: "Pending" },
  { label: "Follow-ups Due", value: "8", note: "Due Today" },
  { label: "High Priority Leads", value: "7", note: "Needs Attention" },
  { label: "Open Opportunities", value: "15", note: "Active" },
] as const;

export const pipelineStages = [
  { label: "New Lead", value: 1289, tone: "brand" },
  { label: "Contacted", value: 856, tone: "teal" },
  { label: "Qualified", value: 428, tone: "success" },
  { label: "Proposal", value: 214, tone: "warning" },
  { label: "Negotiation", value: 142, tone: "violet" },
  { label: "Won", value: 186, tone: "rose" },
] as const;

export const leadSources = [
  { label: "Website", value: 1025, tone: "brand" },
  { label: "WhatsApp", value: 876, tone: "teal" },
  { label: "Email", value: 612, tone: "success" },
  { label: "Referral", value: 428, tone: "violet" },
  { label: "Call", value: 324, tone: "rose" },
] as const;

export const teamPerformance = [
  { name: "Rahul Sharma", leads: 642, followups: 128, conversions: 14, rate: "22.6%" },
  { name: "Neha Verma", leads: 512, followups: 98, conversions: 12, rate: "24.0%" },
  { name: "Amit Kumar", leads: 478, followups: 86, conversions: 10, rate: "23.3%" },
  { name: "Pooja Singh", leads: 421, followups: 74, conversions: 8, rate: "20.5%" },
] as const;

export const execFollowups = [
  {
    name: "Acme Industries Pvt. Ltd.",
    note: "Follow-up for Quotation",
    when: "Today, 11:00 AM",
    priority: "High",
  },
  {
    name: "Global Traders",
    note: "Product Demo Follow-up",
    when: "Today, 3:00 PM",
    priority: "Medium",
  },
  {
    name: "Bright Star Exports",
    note: "Price Discussion",
    when: "Tomorrow, 10:30 AM",
    priority: "Low",
  },
] as const;

export const nextBestActions = [
  { title: "Call Acme Industries", note: "Customer requested revised quotation.", action: "Call" },
  {
    title: "Send Catalog to Global Traders",
    note: "They showed interest in new products.",
    action: "Send",
  },
  {
    title: "Schedule Demo with Bright Star Exports",
    note: "Follow-up pending for demo.",
    action: "Schedule",
  },
] as const;

export const productTabs = [
  {
    label: "Owner Dashboard",
    description:
      "Complete visibility into leads, pipeline, team performance and expected revenue in one screen.",
  },
  {
    label: "Sales Executive Dashboard",
    description:
      "A focused daily workspace with priorities, follow-ups and AI-suggested next actions.",
  },
  {
    label: "Lead Management",
    description: "Capture, assign and track every lead from first contact to conversion.",
  },
  {
    label: "Customer 360°",
    description: "A single view of every customer's history, conversations and open opportunities.",
  },
  {
    label: "Conversations",
    description: "Sales conversations logged automatically across calls, chats and emails.",
  },
  {
    label: "Follow-ups",
    description: "Never miss a follow-up — reminders, priorities and suggested timing.",
  },
  {
    label: "Analytics",
    description: "Reports and insights that turn sales activity into planning decisions.",
  },
] as const;
