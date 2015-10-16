var babelify = require('babelify');
var browserify = require('browserify-middleware');
var keystone = require('keystone');

var importRoutes = keystone.importer(__dirname);

// Setup Route Bindings
exports = module.exports = function(app) {

	app.use('/js', browserify('./client/scripts', {
		transform: [babelify.configure({
			plugins: ['object-assign']
		})]
	}));

	// Views
	app.use(function(req, res) {
		res.render('index');
	});

};
