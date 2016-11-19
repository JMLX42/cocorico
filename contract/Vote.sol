pragma solidity ^0.4.2;

contract Vote {

    enum Status { Open, Closed }

    event Ballot (
        address indexed voter,
        uint8[] proposals
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
    uint8 _numCandidates;
    uint8 _numProposals;
    uint[][] results;
    Status status;

    /* This unnamed function is called whenever someone tries to send ether to it */
    function () {
        throw; // Prevents accidental sending of ether
    }

    // Create a new vote with numProposals different results.
    function Vote(uint8 numCandidates, uint8 numProposals)
    public
    {
        // Format results matrix
        _numCandidates = numCandidates;
        _numProposals = numProposals;
        results.length = numCandidates;
        for(uint8 i = 0; i < numCandidates; i++) {
            results[i].length = numProposals;
        }
        chairperson = msg.sender;
        status = Status.Open;
    }

    modifier onlyChairPerson()
    {
        if (msg.sender != chairperson) {
            VoteError(msg.sender, 'invalid sender');
            return;
        }
        _;
    }

    modifier onlyRegisteredVoter()
    {
        Voter voter = voters[msg.sender];

        if (voter.voted || !voter.registered) {
            VoteError(msg.sender, 'voter is not registered');
            return;
        }
        _;
    }

    modifier notAlreadyVoted()
    {
      Voter voter = voters[msg.sender];

      if (voter.voted) {
          VoteError(msg.sender, 'voter already voted');
          return;
      }
      _;
    }

    modifier onlyWhenStatusIs(Status testStatus)
    {
        if (status != testStatus) {
            VoteError(msg.sender, 'invalid status');
            return;
        }
        _;
    }

    function registerVoter(address voterAddress)
    public
    onlyChairPerson()
    onlyWhenStatusIs(Status.Open)
    {
        Voter voter = voters[voterAddress];

        if (voter.registered) {
            VoteError(voterAddress, 'already registered');
            return;
        }

        voter.registered = true;

        VoterRegistered(voterAddress);
    }

    // Give a multiple vote to proposal.
    function vote(uint8[] ballot)
    public
    onlyRegisteredVoter()
    notAlreadyVoted()
    onlyWhenStatusIs(Status.Open)
    {
        Voter voter = voters[msg.sender];

        uint[] proposals;
        proposals.length = _numCandidates;

        for(uint8 i = 0; i < numCandidates; i++) {
            uint proposal = ballot[i];
            if (proposal >= _numProposals) {
                VoteError(msg.sender, 'invalid proposal');
                return;
            }
            proposals[i] = proposal;
        }

        voter.voted = true;

        for(uint8 i = 0; i < numCandidates; i++) {
            results[i][proposals[i]]  += 1;
        }

        Ballot(msg.sender, proposals);
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
        uint[] flatResults;
        flatResults.length = _numProposals * _numCandidates;

        for(uint8 i = 0; i < _numCandidates; i++) {
              for(uint8 j = 0; j < _numProposals; j++) {
                uint index = i * _numCandidates + j;
                flatResults[index] = results[i][j];
            }
        }
        return flatResults;
    }

    function getCandidateResults(uint candidate)
    public
    onlyWhenStatusIs(Status.Closed)
    constant returns (uint[])
    {
        return results[candidate];
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
