## ADDED Requirements

### Requirement: Praxis renders a full-screen generative OS shell
The system SHALL render a full-screen Praxis shell with a dark navy visual theme, a top bar containing Praxis branding, and a bottom-centered prompt bar inviting app generation.

#### Scenario: Initial shell render
- **WHEN** a user opens the Praxis application
- **THEN** the viewport SHALL display a full-screen desktop shell with the Praxis logo in the top bar and a visible prompt bar containing placeholder text equivalent to "Describe an app and watch it appear..."

### Requirement: Praxis manages generated apps as desktop windows
The system SHALL represent each generated app in its own desktop window with a visible title, minimize control, close control, drag behavior, resize behavior, and focus ordering.

#### Scenario: Opening a generated app window
- **WHEN** the system creates a generated app from a user request
- **THEN** the application SHALL open a new window for that app and place it above previously unfocused windows

#### Scenario: Repositioning a window
- **WHEN** the user drags a window by its title bar
- **THEN** the system SHALL update the window position while preserving the app content and controls

#### Scenario: Resizing a window
- **WHEN** the user resizes a generated app window
- **THEN** the system SHALL update the window bounds without closing or recreating the app session

#### Scenario: Minimizing and closing a window
- **WHEN** the user clicks minimize or close on a generated app window
- **THEN** the system SHALL minimize the window from the desktop view or remove it entirely, respectively

### Requirement: Praxis presents generation progress inside the shell
The system SHALL make builder progress visible in the shell so users can perceive that the app is being written over time rather than appearing only after completion.

#### Scenario: Visible in-progress generation
- **WHEN** an app is being generated
- **THEN** the shell SHALL display an in-progress state associated with the target window until the app is ready to render
