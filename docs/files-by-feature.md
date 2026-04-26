# Wheel of Speed - Files Organized by Feature

## Project Overview
A minimal two-player word game built with .NET Minimal API and React + Vite.

**Note:** The initial project structure and boilerplate were based on the [EverySecondLetter](https://github.com/WeeHorse/every_second_letter) repository, provided by the teacher as a reference.

### Team Members
- **Christian** (@Mezea11)
- **Emmanuel** (@mannilowman)
- **Heather** (@hkmp1303)
- **Mohamed** (@mohamedadam1129)
- **Samir** (@samirpolozen)

---

## 1. **Core Game Engine & Business Logic**

### Match Engine (Game Core)
- `Server/Core/Game/MatchEngine.cs` - **Authors:** Heather, Mezea11, Mohamed
  - Core game logic, match state management, turn rotation, spin mechanics, guess validation

### Services
- `Server/Services/InMemoryMatchService.cs` - **Authors:** Heather, mannilowman, Mezea11, Mohamed
  - Match service handling match creation, joining, gameplay coordination
- `Server/Services/WordBankService.cs` - **Authors:** Heather, mannilowman, Mezea11
  - Word retrieval and word bank management

### Models & Contracts
- `Server/Models/Contracts.cs` - **Authors:** Heather, mannilowman, Mezea11, Mohamed
  - Data models, DTOs, enums for game state

---

## 2. **API & Real-Time Communication**

### API Endpoints
- `Server/Api/MatchEndpoints.cs` - **Authors:** mannilowman, Mezea11
  - REST API endpoints for match operations

### SignalR Hubs
- `Server/Hubs/MatchHub.cs` - **Authors:** Heather, Mezea11
  - Real-time WebSocket communication for live game updates

### Application Setup
- `Server/Program.cs` - **Authors:** Heather, Mezea11
  - ASP.NET Core configuration, dependency injection, middleware, CORS setup

### Project Configuration
- `Server/WheelOfSpeed.Server.csproj` - **Author:** Mezea11
  - .NET project configuration and dependencies

---

## 3. **Frontend - React Application**

### Core Application
- `frontend/src/App.jsx` - **Author:** Mezea11
  - Main application component, routing, navigation logic
- `frontend/src/main.jsx` - **Author:** Mezea11
  - Application entry point
- `frontend/index.html` - **Author:** Mezea11
  - HTML template

### State Management
- `frontend/src/context/GameContext.jsx` - **Authors:** Heather, mannilowman, Mezea11, Mohamed
  - Global game state management, SignalR connection handling

### Pages
- `frontend/src/pages/HomePage.jsx` - **Authors:** mannilowman, Mezea11, Mohamed
  - Home/landing page
- `frontend/src/pages/LobbyPage.jsx` - **Authors:** Mezea11, Mohamed
  - Lobby/waiting room page
- `frontend/src/pages/MatchPage.jsx` - **Authors:** Heather, mannilowman, Mezea11, Mohamed
  - Main gameplay page
- `frontend/src/pages/RulesPage.jsx` - **Author:** Mezea11
  - Game rules and instructions

### Components - Lobby
- `frontend/src/components/lobby/CreateLobbyForm.jsx` - **Authors:** Mezea11, Mohamed
  - Form for creating new game lobbies
- `frontend/src/components/lobby/JoinLobbyForm.jsx` - **Authors:** Mezea11, Mohamed
  - Form for joining existing lobbies

### Components - Game Elements
- `frontend/src/components/PrizeWheel.jsx` - **Author:** Heather
  - Prize wheel animation and spin logic
- `frontend/src/components/PrizeWheel.module.css` - **Author:** Heather
  - Prize wheel styling
- `frontend/src/components/Scoreboard.jsx` - **Author:** Mezea11
  - Player scores display
- `frontend/src/components/ConfirmDialog.jsx` - **Author:** Mezea11
  - Confirmation dialog component

### Utilities
- `frontend/src/utils/messageFormatter.js` - **Author:** Heather
  - Message formatting utilities

### Styling
- `frontend/src/styles.css` - **Authors:** Heather, mannilowman, Mezea11
  - Global styles
- `frontend/src/colors.css` - **Author:** Heather
  - Color scheme definitions

### Build Configuration
- `frontend/package.json` - **Author:** Mezea11
  - NPM dependencies and scripts
- `frontend/vite.config.js` - **Authors:** Heather, Mezea11, Mohamed
  - Vite build configuration
- `frontend/eslint.config.js` - (No git history)
  - ESLint configuration

---

## 4. **Testing**

### Unit Tests
- `Testing/UnitTests/WheelOfSpeed.UnitTests/MatchEngineTests.cs` - **Authors:** Heather, Mezea11, Mohamed
  - Core match engine tests
- `Testing/UnitTests/WheelOfSpeed.UnitTests/MatchEngineSpinTests.cs` - **Author:** Heather
  - Wheel spin mechanism tests
- `Testing/UnitTests/WheelOfSpeed.UnitTests/MatchEngineRematchTests.cs` - **Authors:** Mezea11, Mohamed
  - Rematch functionality tests
- `Testing/UnitTests/WheelOfSpeed.UnitTests/InMemoryMatchServiceCreateMatchTests.cs` - **Author:** Mezea11
  - Match creation service tests
- `Testing/UnitTests/WheelOfSpeed.UnitTests/InMemoryMatchServiceRematchTests.cs` - **Author:** Mezea11
  - Rematch service tests
- `Testing/UnitTests/WheelOfSpeed.UnitTests/WordBankServiceTests.cs` - **Authors:** Heather, mannilowman
  - Word bank service tests
- `Testing/UnitTests/WheelOfSpeed.UnitTests/WheelOfSpeed.UnitTests.csproj` - **Authors:** Mezea11, Mohamed
  - Unit test project configuration
- `Testing/InMemoryMatchServiceTests.cs` - **Authors:** Mezea11, Mohamed
  - Additional service tests

### BDD Tests (Behavior-Driven Development)
- `Testing/BDD/Features/Rematch.feature` - **Author:** Mezea11
  - Rematch feature specifications
- `Testing/BDD/Features/WordBank.feature` - **Author:** mannilowman
  - Word bank feature specifications

### E2E Tests (End-to-End)
- `frontend/tests/lobby-flow.spec.js` - **Authors:** Heather, mannilowman, Mezea11, Mohamed
  - Lobby flow end-to-end tests
- `frontend/tests/prize-wheel.spec.js` - **Authors:** Heather
  - Prize wheel end-to-end tests
- `frontend/tests/rematch-flow.spec.js` - **Authors:** Mezea11, Mohamed
  - Rematch flow end-to-end tests
- `Testing/e2e/ui/features/prize-wheel.feature` - **Authors:** Heather
  - Prize wheel BDD feature file
- `Testing/e2e/ui/steps/prize-wheel.steps.js` - **Authors:** Heather
  - Prize wheel BDD step definitions
- `frontend/playwright.config.js` - **Author:** Mezea11
  - Playwright test configuration

### API Tests
- `Testing/ApiTests/wheel-of-speed.postman_collection.json` - **Author:** Mezea11
  - Postman API test collection
- `Testing/ApiTests/local.postman_environment.json` - **Author:** Mezea11
  - Postman environment configuration

### Test Documentation
- `Testing/TESTING-PLAN.md` - **Author:** Mezea11
  - Intial testing strategy and plan
- `docs/TESTING-PLAN.md` - **Author:** Heather
  - Comprehensive testing documentation and strategy
---

## 5. **DevOps & CI/CD**

### GitHub Actions
- `.github/workflows/ci.yml` - **Author:** Mezea11
  - Continuous Integration pipeline configuration

### Deployment
- `render.yaml` - **Author:** Mezea11
  - Render.com deployment configuration
- `DEPLOY_RENDER.md` - **Author:** Mezea11
  - Deployment instructions for Render
- `Server/Dockerfile` - (No git history)
  - Docker containerization configuration

### Build & Run Scripts
- `build.sh` - **Author:** Heather
  - Build automation script
- `run.sh` - **Author:** Heather
  - Application run script
- `test.sh` - **Author:** Heather
  - Test execution script
- `repair_matchengine.ps1` - **Author:** Mezea11
  - PowerShell utility for match engine repairs

---

## 6. **Documentation**

### Project Documentation
- `README.md` - **Author:** Heather
  - Main project documentation
- `README copy.md` - **Author:** Mezea11
  - Backup/alternate README
- `user-stories.md` - **Author:** Mezea11
  - User stories and epic structure
- `project-requirements.md` - **Author:** Mezea11
  - Project requirements (Swedish)
- `docs/CHANGELOG.md` - **Authors:** Heather
  - Version history and changes
- `docs/PIPELINE-DESCRIPTION.md` - **Author:** Heather
  - CI/CD pipeline description

---

## Feature Contribution Summary

### Heather
- **Primary Focus:** Architecture, core game engine, word services, prize wheel, testing infrastructure
- **Key Contributions:**
  - Match engine core logic
  - Word bank service
  - Prize wheel UI/UX
  - Build and test scripts
  - E2E testing (lobby flow, prize wheel)
  - Message formatting utilities
  - Server Architecture (dependency injection, CORS)
  - Documentation (README, changelog)
  - Project planning (game rules, MVP, wireframe)

### Mezea11 (Christian)
- **Primary Focus:** Frontend, DevOps, testing
- **Key Contributions:**
  - **Initial project setup**: Cloned and adapted from teacher-provided [EverySecondLetter](https://github.com/WeeHorse/every_second_letter) reference repository (PR #15)
  - Frontend architecture: pages (Home, Lobby, Match, Rules)
  - UI components (Scoreboard, ConfirmDialog, lobby forms)
  - Game-specific MatchEngine logic and services
  - SignalR hub implementation for real-time multiplayer
  - API endpoints for match operations
  - CI/CD pipeline (GitHub Actions)
  - Deployment configuration (Render.com)
  - Testing (BDD features, E2E tests, unit tests)
  - Project documentation (user stories, testing plan)

### mannilowman (Emmanuel)
- **Primary Focus:** Services, API development, testing
- **Key Contributions:**
  - Match service implementation
  - Word bank service
  - API endpoints
  - Game context state management
  - BDD feature: Word bank
  - E2E testing (lobby flow)
  - UI styling

### Mohamed
- **Primary Focus:** Game logic, lobby features, testing
- **Key Contributions:**
  - Match engine logic
  - Lobby forms (create/join)
  - Match service
  - Game context
  - Unit tests (match engine, rematch)
  - E2E testing (lobby flow, rematch)
