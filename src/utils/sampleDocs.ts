export interface SampleDoc {
  id: string;
  title: string;
  badge: string;
  description: string;
  content: string;
}

export const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: 'tech-architecture',
    title: 'Cloud Architecture & Systems',
    badge: 'Tech & Jargon',
    description: 'Packed with acronyms like SQL, k8s, Vite, and YAML to test pronunciation rules.',
    content: `# Modern Cloud Architecture & Data Pipelines

Welcome to the overview of our next-generation cloud infrastructure. Today, we will examine how our services communicate via RESTful endpoints and event buses.

## 1. Database Tier & Query Optimization
Our primary persistence layer relies on PostgreSQL for relational transactional integrity. Developers query historical datasets using SQL, while document schemas are serialized as JSON and YAML configurations. For example (e.g.), caching query plans reduces latency by approximately 45%.

## 2. Container Orchestration with Kubernetes
We manage all microservices using Kubernetes (often referred to as k8s). The deployment manifests are strictly versioned in Git repositories. Engineers interact with the cluster primarily through our automated CLI tooling and OAuth authentication guards.

## 3. Frontend Tooling & Fast Bundling
On the client side, our web application is bundled with Vite, enabling sub-millisecond hot reloads. Mathematical and academic documentation is rendered using LaTeX syntax for crisp scientific notation.

## 4. Key Takeaways
- Use PostgreSQL and optimized SQL for relational integrity
- Deploy stateless microservices across our k8s clusters
- Authenticate all internal services via OAuth tokens
- Rely on modern frontend bundlers like Vite for developer velocity
`,
  },
  {
    id: 'audiobook-narrative',
    title: 'The Silent Signal (Narrative)',
    badge: 'Storytelling',
    description: 'Expressive fiction prose with pacing, dialogues, and chapter breaks.',
    content: `# The Silent Signal
## Chapter 1: The Deep Space Array

The observatory was quiet except for the rhythmic hum of liquid helium cooling the antennas. Dr. Elena Vance adjusted her headset, watching the telemetry monitors flicker in the dim amber light.

"We have an anomaly on Sector 7," Marcus whispered from the telemetry station. "It does not look like background solar noise."

Elena leaned closer to the phosphorescent waveforms. For twelve years, the array had listened to the cosmic dark, recording nothing but the static hiss of dead stars. But this signal possessed cadence, an undeniable mathematical rhythm that repeated every three seconds.

## Chapter 2: The Decryption Key

Elena typed the initial parameters into the terminal. She breathed quietly, her heart racing as the analyzer began processing the intercepted stream. 

"If this is genuine," she murmured, "everything we believed about the outer perimeter changes tonight."

The screen flickered. A single string of intelligible glyphs resolved onto the display: 'Welcome to the Commonwealth.'
`,
  },
  {
    id: 'developer-tutorial',
    title: 'Getting Started with Secure APIs',
    badge: 'Tutorial',
    description: 'Clean tutorial with prerequisites, step-by-step instructions, and code blocks.',
    content: `# Quickstart: Building Secure REST APIs

In this tutorial, you will learn how to design, secure, and deploy production-ready APIs. 

## Prerequisites
Before beginning, verify that you have the following installed on your workstation:
- Node.js LTS version 20 or higher
- A running PostgreSQL or SQLite instance
- The terminal CLI installed with sudo permissions

## Step 1: Initialize the Project
Create a new directory and initialize your package manifest.

\`\`\`bash
mkdir secure-api-demo
cd secure-api-demo
npm init -y
\`\`\`

## Step 2: Implement OAuth 2.0 Guards
Never expose unprotected endpoints on the public web. All mutating requests (POST, PUT, DELETE) must validate a Bearer token issued by your identity provider (i.e., Auth0 or Firebase Auth).

## Step 3: Best Practices Checklist
- Always sanitize input parameters to prevent SQL injection
- Enforce strict CORS policies on production domains
- Log errors to stderr while returning standardized JSON responses to clients
`,
  },
];
