import config from '/opt/cocorico/api-web/config.json';

const http = require('follow-redirects').http,
  url = require('url');

export function redirect(req, res) {
  if (!req.headers.referer)
    return res.status(400).send();

  var ref_parts = url.parse(req.headers.referer, true);
  if (ref_parts.host !== config.hostname)
    return res.status(400).send();

  return res.redirect(301, req.query.url);
}

export function proxy(req, res) {
  if (!req.headers.referer)
    return res.status(400).send();

  var ref_parts = url.parse(req.headers.referer, true);
  if (ref_parts.host !== config.hostname)
    return res.status(400).send();

  var url_parts = url.parse(req.query.url, true);

  return http.request(
    {
      host: url_parts.host,
      path: url_parts.path,
    },
    (response) => {
      if (response.statusCode === 200) {
        res.writeHead(200, {
          'Content-Type': response.headers['content-type'],
        });
        response.pipe(res);
      } else {
        res.writeHead(response.statusCode);
        res.end();
      }
    }
  ).end();
}
