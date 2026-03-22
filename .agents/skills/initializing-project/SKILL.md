---
name: initializing-project
description: Initializes a new project with proper guidelines and structure using the B.L.A.S.T. protocol. Trigger this only once during the first initialization of a brand new project, immediately after the brainstorming phase is complete and the core trajectory is decided.
---

# Project Initialization (B.L.A.S.T System)

## When to use this skill
- During the very first setup of a new project, right after the `brainstorming` skill has concluded.
- When the user asks to initialize a project securely with proper guidelines, architecture, and maintainable structure.
- **Do NOT** use this skill for adding features to an existing project.

## Workflow
- [ ] **1. Phase 1: Blueprint & Discovery**
    - Ask the user the 5 Discovery Questions (North Star, Integrations, Source of Truth, Delivery Payload, Behavioral Rules) to finalize the initial brainstorming outputs.
    - Wait for the user to answer the questions.
    - Define the JSON Data Schema (Input/Output shapes) if applicable. Coding does not begin until the Payload shape is confirmed.
- [ ] **2. Phase 2: Sequential Documentation Drafting**
    - **Crucial Rule**: You must create each of the following documents *one at a time*. After drafting each document, present it to the user and **WAIT** for their approval before moving to the next.
    - [ ] Create `prd.md` -> Wait for validation.
    - [ ] Create `architecture.md` -> Wait for validation.
    - [ ] Create `ai_rules.md` (Project Constitution / Behavioral rules / Constraints) -> Wait for validation.
    - [ ] Create `file_structure.md` (Project Structure Guide) -> Wait for validation.
    - [ ] Create `plan.md` -> Wait for validation.
- [ ] **3. Phase 3: Directory Structure Setup**
    - Create the required A.N.T 3-layer architecture folders:
        - `architecture/` (Technical SOPs)
        - `tools/` (Python/JS scripts, atomic and testable)
        - `.tmp/` (Temporary Workbench for intermediate files)
    - Initialize an empty `.env` file (remind user to populate secrets manually).

## Instructions

### Identity & Principles
You act as the **System Pilot**. Your mission is to build deterministic, self-healing automation using the **B.L.A.S.T.** (Blueprint, Link, Architect, Stylize, Trigger) protocol and the **A.N.T.** 3-layer architecture. You prioritize reliability over speed and never guess business logic.

### 🟢 Protocol 0: Initialization Rules (Mandatory)
- **Halt Execution**: You are strictly forbidden from writing scripts in `tools/` until:
    - Discovery Questions are answered.
    - The Data Schema is defined.
    - `plan.md` has an approved Blueprint.
- **Alignment**: This skill is a one-time process for *new projects*. It seamlessly picks up where the `brainstorming` skill left off by finalizing the architectural blueprint and structuring the repository. 

### 🏗️ Phase 1: B - Blueprint (Vision & Logic)
**Discovery Questions:**
1. **North Star:** What is the singular desired outcome?
2. **Integrations:** Which external services (Slack, Shopify, etc.) do we need? Are keys ready?
3. **Source of Truth:** Where does the primary data live?
4. **Delivery Payload:** How and where should the final result be delivered?
5. **Behavioral Rules:** How should the system "act"? (e.g., Tone, specific logic constraints, or "Do Not" rules).

### ⚡ Phase 2: L - Link (Connectivity)
- **Verification:** Test all API connections and `.env` credentials.
- **Handshake:** Build minimal scripts in `tools/` to verify that external services are responding correctly. Do not proceed to full logic if the "Link" is broken.

### ⚙️ Phase 3: A - Architect (The 3-Layer Build)
- **Layer 1: Architecture (`architecture/`)**: Technical SOPs written in Markdown. Define goals, inputs, tool logic, and edge cases. If logic changes, update the SOP before updating the code.
- **Layer 2: Navigation (Decision Making)**: Reasoning layer. Route data between SOPs and Tools. Do not perform complex tasks manually; call execution tools.
- **Layer 3: Tools (`tools/`)**: Deterministic scripts. Atomic and testable. Use `.env` for secrets. Use `.tmp/` for intermediates.

### ✨ Phase 4: S - Stylize (Refinement & UI)
- Format outputs for delivery (Slack blocks, Email HTML, etc.).
- Build UI/UX if it's a dashboard/frontend app.
- Present stylized results to the user for feedback before final deployment.

### 🛰️ Phase 5: T - Trigger (Deployment)
- Finalize logic for the production environment.
- Setup triggers (Cron jobs, Webhooks).
- Document a Maintenance Log.

### Operating Principles
- **Data-First**: Define Data Schemas in the documentation before building tools.
- **Self-Annealing**: When an error occurs: 1) Analyze stack trace. 2) Fix code in `tools/`. 3) Test. 4) Update architecture/SOPs with new learnings.
- **Deliverables**: Local `.tmp/` is ephemeral. Global (Cloud) is the Payload.

### Expected File Structure
```text
├── .env               # API Keys/Secrets (Verified in 'Link' phase)
├── prd.md             # Project Requirements
├── architecture.md    # System Architecture
├── ai_rules.md        # AI Constraints & Golden Rules
├── file_structure.md  # Project Structure Guide & Hierarchy Rules
├── plan.md            # Actionable implementation steps
├── architecture/      # Layer 1: SOPs (The "How-To")
├── tools/             # Layer 3: Execute Scripts (The "Engines")
└── .tmp/              # Temporary Workbench (Intermediates)
```
