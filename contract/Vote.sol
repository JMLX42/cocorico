contract Vote {

    event Ballot (
        address indexed user,
        uint8 proposal
    );

    struct Voter {
        bool voted;
        uint8 vote;
    }
    struct Proposal {
        uint voteCount;
    }

    address chairperson;
    mapping(address => Voter) voters;
    Proposal[] proposals;

    // Create a new ballot with $(_numProposals) different proposals.
    function Vote(uint8 _numProposals) {
        chairperson = msg.sender;
        proposals.length = _numProposals;
    }

    // Give a single vote to proposal $(proposal).
    function vote(uint8 proposal) {
        Voter sender = voters[msg.sender];

        if (sender.voted || proposal >= proposals.length)
            return;

        sender.voted = true;
        sender.vote = proposal;
        proposals[proposal].voteCount += 1;

        Ballot(msg.sender, proposal);
    }

    function winningProposal() constant returns (uint8 winningProposal) {
        uint256 winningVoteCount = 0;
        for (uint8 proposal = 0; proposal < proposals.length; proposal++)
            if (proposals[proposal].voteCount > winningVoteCount) {
                winningVoteCount = proposals[proposal].voteCount;
                winningProposal = proposal;
            }
    }
}
