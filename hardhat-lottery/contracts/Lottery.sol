// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract Lottery is VRFConsumerBaseV2, KeeperCompatible {
  enum LotteryState {
    OPEN,
    CALCULATING
  }

  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  uint256 private immutable i_entranceFee;
  bytes32 private immutable i_gasLane;
  uint64 private immutable i_subId;
  uint32 private immutable i_callbackGasLimit;

  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint16 private constant LOTTERY_PERIOD = 1000;
  uint16 private constant NO_OF_WORDS = 1;
  
  address payable[] private s_players;
  address private s_recentWinner;
  LotteryState private s_lotteryState;
  uint256 private s_lastTimestamp;

  error Lottery__NotEnoughETHEnterer(); 
  error Lottery__TransferFailed();
  error Lottery__LotteryNotOpen();
  error Lottery__UpkeepNotNeeded();

  /* Events */
  event LotteryEnter(address indexed player);
  event WinnerRequest(uint256 indexed requestId);
  event WinnerPicked(address indexed winner);

  constructor(address vrfCoordinator, uint256 entranceFee, bytes32 gasLane, uint64 subId, uint32 callbackGasLimit) VRFConsumerBaseV2(vrfCoordinator) {
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
    i_entranceFee = entranceFee;
    i_gasLane = gasLane;
    i_subId = subId;
    i_callbackGasLimit = callbackGasLimit;

    s_lotteryState = LotteryState.OPEN;
    s_lastTimestamp = block.timestamp;
  }

  function enterLottery() public payable {
    if(msg.value < i_entranceFee) { revert Lottery__NotEnoughETHEnterer(); }
    if(s_lotteryState != LotteryState.OPEN) { revert Lottery__LotteryNotOpen(); }
    s_players.push(payable(msg.sender));
  
    // Events should be updated when dynamic sized data structures are events
    emit LotteryEnter(msg.sender);
  }

  function performUpkeep(bytes calldata /* performData */) external override {

    (bool upkeepNeeded,) = checkUpkeep("");
    if(!upkeepNeeded) { revert Lottery__UpkeepNotNeeded(); }
    
    s_lotteryState = LotteryState.CALCULATING;
    uint256 requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane,
      i_subId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NO_OF_WORDS
    );

    emit WinnerRequest(requestId);
  }

  function fulfillRandomWords(
    uint256, /* requestId */
    uint256[] memory randomWords
  ) internal override {
    // Gonna get a large random word we can use a modulo
    uint256 indexOfWinner = randomWords[0] % s_players.length;
    address payable recentWinner = s_players[indexOfWinner];
    s_recentWinner = recentWinner;
    s_players = new address payable[](0);
    s_lastTimestamp = block.timestamp;
    // Send money in the contract
    bool success;
    (success,) = recentWinner.call{value: address(this).balance}("");
    if(!success) {
      revert Lottery__TransferFailed();
    }

    emit WinnerPicked(recentWinner);
    s_lotteryState = LotteryState.OPEN;
  }

  function checkUpkeep(
    bytes memory
    /* checkData */) public view override returns (bool upkeepNeeded, bytes memory /* performData */) {
      bool isOpen = s_lotteryState == LotteryState.OPEN;
      bool timeElapsed = (s_lastTimestamp - block.timestamp > LOTTERY_PERIOD);
      bool hasPlayers = s_players.length > 0;
      bool hasBalance = address(this).balance > 0;

      bool upkeepNeeded = isOpen && timeElapsed && hasPlayers && hasBalance;
  }

  function getEntranceFee() public view returns(uint256) {
    return i_entranceFee;
  }

  function getPlayer(uint256 i) public view returns(address) {
    return s_players[i];
  }

  function getRecentWinner() public view returns(address) {
    return s_recentWinner;
  }

  function getInterval() public pure returns (uint256) {
    return LOTTERY_PERIOD;
  }

  function getNumberOfPlayers() public view returns (uint256) {
    return s_players.length;
  }
}
