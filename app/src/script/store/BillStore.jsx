var Reflux = require('reflux')
var BillAction = require("../action/BillAction");
var jquery = require('jquery');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(BillAction.list, this._fetchBills);
        this.listenTo(BillAction.showLatestBills, this._fetchLatest);
        this.listenTo(BillAction.show, this._fetchBillById);
        this.listenTo(BillAction.listCurrentUserBills, this._fetchCurrentUserBills);
        this.listenTo(BillAction.save, this._billSaveHandler);
        this.listenTo(BillAction.delete, this._deleteBillById);
        this.listenTo(BillAction.changeStatus, this._changeBillStatus);
        this.listenTo(BillAction.like, this._likeHandler);
        this.listenTo(BillAction.likeBillPart, this._billPartlikeHandler);

        this._clearCache();
        this._lastCreated = null;
    },

    get: function()
    {
        return this._bills === true ? null : this._bills;
    },

    getLatestBills: function()
    {
        return this._latest === true ? null : this._latest;
    },

    getBySlug: function(slug)
    {
        if (this._bills)
            for (var bill of this._bills)
                if (bill.slug == slug)
                    return bill;

        return null;
    },

    getById: function(id)
    {
        for (var list of [this._bills, this._latest, this._currentUserBills])
            if (list && list !== true)
                for (var bill of list)
                    if (bill.id == id)
                        return bill;

        return null;
    },

    getCurrentUserBills: function()
    {
        return this._currentUserBills;
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
            '/api/bill/latest',
            (data) => {
                this._latest = data.bills;
                this.trigger(this);
            }
        );
    },

    _fetchBills: function()
    {
        if (this._bills.length)
        {
            this.trigger(this);
            return;
        }

        jquery.get(
            '/api/bill/list',
            (data) => {
                this._bills = data.bills;
                this.trigger(this);
            }
        );
    },

    _fetchBillById: function(billId)
    {
        var bill = this.getById(billId);

        if (bill && bill.parts && bill.likes)
        {
            this.trigger(this);
            return;
        }

        jquery.get(
            '/api/bill/' + billId,
            (data) => {
                this._bills.push(data.bill);
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            var bill = { billId: billId, error: xhr.status };

            this._bills.push(bill);
            this.trigger(this);
        });
    },

    _fetchBillBySlug: function(slug)
    {
        var bill = this.getBySlug(slug);

        if (bill && bill.parts && bill.likes)
        {
            this.trigger(this);
            return;
        }

        jquery.get(
            '/api/bill/getBySlug/' + slug,
            (data) => {
                this._bills.push(data.bill);
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            var bill = { slug: slug, error: xhr.status };

            this._bills.push(bill);
            this.trigger(this);
        });
    },

    _fetchCurrentUserBills: function()
    {
        if (this._currentUserBills === true)
            return;

        if (this._currentUserBills)
            return this.trigger(this);

        this._currentUserBills = true;

        jquery.get(
            '/api/user/bills',
            (data) => {
                this._currentUserBills = data.bills;
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this._currentUserBills = null;
            this.trigger(this);
        });
    },

    _billSaveHandler: function(id, title, content)
    {
        this._lastCreated = null;

        jquery.post(
            '/api/bill/save',
            {
                id: id,
                title: title,
                content: content
            },
            (data) => {
                if (!this._updateBill(data.bill))
                {
                    if (!this._currentUserBills)
                        this._currentUserBills = [];
                    this._currentUserBills.push(data.bill);
                    this._lastCreated = data.bill;

                    this._bills.push(data.bill);

                    this._latest = null;
                }

                this.trigger(this);
            }
        );
    },

    _insertOrUpdateBill: function(newBill)
    {
        if (!this._updateBill(newBill))
            this._bills.push(newBill);
    },

    _updateBill: function(newBill)
    {
        for (var bills of [this._bills, this._latest, this._currentUserBills])
            for (var i in bills)
                if (bills[i].id == newBill.id)
                {
                    for (var propName in newBill)
                        bills[i][propName] = newBill[propName];
                    return true;
                }

        return false;
    },

    _clearCache: function()
    {
        this._bills = [];
        this._latest = null;
        this._currentUserBills = null;
    },

    _deleteBillById: function(billId)
    {
        jquery.get(
            '/api/bill/delete/' + billId,
            (data) => {
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this.trigger(this);
        });
    },

    _changeBillStatus: function(billId, status)
    {
        jquery.get(
            '/api/bill/status/' + billId + '/' + status,
            (data) => {
                var userBills = this._currentUserBills;

                this._clearCache();
                this._currentUserBills = userBills;
                this._updateBill(data.bill);

                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this.trigger(this);
        });
    },

    _likeHandler: function(bill, value)
    {
        if (bill.likes && bill.likes.length)
        {
            var oldValue = bill.likes[0].value;

            jquery.get(
                '/api/bill/like/remove/' + bill.id,
                (data) => {
                    bill.likes = [];
                    bill.score += data.like.value ? -1 : 1;

                    if (value != oldValue)
                        this._addLike(bill, value);

                    this.trigger(this);
                }
            ).error((xhr, billStatus, err) => {
                this.trigger(this);
            });
        }
        else
            this._addLike(bill, value);
    },

    _addLike: function(bill, value)
    {
        jquery.get(
            '/api/bill/like/add/' + bill.id + '/' + value,
            (data) => {
                bill.likes = [data.like];
                bill.score += data.like.value ? 1 : -1;

                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this.trigger(this);
        });
    },

    _billPartlikeHandler: function(part, value)
    {
        if (part.likes && part.likes.length)
        {
            var oldValue = part.likes[0].value;

            jquery.get(
                '/api/bill/part/like/remove/' + part.id,
                (data) => {
                    part.likes = [];
                    part.score += data.like.value ? -1 : 1;

                    if (value != oldValue)
                        this._addBillPartLike(part, value);

                    this.trigger(this);
                }
            ).error((xhr, billStatus, err) => {
                this.trigger(this);
            });
        }
        else
            this._addBillPartLike(part, value);
    },

    _addBillPartLike: function(part, value)
    {
        jquery.get(
            '/api/bill/part/like/add/' + part.id + '/' + value,
            (data) => {
                part.likes = [data.like];
                part.score += data.like.value ? 1 : -1;

                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this.trigger(this);
        });
    },

});
