# Pani - System Architecture

## Complete System Architecture Diagram

```mermaid
graph TB
    %% Client Layer
    User[👤 End User]
    Browser[🌐 Web Browser]
    
    %% Frontend Application
    subgraph Frontend["Frontend Application (React + TypeScript)"]
        Router[React Router v6]
        
        subgraph Contexts["Context Providers"]
            AuthCtx[Auth Context]
            ThemeCtx[Theme Context]
            ToastCtx[Toast Context]
            PageCtx[Page Context]
            InboxCtx[Inbox Context]
        end
        
        subgraph Pages["Pages Layer"]
            PublicPages[Public Pages<br/>Landing, SignIn, SignUp]
            CandidatePages[Candidate Pages<br/>Dashboard, Jobs, Profile]
            EmployerPages[Employer Pages<br/>Dashboard, Candidates, Campaigns]
        end
        
        subgraph Components["UI Components"]
            UILib[shadcn/ui + Radix UI]
            CustomComponents[Custom Components]
            Layouts[Layout Components]
        end
        
        subgraph DataLayer["Data Layer"]
            Hooks[Custom Hooks<br/>useSupabase, useProfile]
            Services[Services<br/>AI, Notifications]
        end
    end
    
    %% AI Services
    subgraph AIServices["AI Services"]
        GroqAPI[Groq API<br/>LLaMA 3.1-8B]
        HuggingFace[HuggingFace<br/>Gemma Model]
    end
    
    %% Backend Services
    subgraph Backend["Backend (Supabase)"]
        SupabaseAuth[Supabase Auth<br/>JWT Tokens]
        
        subgraph Database["PostgreSQL Database"]
            ProfilesTable[(profiles)]
            JobsTable[(jobs)]
            ApplicationsTable[(applications)]
            InterviewsTable[(interviews)]
            MessagesTable[(messages)]
            CampaignsTable[(hiring_campaigns)]
            RoundsTable[(campaign_rounds)]
            CampAppsTable[(campaign_applications)]
            ResultsTable[(campaign_round_results)]
            InvitationsTable[(campaign_invitations)]
        end
        
        RLS[Row Level Security<br/>Policies]
        Storage[Supabase Storage<br/>Resumes, Media]
        Realtime[Realtime Subscriptions<br/>WebSocket]
    end
    
    %% Connections - User to Browser
    User -->|Interacts| Browser
    
    %% Browser to Frontend
    Browser -->|Loads| Router
    
    %% Router to Pages
    Router -->|Routes| PublicPages
    Router -->|Routes| CandidatePages
    Router -->|Routes| EmployerPages
    
    %% Pages to Contexts
    PublicPages -->|Uses| Contexts
    CandidatePages -->|Uses| Contexts
    EmployerPages -->|Uses| Contexts
    
    %% Pages to Components
    PublicPages -->|Renders| Components
    CandidatePages -->|Renders| Components
    EmployerPages -->|Renders| Components
    
    %% Components to UI Library
    CustomComponents -->|Built with| UILib
    Layouts -->|Built with| UILib
    
    %% Pages to Data Layer
    PublicPages -->|Fetches Data| DataLayer
    CandidatePages -->|Fetches Data| DataLayer
    EmployerPages -->|Fetches Data| DataLayer
    
    %% Contexts to Hooks
    AuthCtx -->|Uses| Hooks
    InboxCtx -->|Uses| Hooks
    
    %% Hooks to Services
    Hooks -->|Calls| Services
    
    %% Services to AI
    Services -->|API Calls| GroqAPI
    Services -->|API Calls| HuggingFace
    
    %% Data Layer to Backend
    Hooks -->|Queries| SupabaseAuth
    Hooks -->|Queries| Database
    Hooks -->|Uploads| Storage
    Hooks -->|Subscribes| Realtime
    
    %% Auth to Database
    SupabaseAuth -->|Validates| RLS
    
    %% RLS to Tables
    RLS -->|Protects| ProfilesTable
    RLS -->|Protects| JobsTable
    RLS -->|Protects| ApplicationsTable
    RLS -->|Protects| InterviewsTable
    RLS -->|Protects| MessagesTable
    RLS -->|Protects| CampaignsTable
    RLS -->|Protects| RoundsTable
    RLS -->|Protects| CampAppsTable
    RLS -->|Protects| ResultsTable
    RLS -->|Protects| InvitationsTable
    
    %% Realtime to Tables
    Realtime -.->|Listens| JobsTable
    Realtime -.->|Listens| ApplicationsTable
    Realtime -.->|Listens| InterviewsTable
    Realtime -.->|Listens| MessagesTable
    Realtime -.->|Listens| CampaignsTable
    
    %% Realtime back to Frontend
    Realtime -.->|Updates| Hooks
    
    %% Styling
    classDef userClass fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    classDef frontendClass fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    classDef aiClass fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    classDef backendClass fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff
    classDef dbClass fill:#F39C12,stroke:#B8860B,stroke-width:2px,color:#fff
    
    class User,Browser userClass
    class Router,Contexts,Pages,Components,DataLayer,Hooks,Services frontendClass
    class GroqAPI,HuggingFace aiClass
    class SupabaseAuth,RLS,Storage,Realtime backendClass
    class ProfilesTable,JobsTable,ApplicationsTable,InterviewsTable,MessagesTable,CampaignsTable,RoundsTable,CampAppsTable,ResultsTable,InvitationsTable dbClass
```

---

## Technology Stack Architecture

```mermaid
graph LR
    %% Frontend Stack
    subgraph FrontendStack["Frontend Stack"]
        React[React 18.2]
        TypeScript[TypeScript 5.2]
        Vite[Vite 5.0]
        
        subgraph Styling["Styling"]
            Tailwind[Tailwind CSS 3.4]
            Radix[Radix UI]
            Shadcn[shadcn/ui]
        end
        
        subgraph Routing["Routing & State"]
            ReactRouter[React Router 6]
            ContextAPI[Context API]
        end
        
        subgraph Utils["Utilities"]
            DayJS[Day.js]
            PDFjs[PDF.js]
            Lucide[Lucide Icons]
        end
    end
    
    %% Backend Stack
    subgraph BackendStack["Backend Stack"]
        Supabase[Supabase Cloud]
        PostgreSQL[PostgreSQL]
        SupabaseJS[Supabase JS SDK 2.39]
        
        subgraph Features["Backend Features"]
            Auth[Authentication]
            RLS[Row Level Security]
            Storage[File Storage]
            Realtime[Realtime DB]
        end
    end
    
    %% AI Stack
    subgraph AIStack["AI/ML Stack"]
        Groq[Groq SDK 0.37]
        LLaMA[LLaMA 3.1-8B]
        HF[HuggingFace API]
        Gemma[Gemma Model]
    end
    
    %% Testing Stack
    subgraph TestingStack["Testing Stack"]
        Vitest[Vitest 4.1]
        FastCheck[fast-check 4.7]
        JSDOM[JSDOM 29.1]
    end
    
    %% Connections
    React --> TypeScript
    React --> Vite
    React --> Styling
    React --> Routing
    React --> Utils
    
    Tailwind --> Radix
    Radix --> Shadcn
    
    React --> SupabaseJS
    SupabaseJS --> Supabase
    Supabase --> PostgreSQL
    Supabase --> Features
    
    React --> Groq
    Groq --> LLaMA
    React --> HF
    HF --> Gemma
    
    React --> Vitest
    Vitest --> FastCheck
    Vitest --> JSDOM
    
    %% Styling
    classDef frontend fill:#61DAFB,stroke:#20232A,stroke-width:2px,color:#000
    classDef backend fill:#3ECF8E,stroke:#1E7A4E,stroke-width:2px,color:#fff
    classDef ai fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    classDef testing fill:#FFA500,stroke:#CC8400,stroke-width:2px,color:#fff
    
    class React,TypeScript,Vite,Tailwind,Radix,Shadcn,ReactRouter,ContextAPI,DayJS,PDFjs,Lucide frontend
    class Supabase,PostgreSQL,SupabaseJS,Auth,RLS,Storage,Realtime backend
    class Groq,LLaMA,HF,Gemma ai
    class Vitest,FastCheck,JSDOM testing
```

---

## Deployment Architecture

```mermaid
graph TB
    %% Development
    subgraph Development["Development Environment"]
        DevMachine[💻 Developer Machine]
        ViteDevServer[Vite Dev Server<br/>localhost:5173]
        LocalEnv[.env.local<br/>Environment Variables]
    end
    
    %% Build Process
    subgraph BuildProcess["Build Process"]
        TypeScriptCompiler[TypeScript Compiler<br/>tsc]
        ViteBuild[Vite Build<br/>Bundler]
        StaticAssets[Static Assets<br/>HTML, CSS, JS]
    end
    
    %% Production Hosting
    subgraph ProductionHosting["Production Hosting"]
        CDN[CDN / Static Hosting<br/>Vercel / Netlify]
        DNS[DNS / Domain]
    end
    
    %% Backend Services
    subgraph BackendServices["Backend Services (Supabase Cloud)"]
        SupabaseProject[Supabase Project]
        PostgresDB[(PostgreSQL Database)]
        AuthService[Auth Service]
        StorageService[Storage Service]
        RealtimeService[Realtime Service]
        EdgeFunctions[Edge Functions]
    end
    
    %% External APIs
    subgraph ExternalAPIs["External APIs"]
        GroqAPI[Groq API<br/>AI Completions]
        HuggingFaceAPI[HuggingFace API<br/>ML Models]
    end
    
    %% End Users
    Users[🌍 End Users<br/>Web Browsers]
    
    %% Development Flow
    DevMachine -->|npm run dev| ViteDevServer
    LocalEnv -->|Loads| ViteDevServer
    
    %% Build Flow
    DevMachine -->|npm run build| TypeScriptCompiler
    TypeScriptCompiler -->|Compiles| ViteBuild
    ViteBuild -->|Generates| StaticAssets
    
    %% Deployment Flow
    StaticAssets -->|Deploy| CDN
    DNS -->|Points to| CDN
    
    %% User Access
    Users -->|HTTPS| DNS
    DNS -->|Serves| CDN
    
    %% Frontend to Backend
    CDN -->|API Calls| SupabaseProject
    ViteDevServer -->|API Calls| SupabaseProject
    
    %% Supabase Internal
    SupabaseProject -->|Manages| PostgresDB
    SupabaseProject -->|Provides| AuthService
    SupabaseProject -->|Provides| StorageService
    SupabaseProject -->|Provides| RealtimeService
    SupabaseProject -->|Runs| EdgeFunctions
    
    %% External API Calls
    CDN -->|AI Requests| GroqAPI
    CDN -->|ML Requests| HuggingFaceAPI
    ViteDevServer -->|AI Requests| GroqAPI
    ViteDevServer -->|ML Requests| HuggingFaceAPI
    
    %% Styling
    classDef devClass fill:#61DAFB,stroke:#20232A,stroke-width:2px,color:#000
    classDef buildClass fill:#FFA500,stroke:#CC8400,stroke-width:2px,color:#fff
    classDef prodClass fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    classDef backendClass fill:#3ECF8E,stroke:#1E7A4E,stroke-width:2px,color:#fff
    classDef apiClass fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    classDef userClass fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff
    
    class DevMachine,ViteDevServer,LocalEnv devClass
    class TypeScriptCompiler,ViteBuild,StaticAssets buildClass
    class CDN,DNS prodClass
    class SupabaseProject,PostgresDB,AuthService,StorageService,RealtimeService,EdgeFunctions backendClass
    class GroqAPI,HuggingFaceAPI apiClass
    class Users userClass
```

---

## Security Architecture

```mermaid
graph TB
    %% User Layer
    User[👤 User]
    
    %% Authentication Layer
    subgraph AuthLayer["Authentication Layer"]
        Login[Login Form]
        SupabaseAuth[Supabase Auth]
        JWT[JWT Token]
    end
    
    %% Authorization Layer
    subgraph AuthorizationLayer["Authorization Layer"]
        AuthGuard[Auth Guard<br/>Route Protection]
        RoleCheck[Role Check<br/>candidate/employer]
    end
    
    %% Application Layer
    subgraph ApplicationLayer["Application Layer"]
        CandidateRoutes[Candidate Routes]
        EmployerRoutes[Employer Routes]
    end
    
    %% Database Security
    subgraph DatabaseSecurity["Database Security (RLS)"]
        RLSEngine[RLS Engine]
        
        subgraph Policies["Security Policies"]
            ProfilePolicy[Profile Policies<br/>Own profile access]
            JobPolicy[Job Policies<br/>Employer CRUD]
            AppPolicy[Application Policies<br/>Candidate + Employer]
            InterviewPolicy[Interview Policies<br/>Participant access]
            MessagePolicy[Message Policies<br/>Sender/Receiver]
            CampaignPolicy[Campaign Policies<br/>Employer + Eligible candidates]
        end
    end
    
    %% Database Tables
    subgraph DatabaseTables["Database Tables"]
        ProfilesDB[(profiles)]
        JobsDB[(jobs)]
        ApplicationsDB[(applications)]
        InterviewsDB[(interviews)]
        MessagesDB[(messages)]
        CampaignsDB[(hiring_campaigns)]
    end
    
    %% User Flow
    User -->|Enters Credentials| Login
    Login -->|Authenticates| SupabaseAuth
    SupabaseAuth -->|Issues| JWT
    
    %% Authorization Flow
    JWT -->|Validates| AuthGuard
    AuthGuard -->|Checks Role| RoleCheck
    
    %% Route Access
    RoleCheck -->|candidate| CandidateRoutes
    RoleCheck -->|employer| EmployerRoutes
    
    %% Database Access
    CandidateRoutes -->|Query| RLSEngine
    EmployerRoutes -->|Query| RLSEngine
    
    %% RLS to Policies
    RLSEngine -->|Applies| Policies
    
    %% Policies to Tables
    ProfilePolicy -->|Protects| ProfilesDB
    JobPolicy -->|Protects| JobsDB
    AppPolicy -->|Protects| ApplicationsDB
    InterviewPolicy -->|Protects| InterviewsDB
    MessagePolicy -->|Protects| MessagesDB
    CampaignPolicy -->|Protects| CampaignsDB
    
    %% JWT to RLS
    JWT -.->|Provides auth.uid| RLSEngine
    
    %% Styling
    classDef userClass fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    classDef authClass fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    classDef appClass fill:#FFA500,stroke:#CC8400,stroke-width:2px,color:#fff
    classDef securityClass fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:#fff
    classDef dbClass fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff
    
    class User userClass
    class Login,SupabaseAuth,JWT,AuthGuard,RoleCheck authClass
    class CandidateRoutes,EmployerRoutes appClass
    class RLSEngine,ProfilePolicy,JobPolicy,AppPolicy,InterviewPolicy,MessagePolicy,CampaignPolicy securityClass
    class ProfilesDB,JobsDB,ApplicationsDB,InterviewsDB,MessagesDB,CampaignsDB dbClass
```

---

## Data Flow Architecture

```mermaid
graph LR
    %% User Actions
    User[👤 User Action]
    
    %% UI Layer
    subgraph UILayer["UI Layer"]
        Component[React Component]
        State[Local State]
    end
    
    %% Context Layer
    subgraph ContextLayer["Context Layer"]
        AuthContext[Auth Context]
        ToastContext[Toast Context]
    end
    
    %% Hook Layer
    subgraph HookLayer["Custom Hooks"]
        useSupabase[useSupabase Hook]
        useProfile[useProfile Hook]
    end
    
    %% Service Layer
    subgraph ServiceLayer["Service Layer"]
        SupabaseClient[Supabase Client]
        AIService[AI Service]
    end
    
    %% Backend
    subgraph Backend["Backend"]
        Database[(Database)]
        AIAPIs[AI APIs]
    end
    
    %% Response Flow
    subgraph ResponseFlow["Response"]
        RealtimeUpdate[Realtime Update]
        UIUpdate[UI Update]
    end
    
    %% Forward Flow
    User -->|Interacts| Component
    Component -->|Updates| State
    Component -->|Uses| ContextLayer
    Component -->|Calls| HookLayer
    
    useSupabase -->|Queries| SupabaseClient
    useProfile -->|Queries| SupabaseClient
    
    SupabaseClient -->|Fetches| Database
    AIService -->|Requests| AIAPIs
    
    %% Backward Flow
    Database -.->|Returns Data| SupabaseClient
    AIAPIs -.->|Returns Result| AIService
    
    SupabaseClient -.->|Updates| useSupabase
    AIService -.->|Updates| useSupabase
    
    useSupabase -.->|Updates| State
    
    Database -.->|Broadcasts| RealtimeUpdate
    RealtimeUpdate -.->|Triggers| useSupabase
    
    State -.->|Triggers| UIUpdate
    UIUpdate -.->|Renders| Component
    
    %% Styling
    classDef userClass fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    classDef uiClass fill:#61DAFB,stroke:#20232A,stroke-width:2px,color:#000
    classDef contextClass fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    classDef hookClass fill:#FFA500,stroke:#CC8400,stroke-width:2px,color:#fff
    classDef serviceClass fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff
    classDef backendClass fill:#3ECF8E,stroke:#1E7A4E,stroke-width:2px,color:#fff
    classDef responseClass fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:#fff
    
    class User userClass
    class Component,State uiClass
    class AuthContext,ToastContext contextClass
    class useSupabase,useProfile hookClass
    class SupabaseClient,AIService serviceClass
    class Database,AIAPIs backendClass
    class RealtimeUpdate,UIUpdate responseClass
```

---

## Legend

- **Solid Lines (→)**: Direct data flow or function calls
- **Dashed Lines (-.->)**: Asynchronous updates or callbacks
- **Subgraphs**: Logical grouping of related components
- **Colors**: Different layers/concerns in the architecture
