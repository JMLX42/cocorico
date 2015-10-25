var keystone = require('keystone');
var transform = require('model-transform');
var Types = keystone.Field.Types;

var Media = new keystone.List('Media', {
    autokey: { path: 'slug', from: 'title', unique: true },
    map: { name: 'title' }
});

Media.add({
	title: { type: String, required: true },
    file: {
        type: Types.LocalFile,
        dest: 'public/' + process.env.UPLOAD_DIR,
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/svg+xml'
        ],
        filename: function(item, file) {
    		return item.slug + '.' + file.extension
    	},
        format: function(item, file) {
    		return '<img src="/' + process.env.UPLOAD_DIR+ '/' + file.filename
                + '" style="max-width: 300px">';
    	}
    }
});

transform.toJSON(Media);

Media.defaultColumns = 'title, file';
Media.register();
