exports.redirect = function(req, res)
{
    return res.redirect(301, req.query.url);
}