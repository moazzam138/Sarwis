# **App Name**: Sarwis Control Panel

## Core Features:

- Waste Detection & UI Status: Monitors the IR sensor via Arduino communication to detect waste insertion, updates the UI status accordingly, and allows manual retries for false detections.
- Arduino Communication Interface: Manages USB serial communication with Arduino Uno, sending commands (e.g., OPEN_LID, CLOSE_LID), receiving real-time weight data, and handling connection stability and errors.
- QR Code Generation & Display: After a successful deposit, calls the backend API to generate a QR code with transaction details and coins earned, then displays it prominently on screen for scanning before auto-clearing.
- Guided Deposit Workflow UI: A step-by-step user interface guiding through the entire waste deposit process, from waiting for waste to displaying the final QR code, with real-time feedback.
- Real-time System Dashboard: Displays current connection status, IR sensor state, live weight readings, last deposit summary, and a log of recent errors and system health indicators.
- Robust Error Handling & Recovery: Provides graceful error handling for Arduino connection issues, API failures, deposit timeouts, and weight sensor malfunctions, offering clear feedback and retry options.
- Environmental Insight Tool: A generative AI tool that, upon successful deposit, provides a brief, engaging environmental fact or eco-tip to encourage sustainable practices and recognize the user's contribution.

## Style Guidelines:

- Primary interactive color: A vibrant, clean blue (`#2693C1`) signifying technology and ecological responsibility.
- Background color: A soft, muted light blue-grey (`#EEF5F7`) providing a clean and non-distracting canvas for the interactive elements and content.
- Accent color: A fresh turquoise (`#5CD5C7`) used for highlights, calls to action, and positive feedback states to draw attention.
- Main font: 'Inter' (sans-serif) for all text, chosen for its modern, clear, and highly legible characteristics suitable for instructions, dashboard information, and dynamic updates.
- Use a set of modern, clear line icons for all status indicators, system alerts, and interactive elements to ensure instant comprehension and a clean visual style.
- Adopt a clean, high-contrast, and responsive layout featuring large touch targets for critical actions and a focused, step-by-step workflow. Elements will arrange into a single-column flow on narrower views and utilize space efficiently on wider displays for dashboards and prominent QR code display.
- Incorporate subtle yet purposeful animations for UI transitions, particularly for the 'lid opening' and 'lid closing' stages, along with concise loading indicators to provide immediate visual feedback on system state and ongoing processes.