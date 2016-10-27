export default function(err) {
  if (!!err) {
    err.noRetry = true;
  }

  return err;
}
