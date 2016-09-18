pragma solidity ^0.4.2;

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

    mapping(address => Voter) voters;
    address chairperson;
    uint[] results;

    /* This unnamed function is called whenever someone tries to send ether to it */
    function () {
        throw; // Prevents accidental sending of ether
    }

    // Create a new vote with $(_numProposals) different results.
    function Vote(uint8 _numProposals) {
        chairperson = msg.sender;
        results.length = _numProposals;
    }

    modifier onlyChairPerson() {
        if (msg.sender != chairperson)
            throw;
        _;
    }

    modifier onlyRegisteredVoter() {
        Voter voter = voters[msg.sender];

        if (voter.voted || !voter.registered)
            throw;
        _;
    }

    function registerVoter(address voterAddress) onlyChairPerson {
        Voter voter = voters[voterAddress];

        if (voter.voted || voter.registered) {
            VoteError(voterAddress, 'already registered');
            throw;
        }

        voter.registered = true;

        VoterRegistered(voterAddress);
    }

    // Give a single vote to proposal $(proposal).
    function vote(uint8 proposal) onlyRegisteredVoter {
        Voter voter = voters[msg.sender];

        if (proposal >= results.length)
            return; // FIXME: emit a BallotError event

        voter.voted = true;
        voter.vote = proposal;
        results[proposal] += 1;

        Ballot(msg.sender, proposal);
    }

    function cancelVote() onlyRegisteredVoter {
        Voter voter = voters[msg.sender];

        results[voter.vote] -= 1;

        voter.voted = false;
    }

    function getVoteResults() constant returns (uint[]) {
        return results;
    }

    function end() onlyChairPerson {
        selfdestruct(chairperson);
    }
}
