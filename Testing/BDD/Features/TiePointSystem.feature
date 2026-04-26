Feature: Tie Point System
  As a game system
  I want to handle equal scores fairly
  So that no player is incorrectly declared winner in a tie

  Scenario: Match ends with a winner when one player has more points
    Given a match has finished
    And player "Alice" has 300 points
    And player "Bob" has 100 points
    When the match result is determined
    Then "Alice" should be declared the winner

  Scenario: Match ends in a draw when both players have equal points
    Given a match has finished
    And player "Alice" has 200 points
    And player "Bob" has 200 points
    When the match result is determined
    Then the match should be declared a draw
    And no player should be declared the winner

  Scenario: Match ends in a draw when both players have zero points
    Given a match has finished
    And player "Alice" has 0 points
    And player "Bob" has 0 points
    When the match result is determined
    Then the match should be declared a draw
    And no player should be declared the winner
