# Pani - Presentation Diagrams

## System Architecture (Presentation Version)

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'18px', 'fontFamily':'arial'}, 'flowchart': {'curve': 'linear'}}}%%
flowchart TB
    User([👤 User])
    
    subgraph Frontend["Frontend (React + TypeScript)"]
        UI[UI Components<br/>shadcn/ui]
        Router[React Router]
        Hooks[Custom Hooks<br/>Data Management]
    end
    
    subgraph AI["AI Services"]
        Groq[Groq API<br/>LLaMA 3.1]
        HF[HuggingFace<br/>Gemma]
    end
    
    subgraph Backend["Backend (Supabase)"]
        Auth[Authentication<br/>JWT]
        DB[(PostgreSQL<br/>Database)]
        Storage[File Storage<br/>Resumes]
        Realtime[Realtime<br/>WebSocket]
    end
    
    User --> UI
    UI --> Router
    Router --> Hooks
    Hooks --> Auth
    Hooks --> DB
    Hooks --> Storage
    Hooks --> Realtime
    Hooks --> AI
    Realtime -.-> Hooks
    
    style User fill:#4A90E2,stroke:#2E5C8A,stroke-width:4px,color:#fff,font-size:16px
    style Frontend fill:#61DAFB,stroke:#20232A,stroke-width:3px,color:#000,font-size:16px
    style AI fill:#FF6B6B,stroke:#C92A2A,stroke-width:3px,color:#fff,font-size:16px
    style Backend fill:#3ECF8E,stroke:#1E7A4E,stroke-width:3px,color:#fff,font-size:16px
    style UI fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    style Router fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    style Hooks fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    style Groq fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:#fff
    style HF fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:#fff
    style Auth fill:#27AE60,stroke:#1E8449,stroke-width:2px,color:#fff
    style DB fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff
    style Storage fill:#27AE60,stroke:#1E8449,stroke-width:2px,color:#fff
    style Realtime fill:#27AE60,stroke:#1E8449,stroke-width:2px,color:#fff
```

---

## Application Block Diagram (Presentation Version)

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'18px', 'fontFamily':'arial'}, 'flowchart': {'curve': 'linear'}}}%%
flowchart TB
    Start([User Visits App])
    
    Auth{Authenticated?}
    
    Public[Public Pages<br/>Landing, Sign In, Sign Up]
    
    Role{User Role?}
    
    subgraph Candidate["Candidate Features"]
        C1[Dashboard]
        C2[Find Jobs<br/>AI Matching]
        C3[Applications]
        C4[Profile]
        C5[Campaigns]
    end
    
    subgraph Employer["Employer Features"]
        E1[Dashboard]
        E2[Post Jobs]
        E3[Browse Candidates]
        E4[Review Applications]
        E5[Create Campaigns]
    end
    
    Backend[(Supabase<br/>Backend)]
    AI[AI Services<br/>Groq + HuggingFace]
    
    Start --> Auth
    Auth -->|No| Public
    Public --> Auth
    Auth -->|Yes| Role
    
    Role -->|Candidate| Candidate
    Role -->|Employer| Employer
    
    Candidate -.-> Backend
    Employer -.-> Backend
    
    C2 -.-> AI
    C4 -.-> AI
    E2 -.-> AI
    E5 -.-> AI
    
    style Start fill:#4A90E2,stroke:#2E5C8A,stroke-width:4px,color:#fff,font-size:16px
    style Auth fill:#F39C12,stroke:#D68910,stroke-width:3px,color:#fff,font-size:16px
    style Role fill:#F39C12,stroke:#D68910,stroke-width:3px,color:#fff,font-size:16px
    style Public fill:#95A5A6,stroke:#7F8C8D,stroke-width:2px,color:#fff
    style Candidate fill:#3498DB,stroke:#2874A6,stroke-width:3px,color:#fff,font-size:16px
    style Employer fill:#E67E22,stroke:#CA6F1E,stroke-width:3px,color:#fff,font-size:16px
    style Backend fill:#9B59B6,stroke:#6C3483,stroke-width:3px,color:#fff,font-size:16px
    style AI fill:#1ABC9C,stroke:#16A085,stroke-width:3px,color:#fff,font-size:16px
    style C1 fill:#5DADE2,stroke:#2874A6,stroke-width:2px,color:#fff
    style C2 fill:#5DADE2,stroke:#2874A6,stroke-width:2px,color:#fff
    style C3 fill:#5DADE2,stroke:#2874A6,stroke-width:2px,color:#fff
    style C4 fill:#5DADE2,stroke:#2874A6,stroke-width:2px,color:#fff
    style C5 fill:#5DADE2,stroke:#2874A6,stroke-width:2px,color:#fff
    style E1 fill:#F0B27A,stroke:#CA6F1E,stroke-width:2px,color:#fff
    style E2 fill:#F0B27A,stroke:#CA6F1E,stroke-width:2px,color:#fff
    style E3 fill:#F0B27A,stroke:#CA6F1E,stroke-width:2px,color:#fff
    style E4 fill:#F0B27A,stroke:#CA6F1E,stroke-width:2px,color:#fff
    style E5 fill:#F0B27A,stroke:#CA6F1E,stroke-width:2px,color:#fff
```

---

## Technology Stack (Presentation Version)

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'18px', 'fontFamily':'arial'}, 'flowchart': {'curve': 'linear'}}}%%
flowchart LR
    subgraph Frontend["Frontend Stack"]
        React[React 18<br/>TypeScript 5]
        Vite[Vite 5<br/>Build Tool]
        Tailwind[Tailwind CSS<br/>Styling]
        Radix[Radix UI<br/>Components]
    end
    
    subgraph Backend["Backend Stack"]
        Supabase[Supabase<br/>BaaS]
        Postgres[PostgreSQL<br/>Database]
        Auth[Auth + RLS<br/>Security]
    end
    
    subgraph AI["AI/ML Stack"]
        Groq[Groq SDK<br/>LLaMA 3.1-8B]
        HF[HuggingFace<br/>Gemma Model]
    end
    
    React --> Vite
    React --> Tailwind
    React --> Radix
    React --> Supabase
    Supabase --> Postgres
    Supabase --> Auth
    React --> Groq
    React --> HF
    
    style Frontend fill:#61DAFB,stroke:#20232A,stroke-width:3px,color:#000,font-size:16px
    style Backend fill:#3ECF8E,stroke:#1E7A4E,stroke-width:3px,color:#fff,font-size:16px
    style AI fill:#FF6B6B,stroke:#C92A2A,stroke-width:3px,color:#fff,font-size:16px
    style React fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    style Vite fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    style Tailwind fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    style Radix fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    style Supabase fill:#27AE60,stroke:#1E8449,stroke-width:2px,color:#fff
    style Postgres fill:#27AE60,stroke:#1E8449,stroke-width:2px,color:#fff
    style Auth fill:#27AE60,stroke:#1E8449,stroke-width:2px,color:#fff
    style Groq fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:#fff
    style HF fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:#fff
```

---

## Database Schema (Presentation Version)

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'16px', 'fontFamily':'arial'}}}%%
erDiagram
    profiles ||--o{ jobs : creates
    profiles ||--o{ applications : submits
    profiles ||--o{ interviews : participates
    profiles ||--o{ hiring_campaigns : creates
    
    jobs ||--o{ applications : receives
    jobs ||--o{ hiring_campaigns : has
    
    applications ||--o{ interviews : leads_to
    
    hiring_campaigns ||--o{ campaign_rounds : contains
    hiring_campaigns ||--o{ campaign_applications : receives
    
    profiles {
        uuid id PK
        text email
        text full_name
        text role
        text headline
        jsonb skills
        int experience_years
        text resume_url
        bool open_to_work
    }
    
    jobs {
        uuid id PK
        uuid employer_id FK
        text title
        text description
        jsonb skills
        text experience_level
        bool is_active
    }
    
    applications {
        uuid id PK
        uuid job_id FK
        uuid candidate_id FK
        text status
        text cover_letter
    }
    
    hiring_campaigns {
        uuid id PK
        uuid employer_id FK
        uuid job_id FK
        text name
        text status
        text visibility
        int min_matching_score
    }
    
    campaign_rounds {
        uuid id PK
        uuid campaign_id FK
        int round_number
        text name
        text type
    }
```

---

## Job Application Flow (Presentation Version)

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'18px', 'fontFamily':'arial'}, 'flowchart': {'curve': 'linear'}}}%%
flowchart LR
    A[Candidate<br/>Browses Jobs]
    B[AI Calculates<br/>Match Score]
    C[Candidate<br/>Applies]
    D[AI Generates<br/>Cover Letter]
    E[Employer<br/>Reviews]
    F[Interview<br/>Scheduled]
    G[Offer<br/>Extended]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    
    style A fill:#3498DB,stroke:#2874A6,stroke-width:3px,color:#fff,font-size:16px
    style B fill:#1ABC9C,stroke:#16A085,stroke-width:3px,color:#fff,font-size:16px
    style C fill:#3498DB,stroke:#2874A6,stroke-width:3px,color:#fff,font-size:16px
    style D fill:#1ABC9C,stroke:#16A085,stroke-width:3px,color:#fff,font-size:16px
    style E fill:#E67E22,stroke:#CA6F1E,stroke-width:3px,color:#fff,font-size:16px
    style F fill:#F39C12,stroke:#D68910,stroke-width:3px,color:#fff,font-size:16px
    style G fill:#27AE60,stroke:#1E8449,stroke-width:3px,color:#fff,font-size:16px
```

---

## Campaign System Flow (Presentation Version)

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'18px', 'fontFamily':'arial'}, 'flowchart': {'curve': 'linear'}}}%%
flowchart TB
    A[Employer Creates<br/>Campaign]
    B[Build Multi-Round<br/>Pipeline]
    C[Activate<br/>Campaign]
    D[Candidates<br/>Apply]
    E[Round 1<br/>Assessment]
    F[Round 2<br/>Interview]
    G[Final<br/>Decision]
    H[Offer<br/>Extended]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E -->|Pass| F
    F -->|Pass| G
    G -->|Hire| H
    
    style A fill:#E67E22,stroke:#CA6F1E,stroke-width:3px,color:#fff,font-size:16px
    style B fill:#E67E22,stroke:#CA6F1E,stroke-width:3px,color:#fff,font-size:16px
    style C fill:#F39C12,stroke:#D68910,stroke-width:3px,color:#fff,font-size:16px
    style D fill:#3498DB,stroke:#2874A6,stroke-width:3px,color:#fff,font-size:16px
    style E fill:#9B59B6,stroke:#6C3483,stroke-width:3px,color:#fff,font-size:16px
    style F fill:#9B59B6,stroke:#6C3483,stroke-width:3px,color:#fff,font-size:16px
    style G fill:#F39C12,stroke:#D68910,stroke-width:3px,color:#fff,font-size:16px
    style H fill:#27AE60,stroke:#1E8449,stroke-width:3px,color:#fff,font-size:16px
```

---

## AI Features Overview (Presentation Version)

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'18px', 'fontFamily':'arial'}, 'flowchart': {'curve': 'linear'}}}%%
flowchart TB
    AI[AI Services<br/>Groq + HuggingFace]
    
    subgraph Candidate["For Candidates"]
        C1[Job Matching<br/>Algorithm]
        C2[Resume<br/>Parsing]
        C3[Cover Letter<br/>Generation]
        C4[Profile<br/>Analysis]
    end
    
    subgraph Employer["For Employers"]
        E1[Job Description<br/>Generation]
        E2[Candidate<br/>Matching]
        E3[Campaign<br/>Setup Assistant]
        E4[Pipeline<br/>Builder]
    end
    
    AI --> Candidate
    AI --> Employer
    
    style AI fill:#1ABC9C,stroke:#16A085,stroke-width:4px,color:#fff,font-size:18px
    style Candidate fill:#3498DB,stroke:#2874A6,stroke-width:3px,color:#fff,font-size:16px
    style Employer fill:#E67E22,stroke:#CA6F1E,stroke-width:3px,color:#fff,font-size:16px
    style C1 fill:#5DADE2,stroke:#2874A6,stroke-width:2px,color:#fff
    style C2 fill:#5DADE2,stroke:#2874A6,stroke-width:2px,color:#fff
    style C3 fill:#5DADE2,stroke:#2874A6,stroke-width:2px,color:#fff
    style C4 fill:#5DADE2,stroke:#2874A6,stroke-width:2px,color:#fff
    style E1 fill:#F0B27A,stroke:#CA6F1E,stroke-width:2px,color:#fff
    style E2 fill:#F0B27A,stroke:#CA6F1E,stroke-width:2px,color:#fff
    style E3 fill:#F0B27A,stroke:#CA6F1E,stroke-width:2px,color:#fff
    style E4 fill:#F0B27A,stroke:#CA6F1E,stroke-width:2px,color:#fff
```

---

## How to Export to PNG

### Method 1: Using Mermaid Live Editor (Recommended)
1. Go to https://mermaid.live/
2. Copy any diagram code from above
3. Paste into the editor
4. Click "Actions" → "PNG" or "SVG"
5. Download the image

### Method 2: Using VS Code Extension
1. Install "Markdown Preview Mermaid Support" extension
2. Open this file in VS Code
3. Right-click on the preview
4. Select "Copy Image" or use a screenshot tool

### Method 3: Using CLI Tool
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i PRESENTATION_DIAGRAMS.md -o diagram.png -w 1920 -H 1080
```

---

## Presentation Tips

- **System Architecture**: Best for technical overview slide
- **Application Block Diagram**: Best for user flow explanation
- **Technology Stack**: Best for tech stack slide
- **Database Schema**: Best for data model slide
- **Job Application Flow**: Best for feature demo
- **Campaign System Flow**: Best for campaign feature explanation
- **AI Features Overview**: Best for AI capabilities slide

All diagrams are optimized for:
- ✅ 16:9 aspect ratio (standard presentation)
- ✅ Large, readable fonts (18px)
- ✅ High contrast colors
- ✅ Clear visual hierarchy
- ✅ Minimal text per node
- ✅ Logical flow direction
