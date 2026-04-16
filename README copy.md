# Wheel of Speed Boilerplate

Det här är en avskalad boilerplate baserad på kodexemplet **Every Second Letter**, men ombyggd för era user stories i **Wheel of Speed**.

## Vad som är kvar från mallen i ny form
- Tydlig backendstruktur med separata lager
- Match/lobby-flow via API
- En enkel spelmotor som är lätt att testdriva
- React-frontend med globalt game context
- Unit test-projekt
- GitHub Actions-CI för build och test

## Vad som är bortskalat
- Claim/dispute-logik från originalspelet
- Databaslager och seedning
- Onödigt komplex state kring originalets spelregler

## Vad boilerplaten redan stödjer
### Backend
- `POST /api/matches` skapa match + unik guidkod
- `POST /api/matches/{guid}/join` joina match
- `POST /api/matches/{guid}/ready` ready-system
- Automatisk matchstart när alla är ready och minst 2 spelare finns
- 3 rundor max
- Aktiv spelare
- Enkel word bank
- Spin endpoint
- Guess endpoint
- SignalR-broadcast för matchuppdateringar
- Timer loop och enkel reveal-logik

### Frontend
- Startvy
- Create Game
- Join Game via code
- Lobby med ready-status
- Matchvy med rundnummer, timer, ordmask, spin, guess och scoreboard

## Viktiga mappar
- `Server/` - backend API + spelmotor + SignalR
- `frontend/` - React-klient
- `Testing/UnitTests/` - start för TDD
- `.github/workflows/ci.yml` - enkel CI

## Rekommenderad nästa ordning
1. Byt namn på spelet/texter efter er vision
2. Förfina datamodellen
3. Flytta matchstate till databas när grundflödet sitter
4. Lägg till fler unit tests för varje user story
5. Lägg till BDD/E2E-testning
6. Lägg till CD/deploy

## Köra lokalt
### Backend
```bash
cd Server
dotnet restore
dotnet run
```
Backend kör då på standardporten från ASP.NET lokalt, ofta `http://localhost:5000` eller liknande.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Kommentar om arkitektur
Det viktigaste här är att ni nu har en **boilerplate**, inte en färdig produkt. Tanken är att ni ska kunna lägga in er egen logik utan att först behöva städa bort originalspelets regler.
