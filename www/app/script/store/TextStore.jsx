var Reflux = require('reflux')
var TextAction = require("../action/TextAction");
var jquery = require('jquery');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(TextAction.list, this._fetchTexts);
        this.listenTo(TextAction.showLatest, this._fetchLatest);
        this.listenTo(TextAction.show, this._fetchTextBySlug);

        this._texts = [];
        this._latest = null;
    },

    get: function()
    {
        return this._texts;
    },

    latest: function()
    {
        return this._latest;
    },

    getBySlug: function(slug)
    {
        if (this._texts)
            for (var text of this._texts)
                if (text.slug == slug)
                    return text;

        return null;
    },

    getById: function(id)
    {
        for (var text of this._texts)
            if (text.id == id)
                return text;

        return null;
    },

    _fetchLatest: function()
    {
        jquery.get(
            '/api/text/latest',
            (data) => {
                this._latest = data.text;
                this.trigger(this, this._latest);
            }
        );
    },

    _fetchTexts: function()
    {
        if (this._texts.length)
        {
            this.trigger(this);
            return;
        }

        jquery.get(
            '/api/text/list',
            (data) => {
                this._texts = data.texts;
                this.trigger(this);
            }
        );
    },

    _fetchTextBySlug: function(slug)
    {
        var text = this.getBySlug(slug);
        if (text)
        {
            this.trigger(this, text);
            return;
        }

        jquery.get(
            '/api/text/getBySlug/' + slug,
            (data) => {
                this._texts.push(data.text);
                this.trigger(this, data.text);
            }
        ).error((xhr, textStatus, err) => {
            var text = { slug: slug, error: xhr.status };

            this._texts.push(text);
            this.trigger(this, text);
        });
    }
});
