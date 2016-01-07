var bcrypt = require('bcrypt');

exports.textIsReadable = function(text, req, checkAuthor)
{
	return ['draft'].indexOf(text.status) < 0
		|| (!checkAuthor && req.isAuthenticated() && bcrypt.compareSync(req.user.sub, text.author));
}

exports.filterReadableTexts = function(texts, req, checkAuthor)
{
	var filtered = [];

	for (var text of texts)
		if (exports.textIsReadable(text, req, checkAuthor))
			filtered.push(text);

	return filtered;
}
