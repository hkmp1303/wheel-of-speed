Feature: Rematch
  As a player who has just finished a match
  I want to challenge my opponent to a rematch
  So that we can play again without returning to the lobby

  Background:
    Given two players have completed a full match
    And the match status is "Finished"
    And both players are still connected via SignalR

  # ──────────────────────────────────────────────
  # Initiating a rematch challenge
  # ──────────────────────────────────────────────

  Scenario: Challenger initiates a rematch
    When player "Alice" clicks the rematch button
    Then the server creates a new match with the same difficulty as the original
    And the new match is linked to the original match's join code
    And a "rematchChallenged" event is pushed to player "Bob"
    And the event contains the new match's join code
    And Alice sees a "Waiting for opponent..." message

  Scenario: Only one rematch can be pending per match
    Given player "Alice" has already initiated a rematch
    When player "Bob" also clicks the rematch button before responding
    Then the server returns a conflict error
    And no duplicate rematch match is created

  # ──────────────────────────────────────────────
  # Receiving a rematch challenge
  # ──────────────────────────────────────────────

  Scenario: Opponent receives a rematch challenge notification
    When player "Alice" initiates a rematch
    Then player "Bob" receives a "rematchChallenged" SignalR event
    And Bob sees an Accept and a Decline button

  # ──────────────────────────────────────────────
  # Accepting a rematch
  # ──────────────────────────────────────────────

  Scenario: Opponent accepts the rematch
    Given player "Alice" has initiated a rematch
    When player "Bob" clicks the Accept button
    Then the server joins Bob to the new match using the rematch join code
    And a "rematchAccepted" event is pushed to both players
    And the event contains the new match's join code
    And both players are navigated to the new match lobby

  Scenario: Both players are marked as not ready in the new match lobby
    Given player "Alice" has initiated a rematch
    When player "Bob" accepts the rematch
    Then the new match status is "Lobby"
    And neither player is marked as ready

  # ──────────────────────────────────────────────
  # Declining a rematch
  # ──────────────────────────────────────────────

  Scenario: Opponent declines the rematch
    Given player "Alice" has initiated a rematch
    When player "Bob" clicks the Decline button
    Then a "rematchDeclined" event is pushed to player "Alice"
    And Alice sees a "Rematch declined" message
    And the pending rematch match is removed from memory

  # ──────────────────────────────────────────────
  # Edge cases
  # ──────────────────────────────────────────────

  Scenario: Rematch cannot be initiated when match is still in progress
    Given a match with status "InProgress"
    When player "Alice" attempts to initiate a rematch
    Then the server returns an error
    And no new match is created

  Scenario: Challenger disconnects after initiating a rematch
    Given player "Alice" has initiated a rematch
    When player "Alice" disconnects
    Then the pending rematch is cancelled
    And a "rematchCancelled" event is pushed to player "Bob"
