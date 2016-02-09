var keystone = require('keystone');
var bcrypt = require('bcrypt');

var Like = keystone.list('Like');

exports.filterUserLikes = function(likes, user)
{
    if (user && user.sub)
        for (var like of likes)
            if (bcrypt.compareSync(user.sub, like.author))
                return [{value : like.value}];

    return [];
}

function addLike(resourceModel, id, user, value, errorCallback, successCallback)
{
    resourceModel.findById(id)
        .populate('likes')
        .exec(function(err, resource)
        {
            if (err)
                return errorCallback(err, null, null);

            if (!resource)
                return errorCallback(null, null, null);

            var authorLike = null;
            for (var like of resource.likes)
                if (like.value == value && bcrypt.compareSync(user.sub, like.author))
                    return errorCallback(null, resource, like);

            authorLike = Like.model({
                author: bcrypt.hashSync(user.sub, 10),
                resource: resource.id,
                value: value
            });

            authorLike.save(function(err)
            {
                if (err)
                    return errorCallback(err, null, null);

                resource.likes.push(authorLike);
                resource.score += value ? 1 : -1;
                resource.save(function(err)
                {
                    if (err)
                        return errorCallback(err, null, null);

                    return successCallback(resource, authorLike);
                });
            });
        });
}

function removeLike(resourceModel, id, user, errorCallback, successCallback)
{
    resourceModel.findById(id)
        .populate('likes')
        .exec(function(err, resource)
        {
            if (err)
                return errorCallback(err, null, null);

            if (!resource)
                return errorCallback(err, null, null);

            var authorLike = null;
            for (var like of resource.likes)
                if (bcrypt.compareSync(user.sub, like.author))
                {
                    authorLike = like;
                    break;
                }

            if (!authorLike)
                return errorCallback(null, resource, null);

            authorLike.remove(function(err)
            {
                if (err)
                    return res.apiError('database error', err);

                resource.likes.splice(resource.likes.indexOf(authorLike), 1);
                resource.score += authorLike.value ? -1 : 1;
                resource.save(function(err)
                {
                    if (err)
                        return errorCallback(err, null, null);

                    return successCallback(resource, authorLike);
                });
            });
        });
}

exports.getAddLikeFunc = function(modelClass, notFoundError, alreadyLikedError)
{
	return function(req, res)
	{
		addLike(
			modelClass.model, req.params.id, req.user, req.params.value == 'true',
			function(err, resource, like)
			{
				if (err)
					return res.apiError('database error', err);

				if (!resource)
					return res.status(404).apiResponse({
						error: notFoundError
					});

				if (like)
					return res.status(400).apiResponse({
						error: alreadyLikedError
					});
			},
			function(resource, like)
			{
				return res.apiResponse({ like : like });
			}
		);
	}
}

exports.getRemoveLikeFunc = function(modelClass)
{
    return function(req, res)
    {
        removeLike(
            modelClass.model, req.params.id, req.user,
            function(err, resource, like)
            {
                if (err)
                    return res.apiError('database error', err);

                if (!resource || !like)
                    return res.status(404).apiResponse();
            },
            function(resource, like)
            {
                res.apiResponse({ like : like });
            }
        );
    };
}
