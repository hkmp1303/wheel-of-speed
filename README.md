# Wheel-of-speed
A minimal two player word game written in .NET Minimal API and React + Vite.

### Game Rules

Players must guess the correct word before the timer ends as the word is progressively revealed one letter at a time. When there is only one letter to go and the player who started the round has not guessed the word, the opponent gets 20 seconds to guess to word and earn the reward.

Reward amounts are determined by a spin on the prize wheel at the start of the round. During each round one player spins the wheel and starts guessing. After the timer expires the opponent gets their chance to guess if player was not sucessful.

**[Play Live Demo](https://wheel-of-speed-1.onrender.com)**

## Technology Stack

### Frontend
- **React** 18.3.1 - UI framework
- **Vite** 5.4.2 - Build tool and dev server
- **SignalR Client** 8.0.8 - Real-time communication
- **CSS Modules** - Component styling

### Backend
- **.NET** 8.0 - Runtime framework
- **ASP.NET Core Minimal API** - REST endpoints
- **SignalR** 8.0.8 - WebSocket server for real-time updates
- **Swagger** (Swashbuckle 6.6.2) - API documentation

### Testing
- **xUnit** 2.9.2 - Unit testing framework
- **Moq** 4.20.72 - Mocking library
- **FluentAssertions** 6.12.1 - Assertion library
- **Playwright** 1.54.2 - End-to-end testing
- **Newman** 6.2.1 - API testing (Postman CLI)

### DevOps & Deployment
- **GitHub Actions** - CI/CD pipeline
- **Docker** - Containerization
- **Render** - Cloud hosting platform

### Development Tools
- **Node.js** 20.x - JavaScript runtime
- **npm** - Package manager
- **Git** - Version control

## Requirements

### System Requirements

- **Node.js** v20.x or higher
- **.NET SDK** 8.0 or higher
- **Git** - Version control

### Runtime Requirements

- Backend runs on port **5000**
- Frontend runs on port **5173**
- **In-memory storage** (no database required)

### Functional Requirements

- [x] two player minimum to start a game
- [x] generate random word from word bank
- [x] display blank spaces corresponding to each letter in the word
- [x] reveal letters one by one
- [x] reveal letters randomly
- [x] letters are revealed by a timer
- [x] Reward for each word is determined by spinning the wheel
  - [ ] skip animation
- [x] player registration - players enter their name
- [x] multiplayer
  - [x] guid link to the match
  - [x] each player must ready up
- [x] score attribution for the player that guesses first
- [x] match length - four rounds, each word is a round
- [x] players have at least 20 seconds to guess per turn

#### Additional feature backlog
- [ ] not revealing vowels
- [x] word length selection
- [ ] language selection
  - [ ] multiple languages
- [ ] upload a custom word bank
- [ ] timer length selection
- [ ] additional advantages or disadvantages added to the wheel - for example point multipliers
- [ ] damage mode - each player takes a turn spinning the wheel
    - points are gained when the spinning player wins, by correctly guessing first
    - points are lost when the spinning player's opponent wins, guesses correctly first

## 🚀 How to Run

### Initial Setup

```shell
git clone git@github.com:hkmp1303/wheel-of-speed.git
cd wheel-of-speed
```

### Option 1: Run Both Services (Recommended)

```shell
./run.sh
```

This starts both the backend (port 5000) and frontend (port 5173).

### Option 2: Run Services Separately

**Backend:**
```shell
dotnet run --project Server/WheelOfSpeed.Server.csproj
```

**Frontend:**
```shell
cd frontend
npm install
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **API Documentation:** http://localhost:5000/swagger

## Testing

### Run All Tests
```shell
./test.sh
```

### Run Individual Test Suites

**Backend Unit Tests:**
```shell
dotnet test wheel-of-speed.sln
```

**Frontend E2E Tests:**
```shell
cd frontend
npm run test:e2e
```

**API Tests:**
```shell
cd frontend
npm run test:api
```

## Project Structure

```
wheel-of-speed/
├── Server/                          # Backend (.NET 8.0)
│   ├── Api/                        # REST endpoint definitions
│   │   └── MatchEndpoints.cs       # Match-related HTTP APIs
│   ├── Core/                       # Core game logic
│   │   └── Game/
│   │       └── MatchEngine.cs      # Game rules and state machine
│   ├── Hubs/                       # SignalR real-time hubs
│   │   └── MatchHub.cs             # WebSocket connection handler
│   ├── Models/                     # Data models and contracts
│   │   └── Contracts.cs            # DTOs and enums
│   ├── Services/                   # Business logic services
│   │   ├── InMemoryMatchService.cs # Match orchestration
│   │   └── WordBankService.cs      # Word generation
│   ├── Program.cs                  # Application entry point
│   └── Dockerfile                  # Container configuration
│
├── frontend/                        # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── PrizeWheel.jsx      # Animated prize wheel
│   │   │   ├── Scoreboard.jsx      # Player scores display
│   │   │   ├── ConfirmDialog.jsx   # Modal dialogs
│   │   │   └── lobby/              # Lobby-specific components
│   │   ├── context/
│   │   │   └── GameContext.jsx     # Global state management
│   │   ├── pages/                  # Route pages
│   │   │   ├── HomePage.jsx        # Landing page
│   │   │   ├── LobbyPage.jsx       # Pre-game lobby
│   │   │   ├── MatchPage.jsx       # Active gameplay
│   │   │   └── RulesPage.jsx       # Game rules display
│   │   ├── utils/
│   │   │   └── messageFormatter.js # Message formatting logic
│   │   └── main.jsx                # App entry point
│   ├── tests/                      # Playwright E2E tests
│   └── vite.config.js              # Build configuration
│
├── Testing/                         # Test suites
│   ├── UnitTests/                  # xUnit backend tests
│   │   └── WheelOfSpeed.UnitTests/
│   │       ├── MatchEngineTests.cs
│   │       ├── InMemoryMatchServiceCreateMatchTests.cs
│   │       └── WordBankServiceTests.cs
│   ├── ApiTests/                   # Newman/Postman tests
│   │   └── wheel-of-speed.postman_collection.json
│   └── BDD/                        # Gherkin feature files
│       └── Features/
│
├── .github/workflows/               # CI/CD pipelines
│   └── ci.yml                      # GitHub Actions workflow
│
├── docs/                           # Documentation
│   ├── testing-plan.md
│   ├── pipeline-description.md
│   └── game-rules.md
│
├── render.yaml                     # Render deployment config
├── run.sh                          # Local dev startup script
└── test.sh                         # Test execution script
```

## Project Scope

This project was developed as a group assignment for a course on **Test-Driven and Behavior-Driven Development with CI/CD**.

### Learning Objectives

The project demonstrates:

1. **Test-Driven Development (TDD)**
   - Unit tests written in conjunction with or before implementation
   - Focus on core game logic, state transitions, and input validation
   - Comprehensive test coverage across multiple layers

2. **Behavior-Driven Development (BDD)**
   - Gherkin feature specifications in `Testing/BDD/Features/`
   - User flow descriptions for game behavior
   - Living documentation of intended functionality

3. **Multi-Layer Testing Strategy**
   - **Unit Tests** (xUnit): Game rules, state management, business logic
   - **API Tests** (Newman): REST endpoint validation
   - **E2E Tests** (Playwright): Critical user flows and UI interactions
   - See `docs/testing-plan.md` for detailed test coverage

4. **CI/CD Pipeline Automation**
   - GitHub Actions with parallel job execution
   - Automated build, test, and deployment
   - YAML-based pipeline configuration with caching
   - Continuous Delivery to Render cloud platform
   - See `docs/pipeline-description.md` for complete pipeline documentation

5. **Iterative Development**
   - Feature slicing and incremental delivery
   - Agile artifacts (wireframes, mockups) in `docs/agile/`

### Key Features
- **Real-time Multiplayer** - Two players compete simultaneously using SignalR WebSocket connections
- **Turn-based Gameplay** - Players alternate rounds with progressive word reveal mechanics
- **Prize Wheel System** - Rewards determined by spinning a visual prize wheel (100-500 points)
- **Difficulty Levels** - Easy (4 letters), Normal (6 letters), Hard (8 letters)
- **Dynamic Timer** - Timer length adjusts based on word length and game phase
- **Match Sharing** - Join matches via unique GUID codes
- **In-browser Experience** - fully web-based
- **Responsive Design** - Retro UI with CSS module and custom styling

### Known Limitations

- **DevSecOps**: Security controls (dependency scanning, vulnerability analysis) are planned but not yet implemented in the pipeline
- **BDD Integration**: Gherkin features exist but are not yet executed in CI
- **State Persistence**: In-memory storage only (no database)
- **Error Handling**: Simplified for educational purposes

## Development Process

Collaboration for early planning and development occured in Miro and is available to view  [here](https://miro.com/app/board/uXjVGpDGxUI=/?share_link_id=347895910110).

### Documentation

- **Testing Strategy**: `docs/testing-plan.md` - Comprehensive test coverage matrix and strategy
- **CI/CD Pipeline**: `docs/pipeline-description.md` - Complete pipeline architecture and stages
- **Deployment Guide**: `DEPLOY_RENDER.md` - Render cloud deployment instructions
- **Game Rules**: `docs/game-rules.md` - Detailed game mechanics
- **User Stories**: `user-stories.md` - Feature requirements and acceptance criteria
- **Files by Feature**: `docs/files-by-feature.md` - Code organization and authorship

## Relevant branches

- A copy of the main branch at the time of the project presentation
  - [demo](../../tree/demo)

## Authors

This project was developed as a group assignment.

- Christian
  - @Mezea11
- Emmanuel
  - @mannilowman
- Heather
  - @hkmp1303
- Mohamed
  - @mohamedadam1129

README and CHANGELOG authored by: Heather
