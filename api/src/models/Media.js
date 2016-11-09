import config from '/opt/cocorico/api-web/config.json';

import keystone from 'keystone';
import transform from 'model-transform';

const Types = keystone.Field.Types;

const Media = new keystone.List('Media', {
  autokey: { path: 'slug', from: 'title', unique: true },
  map: { name: 'title' },
  track: { createdAt: true, updatedAt: true },
});

const storage = new keystone.Storage({
  adapter: keystone.Storage.Adapters.FS,
  fs: {
    path: '/srv/cocorico/app/public/' + config.uploadDir,
    publicPath: '/' + config.uploadDir,
  },
});

Media.add({
  title: { type: String, required: true },
  file: {
    type: Types.File,
    storage: storage,
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/svg+xml',
    ],
    filename: function(item, file) {
      return item.slug + '.' + file.extension
    },
    format: function(item, file) {
      return '<img src="/' + config.uploadDir + '/' + file.filename
        + '" style="max-width: 300px">';
    },
  },
});

transform.toJSON(Media);

Media.defaultColumns = 'title, file';
Media.register();
