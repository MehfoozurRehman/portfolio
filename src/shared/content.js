// Single source of truth for every concept. Copied from D:\Projects\portfolio (src/data.ts and src/pages/index.astro),
// with the corrected LinkedIn address. Images are imported so Vite fingerprints and bundles them.
import portrait from './images/portrait.webp';
import schoolieeHero from './images/schooliee-hero.webp';
import dsmeHero from './images/dsme-hero.webp';
import dsmeLogo from './images/dsme-logo-transparent.webp';
import leadprofitHero from './images/leadprofit-hero.webp';
import leadprofitLogo from './images/logo-leadprofit.png';
import githubLogo from './images/logo-github.png';
import coverExpo from './images/cover-expo.svg';
import coverWhatsapp from './images/cover-whatsapp.svg';
import coverKarobari from './images/cover-karobari.svg';

export const images = { portrait };

export const profile = {
  name: 'Mehfooz-ur-Rehman',
  shortName: 'Mehfooz',
  role: 'Lead Full-Stack Product Engineer',
  company: 'Devscot',
  location: 'Faisalabad / Samundri, Punjab, Pakistan',
  locationShort: 'Faisalabad, PK',
  email: 'mehfoozijaz786@gmail.com',
  phone: '+92 313 7178074',
  whatsapp: 'https://wa.me/923137178074',
  availability: 'Available for product builds',
  portrait,
};

// Hero copy from the live site.
export const hero = {
  headline: ['Products built', 'from idea to launch.'],
  accentWord: 'idea',
  intro: "I'm Mehfooz-ur-Rehman, a full-stack product developer shipping web, mobile, desktop, AI and automation systems that businesses rely on every day.",
  primaryCta: { label: "Let's build", href: '#contact' },
  secondaryCta: { label: 'See the work', href: '#work' },
  stats: [
    { value: '6+', label: 'Years shipping' },
    { value: '400+', label: 'Projects built' },
    { value: 'Devscot', label: 'Currently at' },
  ],
  tags: ['Web', 'Mobile', 'AI'],
  stackLine: 'Next · Convex · AI',
};

export const socials = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mehfoozurrehman786/' },
  { label: 'GitHub', href: 'https://github.com/MehfoozurRehman' },
  { label: 'Instagram', href: 'https://www.instagram.com/mehfoozurrehman___/' },
  { label: 'Facebook', href: 'https://www.facebook.com/MehfoozurRehmanIjaz/' },
  { label: 'CodeSandbox', href: 'https://codesandbox.io/u/MehfoozurRehman' },
];

export const about = {
  heading: 'A product developer with real, practical range.',
  body: [
    'With over 6 years of hands-on engineering experience, I lead full-stack product development at Devscot, architecting production web, mobile, and real-time cloud systems. I combine deep technical execution with high-velocity product delivery, specializing in scalable enterprise SaaS, cross-platform apps, real-time reactive databases (Convex), and automation infrastructure.',
    'Leading product engineering at Devscot, architecting high-concurrency SaaS platforms, real-time reactive systems, cross-platform mobile apps, and enterprise client software.',
  ],
  highlights: [
    { title: '6+ Years Software House Rigor', text: 'Extensive track record building and shipping high-stakes client and company software across web, mobile, desktop, and cloud.' },
    { title: 'Conversational AI & Product Founder', text: 'Creator of Karobari, pioneering zero-friction WhatsApp commerce for emerging market businesses through voice and AI.' },
    { title: 'Full-Spectrum Technical Range', text: 'Fluently architecting across React 19, Next.js 16, Convex, React Native, Electron, Docker, and LLM agent orchestration.' },
    { title: 'Commercial & Operational Empathy', text: 'Focuses on the bottom line: fee collections, revenue dashboards, checkout conversions, and frictionless user adoption.' },
  ],
};

export const services = {
  heading: 'Complete business systems, not isolated screens.',
  intro: 'I build the workflows around the screen too: data, roles, automation, integrations and the launch details that make software actually usable.',
  items: [
    { id: 'whatsapp-ai', title: 'Conversational Commerce & WhatsApp AI', short: 'WhatsApp AI', description: 'AI agents, automated storefront generators, billing engines, and inventory managers driven purely by WhatsApp voice and text in Urdu and English.' },
    { id: 'saas', title: 'Full-Stack SaaS & Operations ERPs', short: 'SaaS & ERPs', description: 'Scalable multi-tenant cloud platforms, real-time reactive databases (Convex), billing pipelines, and executive dashboards built for daily high-concurrency usage.' },
    { id: 'mobile', title: 'Cross-Platform Mobile Applications', short: 'Mobile apps', description: 'Production React Native and Expo applications with offline caching, hardware integrations (BLE, GPS, Cameras), and verified store distribution on iOS and Android.' },
    { id: 'desktop', title: 'Desktop Automation & Native Workstations', short: 'Desktop & automation', description: 'Electron and desktop utilities bridging local operating systems, hardware peripherals, WhatsApp automation engines, and cloud control panels.' },
  ],
};

export const process = {
  heading: 'A direct path from workflow to working software.',
  steps: [
    { title: 'Deconstruct the Real Workflow', text: 'Start with how real people and merchants already work. Identify where time is wasted, how customers communicate (e.g., WhatsApp voice notes), and what data matters.' },
    { title: 'Rapid High-Leverage MVP', text: 'Ship the smallest, complete system that creates immediate commercial value, tests market adoption, and solves the core bottleneck without feature bloat.' },
    { title: 'Hardened, Maintainable Scale', text: 'Build with type safety, clean schemas, reactive real-time backends (Convex/Prisma), and automated messaging pipelines ready to handle daily production scale.' },
  ],
};

export const work = {
  heading: 'Products shaped around operations, revenue and daily use.',
  proofHeading: 'Shipped, in production, and used daily.',
  projects: [
    {
      slug: 'schooliee', name: 'Schooliee', title: 'Schooliee: Multi-School ERP & Parent Communication', category: 'Cloud SaaS & Mobile Ecosystem',
      url: 'https://github.com/MehfoozurRehman/schooliee', urlLabel: 'GitHub', logo: githubLogo, image: schoolieeHero, imageIsScreenshot: true,
      summary: 'A cloud school management ecosystem with role-based web portals, native mobile apps, background SMS relays, and automated WhatsApp parent notifications.',
      businessValue: 'Replaces fragmented paper registers and spreadsheets with a single connected platform for fee challans, student attendance, exams, and family engagement.',
      problem: 'Schools struggled with manual fee collection, delayed parent updates, and disjointed systems for student academic records and attendance.',
      approach: 'Architected a monorepo housing the admin dashboard, mobile apps for teachers/parents, and microservices for automated WhatsApp and SIM SMS notifications.',
      result: 'Attendance alerts, fee challans and grading, automated end to end.',
      outcome: 'Successfully automated daily attendance broadcasts, computerized fee challan generation, and synchronized teacher grading directly into parent mobile feeds.',
      stack: ['Turborepo', 'Next.js', 'React Native', 'Expo', 'Convex', 'Prisma', 'WhatsApp API'],
      highlights: ['Multi-tenant school ERP', 'Automated Fee Challans', 'WhatsApp & SMS Gateways', 'Parent & Teacher Apps'],
    },
    {
      slug: 'dsme-globals', name: 'DSME Globals', title: 'DSME Globals: Software Engineering & Enterprise Services', category: 'Enterprise Digital Platform',
      url: 'https://dsmeglobal.web.app', urlLabel: 'Live site', logo: dsmeLogo, image: dsmeHero, imageIsScreenshot: true,
      summary: 'The digital engineering showcase and product consulting portal for DSME Globals, presenting enterprise client case studies and full-stack solutions.',
      businessValue: 'Delivers a high-conversion client acquisition channel and establishes credible technical authority for international enterprise software contracts.',
      problem: 'The engineering firm needed a high-performance, polished digital presence to represent its cross-platform product delivery capabilities to global clients.',
      approach: 'Designed a fast, accessible web portal highlighting past architectures, service roadmaps, and instant consultation intake flows.',
      result: 'The portal behind international software contracts in logistics, healthcare and retail.',
      outcome: 'Served as the core digital portal securing international software contracts across logistics, healthcare, and retail sectors.',
      stack: ['React 18', 'Vite', 'SCSS', 'Firebase Hosting', 'UI/UX Design'],
      highlights: ['Corporate Engineering Brand', 'Service Architecture Clarity', 'High-Performance SPA', 'Global Client Acquisition'],
    },
    {
      slug: 'leadprofit', name: 'LeadProfit', title: 'LeadProfit: Amazon Marketplace Arbitrage & Analytics', category: 'E-Commerce Intelligence & Data Modeling',
      url: 'https://www.leadprofit.com', urlLabel: 'Live site', logo: leadprofitLogo, image: leadprofitHero, imageIsScreenshot: true,
      summary: 'An Amazon seller intelligence suite focusing on live repricing algorithms, inventory tracking, order analytics, and profit margin visibility.',
      businessValue: 'Gives multi-channel Amazon merchants real-time margin visibility and dynamic repricing controls to prevent inventory dead-stock and protect ROI.',
      problem: 'High-volume marketplace sellers often suffer margin erosion due to unmonitored supplier price fluctuations and manual buy-box tracking.',
      approach: 'Constructed real-time analytical dashboards and OpenAPI-documented REST APIs pulling live Amazon SP-API inventory and sales metrics.',
      result: 'One command center for instant repricing and profit tracking.',
      outcome: 'Gave sellers a unified command center to execute instant repricing strategies and track profit metrics without manual calculations.',
      stack: ['React.js', 'Node.js', 'Amazon SP-API', 'OpenAPI / Swagger', 'Analytics Data Models'],
      highlights: ['Live Margin Analytics', 'Amazon SP-API Integration', 'Interactive Swagger UI', 'Inventory Health Monitoring'],
    },
    {
      slug: 'expo-mobile-apps', name: 'Mobile Ecosystems', title: 'Cross-Platform Mobile Ecosystems & Native Modules', category: 'React Native & Native Mobile Engineering',
      url: null, urlLabel: null, logo: null, image: coverExpo, imageIsScreenshot: false,
      summary: 'Suite of production iOS and Android mobile apps spanning logistics driver dispatchers, on-demand food delivery, BLE hardware monitors, and health coaching.',
      businessValue: 'Maximizes development speed and code reuse across mobile platforms while retaining 60fps native performance and native device access.',
      problem: 'Building separate native Swift and Kotlin applications slowed down time-to-market and increased ongoing maintenance costs.',
      approach: 'Leveraged unified React Native architectures with custom native modules (e.g. expo-quick-actions), native gesture handling, and EAS cloud build pipelines.',
      result: '10+ mobile apps shipped to the App Store and Google Play.',
      outcome: 'Shipped over 10 distinct mobile apps to the App Store and Google Play covering complex GPS routing, biometric sync, and hardware scanning.',
      stack: ['React Native', 'Expo', 'EAS', 'TypeScript', 'BLE', 'Google Maps', 'HealthKit'],
      highlights: ['Production EAS Pipelines', 'Bluetooth Low Energy (BLE)', 'Live Geolocation Maps', 'Custom Native Expo Plugins'],
    },
    {
      slug: 'whatsapp-business-automation', name: 'WhatsApp Gateway', title: 'Native WhatsApp Automation & Messaging Gateway', category: 'Microservices & Desktop Infrastructure',
      url: null, urlLabel: null, logo: null, image: coverWhatsapp, imageIsScreenshot: false,
      summary: 'High-throughput desktop and headless microservice gateways for automated WhatsApp messaging, lead qualification, and customer engagement.',
      businessValue: 'Enables high-volume transactional messaging and conversational bots without exorbitant third-party per-message API overhead.',
      problem: 'Businesses needed reliable mass notifications and conversational workflows without being locked into rigid, costly cloud messaging providers.',
      approach: 'Engineered both an Electron desktop client (schooliee-whatsapp) and a containerized headless engine (schooliee-wbm) with Puppeteer session persistence.',
      result: 'Thousands of daily receipts and reminders, delivered instantly.',
      outcome: 'Processes thousands of automated daily fee receipts, event reminders, and customer confirmations reliably with instant delivery.',
      stack: ['Electron', 'Hono', 'TypeScript', 'Puppeteer', 'Webhooks', 'Docker'],
      highlights: ['Desktop & Docker Engine', 'Puppeteer Session Persistence', 'Bulk Delivery Queues', 'Instant Webhook Triggers'],
    },
    {
      slug: 'karobari', name: 'Karobari', title: 'Karobari: WhatsApp-First AI Commerce Platform', category: 'Founder & Product Lead · Conversational AI Commerce',
      url: 'https://github.com/MehfoozurRehman/karobari', urlLabel: 'GitHub', logo: githubLogo, image: coverKarobari, imageIsScreenshot: false,
      summary: 'An automated digital identity and e-commerce engine enabling local businesses to launch online stores, manage inventory, and fulfill orders entirely through WhatsApp voice and text.',
      businessValue: 'Removes the digital divide for millions of physical merchants in emerging markets by turning the app they already use daily into a full-scale digital commerce operating system.',
      problem: 'Traditional e-commerce platforms and complex admin panels are too intimidating and friction-heavy for local shop owners, who rely solely on WhatsApp and phone calls to do business.',
      approach: 'Engineered an AI conversational ingestion pipeline where merchants can speak or text product details in Urdu/English over WhatsApp to automatically generate live web stores, track inventory decrements, and send customer order receipts.',
      result: 'Shop to live storefront in under 2 minutes, entirely through WhatsApp.',
      outcome: 'Enables any retail merchant or wholesaler to go from a physical shop to an active digital selling engine in less than 2 minutes without writing a single line of data manually.',
      stack: ['Next.js 16', 'React 19', 'Convex', 'OpenAI Agents', 'WhatsApp Cloud API', 'Clerk Auth', 'Tailwind CSS v4'],
      highlights: ['WhatsApp Voice Ingestion', 'Urdu/English AI Understanding', 'Instant Storefront Generation', 'Order & Inventory Automation'],
    },
  ],
};

export const experience = {
  heading: 'Work across schools, SaaS teams and business systems.',
  items: [
    { role: 'Lead Full-Stack Product Developer', company: 'Devscot', period: 'Dec 2020 - Present', years: '5+ years', location: 'Samundri / Faisalabad, Pakistan · Hybrid', summary: 'Leading full-stack engineering and product architecture across flagship SaaS platforms, mobile apps, and custom enterprise systems. Designing multi-tenant reactive backends, real-time dashboards, and automation infrastructure used daily by enterprise clients.', skills: ['Next.js 16', 'React 19', 'TypeScript', 'Convex', 'React Native', 'Node.js', 'System Architecture'] },
    { role: 'Full-Stack Developer', company: 'Schooliee', period: 'Mar 2024 - Present', years: null, location: 'Pakistan · Hybrid', summary: 'Architected and built the comprehensive Schooliee SaaS ecosystem, featuring web administration portals, teacher/parent mobile apps, automated fee challan billing, and native WhatsApp messaging gateways.', skills: ['Next.js', 'React Native', 'Expo', 'Convex', 'Prisma', 'WhatsApp Automation'] },
    { role: 'Founder & Lead Architect', company: 'Karobari', period: '2025 - Present', years: null, location: 'Pakistan · Remote', summary: 'Spearheading the AI business operating system that empowers Pakistani merchants to create digital stores, track inventory, and sell online via WhatsApp voice notes and text.', skills: ['Next.js 16', 'React 19', 'Convex', 'OpenAI Agents', 'WhatsApp Cloud API'] },
    { role: 'Full-Stack Developer', company: 'LeadProfit', period: 'Mar 2023 - Feb 2024', years: null, location: 'Samundri, Pakistan · On-site', summary: 'Engineered high-throughput Amazon marketplace analytical dashboards, Swagger API specifications, and inventory monitoring modules for international e-commerce sellers.', skills: ['React.js', 'Node.js', 'OpenAPI/Swagger', 'Data Visualizations', 'Amazon SP-API'] },
    { role: 'Full-Stack Developer', company: 'CrazyBeings Studios (Pvt) Ltd.', period: 'Dec 2020 - Mar 2023', years: '2+ years', location: 'Faisalabad, Pakistan · Hybrid', summary: 'Delivered customer-facing SaaS products, digital identity platforms, and mobile apps for international startups and retail businesses needing custom software solutions.', skills: ['MERN Stack', 'Express.js', 'React Native', 'MongoDB', 'Cloud Architecture'] },
  ],
};

export const education = {
  school: 'Virtual University of Pakistan',
  degree: 'Bachelor of Science in Computer Science (BSCS)',
  period: 'Apr 2019 - Jul 2023',
  focus: ['Distributed Systems', 'Software Engineering', 'Database Management', 'Computer Networks'],
};

export const stack = {
  heading: 'Modern tools I already use to ship.',
  groups: [
    { label: 'Web & UI', items: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Mapbox GL / Three.js'] },
    { label: 'Mobile & desktop', items: ['React Native', 'Expo', 'Electron'] },
    { label: 'Backend & data', items: ['Convex (Real-Time)', 'Node.js / Express / Hono', 'Prisma ORM', 'PostgreSQL', 'MongoDB', 'Docker'] },
    { label: 'AI & automation', items: ['OpenAI Agents', 'WhatsApp Cloud API', 'Karobari Engine'] },
  ],
};

export const testimonials = {
  heading: 'What clients and teammates already say.',
  items: [
    { quote: 'Mehfooz is a top-tier product engineer with an exceptional eye for design and performance. He turns complex business challenges into seamless, reliable software that scales.', name: 'Dayyan Shahid', role: 'CEO, Dsme Globals' },
    { quote: 'Having worked with Mehfooz for years across major client products, his ability to execute from scratch across Web, Mobile, and Backend at lightning speed is unmatched.', name: 'Hammad Habib', role: 'CEO, Devscot' },
    { quote: 'Mehfooz was instrumental from start to finish. He diagnosed complex architecture bottlenecks instantly and delivered our product ahead of schedule.', name: 'Verified Client', role: 'Enterprise Software Partner' },
  ],
};

export const contact = {
  heading: 'Need a reliable developer to build your product?',
  body: "Send the workflow, product idea or stuck project. I'm strongest when the job needs product thinking, full-stack execution and a practical launch path.",
};
