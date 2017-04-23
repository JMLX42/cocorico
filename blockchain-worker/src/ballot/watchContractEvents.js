import noRetryError from './noRetryError';

const BLOCKCHAIN_EVENT_TIMEOUT = 300000; // 5 minutes

export default function(errorEvents, events) {
  return new Promise((resolve, reject) => {
    var timeout = setTimeout(
      () => {
        cleanup();
        reject(noRetryError({error : 'contract event timeout'}));
      },
      BLOCKCHAIN_EVENT_TIMEOUT
    );

    function cleanup() {
      try {
        clearTimeout(timeout);
        for (var event of events) {
          event.stopWatching();
        }
        for (var errorEvent of errorEvents) {
          errorEvent.stopWatching();
        }
      } catch (err) {
        reject(err);
      }
    }

    function errorEventHandler(err, e) {
      try {
        cleanup();
        if (!!err) return reject(err);
        return reject(noRetryError({error:e.args.message}));
      } catch (err2) {
        return reject(err2);
      }
    }

    function eventHandler(err, e) {
      try {
        cleanup();
        if (!!err) return reject(err);
        return resolve(e);
      } catch (err2) {
        return reject(err2);
      }
    }

    try {
      for (var event of errorEvents)
        event.watch(errorEventHandler);
      for (var event of events)
        event.watch(eventHandler);
    } catch (err) {
      reject(err);
    }
  });
}
