var bcrypt = require('bcrypt');

exports.billIsReadable = function(bill, req, checkAuthor)
{
	return ['draft'].indexOf(bill.status) < 0
		|| (!checkAuthor && req.isAuthenticated() && bcrypt.compareSync(req.user.sub, bill.author));
}

exports.filterReadableBills = function(bills, req, checkAuthor)
{
	var filtered = [];

	for (var bill of bills)
		if (exports.billIsReadable(bill, req, checkAuthor))
			filtered.push(bill);

	return filtered;
}
