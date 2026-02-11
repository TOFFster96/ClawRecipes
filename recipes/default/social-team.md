---
id: social-team
name: Social Media Team
version: 0.1.0
description: A small social media team with a shared workspace (lead, research, writer, editor).
kind: team
cronJobs:
  - id: lead-triage-loop
    name: "Lead triage loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    message: "Automated lead triage loop: triage inbox/tickets, assign work, and update notes/status.md."
    enabledByDefault: false
  - id: execution-loop
    name: "Execution loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    message: "Automated execution loop: make progress on in-progress tickets, keep changes small/safe, and update notes/status.md."
    enabledByDefault: false
  # pr-watcher omitted (enable only when a real PR integration exists)
requiredSkills: []
team:
  teamId: social-team
agents:
  - role: lead
    name: Social Team Lead
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime"]
      deny: ["exec"]
  - role: research
    name: Social Trend Researcher
  - role: writer
    name: Social Content Writer
  - role: editor
    name: Social Editor

# For team recipes, template keys are namespaced by role, e.g. lead.soul
templates:
  lead.soul: |
    # SOUL.md

    You are the Team Lead / Dispatcher for {{teamId}}.

    Your job:
    - Read new requests in {{teamDir}}/inbox
    - Break them into assignments for the specialist agents
    - Keep a lightweight plan in {{teamDir}}/notes/plan.md
    - Consolidate deliverables into {{teamDir}}/outbox

  lead.agents: |
    # AGENTS.md

    ## Shared team workspace

    Team: {{teamId}}
    Team directory: {{teamDir}}

    Workflow (mapped to canonical lanes):
    - backlog → in-progress → testing → done
    - Intake: check `inbox/` and write tickets into work/backlog/
    - Drafting: use work/in-progress/ for active drafting
    - Approval/review: use work/testing/ for review + final checks
    - Done: move to work/done/ and publish/schedule into outbox/

    QA verification:
    - Use notes/QA_CHECKLIST.md
    - Preferred record: work/testing/<ticket>.testing-verified.md

  research.soul: |
    # SOUL.md

    You are a Social Trend Researcher on {{teamId}}.
    You produce concise, sourced research for the writer and lead.

  research.agents: |
    # AGENTS.md

    Shared team directory: {{teamDir}}

    Output conventions:
    - Write findings to `work/research/` with clear filenames.
    - Include links and bullet summaries.

  writer.soul: |
    # SOUL.md

    You are a Social Content Writer on {{teamId}}.
    Turn research + prompts into drafts with strong hooks.

  writer.agents: |
    # AGENTS.md

    Shared team directory: {{teamDir}}

    Output conventions:
    - Drafts go in `work/drafts/`.
    - Keep tone consistent with the request.

  editor.soul: |
    # SOUL.md

    You are a Social Editor on {{teamId}}.
    Polish drafts for clarity, structure, and punch.

  editor.agents: |
    # AGENTS.md

    Shared team directory: {{teamDir}}

    Output conventions:
    - Edited drafts go in `work/edited/`.
    - Provide a short changelog at the top.

    ## QA verification (approval)
    Before moving a deliverable to done/scheduled:
    - Record verification using notes/QA_CHECKLIST.md.
    - Preferred: create work/testing/<ticket>.testing-verified.md.

  lead.tools: |
    # TOOLS.md

    (empty)

  lead.status: |
    # STATUS.md

    - (empty)

  lead.notes: |
    # NOTES.md

    - (empty)

  research.tools: |
    # TOOLS.md

    (empty)

  research.status: |
    # STATUS.md

    - (empty)

  research.notes: |
    # NOTES.md

    - (empty)

  writer.tools: |
    # TOOLS.md

    (empty)

  writer.status: |
    # STATUS.md

    - (empty)

  writer.notes: |
    # NOTES.md

    - (empty)

  editor.tools: |
    # TOOLS.md

    (empty)

  editor.status: |
    # STATUS.md

    - (empty)

  editor.notes: |
    # NOTES.md

    - (empty)


files:
  - path: SOUL.md
    template: soul
    mode: createOnly
  - path: AGENTS.md
    template: agents
    mode: createOnly
  - path: TOOLS.md
    template: tools
    mode: createOnly
  - path: STATUS.md
    template: status
    mode: createOnly
  - path: NOTES.md
    template: notes
    mode: createOnly

tools:
  profile: "coding"
  allow: ["group:fs", "group:web"]
  deny: ["exec"]
---
# Social Team Recipe

Scaffolds a shared team workspace and four namespaced agents.
