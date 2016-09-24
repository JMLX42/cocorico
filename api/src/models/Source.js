var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var Source = new keystone.List('Source', {
  defaultSort: '-time',
});

Source.add({
  url: { type: String, required: true, initial: true },
  time: { type: Types.Datetime, default: Date.now },
  vote: { type: Types.Relationship, ref: 'Vote', required: true, initial: true },
  likes: { type: Types.Relationship, ref: 'Like', many: true, noedit: true },
  score: { type: Types.Number, required: true, default: 1, format: false },
  title: { type: String },
  description: { type: String },
  image: { type: Types.Url },
  type: { type: String },
  latitude: { type: Types.Number },
  longitude: { type: Types.Number },
});

transform.toJSON(Source);

Source.defaultColumns = 'title, score, url';
Source.register();
