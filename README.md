# Stubble To Spark South Punjab

I am building a functional Minimum Viable Product (MVP) for an AI Hackathon. The project is FAZA (فضا), an AI-powered Stubble-to-Fuel Negotiator that connects farmers in South Punjab to biomass power plants to prevent crop burning.

I need you to build this as a complete, interactive web application using Tailwind CSS.

Below is the complete, self-contained HTML/JS code. It acts as a Single Page Application (SPA) with two main views:

1. Authentication/Demo View: A clean launch portal with two distinct paths (Farmer Demo vs. Factory Demo).

2. Dashboard View: The main command center featuring a Bilingual UI (English/Urdu), a Leaflet map, a Chart.js donut chart, a 'Clean Air Subsidy Pool', a Natural Language LLM ingestion step, and a 4-step deterministic reasoning engine.

Crucial Architecture Requirement for the Hackathon:

This app is designed as a Hybrid AI System to prevent financial hallucinations:

LLM Engine: Handles only the Natural Language parsing (extracting acres, location, and deadline from voice/text inputs).

Deterministic Rules Engine: Handles all the financial math and subsidy calculations via plain code.

Please wire the "Extract Data via AI" button to a real LLM edge function if possible, or keep the simulated JavaScript timeout flow provided in the code so the frontend demo works perfectly.

Strict Design Constraints:

Strict Light Mode ONLY.

Absolutely NO emojis anywhere in the UI or code.

Keep the Urdu (Noto Nastaliq Urdu) fonts and right-to-left classes intact.

Ensure the Leaflet maps and Chart.js canvases initialize properly after the dashboard view becomes visible.

Please import this code and convert it into your native React/Vite environment. DO NOT remove any text, math logic, map functionality, chart updates, or UI elements.

Here is the full code to build the app from:

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stubble-to-spark-south-punjab.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a3dffe6e-298e-4cf1-82dc-dff4cbe84abe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
