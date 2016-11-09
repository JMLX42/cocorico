import keystone from 'keystone';
import transform from 'model-transform';

const Types = keystone.Field.Types;

const Source = new keystone.List('Source', {
  defaultSort: '-time',
});

Source.add({
  url: { type: String, required: true, initial: true },
  time: { type: Types.Datetime, default: Date.now },
  vote: { type: Types.Relationship, ref: 'Vote', required: true, initial: true },
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
