pragma solidity ^0.4.2;

contract Vote {

  enum Status { Open, Closed }

  event Ballot (
    address indexed voter,
    uint8[] ballot
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

  mapping(address => Voter) _voters;
  uint8 _numProposals;
  uint8 _numChoices;
  address _chairperson;
  uint[][] _results;
  Status _status;

  /* This unnamed function is called whenever someone tries to send ether to it */
  function () {
    throw; // Prevents accidental sending of ether
  }

  /**@dev Instanciate a new Vote contract.
   * @param numProposals The number of proposals.
   * @param numChoices The number of choices for each proposal.
   */
  function Vote(uint8 numProposals, uint8 numChoices)
  public {
    _numProposals = numProposals;
    _numChoices = numChoices;
    _chairperson = msg.sender;
    _results.length = numProposals;
    for (uint i = 0; i < numProposals; ++i) {
      _results[i].length = numChoices;
    }
    _status = Status.Open;
  }

  /**@dev Returns early if the sender is not the contract creator.*/
  modifier onlyChairPerson() {
    if (msg.sender != _chairperson) {
      VoteError(msg.sender, 'invalid sender');
      return;
    }
    _;
  }

  /**@dev Returns early if the sender has not been registered using
   * registerVoter().
   */
  modifier onlyRegisteredVoter() {
    Voter voter = _voters[msg.sender];

    if (voter.voted || !voter.registered) {
      VoteError(msg.sender, 'voter is not registered');
      return;
    }
    _;
  }

  /**@dev Returns early if the sender already voted.*/
  modifier notAlreadyVoted() {
    Voter voter = _voters[msg.sender];

    if (voter.voted) {
      VoteError(msg.sender, 'voter already voted');
      return;
    }
    _;
  }

  /**@dev Returns early if the status does not match.
   * @param status The status to match.
   */
  modifier onlyWhenStatusIs(Status status) {
    if (_status != status) {
      VoteError(msg.sender, 'invalid status');
      return;
    }
    _;
  }

  /**@dev Register the specified address as a voter.
   * @param voterAddress The address to register as a voter.
   */
  function registerVoter(address voterAddress)
  public payable
  onlyChairPerson()
  onlyWhenStatusIs(Status.Open) {
    Voter voter = _voters[voterAddress];

    if (voter.registered) {
      VoteError(voterAddress, 'already registered');
      return;
    }

    if (voterAddress.send(msg.value)) {
      voter.registered = true;
      VoterRegistered(voterAddress);
    }
  }

  /**@dev Cast an actual ballot.
   * @param ballot A ballot as an array where each index is the proposal and the
   * corresponding cell value is the choice to increment.
   */
  function vote(uint8[] ballot)
  public
  onlyRegisteredVoter()
  notAlreadyVoted()
  onlyWhenStatusIs(Status.Open) {
    Voter voter = _voters[msg.sender];

    if (ballot.length != _numProposals) {
        VoteError(msg.sender, 'invalid proposal');
        return;
    }

    for (uint8 i = 0; i < _numProposals; i++) {
      if (ballot[i] >= _numChoices) {
        VoteError(msg.sender, 'invalid choice');
        return;
      }
    }

    voter.voted = true;

    for (uint8 j = 0; j < _numProposals; j++) {
      _results[j][ballot[j]] += 1;
    }

    Ballot(msg.sender, ballot);
  }

  /**@dev Returns the number of ballots for each choice of the specified
    * proposal.
    * @return The number of ballots for each choice of the specified proposal.
    */
  function getProposalResults(uint8 proposal)
  public
  onlyWhenStatusIs(Status.Closed)
  constant returns (uint[]) {
    return _results[proposal];
  }

  /**@dev Set the status of the vote to "open".*/
  function open()
  public
  onlyChairPerson()
  onlyWhenStatusIs(Status.Closed) {
    _status = Status.Open;
  }

  /**@dev Set the status of the vote to "closed".*/
  function close()
  public
  onlyChairPerson()
  onlyWhenStatusIs(Status.Open) {
    _status = Status.Closed;
  }
}
