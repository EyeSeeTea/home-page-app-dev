---
name: task-management
description: >
  Project management skill for creating and managing tasks in ClickUp
  from OpenSpec artifacts. Use whenever creating tasks, updating status, planning
  sprints, or coordinating work between development agents. Trigger on any
  mention of tickets, tasks, sprint planning, or project tracking.
---

# ClickUp Task Management

## Creating Tasks from OpenSpec

When given an OpenSpec change proposal:

1. Read `openspec/changes/<change-name>/tasks.md` for the task breakdown
2. Read `openspec/changes/<change-name>/design.md` for technical context
3. For each task, create a task in ClickUp with:
   - **Name**: `[ROLE] Task description`
   - **Description**: Include acceptance criteria from the spec
   - **Priority**: Based on dependency order (blocking tasks = high)
   - **Assignee**: Map to the appropriate agent role
   - **Tags**: Feature name, sprint number

## Role-to-Assignee Mapping

| Role Tag | Agent | Task Type |
|----------|-------|-----------|
| [FE]     | frontend-developer | UI components, pages, styling, client logic |
| [BE]     | backend-developer | Domain entities, use cases, repositories, data layer |
| [GD]     | graphical-designer | Visual design, wireframes, mockups |
| [CR]     | code-reviewer | Code review, architecture audit |

## Task Dependencies
Create tasks in dependency order:
1. BE domain/use cases -> BE repositories -> FE implementation
2. GD wireframes/mockups -> FE implementation
3. Both tracks can run in parallel

## Task Structure Strategy
Choose the structure based on feature complexity:

**Simple features** (roughly 5 or fewer tasks):
- Create ONE parent task named: `[Feature name] - Brief description`
- Create subtasks under it for each individual task from tasks.md
- Subtask names: `[ROLE] Task description`

**Complex features** (more than 5 tasks, or multiple parallel tracks):
- Create multiple standalone tasks
- Every task name MUST include the feature name as a prefix so they can be filtered together
- Format: `[Feature name] [ROLE] Task description`

When in doubt, prefer the simple approach (parent + subtasks).
