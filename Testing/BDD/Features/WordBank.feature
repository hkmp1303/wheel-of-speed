Feature: Word Bank
  As a game system
  I want to provide words of varying difficulty for each round
  So that players can choose a challenge level that suits them

  Background:
    Given the word bank is initialized with words for Easy, Normal and Hard difficulty
    And the wheel has defined point values of 100, 200, 300, 400 and 500

  # ──────────────────────────────────────────────
  # Word retrieval per difficulty
  # ──────────────────────────────────────────────

  Scenario: An easy word is returned when Easy difficulty is requested
    When the system requests a random word with difficulty "Easy"
    Then a non-empty word should be returned
    And the word should be 4 letters long

  Scenario: A normal word is returned when Normal difficulty is requested
    When the system requests a random word with difficulty "Normal"
    Then a non-empty word should be returned
    And the word should be 6 letters long

  Scenario: A hard word is returned when Hard difficulty is requested
    When the system requests a random word with difficulty "Hard"
    Then a non-empty word should be returned
    And the word should be 8 letters long

  Scenario: The default difficulty returns a Normal word
    When the system requests a random word without specifying difficulty
    Then a non-empty word should be returned
    And the word should be 6 letters long

  # ──────────────────────────────────────────────
  # Variety across requests
  # ──────────────────────────────────────────────

  Scenario Outline: Repeated requests for <difficulty> words return varied results
    When the system requests a "<difficulty>" word 50 times
    Then at least 2 different words should have been returned

    Examples:
      | difficulty |
      | Easy       |
      | Normal     |
      | Hard       |

  # ──────────────────────────────────────────────
  # Wheel values
  # ──────────────────────────────────────────────

  Scenario: A valid wheel value is returned when a player spins
    When the system generates a random wheel value
    Then the value should be one of 100, 200, 300, 400 or 500

  Scenario: Repeated wheel spins return varied values
    When the system generates a wheel value 50 times
    Then at least 2 different values should have been returned

  # ──────────────────────────────────────────────
  # Integration with match flow
  # ──────────────────────────────────────────────

  Scenario: A word matching the selected difficulty is assigned when a match starts
    Given two players have joined a lobby
    And the host has selected "Hard" difficulty
    And both players have marked themselves as ready
    When the match starts automatically
    Then the active round should display a masked word
    And the masked word should correspond to an 8-letter word

  Scenario: A new word of the same difficulty is assigned at the start of each round
    Given a match is in progress at "Normal" difficulty and round 1 has been completed
    When round 2 begins
    Then the active word should be a 6-letter word
    And the new word should be fully masked at the start of the round

  Scenario: The word is displayed as masked underscores before any letters are revealed
    Given a match has just started with the word "ROCKET" at Normal difficulty
    When no letters have been revealed yet
    Then the masked word displayed to players should be "_ _ _ _ _ _"
