export interface TicketTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  body: string;
}

export const DEFAULT_TEMPLATES: TicketTemplate[] = [
  {
    id: "standard",
    name: "Standard feature",
    description: "Full template with user story, AC, and design link",
    sections: ["User Story", "Description", "Assumptions", "Acceptance Criteria", "Requirements", "Design", "Implementation"],
    body: `## User Story\nAs a [persona], I want to [action], so that [outcome].\n\n## Description\n[What this screen/feature is and its role in the flow]\n\n## Assumptions\n- [assumption]\n\n## Acceptance Criteria\n- **Given** [context]\n- **When** [action]\n- **Then** [outcome]\n\n## Requirements\n- [specific requirement]\n\n## Design\n[Figma embed link or placeholder]\n\n## Implementation\n[Notes for dev team or "Open to dev team."]`,
  },
  {
    id: "bug",
    name: "Bug report",
    description: "Steps to reproduce, expected vs actual behaviour",
    sections: ["Description", "Steps to reproduce", "Expected behaviour", "Actual behaviour", "Environment"],
    body: `## Description\n[Short summary of the bug]\n\n## Steps to reproduce\n1. [step]\n2. [step]\n3. [step]\n\n## Expected behaviour\n[What should happen]\n\n## Actual behaviour\n[What actually happens]\n\n## Environment\n- Platform: [web / iOS / Android]\n- Version: [version]`,
  },
  {
    id: "spike",
    name: "Tech spike",
    description: "Investigation task with a defined output",
    sections: ["Goal", "Questions to answer", "Constraints", "Output"],
    body: `## Goal\n[What we want to learn or decide]\n\n## Questions to answer\n- [question]\n\n## Constraints\n- Time-boxed to [X days]\n\n## Output\n[What artefact or decision comes out of this spike]`,
  },
];
