---
description: Bootstrap a new project by copying selected core skills from Antigravity_cores
---

# New Project Bootstrap

Use this workflow when starting a brand-new project and you want to pull in core skills from the Antigravity Cores hub.

## When to use
- Starting a fresh project folder
- User says "start a new project", "bootstrap a project", or "/new-project"

## Steps

1. **Ask for the target project path** if not already known.
   ```
   What is the full path to your new project folder? (Or press Enter to use current directory)
   ```

2. **Run the bootstrap script**:
   ```powershell
   & "C:\Users\User\Documents\Coding\Antigravity_cores\new-project.ps1"
   ```
   The script will:
   - Show all available core skills
   - Let the user pick which ones to copy
   - Copy selected skills into `<project>/.agents/skills/`
   - Create a `custom/` placeholder for project-specific skills

3. **Remind the user** about the two-skill convention:
   > Your project now has **core skills** (copied from Antigravity Cores) and a **custom/** folder for project-specific skills. When creating new skills for this project, use the `creating-skills` skill and reference `.ref/` in Antigravity Cores for inspiration.

4. **Done** — hand off to the `initializing-project` skill if this is a brand new project that needs full B.L.A.S.T. initialization.
