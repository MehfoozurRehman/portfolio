import {
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Code2,
  Laptop,
  Map,
  MessageCircle,
  MonitorCog,
  Rocket,
  School,
  Smartphone
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type Project = {
  title: string;
  category: string;
  summary: string;
  businessValue: string;
  stack: string[];
  icon: LucideIcon;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export type ProcessStep = {
  title: string;
  text: string;
  icon: LucideIcon;
};

export const profile = {
  name: "Mehfooz-ur-Rehman",
  role: "Full-stack product developer",
  company: "Devscot",
  location: "Samundri, Faisalabad, Punjab, Pakistan",
  email: "mehfoozijaz786@gmail.com",
  phone: "+92 313 7178074",
  whatsapp: "https://wa.me/923137178074",
  github: "https://github.com/MehfoozurRehman",
  linkedin: "https://www.linkedin.com/in/mehfooz-rehman-37a1b0231/",
  instagram: "https://www.instagram.com/mehfoozurrehman___/",
  facebook: "https://www.facebook.com/MehfoozurRehmanIjaz/",
  codesandbox: "https://codesandbox.io/u/MehfoozurRehman",
  headline: "Full-stack product developer building web, mobile, desktop and AI-powered business systems.",
  subheadline:
    "I help businesses turn messy operations into fast, reliable software: dashboards, mobile apps, automation, AI assistants, WhatsApp workflows and complete SaaS products."
} as const;

export const services: Service[] = [
  {
    title: "SaaS and dashboards",
    icon: BriefcaseBusiness,
    description:
      "Admin panels, customer portals, analytics, billing flows and operations software built around real business workflows."
  },
  {
    title: "Mobile apps",
    icon: Smartphone,
    description:
      "React Native and Expo apps for iOS and Android, including EAS builds, TestFlight and Play Console delivery."
  },
  {
    title: "AI automation",
    icon: BrainCircuit,
    description:
      "OpenAI and Gemini powered assistants, summaries, action items, business chat, and workflow automation."
  },
  {
    title: "Desktop tools",
    icon: MonitorCog,
    description:
      "Electron and background utilities that connect local desktop workflows with cloud dashboards."
  }
];

export const projects: Project[] = [
  {
    title: "Schooliee",
    category: "School management platform",
    icon: School,
    summary:
      "A complete school operating system with fees, attendance, exams, parent portal, staff tools, challans, WhatsApp and AI assistant features.",
    businessValue:
      "Helps schools replace scattered spreadsheets and manual follow-ups with one reliable daily workflow.",
    stack: ["Next.js", "Convex", "React Native", "WhatsApp", "AI"]
  },
  {
    title: "Zood Real Estate",
    category: "Real estate admin and public platform",
    icon: Building2,
    summary:
      "Property management, applications, invoices, analytics and Mapbox-based maps for a real estate workflow.",
    businessValue:
      "Gives property teams a cleaner way to manage inventory, customer activity and operational reporting.",
    stack: ["React", "Node.js", "Mapbox", "MongoDB", "Invoices"]
  },
  {
    title: "WhatsApp Business Automation",
    category: "Customer support and lead handling",
    icon: MessageCircle,
    summary:
      "Lead capture, confirmations, AI-assisted replies and business process automation around WhatsApp conversations.",
    businessValue:
      "Designed for businesses in markets where customers already prefer WhatsApp over complex portals.",
    stack: ["Node.js", "OpenAI", "WhatsApp", "Webhooks"]
  },
  {
    title: "Teams AI Meeting Assistant",
    category: "Voice, captions and summaries",
    icon: Bot,
    summary:
      "Meeting join, caption capture, summary and action-item workflows using Microsoft Graph and AI services.",
    businessValue:
      "Turns meetings into structured follow-ups instead of lost context and manual note taking.",
    stack: ["Microsoft Graph", "AI", "Node.js", "Automation"]
  },
  {
    title: "Expo Mobile Apps",
    category: "Cross-platform mobile delivery",
    icon: Smartphone,
    summary:
      "Production mobile apps shipped through Expo, EAS, TestFlight and Google Play Console.",
    businessValue:
      "One codebase with practical native delivery for startups and internal business tools.",
    stack: ["Expo", "React Native", "EAS", "TypeScript"]
  },
  {
    title: "Desktop Automation Tools",
    category: "Electron and background apps",
    icon: Laptop,
    summary:
      "Desktop utilities that run background workflows and connect local machines to web dashboards.",
    businessValue:
      "Useful when the real workflow still depends on a user machine, files, browser sessions or local state.",
    stack: ["Electron", "React", "Node.js", "Dashboards"]
  }
];

export const process: ProcessStep[] = [
  {
    title: "Map the real workflow",
    icon: Map,
    text: "Start with how the business already works, where time is lost, and what customers actually do."
  },
  {
    title: "Ship a useful first version",
    icon: Rocket,
    text: "Prioritize the smallest complete system that can create value, get feedback and prove the direction."
  },
  {
    title: "Make it maintainable",
    icon: Code2,
    text: "Keep the code practical, typed, clean and easy to evolve after the first launch."
  }
];

export const stack = [
  "Next.js",
  "React",
  "TypeScript",
  "React Native",
  "Expo",
  "Convex",
  "Prisma",
  "MongoDB",
  "Electron",
  "Node.js",
  "OpenAI",
  "Gemini",
  "Firebase",
  "Vercel",
  "Mapbox",
  "Microsoft Graph"
] as const;

export const testimonials: Testimonial[] = [
  {
    quote:
      "Mehfooz is very talented and has a great eye for design. He is very professional and always delivers on time.",
    name: "Dayyan Shahid",
    role: "CEO, Dsme Globals"
  },
  {
    quote:
      "I have had the pleasure of working with Mehfooz for over two years, and he has been an indispensable asset to our team.",
    name: "Hammad Habib",
    role: "CEO, Crazybeings Studios"
  },
  {
    quote:
      "Mehfooz was very helpful from beginning to end. He quickly solved one of my React bugs and explained the misunderstanding clearly.",
    name: "blackswanlrn",
    role: "Fiverr client"
  }
];
