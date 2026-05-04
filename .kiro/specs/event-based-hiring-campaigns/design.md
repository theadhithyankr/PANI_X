# Design Document: Event-Based Hiring Campaign System

## Overview

The Event-Based Hiring Campaign System transforms traditional continuous hiring into structured, time-bound recruitment events with transparent multi-round pipelines. This system enables employers to create campus-placement-style hiring campaigns where candidates can see all assessment rounds upfront with specific dates, enabling better planning and transparency.

### Key Features

- **Time-Bound Campaigns**: Structured recruitment events with clear start/end dates linked to job postings
- **Multi-Round Pipelines**: Sequential assessment stages (aptitude tests, technical interviews, HR rounds, etc.)
- **AI-Powered Pipeline Builder**: Automated pipeline generation using Groq API based on role parameters
- **Manual Pipeline Customization**: Full control to add, remove, reorder, and customize rounds
- **Entry Criteria Validation**: Automatic eligibility checking based on matching scores, skills, experience, and education
- **Invitation System**: Proactive candidate recruitment with search and invite capabilities
- **Progress Tracking**: Real-time candidate progress through pipeline rounds with status visibility
- **Email Notifications**: Automated notifications for invitations, round reminders, and results
- **Employer Dashboard**: Comprehensive view of all applicants with filtering and conversion funnel visualization

### Design Principles

1. **Simplicity**: Leverage existing infrastructure (Supabase, Groq, email services) rather than introducing new dependencies
2. **Maintainability**: Clean separation of concerns with modular components
3. **College-Project Appropriate**: Straightforward implementation suitable for academic context
4. **User Experience**: Transparent process for candidates, efficient management for employers

## Architecture

### System Components

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Employer Campaign Dashboard]
        B[AI Pipeline Builder UI]
        C[Manual Pipeline Builder UI]
        D[Candidate Campaign Browser]
        E[Candidate Progress Tracker]
        F[Invitation Management UI]
    end
    
    subgraph "API Layer"
        G[Campaign CRUD API]
        H[Pipeline Builder API]
        I[Application Management API]
        J[Invitation API]
        K[Eligibility Checker API]
    end
    
    subgraph "Service Layer"
        L[Groq AI Service]
        M[Email Notification Service]
        N[Matching Score Calculator]
    end
    
    subgraph "Data Layer"
        O[(Supabase Database)]
        P[hiring_campaigns]
        Q[campaign_rounds]
        R[campaign_applications]
        S[campaign_round_results]
        T[campaign_invitations]
    end
    
    A --> G
    B --> H
    C --> H
    D --> G
    E --> I
    F --> J
    
    G --> O
    H --> L
    H --> O
    I --> O
    I --> M
    J --> O
    J --> M
    K --> N
    K --> O
    
    O --> P
    O --> Q
    O --> R
    O --> S
    O --> T
