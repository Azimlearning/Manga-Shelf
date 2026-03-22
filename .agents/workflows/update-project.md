---
description: Update an existing project with the latest core skills from Antigravity_cores
---

# Update Project Skills

Use this workflow to update an existing project's `.agents/skills` folder with the latest core skills from the main Antigravity Cores hub. This is useful when core skills are modified and you want to cascade those changes down to your working project.

## When to use
- User wants to update core skills in their active project
- User says "update my project skills", "pull latest skills", or "/update-project"

## Steps

1. **Ask for the target project path** if not already known (or assume current directory).

2. **Run the update script**:
   ```powershell
   & "C:\Users\User\Documents\Coding\Antigravity_cores\update-project.ps1"
   ```
   The script will:
   - Check if the target project has an `.agents\skills\` directory
   - Show all available core skills in the Cores hub
   - Let the user pick which ones to update (or all)
   - Overwrite the selected core skills in the target project
   - Avoid touching the `custom/` folder or any project-specific skills

3. **Confirm completion**:
   Let the user know that the selected core skills have been successfully updated in their project folder.
