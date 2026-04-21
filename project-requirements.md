# Projektuppgift – Test- och beteendedriven utveckling och leverans av ett ordspel

## Inledning

I den här uppgiften ska ni inte bara bygga ett system – ni ska visa att ni kan bygga det på ett genomtänkt sätt.

Ni kommer att arbeta med testning, beteenden och automatisering som en naturlig del av utvecklingen. Det innebär att testning inte är något som görs i slutet, utan något som är med från början och påverkar hur systemet byggs.

Ni ska arbeta med:

- **testdriven utveckling (TDD)**, där tester styr implementationen
- **beteendedriven utveckling (BDD)**, där användarens flöden står i centrum
- **CI/CD**, där bygg, test, kvalitetssäkring och leverans/publicering automatiseras

Målet är att ni ska få erfarenhet av hur kod, tester och pipeline tillsammans skapar ett system med kvalitet.

---

## Vad går uppgiften ut på?

Ni ska utveckla ett ordspel där minst två spelare deltar och interagerar enligt definierade regler.

Spelet ska vara turbaserat och innehålla logik för exempelvis:

- spelarnas drag
- poäng eller resultat
- spelstatus, till exempel pågående eller avslutat

Spelet ska vara en egen variant, inte en kopia av ett befintligt spel. Det är viktigt eftersom ni då själva behöver formulera regler, beteenden och testfall.

Exempel på spelvarianter som ni kan ta inspiration av finns här: **Word games**

Systemet ska bestå av:

- en **backend** med affärslogik, state-hantering och API
- en **enklare klient** (valfri nivå) som gör det möjligt att spela spelet

---

## Testning som en del av utvecklingen

Testning ska genomsyra hela arbetet. Ni förväntas arbeta testdrivet, vilket innebär att tester skrivs i samband med – eller före – implementationen.

Fokus ska ligga på att testa centrala delar av systemet, till exempel:

- spelregler
- state transitions
- validering av input

Utöver enhetstestning och integrationstestning ska ni också arbeta med:

- **API-testning**
- **End-to-end testing (UI/System)**

Detta för att säkerställa att systemets delar fungerar tillsammans.

Ni ska använda **beteendedriven utveckling (BDD)** för att beskriva och testa användarflöden i gränssnittet.

---

## CI/CD och automatisering

En central del av uppgiften är att sätta upp en **CI/CD-pipeline**, till exempel med **GitHub Actions**.

Pipelinen ska fungera som ett automatiserat flöde som kan köras kontinuerligt under utveckling. När ni gör ändringar i koden och pushar eller mergar till en release-branch ska pipelinen automatiskt:

- bygga applikationen
- köra tester (unit, API och eventuellt UI)
- visa resultat från körningen

Ni ska strukturera pipelinen med **YAML** och arbeta med begrepp som:

- jobs
- steps

Det är också relevant att hantera enklare delar som:

- secrets
- caching

Som en del av **DevSecOps** ska pipelinen även innehålla säkerhetskontroller, till exempel:

- dependency scanning
- sårbarhetsanalys

Ni ska avslutningsvis implementera **Continuous Delivery**, med automatisk deployment till en server eller driftmiljö.

---

## Arbetsprocess

Ni ska arbeta iterativt och strukturerat. Det innebär att ni bryter ner funktionalitet i mindre delar (**feature slicing**) och planerar hur utveckling och testning ska ske parallellt.

Testning och implementation ska gå hand i hand, och pipelinen ska användas löpande för att verifiera att systemet fungerar.

Ni ska löpande underhålla en enkel **testplan** som beskriver vad som testas och hur.

---

## Dokumentation och rapport

Ni ska lämna in:

- källkod och repository
- testplan
- en beskrivning av er pipeline

Dessutom ska du skriva en individuell rapport där du reflekterar över arbetet.

I rapporten ska du resonera kring:

- testdriven utveckling
- beteendedriven utveckling
- testbarhet
- skillnader mellan olika testmetoders tillämpning och värde
- hur CI/CD påverkar kvalitet och produktion

Du ska också reflektera över:

- begränsningar i er lösning
- hur lösningen skulle kunna förbättras

Rapporten behöver inte vara lång – cirka **300–1000 ord** räcker.

---

## Redovisning

Ni redovisar ert projekt i helklass.

Då ska ni:

- visa upp spelet
- demonstrera tester och pipeline
- förklara hur ni har arbetat och vilka val ni gjort

Era klasskamrater ska kunna speltesta ert spel på sina datorer.

---

## Bedömning

### Godkänt (G)

För att bli godkända ska ni:

- ha utvecklat ett fungerande spel med fungerande testning
- ha tester som täcker centrala delar av systemet
- ha en CI/CD-pipeline som bygger, kör tester och driftsätter
- visa att ni förstår grunderna i testning och kvalitet
- visa att ni förstår och kan tillämpa kursens testmetoder

### Väl godkänt (VG)

För att få VG ska ni dessutom:

- visa på ett fördjupat genomförande och förståelse av testdriven utveckling
- visa på ett kvalitativt arbetssätt med god testbarhet och god testtäckning
- visa på ett fördjupat genomförande och förståelse av användning av CI/CD-pipelines med säkerhetskontroller
