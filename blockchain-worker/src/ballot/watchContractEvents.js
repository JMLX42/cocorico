import noRetryError from './noRetryError';

export default function(errorEvents, events) {
  return new Promise((resolve, reject) => {
    var timeout = setTimeout(
      () => {
        cleanup();
        reject(noRetryError({error : 'contract event timeout'}));
      },
      600000 // 10 minutes
    );

    function cleanup() {
      try {
        clearTimeout(timeout);
        for (var event of events.concat(errorEvents)) {
          event.stopWatching();
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
