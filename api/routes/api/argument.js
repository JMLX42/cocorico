var keystone = require('keystone');
var bcrypt = require('bcrypt');

var Argument = keystone.list('Argument'),
    Bill = keystone.list('Bill'),
    Like = keystone.list('Like');

var BillHelper = require('../../helpers/BillHelper'),
    LikeHelper = require('../../helpers/LikeHelper');

exports.addLike = LikeHelper.getAddLikeFunc(Argument, 'ERROR_ARGUMENT_NOT_FOUND', 'ERROR_ARGUMENT_ALREADY_LIKED');

exports.removeLike = LikeHelper.getRemoveLikeFunc(Argument);

exports.list = function(req, res)
{
    Bill.model.findById(req.params.billId)
        .exec(function(err, bill)
        {
            if (err)
                return res.apiError('database error', err);

            if (!bill)
                return res.status(404).send();

            if (!BillHelper.billIsReadable(bill, req))
                return res.status(403).send();

            Argument.model.find({bill : bill})
                .populate('likes')
                .exec(function(err, arguments)
                {
                    if (err)
                        return res.apiError('database error', err);

                    for (var argument of arguments)
                        argument.likes = LikeHelper.filterUserLikes(argument.likes, req.user);

                    return res.apiResponse({arguments : arguments});
                });
        });
}

exports.add = function(req, res)
{
    var billId = req.body.billId;
    var title = req.body.title;
    var content = req.body.content;
    var value = req.body.value;

    Bill.model.findById(billId)
        .exec(function(err, bill)
        {
            if (err)
                return res.apiError('database error', err);

            if (!bill)
                return res.status(404).apiResponse();
            console.log(bill);
            if (!BillHelper.billIsReadable(bill, req)
                || bill.status != 'debate')
    			return res.status(403).send();

    		var newArgument = Argument.model({
    			title   : title,
                content : content,
    			bill    : bill,
                value   : value,
                author  : bcrypt.hashSync(req.user.sub, 10)
    		});

    		newArgument.save(function(err)
    		{
    			if (err)
    				return res.apiError('database error', err);

    			res.apiResponse({ argument : newArgument });
    		});
        });
}

exports.remove = function(req, res)
{

}
