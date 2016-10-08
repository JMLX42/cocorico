var ProxyMixin = {
  proxifyURL: function(url) {
    return '/api/redirect/proxy?url=' + url;
  },
};

module.exports = ProxyMixin;
