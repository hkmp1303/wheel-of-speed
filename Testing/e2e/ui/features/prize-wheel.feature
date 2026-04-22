Feature: Prize Wheel
  As a player in Wheel of Speed
  I want to spin the wheel to determine the point value for my guess
  So that I can earn points by answering correctly

  Background:
    Given two players have joined a match
    And both players have marked themselves as ready
    And the match has started at Round 1/3

  # ──────────────────────────────────────────────
  # Wheel Rendering and Visual Indicators
  # ──────────────────────────────────────────────

  Scenario: Wheel renders with all 5 slices visible
    When the active player views the match page
    Then the wheel should be visible
    And the wheel should display exactly 5 slices
    And each slice should display one of the values: 100, 200, 300, 400, 500

  Scenario: Wheel has a pointer indicator at the top
    When the active player views the match page
    Then the wheel should render with a top pointer indicator
    And the pointer should mark the landing position

  # ──────────────────────────────────────────────
  # Wheel Spin Mechanics
  # ──────────────────────────────────────────────

  Scenario: Only the active player can spin the wheel
    When the active player clicks the Spin button
    Then the wheel should spin
    And a point value between 100 and 500 should be assigned

  Scenario: Non-active player cannot spin the wheel
    When the non-active player attempts to click the Spin button
    Then the Spin button should be disabled
    And the wheel should not spin

  Scenario: Spin button is disabled after the first spin
    When the active player spins the wheel
    Then the Spin button should become disabled
    And the wheel should lock to a landing position

  Scenario: Spinning the wheel reveals the first letter
    When the active player spins the wheel
    Then at least one letter of the word should be revealed
    And the masked word should update immediately

  # ──────────────────────────────────────────────
  # Wheel Animation and Visual Feedback
  # ──────────────────────────────────────────────

  Scenario: Wheel displays landing animation
    When the active player spins the wheel
    Then the wheel should rotate smoothly
    And the wheel should land on a specific slice
    And the landed slice should be marked with the 'landed' class

  Scenario: Text glow effect appears after landing
    When the active player spins the wheel
    And the spin animation completes
    Then the text of the landed slice should display a glow effect
    And the glow effect should appear within 7 seconds
