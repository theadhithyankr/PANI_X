# Pani - Complete Application Architecture

## System Overview

Pani is a modern hiring platform built with React, TypeScript, and Supabase that connects candidates with employers through AI-powered matching and event-based hiring campaigns.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        React[React 18 + TypeScript]
        Router[React Router v6]
    end

    subgraph "UI Components"
        Pages[Pages Layer]
        Components[Reusable Components]
        Layouts[Layout Components]
        UI[shadcn/ui + Radix UI]
    end

    subgraph "State Management"
        Contexts[React Contexts]
        AuthCtx[Auth Context]
        ThemeCtx[Theme Context]
        ToastCtx[Toast Context]
        PageCtx[Page Context]
        InboxCtx[Inbox Context]
    end

    subgraph "Data Layer"
        Hooks[Custom Hooks]
        useSupabase[useSupabase Hook]
        useProfile[useProfile Hook]
        Services[Service Layer]
    end

    subgraph "AI Services"
        Groq[Groq API<br/>LLaMA 3.1]
        HuggingFace[HuggingFace<br/>Gemma Model]
        AIUtils[AI Utilities]
    end

    subgraph "Backend - Supabase"
        Auth[Supabase Auth]
        Database[(PostgreSQL Database)]
        Storage[Supabase Storage]
        Realtime[Realtime Subscriptions]
        RLS[Row Level Security]
    end

    Browser --> React
    React --> Router
    Router --> Pages
    Pages --> Components
    Components --> UI
    Pages --> Contexts
    Pages --> Hooks
    Hooks --> Services
    Services --> AIUtils
    AIUtils --> Groq
    AIUtils --> HuggingFace
    Hooks --> Auth
    Hooks --> Database
    Hooks --> Storage
    Hooks --> Realtime
    Database --> RLS
    Contexts --> Hooks
```

---

## Database Schema

```mermaid
erDiagram
    profiles ||--o{ jobs : "creates"
    profiles ||--o{ applications : "submits"
    profiles ||--o{ interviews : "participates"
    profiles ||--o{ messages : "sends/receives"
    profiles ||--o{ hiring_campaigns : "creates"
    profiles ||--o{ campaign_invitations : "sends/receives"
    
    jobs ||--o{ applications : "receives"
    jobs ||--o{ hiring_campaigns : "has"
    
    applications ||--o{ interviews : "leads_to"
    applications ||--o{ campaign_applications : "related"
    
    hiring_campaigns ||--o{ campaign_rounds : "contains"
    hiring_campaigns ||--o{ campaign_applications : "receives"
    hiring_campaigns ||--o{ campaign_invitations : "sends"
    
    campaign_applications ||--o{ campaign_round_results : "tracks"
    campaign_rounds ||--o{ campaign_round_results : "evaluates"

    profiles {
        uuid id PK
        text email
        text full_name
        text role "candidate|employer|admin"
        text headline
        text location
        text phone
        text about
        text resume_url
        text resume_text
        jsonb skills
        int experience_years
        jsonb experience
        jsonb education
        bool open_to_work
        text avatar_url
        text cover_url
        text github
        text linkedin
        text company_name
        text website
        text logo_url
        timestamp created_at
    }

    jobs {
        uuid id PK
        uuid employer_id FK
        text title
        text description
        text location
        text type
        text experience_level
        jsonb skills
        text salary_range
        text work_mode
        int openings
        bool is_active
        int applicants
        timestamp created_at
    }

    applications {
        uuid id PK
        uuid job_id FK
        uuid candidate_id FK
        text status "pending|reviewed|interview|offer|rejected|accepted"
        text cover_letter
        text rejection_feedback
        bool is_viewed
        bool candidate_dismissed
        timestamp created_at
    }

    interviews {
        uuid id PK
        uuid application_id FK
        uuid employer_id FK
        uuid candidate_id FK
        timestamp start_time
        timestamp end_time
        text type
        text status "scheduled|completed|cancelled"
        bool is_viewed
        bool candidate_dismissed
        timestamp created_at
    }

    messages {
        uuid id PK
        uuid sender_id FK
        uuid receiver_id FK
        text content
        bool is_read
        bool candidate_dismissed
        timestamp created_at
    }

    hiring_campaigns {
        uuid id PK
        uuid employer_id FK
        uuid job_id FK
        text name
        timestamp start_date
        timestamp end_date
        text status "draft|active|completed"
        text visibility "public|invite-only"
        int min_matching_score
        jsonb required_skills
        int min_experience
        int max_experience
        jsonb education_requirements
        timestamp created_at
        timestamp updated_at
    }

    campaign_rounds {
        uuid id PK
        uuid campaign_id FK
        int round_number
        text name
        text type "aptitude test|technical assessment|HR interview|technical interview|group discussion"
        timestamp scheduled_date
        int min_passing_score
        timestamp created_at
    }

    campaign_applications {
        uuid id PK
        uuid campaign_id FK
        uuid candidate_id FK
        uuid job_id FK
        text status "pending|in-progress|completed|rejected"
        int current_round
        timestamp applied_at
        timestamp updated_at
    }

    campaign_round_results {
        uuid id PK
        uuid application_id FK
        uuid round_id FK
        int score
        text status "passed|failed|pending"
        text feedback
        timestamp completed_at
    }

    campaign_invitations {
        uuid id PK
        uuid campaign_id FK
        uuid employer_id FK
        uuid candidate_id FK
        text status "pending|accepted|declined"
        text message
        timestamp sent_at
        timestamp responded_at
    }
```

---

## Application Flow - User Roles

```mermaid
graph LR
    subgraph "Public Routes"
        Landing[Landing Page]
        SignIn[Sign In]
        SignUp[Sign Up]
        ResetPwd[Reset Password]
    end

    subgraph "Candidate Routes"
        CandDash[Dashboard]
        FindJobs[Find Jobs]
        Applications[Applications]
        Profile[Profile]
        Inbox[Inbox]
        CandAI[AI Chat]
        CandCampaigns[Campaigns]
        CampProgress[Campaign Progress]
    end

    subgraph "Employer Routes"
        EmpDash[Dashboard]
        EmpJobs[Jobs Management]
        EmpCandidates[Candidates]
        EmpApplications[Applications]
        EmpInterviews[Interviews]
        EmpCompany[Company Profile]
        EmpAI[AI Chat]
        EmpCampaigns[Campaigns]
        CampDashboard[Campaign Dashboard]
        CampInvitations[Campaign Invitations]
    end

    subgraph "Admin Routes"
        AdminDash[Dashboard]
        AdminUsers[Users]
        AdminJobs[Jobs]
        AdminAnalytics[Analytics]
        AdminSettings[Settings]
        AdminSecurity[Security]
    end

    Landing --> SignIn
    Landing --> SignUp
    SignIn --> CandDash
    SignIn --> EmpDash
    SignIn --> AdminDash
```

---

## Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant AuthContext
    participant Supabase Auth
    participant Database
    participant AuthGuard

    User->>Browser: Access Protected Route
    Browser->>AuthGuard: Check Authentication
    AuthGuard->>AuthContext: Get Session
    AuthContext->>Supabase Auth: getSession()
    
    alt Session Exists
        Supabase Auth-->>AuthContext: Return Session
        AuthContext->>Database: Fetch Profile
        Database-->>AuthContext: Return Profile Data
        AuthContext-->>AuthGuard: Session + Profile
        
        alt Role Matches
            AuthGuard-->>Browser: Allow Access
            Browser-->>User: Show Protected Page
        else Role Mismatch
            AuthGuard-->>Browser: Redirect to Appropriate Dashboard
        end
    else No Session
        Supabase Auth-->>AuthContext: No Session
        AuthContext-->>AuthGuard: Unauthenticated
        AuthGuard-->>Browser: Redirect to Sign In
        Browser-->>User: Show Sign In Page
    end
```

---

## Data Flow - Job Application Process

```mermaid
sequenceDiagram
    participant Candidate
    participant UI
    participant useSupabase
    participant Supabase
    participant AI Service
    participant Employer

    Candidate->>UI: Browse Jobs
    UI->>useSupabase: useJobs()
    useSupabase->>Supabase: Query jobs table
    Supabase-->>useSupabase: Return active jobs
    
    useSupabase->>Supabase: Get candidate profile
    Supabase-->>useSupabase: Return profile
    
    useSupabase->>AI Service: calculateJobMatch(job, profile)
    AI Service-->>useSupabase: Return match score & details
    useSupabase-->>UI: Jobs with match scores
    UI-->>Candidate: Display matched jobs
    
    Candidate->>UI: Apply to Job
    UI->>AI Service: generateCoverLetter(job, profile)
    AI Service-->>UI: Generated cover letter
    
    Candidate->>UI: Submit Application
    UI->>useSupabase: applyToJob(jobId, candidateId, coverLetter)
    useSupabase->>Supabase: Insert into applications
    Supabase-->>useSupabase: Success
    
    Supabase->>Employer: Realtime notification
    useSupabase-->>UI: Application submitted
    UI-->>Candidate: Show confirmation
```

---

## AI Integration Architecture

```mermaid
graph TB
    subgraph "AI Features"
        JobGen[Job Description<br/>Generation]
        ResumeParser[Resume Parsing]
        MatchCalc[Job Matching<br/>Algorithm]
        CoverGen[Cover Letter<br/>Generation]
        GapAnalysis[Resume Gap<br/>Analysis]
        ProfileAnalysis[Profile Strength<br/>Analysis]
        CampaignSetup[Campaign Setup<br/>Assistant]
        PipelineBuilder[Pipeline Builder<br/>Assistant]
    end

    subgraph "AI Services"
        GroqAPI[Groq API<br/>LLaMA 3.1-8B]
        HFService[HuggingFace<br/>Gemma Model]
    end

    subgraph "AI Utilities"
        AIUtils[ai.ts]
        GroqService[groq.ts]
        HFClient[huggingface.ts]
        CampaignAI[aiCampaignSetup.ts]
        PipelineAI[aiPipelineBuilder.ts]
    end

    JobGen --> GroqService
    ResumeParser --> HFClient
    MatchCalc --> AIUtils
    CoverGen --> HFClient
    GapAnalysis --> HFClient
    ProfileAnalysis --> HFClient
    CampaignSetup --> CampaignAI
    PipelineBuilder --> PipelineAI

    GroqService --> GroqAPI
    HFClient --> HFService
    CampaignAI --> GroqAPI
    PipelineAI --> GroqAPI
```

---

## Campaign System Architecture

```mermaid
graph TB
    subgraph "Campaign Creation"
        CreateCamp[Create Campaign]
        SelectJob[Select Job]
        SetDates[Set Start/End Dates]
        SetVisibility[Set Visibility<br/>public/invite-only]
        SetCriteria[Set Eligibility Criteria]
        BuildPipeline[Build Pipeline Rounds]
    end

    subgraph "Campaign Pipeline"
        Round1[Round 1<br/>Aptitude Test]
        Round2[Round 2<br/>Technical Assessment]
        Round3[Round 3<br/>HR Interview]
        Round4[Round 4<br/>Technical Interview]
        Round5[Round 5<br/>Group Discussion]
    end

    subgraph "Candidate Journey"
        Discover[Discover Campaign]
        Apply[Apply to Campaign]
        Progress[Track Progress]
        Complete[Complete Rounds]
        Result[Get Results]
    end

    subgraph "Employer Management"
        Monitor[Monitor Applications]
        Evaluate[Evaluate Candidates]
        SendInvites[Send Invitations]
        UpdateStatus[Update Round Status]
        ViewResults[View Results]
    end

    CreateCamp --> SelectJob
    SelectJob --> SetDates
    SetDates --> SetVisibility
    SetVisibility --> SetCriteria
    SetCriteria --> BuildPipeline
    
    BuildPipeline --> Round1
    Round1 --> Round2
    Round2 --> Round3
    Round3 --> Round4
    Round4 --> Round5
    
    Discover --> Apply
    Apply --> Progress
    Progress --> Complete
    Complete --> Result
    
    Monitor --> Evaluate
    Evaluate --> SendInvites
    SendInvites --> UpdateStatus
    UpdateStatus --> ViewResults
```

---

## Realtime Features

```mermaid
graph LR
    subgraph "Realtime Subscriptions"
        JobsSub[Jobs Channel]
        AppsSub[Applications Channel]
        InterviewsSub[Interviews Channel]
        MessagesSub[Messages Channel]
        ProfilesSub[Profiles Channel]
        CampaignsSub[Campaigns Channel]
    end

    subgraph "Database Events"
        JobsTable[(jobs table)]
        AppsTable[(applications table)]
        InterviewsTable[(interviews table)]
        MessagesTable[(messages table)]
        ProfilesTable[(profiles table)]
        CampaignsTable[(hiring_campaigns table)]
    end

    subgraph "UI Updates"
        JobsList[Jobs List]
        AppsList[Applications List]
        InterviewsList[Interviews List]
        InboxList[Inbox]
        CandidatesList[Candidates List]
        CampaignsList[Campaigns List]
    end

    JobsTable -->|INSERT/UPDATE/DELETE| JobsSub
    AppsTable -->|INSERT/UPDATE/DELETE| AppsSub
    InterviewsTable -->|INSERT/UPDATE/DELETE| InterviewsSub
    MessagesTable -->|INSERT/UPDATE/DELETE| MessagesSub
    ProfilesTable -->|INSERT/UPDATE/DELETE| ProfilesSub
    CampaignsTable -->|INSERT/UPDATE/DELETE| CampaignsSub

    JobsSub --> JobsList
    AppsSub --> AppsList
    InterviewsSub --> InterviewsList
    MessagesSub --> InboxList
    ProfilesSub --> CandidatesList
    CampaignsSub --> CampaignsList
```

---

## Security Architecture (RLS)

```mermaid
graph TB
    subgraph "Row Level Security Policies"
        ProfileRLS[Profiles RLS<br/>- Users can read/update own profile<br/>- Employers can read candidate profiles<br/>- Admins can read all]
        
        JobsRLS[Jobs RLS<br/>- All can read active jobs<br/>- Employers can CRUD own jobs<br/>- Admins can read all]
        
        AppsRLS[Applications RLS<br/>- Candidates can read/create own<br/>- Employers can read/update for own jobs<br/>- Admins can read all]
        
        InterviewsRLS[Interviews RLS<br/>- Participants can read own<br/>- Employers can CRUD own<br/>- Admins can read all]
        
        MessagesRLS[Messages RLS<br/>- Users can read own messages<br/>- Users can send messages<br/>- Admins can read all]
        
        CampaignsRLS[Campaigns RLS<br/>- Employers can CRUD own campaigns<br/>- Candidates can read eligible campaigns<br/>- Admins can read all]
    end

    subgraph "Authentication"
        SupabaseAuth[Supabase Auth<br/>JWT Tokens]
    end

    subgraph "Database Access"
        PostgreSQL[(PostgreSQL<br/>with RLS Enabled)]
    end

    SupabaseAuth --> ProfileRLS
    SupabaseAuth --> JobsRLS
    SupabaseAuth --> AppsRLS
    SupabaseAuth --> InterviewsRLS
    SupabaseAuth --> MessagesRLS
    SupabaseAuth --> CampaignsRLS
    
    ProfileRLS --> PostgreSQL
    JobsRLS --> PostgreSQL
    AppsRLS --> PostgreSQL
    InterviewsRLS --> PostgreSQL
    MessagesRLS --> PostgreSQL
    CampaignsRLS --> PostgreSQL
```

---

## Technology Stack

```mermaid
graph TB
    subgraph "Frontend"
        React[React 18]
        TypeScript[TypeScript 5.2]
        Vite[Vite 5]
        TailwindCSS[Tailwind CSS 3.4]
        ReactRouter[React Router 6]
        RadixUI[Radix UI]
        ShadcnUI[shadcn/ui]
        Lucide[Lucide Icons]
    end

    subgraph "Backend & Database"
        Supabase[Supabase]
        PostgreSQL[PostgreSQL]
        SupabaseAuth[Supabase Auth]
        SupabaseStorage[Supabase Storage]
        SupabaseRealtime[Supabase Realtime]
    end

    subgraph "AI & ML"
        GroqSDK[Groq SDK]
        LLaMA[LLaMA 3.1-8B]
        HuggingFace[HuggingFace API]
        Gemma[Gemma Model]
    end

    subgraph "Development Tools"
        Vitest[Vitest]
        FastCheck[fast-check<br/>Property-Based Testing]
        ESLint[ESLint]
        PostCSS[PostCSS]
        Autoprefixer[Autoprefixer]
    end

    subgraph "Utilities"
        DayJS[Day.js]
        PDFjs[PDF.js]
        ReactEasyCrop[React Easy Crop]
        CVA[class-variance-authority]
        TailwindMerge[tailwind-merge]
    end

    React --> TypeScript
    React --> Vite
    React --> TailwindCSS
    React --> ReactRouter
    React --> RadixUI
    RadixUI --> ShadcnUI
    React --> Lucide
    
    React --> Supabase
    Supabase --> PostgreSQL
    Supabase --> SupabaseAuth
    Supabase --> SupabaseStorage
    Supabase --> SupabaseRealtime
    
    React --> GroqSDK
    GroqSDK --> LLaMA
    React --> HuggingFace
    HuggingFace --> Gemma
```

---

## File Structure

```
pani-vite/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/          # Admin-specific components
│   │   ├── common/         # Shared components
│   │   ├── dashboard/      # Candidate dashboard components
│   │   ├── employer/       # Employer-specific components
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── ToastContext.tsx
│   │   ├── PageContext.tsx
│   │   └── InboxContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── useSupabase.ts  # Main data fetching hook
│   ├── pages/              # Route pages
│   │   ├── admin/          # Admin pages
│   │   ├── employer/       # Employer pages
│   │   └── [candidate pages]
│   ├── services/           # Business logic & external services
│   │   ├── groq.ts
│   │   ├── huggingface.ts
│   │   ├── aiCampaignSetup.ts
│   │   ├── aiPipelineBuilder.ts
│   │   └── campaignNotifications.ts
│   ├── utils/              # Utility functions
│   │   ├── ai.ts           # AI utilities
│   │   ├── pdf.ts          # PDF utilities
│   │   ├── pdfParser.ts
│   │   ├── cropImage.ts
│   │   ├── eligibilityChecker.ts
│   │   └── supabase/
│   │       └── client.ts   # Supabase client
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── supabase/               # Database migrations & SQL
│   ├── create_campaign_tables.sql
│   ├── campaign_rls_policies.sql
│   ├── enable_realtime.sql
│   └── [other migrations]
├── public/                 # Static assets
├── .env                    # Environment variables
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Key Features Summary

### For Candidates
- **AI-Powered Job Matching**: Intelligent matching algorithm with detailed breakdown
- **Resume Parsing**: Automatic profile population from uploaded resume
- **AI Cover Letter Generation**: Context-aware cover letter creation
- **Campaign Participation**: Apply to multi-round hiring campaigns
- **Progress Tracking**: Track application and campaign progress
- **Inbox System**: Unified inbox for interviews, messages, and updates
- **Profile Optimization**: AI-powered profile strength analysis

### For Employers
- **AI Job Description Generator**: Create compelling job postings with AI
- **Candidate Discovery**: Browse candidates with match scores
- **Application Management**: Review and manage applications
- **Interview Scheduling**: Schedule and manage interviews
- **Campaign Creation**: Create event-based hiring campaigns with multi-round pipelines
- **AI Pipeline Builder**: AI-assisted pipeline creation
- **Invitation System**: Invite specific candidates to campaigns
- **Analytics Dashboard**: Track hiring metrics and pipeline status

### For Admins
- **User Management**: Manage all users and roles
- **Job Moderation**: Oversee all job postings
- **Analytics**: System-wide analytics and insights
- **Security Settings**: Configure security policies
- **System Settings**: Manage platform configuration

---

## Performance Optimizations

1. **Module-level Profile Caching**: Prevents sidebar flashing on remount
2. **Realtime Subscriptions**: Efficient data synchronization
3. **Lazy Loading**: Code splitting for route-based components
4. **Optimistic Updates**: Immediate UI feedback before server confirmation
5. **Indexed Database Queries**: Optimized database indexes for frequent queries
6. **Connection Pooling**: Efficient database connection management via Supabase

---

## Security Features

1. **Row Level Security (RLS)**: Database-level access control
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Access Control**: Candidate, Employer, Admin roles
4. **Secure File Storage**: Protected resume and media storage
5. **Input Validation**: Client and server-side validation
6. **SQL Injection Prevention**: Parameterized queries via Supabase
7. **XSS Protection**: React's built-in XSS protection

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Client Deployment"
        Vite[Vite Build]
        StaticFiles[Static Files<br/>HTML, CSS, JS]
        CDN[CDN/Hosting<br/>Vercel/Netlify]
    end

    subgraph "Backend Services"
        SupabaseCloud[Supabase Cloud]
        PostgresDB[(PostgreSQL Database)]
        AuthService[Auth Service]
        StorageService[Storage Service]
        RealtimeService[Realtime Service]
    end

    subgraph "External APIs"
        GroqAPI[Groq API]
        HFAPI[HuggingFace API]
    end

    Vite --> StaticFiles
    StaticFiles --> CDN
    CDN --> Users[End Users]
    
    Users --> SupabaseCloud
    SupabaseCloud --> PostgresDB
    SupabaseCloud --> AuthService
    SupabaseCloud --> StorageService
    SupabaseCloud --> RealtimeService
    
    Users --> GroqAPI
    Users --> HFAPI
```

---

## Future Enhancements

1. **Video Interviews**: Integrated video calling for remote interviews
2. **Advanced Analytics**: ML-powered hiring insights
3. **Mobile Apps**: Native iOS and Android applications
4. **API Integration**: Third-party ATS integrations
5. **Advanced Notifications**: Push notifications and email alerts
6. **Skill Assessments**: Built-in coding challenges and assessments
7. **Team Collaboration**: Multi-user employer accounts
8. **Candidate Pools**: Talent pool management for employers

---

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
VITE_GROQ_API_KEY=your_groq_api_key
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
# Execute SQL files in supabase/ directory in Supabase Dashboard

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

---

## License

[Your License Here]

---

## Contributors

[Your Team/Contributors Here]
