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
        this._loadingPages = {};
        this._navBar = null;

        this.fetchNavBar();
    },

    pageIsLoading: function(slug)
    {
        return this._loadingPages[slug] === true;
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
        if (this._navBar != null)
            return;

        this._navBar = [];

        jquery.get(
            '/api/page/navbar',
            (data) => {
                this._navBar = data.pages;
                this.trigger(this);
            }
        );
    },

    fetchPages: function()
    {
        jquery.get(
            '/api/page/list',
            (data) => {
                this._pages = data.pages;
                this.trigger(this);
            }
        );
    },

    fetchPageBySlug: function(slug)
    {
        if (this._loadingPages[slug])
            return;

        if (this.getPageBySlug(slug))
        {
            this.trigger(this);
            return;
        }

        this._loadingPages[slug] = true;

        jquery.get(
            '/api/page/getBySlug/' + slug,
            (data, billStatus, xhr) => {
                delete this._loadingPages[slug];
                this._pages.push(data.page);
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            delete this._loadingPages[slug];
            this._pages.push({ slug: slug, error: xhr.status });
            this.trigger(this);
        });
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
