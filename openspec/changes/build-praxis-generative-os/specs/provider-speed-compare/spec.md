## ADDED Requirements

### Requirement: Praxis displays a Speed Compare panel
The system SHALL render a Speed Compare panel within the Praxis shell that compares throughput-oriented metrics for a faster provider versus a slower provider.

#### Scenario: Viewing the comparison panel
- **WHEN** a user opens Praxis
- **THEN** the shell SHALL display a Speed Compare panel showing separate entries for a fast provider path and a slow provider path

### Requirement: Speed Compare supports staged data sources
The system SHALL allow the Speed Compare panel to render placeholder or mocked values during PRE-BUILD and real measured values during CORE integration.

#### Scenario: Prebuild demo mode
- **WHEN** live provider telemetry is not yet connected
- **THEN** the panel SHALL still render using placeholder or mocked values without breaking the shell layout

#### Scenario: Live comparison mode
- **WHEN** real provider throughput measurements are available
- **THEN** the panel SHALL display those measured values using the same presentation surface without requiring a redesign of the shell UI
