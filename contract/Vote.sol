contract Vote {

    event Ballot (
        address indexed voter,
        uint8 proposal
    );

    event VoterRegistered (
        address indexed voter
    );

    event VoteError (
        address indexed user,
        string message
    );

    struct Voter {
        bool registered;
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

    modifier onlyChairPerson() {
        if (msg.sender != chairperson)
            throw;
        _
    }

    modifier onlyRegisteredVoter() {
        Voter voter = voters[msg.sender];

        if (voter.voted || !voter.registered)
            throw;
        _
    }

    function registerVoter(address voterAddress) onlyChairPerson {
        Voter voter = voters[voterAddress];

        if (voter.voted || voter.registered)
            throw;

        voter.registered = true;

        VoterRegistered(voterAddress);
    }

    // Give a single vote to proposal $(proposal).
    function vote(uint8 proposal) onlyRegisteredVoter {
        Voter voter = voters[msg.sender];

        if (proposal >= proposals.length)
            return; // FIXME: emit a BallotError event

        voter.voted = true;
        voter.vote = proposal;
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

    /* This unnamed function is called whenever someone tries to send ether to it */
    function () {
        throw; // Prevents accidental sending of ether
    }
}
