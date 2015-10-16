exports.config =

  plugins:
    react:
      autoIncludeCommentBlock: yes
      harmony: yes
    uglify:
      mangle: true
      compress:
        global_defs:
          DEBUG: false
    traceur:
      paths: /^app/
      options:
        experimental: true # Passed to traceur
    autoReload:
      enabled: false

    browserify:
      bundles:
        'js/app.js':
            entry: 'app/script/init.js'
            matcher: /^app\/script/

  npm:
    enabled: true

  watcher:
    usePolling: true

  conventions:
    assets:  /^app\/asset/

  modules:
    nameCleaner: (path) ->
      path.replace(/^app\/script\//, '').replace(/^script\//, '')

  paths:
    public: 'public/'
    watched: ['app']

  files:
    javascripts:
      joinTo:
        'js/app.js': /^app\/script/
        'js/vendor.js': /^app\/vendor/
    #   order:
    #     before: [
    #       "node_modules/react/react-with-addons.js",
    #       "node_modules/react-router/dist/react-router.js",
    #       "node_modules/reflux/dist/reflux.js",
    #     ]

    stylesheets:
      joinTo:
        'css/app.css': (path) ->
          m1 = path.match(/^app\/style/)
          return (m1 && m1.length > 0)
        'css/vendor.css': /^app\/vendor/
