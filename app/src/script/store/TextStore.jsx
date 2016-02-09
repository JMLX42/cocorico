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
        this.listenTo(TextAction.like, this._likeHandler);
        this.listenTo(TextAction.likeBillPart, this._billPartlikeHandler);

        this._clearCache();
        this._lastCreated = null;
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

        // if (this._latest && this._latest !== true)
        //     for (var text of this._latest)
        //         if (text.id == id)
        //             return text;

        return null;
    },

    getCurrentUserTexts: function()
    {
        return this._currentUserTexts;
    },

    getLastCreated: function()
    {
        return this._lastCreated;
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
        this._lastCreated = null;

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
                    this._lastCreated = data.text;

                    this._texts.push(data.text);

                    this._latest = null;
                }

                this.trigger(this);
            }
        );
    },

    _updateText: function(newText)
    {
        for (var texts of [this._texts, this._latest, this._currentUserTexts])
            for (var i in texts)
                if (texts[i].id == newText.id)
                {
                    for (var propName in newText)
                        texts[i][propName] = newText[propName];
                    return true;
                }

        return false;
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
    },

    _likeHandler: function(text, value)
    {
        if (text.likes && text.likes.length)
        {
            var oldValue = text.likes[0].value;

            jquery.get(
                '/api/text/like/remove/' + text.id,
                (data) => {
                    text.likes = [];
                    text.score += data.like.value ? -1 : 1;

                    if (value != oldValue)
                        this._addLike(text, value);

                    this.trigger(this);
                }
            ).error((xhr, textStatus, err) => {
                this.trigger(this);
            });
        }
        else
            this._addLike(text, value);
    },

    _addLike: function(text, value)
    {
        jquery.get(
            '/api/text/like/add/' + text.id + '/' + value,
            (data) => {
                text.likes = [data.like];
                text.score += data.like.value ? 1 : -1;

                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this.trigger(this);
        });
    },

    _billPartlikeHandler: function(part, value)
    {
        if (part.likes && part.likes.length)
        {
            var oldValue = part.likes[0].value;

            jquery.get(
                '/api/text/part/like/remove/' + part.id,
                (data) => {
                    part.likes = [];
                    part.score += data.like.value ? -1 : 1;

                    if (value != oldValue)
                        this._addBillPartLike(part, value);

                    this.trigger(this);
                }
            ).error((xhr, textStatus, err) => {
                this.trigger(this);
            });
        }
        else
            this._addBillPartLike(part, value);
    },

    _addBillPartLike: function(part, value)
    {
        jquery.get(
            '/api/text/part/like/add/' + part.id + '/' + value,
            (data) => {
                part.likes = [data.like];
                part.score += data.like.value ? 1 : -1;

                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this.trigger(this);
        });
    },

});
