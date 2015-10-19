var Reflux = require('reflux')
var PageAction = require("../action/PageAction");
var jquery = require('jquery');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(PageAction.list, this.fetchPages);
        this.listenTo(PageAction.showNavBar, this.fetchNavBar);
        this.listenTo(PageAction.readPage, this.fetchPageBySlug);

        this._pages = [];
        this._navBar = null;

        this.fetchNavBar();
    },

    get: function()
    {
        return this._pages;
    },

    navBar: function()
    {
        return this._navBar;
    },

    fetchNavBar: function()
    {
        var self = this;

        if (this._navBar != null)
            return;

        this._navBar = [];

        jquery.get(
            '/api/page/navbar',
            function(data)
            {
                self._navBar = data.pages;
                self.trigger(self);
            }
        );
    },

    fetchPages: function()
    {
        var self = this;

        jquery.get(
            '/api/page/list',
            function(data)
            {
                self._pages = data.pages;
                self.trigger(self);
            }
        );
    },

    fetchPageBySlug: function(slug)
    {
        var self = this;

        if (this.getPageBySlug(slug))
        {
            self.trigger(self);
            return;
        }

        jquery.get(
            '/api/page/getBySlug/' + slug,
            function(data)
            {
                self._pages.push(data.page);
                self.trigger(self);
            }
        );
    },

    getPageBySlug: function(slug)
    {
        for (var page of this._pages)
        {
            if (page.slug == slug)
                return page;
        }
        return null;
    }
});
