/**
 * Returns the currently logged in user.
 */
exports.me = (req, res) => {
  res.apiResponse({ 'user': req.user });
}
