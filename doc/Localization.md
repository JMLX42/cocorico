# Localization

## Editing an existing locale

Existing locale messages can be modified by editing the corresponding file in
the `app/src/script/intl` directory.

To test your changes, rebuild the app:

```shell
vagrant ssh --command "cd /vagrant/app && npm run build-release"
```

then check the result in your local instance by going to
`https://local.cocorico.cc` in your Web browser.

## Adding a new locale

In `provisioning/inventory/group_vars/all.yml`, edit the `supported_locales`
dictionary to add the new locale. Here is an example to add the `es-ES` locale:

```yml
supported_locales:
  fr-FR: Français
  en-US: English
  es-ES: Español
```

Add the corresponding JSON localization file in the `app/src/script/intl`
directory. For example, for the `es-ES` locale, add and fill the
`app/src/script/intl/es-ES.json` file.

Instead of creating that file out of nothing, we recommend to copy an
existing JSON localization file - such as `en-US.json` - and translate its
content.

When you're done filling up the JSON file, provision the machine to
automatically update the locale list and rebuild the app:

```shell
vagrant provision
```

Then check the result in your local instance by going to
`https://local.cocorico.cc` in your Web browser.

## Translating pages

Pages are not stored in the JSON localization message files. They are stored in
the database and must be created through the CMS. To do so, for each translated
page you want to create:

* make sure your local instance is running with `vagrant up`
* in your Web browser, go to `https://local.cocorico.cc/admin/pages?create` and
login if necessary
* fill the text input with the name of your translated page and click "Create"
* configure the newly created page and write its content
* click on "Save"

**Attention!** You have to make sure the slug of your translated page - which is
automatically generated from its title - fits the one specified in the
corresponding JSON localization file (if any). For example, for the "Accueil"
French page, the generated slug is "accueil" and the JSON localization file
contains:

```json
"slug" : {
    "HOME": "accueil"
}
```

You can either change the JSON localization file or the page title to make sure
the slugs match.

If the page you are translating is not listed in the `slug` section of the JSON
localization file, then you don't have to worry about its title/slug.

When all your translated pages are set, don't forget to export them from
the database:

```shell
vagrant ssh --command "cd /vagrant/api && ./scripts/save-pages.js"
```

## Submitting your work

When you're all set and all your pages are exported, you can create a new GIT
branch, add your files to repository and commit them. Here is an example to commit
and push new pages for the "es-ES" (Spanish) locale:

```shell
git checkout -b localization/es-ES
git add api/db/pages/* app/src/script/intl/*.json
git commit api/db/pages/* app/src/script/intl/*.json
git push origin localization/es-ES
```

Feel free to set the branch name ("localization/es-ES" in the example above) to
better reflect your proposed changes and additions, but try to always:
* prefix it with "localization/";
* indicate the ISO code of the locale you changed.

When your branch has been pushed, go to Github and
[create a pull request](https://help.github.com/articles/creating-a-pull-request/).
The community will then be able to review it and merge your work.
