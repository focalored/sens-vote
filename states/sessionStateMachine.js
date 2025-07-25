const VALID_TRANSITIONS = {
  draft: { startSession: "awaiting_moderator" },
  awaiting_moderator: {
    advanceRound: "awaiting_votes",
    finalizeSession: "complete",
  },
  awaiting_votes: { submitVotes: "awaiting_moderator" },
};

const getNextState = (current, action) => {
  const transitions = VALID_TRANSITIONS[current] || {};
  return transitions[action] || null;
};

module.exports = getNextState;
