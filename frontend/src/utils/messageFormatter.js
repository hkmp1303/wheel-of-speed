/**
 * Generates targeted messaging for game events
 * Considers the current player's role (active player vs opponent)
 * to provide context-appropriate messages
 */

/**
 * Formats an incorrect guess message based on player role
 * @param {boolean} isActivePlayer - Whether the current player is the active guesser
 * @returns {object} Object with message string and CSS class name
 */
export function formatIncorrectGuessMessage(isActivePlayer) {
  if (isActivePlayer) {
    return {
      text: "Incorrect guess. Try again!",
      class: "incorrect-guess-active"
    };
  } else {
    return {
      text: "That guess didn't work.",
      class: "incorrect-guess-opponent"
    };
  }
}

/**
 * Formats a correct answer message
 * @param {string} playerName - Name of the player who guessed correctly
 * @param {number} points - Points awarded for the correct answer
 * @returns {object} Object with message string and CSS class name
 */
export function formatCorrectAnswerMessage(playerName, points) {
  return {
    text: `Correct answer, ${playerName} is awarded ${points} points.`,
    class: "correct-answer"
  };
}

/**
 * Formats a final guess message
 * @returns {object} Object with message string and CSS class name
 */
export function formatFinalGuessMessage() {
  return {
    text: "⚠ Final Guess! The wheel value is locked. Make your guess!",
    class: "final-guess-warning"
  };
}

/**
 * Determines if a message should be shown to the current player
 * @param {string} messageType - Type of message (e.g., 'incorrect-guess', 'correct-answer')
 * @param {boolean} isActivePlayer - Whether the current player is the active player
 * @returns {boolean} Whether the message should be displayed
 */
export function shouldShowMessage(messageType, isActivePlayer) {
  // For now, show all incorrect guess messages to everyone
  // Correct answer messages are always shown
  // Future: could expand this logic for other message types
  return true;
}
