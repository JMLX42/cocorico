import keystone from 'keystone';

const Page = keystone.list('Page');

export async function list(req, res) {
  try {
    const pages = await Page.model.find({published: true});

    return res.apiResponse({pages: pages});
  } catch (err) {
    return res.apiError('database error', err);
  }
}

export async function get(req, res) {
  try {
    const page = await Page.model.findById(req.params.id).exec();

    if (!page) {
      return res.startus(404).send({error: 'page not found'});
    }

    return res.apiResponse({page: page});
  } catch (err) {
    return res.apiError('database error', err);
  }
}

export async function getBySlug(req, res) {
  try {
    const page = await Page.model.findOne({slug : req.params.slug}).exec();

    if (!page) {
      return res.status(404).send({error: 'page not found'});
    }

    return res.apiResponse({page : page});
  } catch (err) {
    return res.apiError('database error', err);
  }
}
