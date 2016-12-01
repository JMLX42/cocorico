// Some browser emulation environments (such as jsdom) don't support window.crypto.
// Naive window.crypto polyfill. Required by eth-lightwallet.
if (!!global.window && !global.window.crypto) {
  global.window.crypto = {
    getRandomValues: function(array) {
      var v = require('crypto').randomBytes(array.length);
      for (var i = 0; i < array.length; i++) {
        array[i] = v[i];
      }
    },
  };
}

export {default as getAccessToken} from './getAccessToken';
export {default as getAPIURL} from './getAPIURL';
export {default as getBallotTransaction} from './getBallotTransaction';
export {default as getRandomUser} from './getRandomUser';
export {default as getUserJWT} from './getUserJWT';
export {default as getVote} from './getVote';
export {default as request} from './request';
export {default as getBallot} from './getBallot';
export {default as sendBallot} from './sendBallot';
export {default as sendBallotTransaction} from './sendBallotTransaction';
export {default as updateVote} from './updateVote';
