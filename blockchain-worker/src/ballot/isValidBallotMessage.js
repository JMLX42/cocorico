import logger from './logger';

export default function(message) {
  if (!message.ballot) {
    logger.info('invalid ballot message received');
    return false;
  }

  const ballot = message.ballot;

  if (!ballot.id) {
    logger.error('missing ballot id');
    return false;
  }

  if (!ballot.voteContractAddress) {
    logger.error('missing ballot vote contract address');
    return false;
  }

  if (!ballot.transaction) {
    logger.error('missing ballot transaction');
    return false;
  }

  return true;
}
