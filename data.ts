import {
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Code2,
  Laptop,
  Layers,
  Map,
  MessageCircle,
  MonitorCog,
  MousePointerClick,
  Rocket,
  School,
  Smartphone,
  Sparkles,
  Store,
  UsersRound,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

export type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type Project = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  businessValue: string;
  stack: string[];
  icon: LucideIcon;
  url?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  problem: string;
  approach: string;
  outcome: string;
  responsibilities: string[];
  highlights: string[];
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

export type Experience = {
  role: string;
  company: string;
  period: string;
  location: string;
  summary: string;
  skills: string[];
};

export type Education = {
  school: string;
  degree: string;
  period: string;
  focus: string[];
};

export const profile = {
  name: 'Mehfooz-ur-Rehman',
  role: 'Full-Stack Product Engineer & Founder',
  company: 'Devscot',
  location: 'Faisalabad / Samundri, Punjab, Pakistan',
  email: 'mehfoozijaz786@gmail.com',
  phone: '+92 313 7178074',
  whatsapp: 'https://wa.me/923137178074',
  github: 'https://github.com/MehfoozurRehman',
  linkedin: 'https://www.linkedin.com/in/mehfooz-rehman-37a1b0231/',
  instagram: 'https://www.instagram.com/mehfoozurrehman___/',
  facebook: 'https://www.facebook.com/MehfoozurRehmanIjaz/',
  codesandbox: 'https://codesandbox.io/u/MehfoozurRehman',
  headline: 'Full-Stack Product Engineer with 6+ years shipping Web, Mobile, Desktop, AI and conversational business engines.',
  subheadline: 'Creator of Karobari — enabling Pakistani merchants and local businesses to create an automated digital store and manage multi-channel commerce with nothing but WhatsApp voice notes and text in Urdu or English.',
  about:
    'With over 6 years of hands-on engineering inside software houses and fast-moving product teams, I bridge deep technical execution with real commercial empathy. Having built enterprise ERPs, cross-platform mobile apps, 3D geospatial platforms, and real-time AI tools, I am now focused on solving the fundamental commerce bottleneck for Pakistani businesses: giving any physical store an automated digital identity and selling engine operated entirely through WhatsApp.',
} as const;

export const services: Service[] = [
  {
    title: 'Conversational Commerce & WhatsApp AI',
    icon: MessageCircle,
    description: 'AI agents, automated storefront generators, billing engines, and inventory managers driven purely by WhatsApp voice and text in Urdu and English.',
  },
  {
    title: 'Full-Stack SaaS & Operations ERPs',
    icon: BriefcaseBusiness,
    description: 'Scalable multi-tenant cloud platforms, real-time reactive databases (Convex), billing pipelines, and executive dashboards built for daily high-concurrency usage.',
  },
  {
    title: 'Cross-Platform Mobile Applications',
    icon: Smartphone,
    description: 'Production React Native and Expo applications with offline caching, hardware integrations (BLE, GPS, Cameras), and verified store distribution on iOS and Android.',
  },
  {
    title: 'Desktop Automation & Native Workstations',
    icon: MonitorCog,
    description: 'Electron and desktop utilities bridging local operating systems, hardware peripherals, WhatsApp automation engines, and cloud control panels.',
  },
];

export const projects: Project[] = [
  {
    slug: 'karobari',
    title: 'Karobari: WhatsApp-First AI Commerce Platform',
    category: 'Founder & Product Lead · Conversational AI Commerce',
    icon: Store,
    url: 'https://github.com/MehfoozurRehman/karobari',
    heroImageUrl: '/cover-whatsapp.svg',
    summary: 'An automated digital identity and e-commerce engine enabling local businesses to launch online stores, manage inventory, and fulfill orders entirely through WhatsApp voice and text.',
    businessValue: 'Removes the digital divide for millions of physical merchants in emerging markets by turning the app they already use daily into a full-scale digital commerce operating system.',
    stack: ['Next.js 16', 'React 19', 'Convex', 'OpenAI Agents', 'WhatsApp Cloud API', 'Clerk Auth', 'Tailwind CSS v4'],
    problem: 'Traditional e-commerce platforms and complex admin panels are too intimidating and friction-heavy for local shop owners, who rely solely on WhatsApp and phone calls to do business.',
    approach: 'Engineered an AI conversational ingestion pipeline where merchants can speak or text product details in Urdu/English over WhatsApp to automatically generate live web stores, track inventory decrements, and send customer order receipts.',
    outcome: 'Enables any retail merchant or wholesaler to go from a physical shop to an active digital selling engine in less than 2 minutes without writing a single line of data manually.',
    responsibilities: ['Product architecture', 'Conversational AI pipeline', 'Convex real-time schemas', 'WhatsApp webhook infrastructure', 'Merchant UX'],
    highlights: ['WhatsApp Voice Ingestion', 'Urdu/English AI Understanding', 'Instant Storefront Generation', 'Order & Inventory Automation'],
  },
  {
    slug: 'schooliee',
    title: 'Schooliee: Multi-School ERP & Parent Communication',
    category: 'Cloud SaaS & Mobile Ecosystem',
    icon: School,
    url: 'https://github.com/MehfoozurRehman/schooliee',
    heroImageUrl: '/schooliee-hero.webp',
    summary: 'A cloud school management ecosystem with role-based web portals, native mobile apps, background SMS relays, and automated WhatsApp parent notifications.',
    businessValue: 'Replaces fragmented paper registers and spreadsheets with a single connected platform for fee challans, student attendance, exams, and family engagement.',
    stack: ['Turborepo', 'Next.js', 'React Native', 'Expo', 'Convex', 'Prisma', 'WhatsApp API'],
    problem: 'Schools struggled with manual fee collection, delayed parent updates, and disjointed systems for student academic records and attendance.',
    approach: 'Architected a monorepo housing the admin dashboard, mobile apps for teachers/parents, and microservices for automated WhatsApp and SIM SMS notifications.',
    outcome: 'Successfully automated daily attendance broadcasts, computerized fee challan generation, and synchronized teacher grading directly into parent mobile feeds.',
    responsibilities: ['Full-stack monorepo engineering', 'Parent & staff workflows', 'WhatsApp desktop messaging engine', 'Mobile app delivery'],
    highlights: ['Multi-tenant school ERP', 'Automated Fee Challans', 'WhatsApp & SMS Gateways', 'Parent & Teacher Apps'],
  },
  {
    slug: 'dsme-globals',
    title: 'DSME Globals: Software Engineering & Enterprise Services',
    category: 'Enterprise Digital Platform',
    icon: Building2,
    url: 'https://dsmeglobal.web.app',
    logoUrl: '/dsme-logo-transparent.webp',
    heroImageUrl: '/dsme-hero.webp',
    summary: 'The digital engineering showcase and product consulting portal for DSME Globals, presenting enterprise client case studies and full-stack solutions.',
    businessValue: 'Delivers a high-conversion client acquisition channel and establishes credible technical authority for international enterprise software contracts.',
    stack: ['React 18', 'Vite', 'SCSS', 'Firebase Hosting', 'UI/UX Design'],
    problem: 'The engineering firm needed a high-performance, polished digital presence to represent its cross-platform product delivery capabilities to global clients.',
    approach: 'Designed a fast, accessible web portal highlighting past architectures, service roadmaps, and instant consultation intake flows.',
    outcome: 'Served as the core digital portal securing international software contracts across logistics, healthcare, and retail sectors.',
    responsibilities: ['Information architecture', 'Frontend performance optimization', 'Service positioning', 'Responsive UI engineering'],
    highlights: ['Corporate Engineering Brand', 'Service Architecture Clarity', 'High-Performance SPA', 'Global Client Acquisition'],
  },
  {
    slug: 'leadprofit',
    title: 'LeadProfit: Amazon Marketplace Arbitrage & Analytics',
    category: 'E-Commerce Intelligence & Data Modeling',
    icon: MessageCircle,
    url: 'https://www.leadprofit.com',
    heroImageUrl: '/leadprofit-hero.webp',
    summary: 'An Amazon seller intelligence suite focusing on live repricing algorithms, inventory tracking, order analytics, and profit margin visibility.',
    businessValue: 'Gives multi-channel Amazon merchants real-time margin visibility and dynamic repricing controls to prevent inventory dead-stock and protect ROI.',
    stack: ['React.js', 'Node.js', 'Amazon SP-API', 'OpenAPI / Swagger', 'Analytics Data Models'],
    problem: 'High-volume marketplace sellers often suffer margin erosion due to unmonitored supplier price fluctuations and manual buy-box tracking.',
    approach: 'Constructed real-time analytical dashboards and OpenAPI-documented REST APIs pulling live Amazon SP-API inventory and sales metrics.',
    outcome: 'Gave sellers a unified command center to execute instant repricing strategies and track profit metrics without manual calculations.',
    responsibilities: ['Marketplace data modeling', 'Dashboard UI architecture', 'Swagger API documentation', 'Repricing workflows'],
    highlights: ['Live Margin Analytics', 'Amazon SP-API Integration', 'Interactive Swagger UI', 'Inventory Health Monitoring'],
  },
  {
    slug: 'whatsapp-business-automation',
    title: 'Native WhatsApp Automation & Messaging Gateway',
    category: 'Microservices & Desktop Infrastructure',
    icon: MessageCircle,
    heroImageUrl: '/cover-whatsapp.svg',
    summary: 'High-throughput desktop and headless microservice gateways for automated WhatsApp messaging, lead qualification, and customer engagement.',
    businessValue: 'Enables high-volume transactional messaging and conversational bots without exorbitant third-party per-message API overhead.',
    stack: ['Electron', 'Hono', 'TypeScript', 'Puppeteer', 'Webhooks', 'Docker'],
    problem: 'Businesses needed reliable mass notifications and conversational workflows without being locked into rigid, costly cloud messaging providers.',
    approach: 'Engineered both an Electron desktop client (`schooliee-whatsapp`) and a containerized headless engine (`schooliee-wbm`) with Puppeteer session persistence.',
    outcome: 'Processes thousands of automated daily fee receipts, event reminders, and customer confirmations reliably with instant delivery.',
    responsibilities: ['Headless browser automation', 'Electron desktop wrapper', 'Webhook queueing', 'Session management'],
    highlights: ['Desktop & Docker Engine', 'Puppeteer Session Persistence', 'Bulk Delivery Queues', 'Instant Webhook Triggers'],
  },
  {
    slug: 'expo-mobile-apps',
    title: 'Cross-Platform Mobile Ecosystems & Native Modules',
    category: 'React Native & Native Mobile Engineering',
    icon: Smartphone,
    heroImageUrl: '/cover-expo.svg',
    summary: 'Suite of production iOS and Android mobile apps spanning logistics driver dispatchers, on-demand food delivery, BLE hardware monitors, and health coaching.',
    businessValue: 'Maximizes development speed and code reuse across mobile platforms while retaining 60fps native performance and native device access.',
    stack: ['React Native', 'Expo', 'EAS', 'TypeScript', 'BLE', 'Google Maps', 'HealthKit'],
    problem: 'Building separate native Swift and Kotlin applications slowed down time-to-market and increased ongoing maintenance costs.',
    approach: 'Leveraged unified React Native architectures with custom native modules (e.g. `expo-quick-actions`), native gesture handling, and EAS cloud build pipelines.',
    outcome: 'Shipped over 10+ distinct mobile apps to the App Store and Google Play covering complex GPS routing, biometric sync, and hardware scanning.',
    responsibilities: ['Mobile system architecture', 'Store submission (EAS/TestFlight)', 'Native hardware integrations', 'State & performance optimization'],
    highlights: ['Production EAS Pipelines', 'Bluetooth Low Energy (BLE)', 'Live Geolocation Maps', 'Custom Native Expo Plugins'],
  },
];

export const process: ProcessStep[] = [
  {
    title: '1. Deconstruct the Real Workflow',
    icon: Map,
    text: 'Start with how real people and merchants already work. Identify where time is wasted, how customers communicate (e.g., WhatsApp voice notes), and what data matters.',
  },
  {
    title: '2. Rapid High-Leverage MVP',
    icon: Rocket,
    text: 'Ship the smallest, complete system that creates immediate commercial value, tests market adoption, and solves the core bottleneck without feature bloat.',
  },
  {
    title: '3. Hardened, Maintainable Scale',
    icon: Code2,
    text: 'Build with type safety, clean schemas, reactive real-time backends (Convex/Prisma), and automated messaging pipelines ready to handle daily production scale.',
  },
];

export const profileHighlights = [
  {
    title: '6+ Years Software House Rigor',
    text: 'Extensive track record building and shipping high-stakes client and company software across web, mobile, desktop, and cloud.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Conversational AI & Product Founder',
    text: 'Creator of Karobari — pioneering zero-friction WhatsApp commerce for emerging market businesses through voice and AI.',
    icon: Sparkles,
  },
  {
    title: 'Full-Spectrum Technical Range',
    text: 'Fluently architecting across React 19, Next.js 16, Convex, React Native, Electron, Docker, and LLM agent orchestration.',
    icon: Code2,
  },
  {
    title: 'Commercial & Operational Empathy',
    text: 'Focuses on the bottom-line: fee collections, revenue dashboards, checkout conversions, and frictionless user adoption.',
    icon: MousePointerClick,
  },
];

export const experience: Experience[] = [
  {
    role: 'Founder & Lead Architect',
    company: 'Karobari',
    period: '2025 - Present',
    location: 'Pakistan · Remote',
    summary: 'Spearheading the AI business operating system that empowers Pakistani merchants to create digital stores, track inventory, and sell online exclusively through WhatsApp voice notes and text.',
    skills: ['Next.js 16', 'React 19', 'Convex', 'OpenAI Agents', 'WhatsApp Cloud API', 'Product Leadership'],
  },
  {
    role: 'Lead Full-Stack Product Developer',
    company: 'Devscot',
    period: 'Dec 2020 - Present (4+ Years)',
    location: 'Samundri / Faisalabad, Pakistan · Hybrid',
    summary: 'Leading full-stack engineering and product architecture across flagship SaaS platforms, mobile apps, and custom client software. Designed multi-tenant backends, real-time dashboards, and automation engines used daily by enterprise clients.',
    skills: ['Next.js', 'React.js', 'React Native', 'Node.js', 'Product Strategy', 'System Architecture'],
  },
  {
    role: 'Full-Stack Developer',
    company: 'Schooliee - School Management Cloud Ecosystem',
    period: 'Mar 2024 - Present',
    location: 'Pakistan · Hybrid',
    summary: 'Architected and built the comprehensive Schooliee SaaS ecosystem, featuring web administration portals, teacher/parent mobile apps, automated fee challan billing, and native WhatsApp messaging gateways.',
    skills: ['Next.js', 'React Native', 'Expo', 'Convex', 'Prisma', 'WhatsApp Automation'],
  },
  {
    role: 'Full-Stack Developer',
    company: 'LeadProfit',
    period: 'Mar 2023 - Feb 2024',
    location: 'Samundri, Pakistan · On-site',
    summary: 'Engineered high-throughput Amazon marketplace analytical dashboards, Swagger API specifications, and inventory monitoring modules for international e-commerce sellers.',
    skills: ['React.js', 'Node.js', 'OpenAPI/Swagger', 'Data Visualizations', 'Amazon SP-API'],
  },
  {
    role: 'Full-Stack Developer',
    company: 'CrazyBeings Studios (Pvt) Ltd.',
    period: 'Dec 2020 - Mar 2023 (2+ Years)',
    location: 'Faisalabad, Pakistan · Hybrid',
    summary: 'Delivered customer-facing SaaS products, digital identity platforms, and mobile apps for international startups and retail businesses needing custom software solutions.',
    skills: ['MERN Stack', 'Express.js', 'React Native', 'MongoDB', 'Cloud Architecture'],
  },
];

export const education: Education[] = [
  {
    school: 'Virtual University of Pakistan',
    degree: "Bachelor of Science in Computer Science (BSCS)",
    period: 'Apr 2019 - Jul 2023',
    focus: ['Distributed Systems', 'Software Engineering', 'Database Management', 'Computer Networks'],
  },
];

export const stack = [
  'Karobari Engine',
  'Next.js 16',
  'React 19',
  'TypeScript',
  'React Native',
  'Expo',
  'Convex (Real-Time)',
  'OpenAI Agents',
  'WhatsApp Cloud API',
  'Tailwind CSS v4',
  'Prisma ORM',
  'MongoDB',
  'PostgreSQL',
  'Node.js / Express / Hono',
  'Electron',
  'Docker',
  'Mapbox GL / Three.js',
] as const;

export const testimonials: Testimonial[] = [
  {
    quote: 'Mehfooz is a top-tier product engineer with an exceptional eye for design and performance. He turns complex business challenges into seamless, reliable software that scales.',
    name: 'Dayyan Shahid',
    role: 'CEO, Dsme Globals',
  },
  {
    quote: 'Having worked with Mehfooz for years across major client products, his ability to execute from scratch across Web, Mobile, and Backend at lightning speed is unmatched.',
    name: 'Hammad Habib',
    role: 'CEO, Devscot',
  },
  {
    quote: 'Mehfooz was instrumental from start to finish. He diagnosed complex architecture bottlenecks instantly and delivered our product ahead of schedule.',
    name: 'Verified Client',
    role: 'Enterprise Software Partner',
  },
];
