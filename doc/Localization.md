# Localization

## Editing an existing locale

Existing locale messages can be edited by editing the corresponding file in the
`app/src/script/intl` directory.

To test your changes, rebuild the app:

```shell
vagrant ssh --command "cd /vagrant/app && npm build-release"
```

## Adding a new locale

Edit the `supported_locales` dictionary to add the new locale. Here an example
to add the `es-ES` locale:

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
