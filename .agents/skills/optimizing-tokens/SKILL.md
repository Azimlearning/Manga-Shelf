---
name: optimizing-tokens
description: Enhances token efficiency and reduces API costs during agentic sessions. Use when the user wants to reduce spend, optimize their context window, compact memory, route models efficiently, or prevent context rot. ALSO auto-activates at the start of every session to enforce baseline efficiency practices.
---

# Token Optimization & Cost Reduction

<STANDING-ORDER>
This skill is always active as a background discipline. Even when not explicitly invoked, apply the Progressive Disclosure reading strategy and avoid loading large files or dumping entire codebases into context unnecessarily.
</STANDING-ORDER>

> For **cloud, infrastructure, and code-level** cost reduction (AWS, DB queries, bundles, caching), use the `cost-reducer` skill instead — it has dedicated reference files for those concerns.

## When to Use This Skill

- **Passively (always)**: Apply Progressive Disclosure for every file read or search operation
- The user expresses concern about API costs or token limits
- The context window is nearing capacity (>80% full) — risk of context rot
- The user wants to set up cost-saving measures for a new or existing project
- You need to perform a "strategic compaction" or memory reset

## Workflow

- [ ] **1. Session Start Audit**: Assess active MCP servers — disable any not needed for the current task
- [ ] **2. Model Routing**: Determine if the task requires an expensive model (Opus) or if a cheaper model (Sonnet/Haiku) will suffice
- [ ] **3. Apply Progressive Disclosure**: Never read a file in full unless specifically needed — always search first
- [ ] **4. Tool Management**: Disable unnecessary MCP servers and tools to reclaim context space
- [ ] **5. Strategic Compaction**: If context is bloated, summarize progress and perform a soft reset at a logical breakpoint

---

## Instructions

### 1. Smart Model Routing

- **Default to smaller models**: Sonnet or Haiku for everyday tasks (fixes, boilerplate, simple UI changes) — saves ~60% in costs
- **Reserve heavy models**: Only escalate to Opus for complex architectural planning, deep reasoning, or severe debugging
- **Agent teams vs. subagents**: For simple or sequential tasks, use a single subagent. Avoid spawning massive agent teams unless parallel execution of distinct, complex domains is strictly required

### 2. Context Window & Tool Management

Every active tool description consumes tokens continuously.

- **Limit active MCPs**: Keep fewer than 10 MCP servers and 80 total tools active per project
- **Cap thinking tokens**: If the harness allows it, reduce `MAX_THINKING_TOKENS` (e.g., from 31,999 → 10,000) when deep thought isn't needed

### 3. Strategic Context Compaction

- **Do NOT compact mid-task**: Never compact in the middle of a complex implementation step — you'll lose file paths and variable names
- **Compact at breakpoints**: Wait until a logical breakpoint (bug fixed, research done, PR ready)
- **The Compaction Routine**:
  1. Generate a dense semantic summary of current project state, active changes, and next steps
  2. Save to a temporary file (e.g., `/tmp/context-checkpoint.md`)
  3. Execute `/clear` or `/compact` if supported by the harness
  4. Reload the summary from the temporary file

### 4. Progressive Disclosure — MANDATORY BASELINE (The 3-Layer Method)

When querying logs, databases, or large codebases, NEVER dump massive files into context.

1. **Search & ID**: `grep` or search to retrieve only file paths, IDs, or timestamps (~50–100 tokens)
2. **Timeline View**: View minimal snippet context around those IDs
3. **Targeted Fetch**: Fetch the full file **only** for specific IDs confirmed necessary (~500–1,000 tokens)

> Filtering before fetching yields ~10x token savings.

### 5. Reading Large Files

- Always use `StartLine`/`EndLine` parameters to read in chunks
- Never view a file you don't need — search for the relevant section first
- Never view the same file twice in the same task if you already have the relevant content in context
