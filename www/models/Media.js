var keystone = require('keystone');
var transform = require('model-transform');
var config = require('/opt/cocorico/cocorico.json');
var Types = keystone.Field.Types;

var Media = new keystone.List('Media', {
    autokey: { path: 'slug', from: 'title', unique: true },
    map: { name: 'title' }
});

Media.add({
	title: { type: String, required: true },
    file: {
        type: Types.LocalFile,
        dest: 'public/' + config.uploadDir,
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/svg+xml'
        ],
        filename: function(item, file) {
    		return item.slug + '.' + file.extension
    	},
        format: function(item, file) {
    		return '<img src="/' + config.uploadDir+ '/' + file.filename
                + '" style="max-width: 300px">';
    	}
    }
});

transform.toJSON(Media);

Media.defaultColumns = 'title, file';
Media.register();
