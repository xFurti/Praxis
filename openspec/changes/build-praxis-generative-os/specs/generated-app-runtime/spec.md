## ADDED Requirements

### Requirement: Generated apps run in isolated iframe documents
The system SHALL render generated applications inside sandboxed `iframe` elements using `srcdoc` so generated HTML, CSS, and JavaScript remain isolated from the Praxis shell.

#### Scenario: Rendering a completed generated app
- **WHEN** the builder produces valid self-contained HTML for a generated app
- **THEN** the system SHALL load that HTML into a sandboxed `iframe srcdoc` container instead of injecting it into the shell DOM

### Requirement: Backend model access is abstracted behind a single provider entry point
The backend SHALL expose a `callModel({ role, messages, stream })` abstraction that uses provider and model configuration from environment variables and keeps API credentials server-side only.

#### Scenario: Backend receives a generation request
- **WHEN** the frontend requests model generation behavior
- **THEN** the backend SHALL route the request through `callModel({ role, messages, stream })` and SHALL NOT require the frontend to send or store API keys

### Requirement: Praxis supports a three-role generation pipeline
The system SHALL define distinct INTERPRETER, BUILDER, and FIXER roles, each with a separate system-prompt contract and responsibility in the app-generation lifecycle.

#### Scenario: Converting a user prompt into an app spec
- **WHEN** a user submits an app description
- **THEN** the INTERPRETER role SHALL transform the request into a structured JSON specification for downstream generation

#### Scenario: Building an app from a structured specification
- **WHEN** the BUILDER role receives a structured app specification and Praxis design-system guidance
- **THEN** it SHALL produce a self-contained HTML document intended for isolated rendering

#### Scenario: Repairing a failed generated app
- **WHEN** generated HTML encounters an error condition identified by the system
- **THEN** the FIXER role SHALL receive the HTML and error context and SHALL return corrected HTML for re-rendering

### Requirement: The builder output uses the Praxis design system
The system SHALL require generated app output to use the shared Praxis design-system classes for common interactive and display elements.

#### Scenario: Builder creates styled controls
- **WHEN** the BUILDER role emits controls such as buttons, cards, inputs, or display surfaces
- **THEN** the generated HTML SHALL apply Praxis design-system classes such as `.praxis-btn`, `.praxis-card`, `.praxis-input`, or `.praxis-display` where semantically appropriate

### Requirement: Praxis can accept optional screenshot input for interpretation
The system SHOULD support an optional screenshot input path that allows the INTERPRETER role to derive a structured app specification from a dropped image when provider capabilities allow it.

#### Scenario: Screenshot-enhanced prompt submission
- **WHEN** a user drops a screenshot into the prompt workflow and multimodal support is available
- **THEN** the system SHALL send the screenshot context to the INTERPRETER path and produce a structured app specification informed by the image
