# Localization

## Editing an existing locale

Existing locale messages can be edited by editing the corresponding file in the
`app/src/script/intl` directory.

To test your changes, rebuild the app:

```shell
vagrant ssh --command "cd /vagrant/app && npm run build-release"
```

## Adding a new locale

In `provisioning/inventory/group_vars/all.yml`, edit the `supported_locales`
dictionary to add the new locale. Here an example to add the `es-ES` locale:

```yml
supported_locales:
  fr-FR: Français
  en-US: English
  es-ES: Español
```

Add the corresponding JSON localization file in the `app/src/script/intl`
directory. For example, for the `es-ES` locale, add and fill the
`app/src/script/intl/es-ES.json` file.

Then provision the machine to automatically update the locale list and
rebuild the app:

```shell
vagrant provision
```

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

When all your translated pages are set, don't forget to export them from
the database:

```shell
vagrant ssh --command "cd /vagrant/api && ./scripts/save-pages.js"
```

When you're all set and all your pages are exported, you can create a new GIT
branch, add them to the repository and commit them. Here is an example to commit
and push new pages for the "es-ES" (Spanish) locale:

```shell
git checkout -b translation/es-ES
git add api/db/pages/*
git commit api/db/pages/*
git push origin translation/es-ES
```

When your branch has been pushed, go to Github and
[create a pull request](https://help.github.com/articles/creating-a-pull-request/).
The community will then be able to review it and merge your translated pages.
