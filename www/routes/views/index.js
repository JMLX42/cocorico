const keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res);

	view.render(
		'index',
		{
			csrfToken: keystone.security.csrf.getToken(req, res),
			csrfKey: keystone.security.csrf.TOKEN_KEY
		}
	);
}
