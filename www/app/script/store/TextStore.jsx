var Reflux = require('reflux')
var TextAction = require("../action/TextAction");
var jquery = require('jquery');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(TextAction.list, this._fetchTexts);
        this.listenTo(TextAction.showLatestTexts, this._fetchLatest);
        this.listenTo(TextAction.show, this._fetchTextById);
        this.listenTo(TextAction.listCurrentUserTexts, this._fetchCurrentUserTexts);
        this.listenTo(TextAction.save, this._textSaveHandler);
        this.listenTo(TextAction.delete, this._deleteTextById);
        this.listenTo(TextAction.changeStatus, this._changeTextStatus);

        this._clearCache();
    },

    get: function()
    {
        return this._texts === true ? null : this._texts;
    },

    getLatestTexts: function()
    {
        return this._latest === true ? null : this._latest;
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

    getCurrentUserTexts: function()
    {
        return this._currentUserTexts;
    },

    _fetchLatest: function()
    {
        if (this._latest === true)
            return;

        if (this._latest)
            return this.trigger(this);

        this._latest = true;

        jquery.get(
            '/api/text/latest',
            (data) => {
                this._latest = data.texts;
                this.trigger(this);
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

    _fetchTextById: function(textId)
    {
        var text = this.getById(textId);
        if (text)
        {
            this.trigger(this);
            return;
        }

        jquery.get(
            '/api/text/' + textId,
            (data) => {
                this._texts.push(data.text);
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            var text = { textId: textId, error: xhr.status };

            this._texts.push(text);
            this.trigger(this);
        });
    },

    _fetchTextBySlug: function(slug)
    {
        var text = this.getBySlug(slug);
        if (text)
        {
            this.trigger(this);
            return;
        }

        jquery.get(
            '/api/text/getBySlug/' + slug,
            (data) => {
                this._texts.push(data.text);
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            var text = { slug: slug, error: xhr.status };

            this._texts.push(text);
            this.trigger(this);
        });
    },

    _fetchCurrentUserTexts: function()
    {
        if (this._currentUserTexts === true)
            return;

        if (this._currentUserTexts)
            return this.trigger(this);

        this._currentUserTexts = true;

        jquery.get(
            '/api/user/texts',
            (data) => {
                this._currentUserTexts = data.texts;
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this._currentUserTexts = null;
            this.trigger(this);
        });
    },

    _textSaveHandler: function(id, title, content)
    {
        jquery.post(
            '/api/text/save',
            {
                id: id,
                title: title,
                content: content
            },
            (data) => {
                if (!this._updateText(data.text))
                {
                    if (!this._currentUserTexts)
                        this._currentUserTexts = [];
                    this._currentUserTexts.push(data.text);

                    this._texts.push(data.text);

                    this._latest = null;
                }

                this.trigger(this);
            }
        );
    },

    _updateText: function(newText)
    {
        var updated = false;

        for (var texts of [this._texts, this._latest, this._currentUserTexts])
            for (var i in texts)
                if (texts[i].id == newText.id)
                {
                    texts[i] = newText;
                    updated = true;
                    break;
                }

        return updated;
    },

    _clearCache: function()
    {
        this._texts = [];
        this._latest = null;
        this._currentUserTexts = null;
    },

    _deleteTextById: function(textId)
    {
        jquery.get(
            '/api/text/delete/' + textId,
            (data) => {
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this.trigger(this);
        });
    },

    _changeTextStatus: function(textId, status)
    {
        jquery.get(
            '/api/text/status/' + textId + '/' + status,
            (data) => {
                var userTexts = this._currentUserTexts;

                this._clearCache();
                this._currentUserTexts = userTexts;
                this._updateText(data.text);

                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this.trigger(this);
        });
    }
});
