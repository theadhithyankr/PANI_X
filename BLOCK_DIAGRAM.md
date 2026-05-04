# Pani - Application Block Diagrams

## Complete Application Block Diagram

```mermaid
graph TB
    %% Entry Point
    Start([User Visits App])
    
    %% Authentication Decision
    Start --> AuthCheck{Authenticated?}
    
    %% Public Routes
    AuthCheck -->|No| PublicArea[Public Area]
    PublicArea --> Landing[Landing Page]
    PublicArea --> SignIn[Sign In Page]
    PublicArea --> SignUp[Sign Up Page]
    
    SignIn --> AuthProcess[Authentication Process]
    SignUp --> AuthProcess
    
    %% Role Decision
    AuthCheck -->|Yes| RoleCheck{User Role?}
    AuthProcess --> RoleCheck
    
    %% Candidate Flow
    RoleCheck -->|Candidate| CandidateArea[Candidate Area]
    
    subgraph CandidateFeatures["Candidate Features"]
        CandDash[Dashboard<br/>Stats & Overview]
        FindJobs[Find Jobs<br/>AI Matching]
        Applications[My Applications<br/>Track Status]
        Profile[Profile<br/>Resume Upload]
        Inbox[Inbox<br/>Messages & Interviews]
        CandAI[AI Assistant<br/>Career Advice]
        Campaigns[Campaigns<br/>Event-Based Hiring]
    end
    
    CandidateArea --> CandDash
    CandidateArea --> FindJobs
    CandidateArea --> Applications
    CandidateArea --> Profile
    CandidateArea --> Inbox
    CandidateArea --> CandAI
    CandidateArea --> Campaigns
    
    %% Employer Flow
    RoleCheck -->|Employer| EmployerArea[Employer Area]
    
    subgraph EmployerFeatures["Employer Features"]
        EmpDash[Dashboard<br/>Hiring Metrics]
        JobsMgmt[Jobs Management<br/>Post & Edit]
        Candidates[Candidates<br/>Browse & Match]
        EmpApps[Applications<br/>Review & Status]
        Interviews[Interviews<br/>Schedule & Manage]
        Company[Company Profile<br/>Branding]
        EmpAI[AI Assistant<br/>Job Descriptions]
        EmpCampaigns[Campaigns<br/>Multi-Round Hiring]
    end
    
    EmployerArea --> EmpDash
    EmployerArea --> JobsMgmt
    EmployerArea --> Candidates
    EmployerArea --> EmpApps
    EmployerArea --> Interviews
    EmployerArea --> Company
    EmployerArea --> EmpAI
    EmployerArea --> EmpCampaigns
    
    %% Backend Connections
    CandidateFeatures -.->|Data| Backend[(Backend<br/>Supabase)]
    EmployerFeatures -.->|Data| Backend
    
    %% AI Connections
    FindJobs -.->|AI Matching| AI[AI Services<br/>Groq + HuggingFace]
    CandAI -.->|AI Chat| AI
    EmpAI -.->|AI Generation| AI
    Profile -.->|Resume Parse| AI
    
    %% Styling
    classDef startClass fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    classDef publicClass fill:#95A5A6,stroke:#7F8C8D,stroke-width:2px,color:#fff
    classDef candidateClass fill:#3498DB,stroke:#2874A6,stroke-width:2px,color:#fff
    classDef employerClass fill:#E67E22,stroke:#CA6F1E,stroke-width:2px,color:#fff
    classDef backendClass fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff
    classDef aiClass fill:#1ABC9C,stroke:#16A085,stroke-width:2px,color:#fff
    
    class Start,AuthCheck,RoleCheck startClass
    class PublicArea,Landing,SignIn,SignUp,AuthProcess publicClass
    class CandidateArea,CandDash,FindJobs,Applications,Profile,Inbox,CandAI,Campaigns candidateClass
    class EmployerArea,EmpDash,JobsMgmt,Candidates,EmpApps,Interviews,Company,EmpAI,EmpCampaigns employerClass
    class Backend backendClass
    class AI aiClass
```

---

## Job Application Flow Block Diagram

```mermaid
graph TB
    %% Start
    Start([Candidate Logs In])
    
    %% Browse Jobs
    Start --> Dashboard[View Dashboard]
    Dashboard --> BrowseJobs[Browse Jobs Page]
    
    %% Job Matching
    BrowseJobs --> LoadJobs[Load Active Jobs]
    LoadJobs --> FetchProfile[Fetch Candidate Profile]
    FetchProfile --> AIMatch[AI Matching Algorithm]
    AIMatch --> DisplayJobs[Display Jobs with<br/>Match Scores]
    
    %% Job Selection
    DisplayJobs --> SelectJob{Select Job?}
    SelectJob -->|No| BrowseJobs
    SelectJob -->|Yes| ViewDetails[View Job Details]
    
    %% Application Decision
    ViewDetails --> ApplyDecision{Apply?}
    ApplyDecision -->|No| BrowseJobs
    ApplyDecision -->|Yes| GenerateCover[AI Generate<br/>Cover Letter]
    
    %% Submit Application
    GenerateCover --> ReviewApp[Review Application]
    ReviewApp --> SubmitApp[Submit Application]
    SubmitApp --> SaveDB[(Save to Database)]
    
    %% Employer Notification
    SaveDB --> NotifyEmployer[Notify Employer<br/>Realtime]
    
    %% Candidate Tracking
    SaveDB --> UpdateApps[Update Applications List]
    UpdateApps --> TrackStatus[Track Application Status]
    
    %% Employer Review
    NotifyEmployer --> EmpReview[Employer Reviews]
    EmpReview --> StatusUpdate{Status Update}
    
    %% Status Outcomes
    StatusUpdate -->|Reviewed| Reviewed[Status: Reviewed]
    StatusUpdate -->|Interview| Interview[Schedule Interview]
    StatusUpdate -->|Rejected| Rejected[Status: Rejected]
    StatusUpdate -->|Offer| Offer[Status: Offer]
    
    %% Notifications
    Reviewed --> NotifyCandidate[Notify Candidate<br/>Realtime]
    Interview --> NotifyCandidate
    Rejected --> NotifyCandidate
    Offer --> NotifyCandidate
    
    %% Candidate Inbox
    NotifyCandidate --> CandInbox[Candidate Inbox]
    CandInbox --> TrackStatus
    
    %% Interview Flow
    Interview --> InterviewScheduled[Interview Scheduled]
    InterviewScheduled --> CandInbox
    InterviewScheduled --> InterviewDay{Interview Day}
    InterviewDay --> InterviewComplete[Interview Complete]
    InterviewComplete --> FinalDecision{Final Decision}
    
    %% Final Outcomes
    FinalDecision -->|Offer| Offer
    FinalDecision -->|Rejected| Rejected
    
    Offer --> AcceptDecision{Accept Offer?}
    AcceptDecision -->|Yes| Accepted[Status: Accepted]
    AcceptDecision -->|No| Declined[Status: Declined]
    
    Accepted --> End([Application Complete])
    Declined --> End
    Rejected --> End
    
    %% Styling
    classDef startClass fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    classDef processClass fill:#3498DB,stroke:#2874A6,stroke-width:2px,color:#fff
    classDef aiClass fill:#1ABC9C,stroke:#16A085,stroke-width:2px,color:#fff
    classDef dbClass fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff
    classDef decisionClass fill:#F39C12,stroke:#D68910,stroke-width:2px,color:#fff
    classDef successClass fill:#27AE60,stroke:#1E8449,stroke-width:2px,color:#fff
    classDef rejectClass fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:#fff
    classDef endClass fill:#95A5A6,stroke:#7F8C8D,stroke-width:3px,color:#fff
    
    class Start,End startClass,endClass
    class Dashboard,BrowseJobs,LoadJobs,FetchProfile,ViewDetails,ReviewApp,SubmitApp,UpdateApps,TrackStatus,EmpReview,NotifyEmployer,NotifyCandidate,CandInbox,InterviewScheduled,InterviewDay,InterviewComplete processClass
    class AIMatch,GenerateCover aiClass
    class SaveDB dbClass
    class SelectJob,ApplyDecision,StatusUpdate,FinalDecision,AcceptDecision decisionClass
    class DisplayJobs,Reviewed,Interview,Offer,Accepted successClass
    class Rejected,Declined rejectClass
```

---

## Campaign System Block Diagram

```mermaid
graph TB
    %% Employer Creates Campaign
    Start([Employer Logs In])
    Start --> EmpDash[Employer Dashboard]
    EmpDash --> CampaignPage[Campaigns Page]
    
    %% Create Campaign
    CampaignPage --> CreateBtn[Click Create Campaign]
    CreateBtn --> SelectJob[Select Job Posting]
    SelectJob --> SetDetails[Set Campaign Details]
    
    subgraph CampaignDetails["Campaign Configuration"]
        Name[Campaign Name]
        Dates[Start & End Dates]
        Visibility[Visibility<br/>public/invite-only]
        Criteria[Eligibility Criteria<br/>Skills, Experience]
    end
    
    SetDetails --> CampaignDetails
    CampaignDetails --> BuildPipeline[Build Pipeline]
    
    %% Pipeline Builder
    subgraph PipelineRounds["Pipeline Rounds"]
        Round1[Round 1<br/>Aptitude Test]
        Round2[Round 2<br/>Technical Assessment]
        Round3[Round 3<br/>HR Interview]
        Round4[Round 4<br/>Technical Interview]
        Round5[Round 5<br/>Group Discussion]
    end
    
    BuildPipeline --> PipelineRounds
    PipelineRounds --> SaveCampaign[(Save Campaign<br/>Status: Draft)]
    
    %% Activate Campaign
    SaveCampaign --> ReviewCampaign[Review Campaign]
    ReviewCampaign --> ActivateDecision{Activate?}
    ActivateDecision -->|No| EditCampaign[Edit Campaign]
    EditCampaign --> ReviewCampaign
    ActivateDecision -->|Yes| ActivateCampaign[Activate Campaign<br/>Status: Active]
    
    %% Candidate Discovery
    ActivateCampaign --> PublishCampaign[Publish Campaign]
    PublishCampaign --> CandidateView{Visibility Type}
    
    CandidateView -->|Public| AllCandidates[All Eligible<br/>Candidates See It]
    CandidateView -->|Invite-Only| SendInvites[Send Invitations<br/>to Selected Candidates]
    
    %% Candidate Application
    AllCandidates --> CandApply[Candidate Applies]
    SendInvites --> InviteReceived[Candidate Receives<br/>Invitation]
    InviteReceived --> AcceptInvite{Accept?}
    AcceptInvite -->|Yes| CandApply
    AcceptInvite -->|No| DeclineInvite[Decline Invitation]
    
    %% Application Processing
    CandApply --> CheckEligibility[Check Eligibility<br/>Match Score, Skills]
    CheckEligibility --> EligibleDecision{Eligible?}
    EligibleDecision -->|No| RejectApp[Reject Application]
    EligibleDecision -->|Yes| CreateAppRecord[(Create Application<br/>current_round: 0)]
    
    %% Round Progression
    CreateAppRecord --> StartRound1[Start Round 1]
    
    subgraph RoundFlow["Round Progression Flow"]
        TakeTest[Candidate Takes Test/<br/>Attends Interview]
        SubmitResult[Submit Results]
        EvaluateScore[Evaluate Score]
        PassDecision{Pass?}
        NextRound[Move to Next Round]
        FailRound[Fail - Reject]
    end
    
    StartRound1 --> RoundFlow
    TakeTest --> SubmitResult
    SubmitResult --> EvaluateScore
    EvaluateScore --> PassDecision
    PassDecision -->|Yes| NextRound
    PassDecision -->|No| FailRound
    
    %% Round Iteration
    NextRound --> CheckMoreRounds{More Rounds?}
    CheckMoreRounds -->|Yes| TakeTest
    CheckMoreRounds -->|No| AllRoundsComplete[All Rounds Complete]
    
    %% Final Outcomes
    AllRoundsComplete --> FinalEvaluation[Final Evaluation]
    FinalEvaluation --> FinalDecision{Hire?}
    FinalDecision -->|Yes| SendOffer[Send Job Offer]
    FinalDecision -->|No| RejectFinal[Reject Application]
    
    SendOffer --> CandidateResponse{Candidate Response}
    CandidateResponse -->|Accept| Hired[Status: Hired]
    CandidateResponse -->|Decline| OfferDeclined[Offer Declined]
    
    %% End States
    RejectApp --> End([Campaign Application End])
    FailRound --> End
    RejectFinal --> End
    Hired --> End
    OfferDeclined --> End
    DeclineInvite --> End
    
    %% Employer Monitoring
    ActivateCampaign -.-> MonitorDashboard[Campaign Dashboard<br/>Monitor Progress]
    MonitorDashboard -.-> ViewApplicants[View Applicants]
    MonitorDashboard -.-> ViewRoundResults[View Round Results]
    MonitorDashboard -.-> SendInvites
    
    %% Styling
    classDef startClass fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    classDef employerClass fill:#E67E22,stroke:#CA6F1E,stroke-width:2px,color:#fff
    classDef candidateClass fill:#3498DB,stroke:#2874A6,stroke-width:2px,color:#fff
    classDef processClass fill:#1ABC9C,stroke:#16A085,stroke-width:2px,color:#fff
    classDef decisionClass fill:#F39C12,stroke:#D68910,stroke-width:2px,color:#fff
    classDef dbClass fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff
    classDef successClass fill:#27AE60,stroke:#1E8449,stroke-width:2px,color:#fff
    classDef rejectClass fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:#fff
    classDef endClass fill:#95A5A6,stroke:#7F8C8D,stroke-width:3px,color:#fff
    
    class Start,End startClass,endClass
    class EmpDash,CampaignPage,CreateBtn,SelectJob,SetDetails,BuildPipeline,ReviewCampaign,EditCampaign,PublishCampaign,MonitorDashboard,ViewApplicants,ViewRoundResults employerClass
    class CandApply,InviteReceived,TakeTest,SubmitResult candidateClass
    class Name,Dates,Visibility,Criteria,Round1,Round2,Round3,Round4,Round5,CheckEligibility,EvaluateScore,FinalEvaluation processClass
    class ActivateDecision,CandidateView,AcceptInvite,EligibleDecision,PassDecision,CheckMoreRounds,FinalDecision,CandidateResponse decisionClass
    class SaveCampaign,CreateAppRecord dbClass
    class ActivateCampaign,AllCandidates,SendInvites,NextRound,AllRoundsComplete,SendOffer,Hired successClass
    class RejectApp,FailRound,RejectFinal,OfferDeclined,DeclineInvite rejectClass
```

---

## AI Integration Block Diagram

```mermaid
graph TB
    %% User Actions
    Start([User Interaction])
    
    %% AI Features Entry Points
    Start --> AIFeatures{AI Feature}
    
    %% Job Description Generation
    AIFeatures -->|Generate Job| JobGen[Job Description<br/>Generator]
    JobGen --> JobPrompt[Employer Enters<br/>Job Requirements]
    JobPrompt --> GroqAPI1[Groq API<br/>LLaMA 3.1-8B]
    GroqAPI1 --> JobJSON[Parse JSON Response]
    JobJSON --> DisplayJob[Display Generated<br/>Job Description]
    DisplayJob --> SaveJob[(Save to Database)]
    
    %% Resume Parsing
    AIFeatures -->|Upload Resume| ResumeParser[Resume Parser]
    ResumeParser --> UploadPDF[Candidate Uploads<br/>PDF Resume]
    UploadPDF --> ExtractText[Extract Text<br/>PDF.js]
    ExtractText --> HuggingFace1[HuggingFace API<br/>Gemma Model]
    HuggingFace1 --> ParsedData[Parse Structured Data]
    ParsedData --> SanitizeData[Sanitize & Validate]
    SanitizeData --> AutoFillProfile[Auto-Fill Profile]
    AutoFillProfile --> SaveProfile[(Save to Database)]
    
    %% Job Matching
    AIFeatures -->|Browse Jobs| JobMatching[Job Matching<br/>Algorithm]
    JobMatching --> LoadJobsProfiles[Load Jobs &<br/>Candidate Profile]
    LoadJobsProfiles --> MatchAlgo[Matching Algorithm]
    
    subgraph MatchingLogic["Matching Logic"]
        RoleMatch[Role Match<br/>30 points]
        SkillMatch[Skill Match<br/>40 points]
        ExpMatch[Experience Match<br/>20 points]
        LocMatch[Location Match<br/>10 points]
    end
    
    MatchAlgo --> MatchingLogic
    MatchingLogic --> CalcScore[Calculate Total Score]
    CalcScore --> DisplayMatches[Display Jobs with<br/>Match Scores]
    
    %% Cover Letter Generation
    AIFeatures -->|Apply to Job| CoverGen[Cover Letter<br/>Generator]
    CoverGen --> JobProfileData[Load Job &<br/>Profile Data]
    JobProfileData --> HuggingFace2[HuggingFace API<br/>Gemma Model]
    HuggingFace2 --> GeneratedLetter[Generated Cover Letter]
    GeneratedLetter --> ReviewEdit[Candidate Reviews<br/>& Edits]
    ReviewEdit --> SubmitApp[Submit Application]
    
    %% Gap Analysis
    AIFeatures -->|Analyze Gap| GapAnalysis[Resume Gap<br/>Analysis]
    GapAnalysis --> CompareJobProfile[Compare Job<br/>Requirements vs Profile]
    CompareJobProfile --> HuggingFace3[HuggingFace API<br/>Gemma Model]
    HuggingFace3 --> GapReport[Gap Analysis Report]
    
    subgraph GapReportContent["Gap Report"]
        MissingSkills[Missing Skills]
        Actions[Recommended Actions]
        ResumeTips[Resume Tips]
    end
    
    GapReport --> GapReportContent
    GapReportContent --> DisplayGap[Display to Candidate]
    
    %% Profile Analysis
    AIFeatures -->|Analyze Profile| ProfileAnalysis[Profile Strength<br/>Analysis]
    ProfileAnalysis --> LoadProfileResume[Load Profile &<br/>Resume Text]
    LoadProfileResume --> HuggingFace4[HuggingFace API<br/>Gemma Model]
    HuggingFace4 --> ATSScore[ATS Score Calculation]
    
    subgraph AnalysisReport["Analysis Report"]
        Strengths[Strengths]
        Weaknesses[Weaknesses]
        Suggestions[Suggestions]
        ATSScoreDisplay[ATS Score 0-100]
    end
    
    ATSScore --> AnalysisReport
    AnalysisReport --> DisplayAnalysis[Display Analysis]
    
    %% Campaign Setup Assistant
    AIFeatures -->|Setup Campaign| CampaignAI[Campaign Setup<br/>Assistant]
    CampaignAI --> CampaignPrompt[Employer Describes<br/>Campaign Goals]
    CampaignPrompt --> GroqAPI2[Groq API<br/>LLaMA 3.1-8B]
    GroqAPI2 --> CampaignConfig[Campaign Configuration]
    CampaignConfig --> DisplayCampaign[Display Suggested<br/>Campaign Setup]
    
    %% Pipeline Builder
    AIFeatures -->|Build Pipeline| PipelineAI[Pipeline Builder<br/>Assistant]
    PipelineAI --> PipelinePrompt[Employer Describes<br/>Hiring Process]
    PipelinePrompt --> GroqAPI3[Groq API<br/>LLaMA 3.1-8B]
    GroqAPI3 --> PipelineRounds[Suggested Rounds]
    PipelineRounds --> DisplayPipeline[Display Pipeline]
    
    %% End Points
    SaveJob --> End([AI Task Complete])
    SaveProfile --> End
    DisplayMatches --> End
    SubmitApp --> End
    DisplayGap --> End
    DisplayAnalysis --> End
    DisplayCampaign --> End
    DisplayPipeline --> End
    
    %% Styling
    classDef startClass fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    classDef featureClass fill:#1ABC9C,stroke:#16A085,stroke-width:2px,color:#fff
    classDef groqClass fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    classDef hfClass fill:#FFA500,stroke:#CC8400,stroke-width:2px,color:#fff
    classDef processClass fill:#3498DB,stroke:#2874A6,stroke-width:2px,color:#fff
    classDef dbClass fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff
    classDef displayClass fill:#27AE60,stroke:#1E8449,stroke-width:2px,color:#fff
    classDef endClass fill:#95A5A6,stroke:#7F8C8D,stroke-width:3px,color:#fff
    
    class Start,End,AIFeatures startClass,endClass
    class JobGen,ResumeParser,JobMatching,CoverGen,GapAnalysis,ProfileAnalysis,CampaignAI,PipelineAI featureClass
    class GroqAPI1,GroqAPI2,GroqAPI3 groqClass
    class HuggingFace1,HuggingFace2,HuggingFace3,HuggingFace4 hfClass
    class JobPrompt,UploadPDF,ExtractText,ParsedData,SanitizeData,LoadJobsProfiles,MatchAlgo,RoleMatch,SkillMatch,ExpMatch,LocMatch,CalcScore,JobProfileData,ReviewEdit,CompareJobProfile,LoadProfileResume,ATSScore,CampaignPrompt,PipelinePrompt processClass
    class SaveJob,SaveProfile,SubmitApp dbClass
    class DisplayJob,AutoFillProfile,DisplayMatches,GeneratedLetter,GapReport,MissingSkills,Actions,ResumeTips,DisplayGap,AnalysisReport,Strengths,Weaknesses,Suggestions,ATSScoreDisplay,DisplayAnalysis,CampaignConfig,DisplayCampaign,PipelineRounds,DisplayPipeline displayClass
```

---

## Realtime Updates Block Diagram

```mermaid
graph LR
    %% Database Events
    subgraph DatabaseEvents["Database Events"]
        JobInsert[Job INSERT]
        JobUpdate[Job UPDATE]
        JobDelete[Job DELETE]
        AppInsert[Application INSERT]
        AppUpdate[Application UPDATE]
        IntInsert[Interview INSERT]
        IntUpdate[Interview UPDATE]
        MsgInsert[Message INSERT]
        CampInsert[Campaign INSERT]
        CampUpdate[Campaign UPDATE]
    end
    
    %% Realtime Engine
    subgraph RealtimeEngine["Supabase Realtime Engine"]
        RealtimeServer[Realtime Server<br/>WebSocket]
        
        subgraph Channels["Realtime Channels"]
            JobsChannel[jobs-channel]
            AppsChannel[applications-channel]
            InterviewsChannel[interviews-channel]
            MessagesChannel[messages-channel]
            CampaignsChannel[campaigns-channel]
        end
    end
    
    %% Frontend Subscriptions
    subgraph FrontendSubscriptions["Frontend Subscriptions"]
        JobsHook[useJobs Hook]
        AppsHook[useApplications Hook]
        InterviewsHook[useInterviews Hook]
        InboxHook[useInbox Hook]
        CampaignsHook[useCampaigns Hook]
    end
    
    %% UI Updates
    subgraph UIUpdates["UI Updates"]
        JobsList[Jobs List<br/>Auto-Refresh]
        AppsList[Applications List<br/>Auto-Refresh]
        InterviewsList[Interviews List<br/>Auto-Refresh]
        InboxList[Inbox<br/>Auto-Refresh]
        CampaignsList[Campaigns List<br/>Auto-Refresh]
    end
    
    %% Database to Realtime
    JobInsert --> RealtimeServer
    JobUpdate --> RealtimeServer
    JobDelete --> RealtimeServer
    AppInsert --> RealtimeServer
    AppUpdate --> RealtimeServer
    IntInsert --> RealtimeServer
    IntUpdate --> RealtimeServer
    MsgInsert --> RealtimeServer
    CampInsert --> RealtimeServer
    CampUpdate --> RealtimeServer
    
    %% Realtime to Channels
    RealtimeServer --> JobsChannel
    RealtimeServer --> AppsChannel
    RealtimeServer --> InterviewsChannel
    RealtimeServer --> MessagesChannel
    RealtimeServer --> CampaignsChannel
    
    %% Channels to Hooks
    JobsChannel -.->|Broadcast| JobsHook
    AppsChannel -.->|Broadcast| AppsHook
    InterviewsChannel -.->|Broadcast| InterviewsHook
    MessagesChannel -.->|Broadcast| InboxHook
    CampaignsChannel -.->|Broadcast| CampaignsHook
    
    %% Hooks to UI
    JobsHook -->|Triggers Re-fetch| JobsList
    AppsHook -->|Triggers Re-fetch| AppsList
    InterviewsHook -->|Triggers Re-fetch| InterviewsList
    InboxHook -->|Triggers Re-fetch| InboxList
    CampaignsHook -->|Triggers Re-fetch| CampaignsList
    
    %% Styling
    classDef dbClass fill:#F39C12,stroke:#D68910,stroke-width:2px,color:#fff
    classDef realtimeClass fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff
    classDef hookClass fill:#3498DB,stroke:#2874A6,stroke-width:2px,color:#fff
    classDef uiClass fill:#27AE60,stroke:#1E8449,stroke-width:2px,color:#fff
    
    class JobInsert,JobUpdate,JobDelete,AppInsert,AppUpdate,IntInsert,IntUpdate,MsgInsert,CampInsert,CampUpdate dbClass
    class RealtimeServer,JobsChannel,AppsChannel,InterviewsChannel,MessagesChannel,CampaignsChannel realtimeClass
    class JobsHook,AppsHook,InterviewsHook,InboxHook,CampaignsHook hookClass
    class JobsList,AppsList,InterviewsList,InboxList,CampaignsList uiClass
```

---

## Legend

- **Solid Lines (→)**: Direct synchronous flow
- **Dashed Lines (-.->)**: Asynchronous updates or broadcasts
- **Diamond Shapes (◇)**: Decision points
- **Rounded Rectangles**: Processes or actions
- **Cylinders**: Database operations
- **Subgraphs**: Logical grouping of related components
- **Colors**: Different layers/concerns in the application
