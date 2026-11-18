export type AboutBlock = {
  heading: string
  body: string
}

export type IdentityFact = {
  label: string
  value: string
}

export type ExploreNote = {
  id: string
  label: string
  title: string
  body: string
}

export type Work = {
  id: string
  index: string
  title: string
  place: string
  role: string
  status: string
  summary: string
  stack: readonly string[]
  did: readonly string[]
  metric: string
  href?: string
  image?: string
}

export type SiteLink = {
  label: string
  href: string
}

export type Site = {
  name: string
  role: string
  journey: string
  greeting: string
  line: string
  email: string
  links: readonly SiteLink[]
  aboutHeadline: string
  aboutIntro: string
  identityTitle: string
  identity: readonly IdentityFact[]
  about: readonly AboutBlock[]
  workEyebrow: string
  workTitle: string
  workLead: string
  works: readonly Work[]
  exploreEyebrow: string
  exploreTitle: string
  exploreLead: string
  explore: readonly ExploreNote[]
  contact: {
    title: string
    body: string
  }
  resume: {
    title: string
    summary: string
    highlights: readonly string[]
    href?: string
  }
  footer: string
}

export const site: Site = {
  name: 'Sunidhi Chouhan',
  role: 'Software Engineer',
  journey: 'The midnight journey',
  greeting: "Hello, I'm",
  line: 'I enjoy exploring how things work, solving problems that matter, and turning ideas into products people can actually use.',
  email: 'sunidhichouhan34@gmail.com',
  links: [
    { label: 'Email', href: 'mailto:sunidhichouhan34@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/sunidhi-chouhan' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/sunidhi-chouhan-732112223' },
  ],
  aboutHeadline: 'Solving problems that matter.',
  aboutIntro:
    'Software engineer with 3.5+ years of experience, currently at Systango Technologies Ltd. The work is engineering challenges, Agentic AI, and product development: frontend and full-stack, from the problem through the interface people use.',
  identityTitle: 'Practice',
  identity: [
    { label: 'Role', value: 'Software Engineer' },
    { label: 'Practice', value: 'Frontend and full-stack development' },
    { label: 'Now', value: 'Systango Technologies Ltd.' },
    { label: 'Focus', value: 'Engineering challenges, Agentic AI, and product development' },
  ],
  about: [
    {
      heading: 'Craft',
      body: 'Thoughtful engineering: understanding the problem, shaping the interface, and building the product so the pieces hold together. The useful work is the judgment in between the idea and the thing someone can actually use.',
    },
    {
      heading: 'Curiosity',
      body: 'Agentic AI, LLMs, automation, and the practical applications of emerging technology. The interest is in what these tools change in real products, not in the novelty by itself.',
    },
  ],
  workEyebrow: 'Selected work',
  workTitle: 'Studies',
  workLead:
    'Three products. Open one for the role, the stack, and the engineering problem. Links appear only where a public URL was provided.',
  works: [
    {
      id: 'whohire',
      index: '01',
      title: 'WhoHire',
      place: 'Production',
      role: 'Frontend Engineer',
      status: 'Production application',
      summary:
        'An AI-powered hiring platform. The frontend covers role-based access, feedback management, video assessments, drag-and-drop interactions, and theme switching.',
      stack: ['Next.js', 'React', 'TypeScript', 'Sass'],
      did: [
        'Role-based access across the product',
        'Feedback management and video assessments',
        'Drag-and-drop interactions and theme switching',
      ],
      metric: 'Managing permissions across a complex SaaS application.',
      image: '/work/whohire.jpg',
    },
    {
      id: 'shopbridge',
      index: '02',
      title: 'ShopBridge',
      place: 'Under construction',
      role: 'Full-Stack Developer',
      status: 'Under construction',
      summary:
        'Every order has a conversation. The React product ties order-centric conversations, automatic two-way translation, real-time updates, rich messaging, offers, and context-aware support to the transaction.',
      stack: ['React'],
      did: [
        'Order-centric conversations with automatic two-way translation',
        'Real-time updates, rich messaging, and offers',
        'Support that stays aware of the order context',
      ],
      metric: 'End-to-end product development, connecting communication with the context of each order.',
      href: 'https://shopbridge-voiceops.onrender.com/',
      image: '/work/shopbridge.jpg',
    },
    {
      id: 'ethoventures',
      index: '03',
      title: 'Ethoventures',
      place: 'Production',
      role: 'Frontend Engineer',
      status: 'Production application',
      summary:
        'Discover, plan, and travel together. The frontend covers itinerary creation and management, collaborative planning, sharing, payments, and travel discovery.',
      stack: ['React', 'Stripe', 'PDF generation'],
      did: [
        'Itinerary creation, management, and sharing',
        'Collaborative planning',
        'Payments and travel discovery',
      ],
      metric: 'Ownership of interconnected frontend workflows.',
      image: '/work/ethoventures.jpg',
    },
  ],
  exploreEyebrow: 'Field notes',
  exploreTitle: 'Notes from the work.',
  exploreLead: 'Reflections from building these products. Not a blog, and not a list of tools.',
  explore: [
    {
      id: 'flow',
      label: 'Practice',
      title: 'Understand the flow before writing the code.',
      body: 'The interface is the last expression of a flow that already exists: who does what, what has to stay true, and where a person gets stuck. Writing the code first usually means redrawing it.',
    },
    {
      id: 'permission',
      label: 'WhoHire',
      title: 'The complexity behind a simple permission check.',
      body: 'A permission looks like a condition. On WhoHire it is the product: roles, screens, and actions that have to agree across a SaaS application. The hard part is keeping that agreement when the surface area grows.',
    },
    {
      id: 'dots',
      label: 'Product',
      title: 'Building a product means connecting the dots.',
      body: 'ShopBridge connects a conversation to an order. Ethoventures connects planning, sharing, and payment. The engineering is the join between those pieces, not a screen on its own.',
    },
    {
      id: 'curiosity',
      label: 'Curiosity',
      title: 'Curiosity beyond conventional software.',
      body: 'Agentic AI, LLMs, and automation are interesting where they change a real workflow. The question is the practical application: what a person can now do that the product could not do before.',
    },
  ],
  contact: {
    title: 'The river is quiet from here.',
    body: 'I am a software engineer at Systango Technologies Ltd. For work or a question about the projects, use the email, GitHub, and LinkedIn below.',
  },
  resume: {
    title: 'Resume',
    summary: '',
    highlights: [],
    href: '/resume.pdf',
  },
  footer: 'Software engineer at Systango Technologies Ltd.',
}
