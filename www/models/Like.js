var keystone = require('keystone');
var transform = require('model-transform');
var bcrypt = require('bcrypt');
var Types = keystone.Field.Types;

var Like = new keystone.List('Like', {
});

Like.add({
    createdAt: { type: Date, default: Date.now, required: true },
    author: { type: String, required: true, initial: true, noedit: true },
    value: { type: Types.Boolean, required: true, initial: true, noedit: true }
});

Like.addLike = function(resourceModel, id, user, value, errorCallback, successCallback)
{
    resourceModel.findById(id)
        .populate('likes')
        .exec(function(err, resource)
        {
            if (err)
                return res.apiError('database error', err);

            if (!resource)
                return errorCallback && errorCallback(null, null, null);

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

transform.toJSON(Like);

Like.defaultColumns = 'createdAt, value';
Like.register();
