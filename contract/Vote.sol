pragma solidity ^0.4.2;

contract Vote {

    enum Status { Open, Closed }

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
    Status status;

    /* This unnamed function is called whenever someone tries to send ether to it */
    function () {
        throw; // Prevents accidental sending of ether
    }

    // Create a new vote with numProposals different results.
    function Vote(uint8 numProposals)
    public
    {
        chairperson = msg.sender;
        results.length = numProposals;
        status = Status.Open;
    }

    modifier onlyChairPerson()
    {
        if (msg.sender != chairperson)
            throw;
        _;
    }

    modifier onlyRegisteredVoter()
    {
        Voter voter = voters[msg.sender];

        if (voter.voted || !voter.registered)
            throw;
        _;
    }

    modifier onlyWhenStatusIs(Status testStatus)
    {
        if (status != testStatus)
            throw;
        _;
    }

    function registerVoter(address voterAddress)
    public
    onlyChairPerson()
    onlyWhenStatusIs(Status.Open)
    {
        Voter voter = voters[voterAddress];

        if (voter.voted || voter.registered) {
            VoteError(voterAddress, 'already registered');
            return;
        }

        voter.registered = true;

        VoterRegistered(voterAddress);
    }

    // Give a single vote to proposal $(proposal).
    function vote(uint8 proposal)
    public
    onlyRegisteredVoter()
    onlyWhenStatusIs(Status.Open)
    {
        Voter voter = voters[msg.sender];

        if (proposal >= results.length) {
          VoteError(msg.sender, 'invalid proposal');
          return;
        }

        voter.voted = true;
        voter.vote = proposal;
        results[proposal] += 1;

        Ballot(msg.sender, proposal);
    }

    /*function cancelVote() onlyRegisteredVoter onlyWhenStatusIs(Status.Open) {
        Voter voter = voters[msg.sender];

        results[voter.vote] -= 1;

        voter.voted = false;
    }*/

    function getVoteResults()
    public
    onlyWhenStatusIs(Status.Closed)
    constant returns (uint[])
    {
        return results;
    }

    function close()
    public
    onlyChairPerson()
    onlyWhenStatusIs(Status.Open)
    {
        status = Status.Closed;
    }

    function destroy()
    public
    onlyChairPerson()
    onlyWhenStatusIs(Status.Closed)
    {
        selfdestruct(chairperson);
    }
}
