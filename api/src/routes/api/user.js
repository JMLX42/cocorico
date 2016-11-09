export function me(req, res) {
  res.apiResponse({ 'user': req.user });
}
