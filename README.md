# volto-addon-template

[![Releases](https://img.shields.io/github/v/release/eea/volto-addon-template)](https://github.com/eea/volto-addon-template/releases)

[![Pipeline](https://ci.eionet.europa.eu/buildStatus/icon?job=volto-addons%2Fvolto-addon-template%2Fmaster&subject=master)](https://ci.eionet.europa.eu/view/Github/job/volto-addons/job/volto-addon-template/job/master/display/redirect)
[![Lines of Code](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-addon-template-master&metric=ncloc)](https://sonarqube.eea.europa.eu/dashboard?id=volto-addon-template-master)
[![Coverage](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-addon-template-master&metric=coverage)](https://sonarqube.eea.europa.eu/dashboard?id=volto-addon-template-master)
[![Bugs](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-addon-template-master&metric=bugs)](https://sonarqube.eea.europa.eu/dashboard?id=volto-addon-template-master)
[![Duplicated Lines (%)](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-addon-template-master&metric=duplicated_lines_density)](https://sonarqube.eea.europa.eu/dashboard?id=volto-addon-template-master)

[![Pipeline](https://ci.eionet.europa.eu/buildStatus/icon?job=volto-addons%2Fvolto-addon-template%2Fdevelop&subject=develop)](https://ci.eionet.europa.eu/view/Github/job/volto-addons/job/volto-addon-template/job/develop/display/redirect)
[![Lines of Code](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-addon-template-develop&metric=ncloc)](https://sonarqube.eea.europa.eu/dashboard?id=volto-addon-template-develop)
[![Coverage](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-addon-template-develop&metric=coverage)](https://sonarqube.eea.europa.eu/dashboard?id=volto-addon-template-develop)
[![Bugs](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-addon-template-develop&metric=bugs)](https://sonarqube.eea.europa.eu/dashboard?id=volto-addon-template-develop)
[![Duplicated Lines (%)](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-addon-template-develop&metric=duplicated_lines_density)](https://sonarqube.eea.europa.eu/dashboard?id=volto-addon-template-develop)


[Volto](https://github.com/plone/volto) add-on

## Features

Demo GIF

## Getting started

### Try volto-addon-template with Docker

      git clone https://github.com/eea/volto-addon-template.git
      cd volto-addon-template
      make
      make start

Go to http://localhost:3000

### Add volto-addon-template to your Volto project

1. Make sure you have a [Plone backend](https://plone.org/download) up-and-running at http://localhost:8080/Plone

   ```Bash
   docker compose up backend
   ```

1. Start Volto frontend

* If you already have a volto project, just update `package.json`:

   ```JSON
   "addons": [
       "@eeacms/volto-addon-template"
   ],

   "dependencies": {
       "@eeacms/volto-addon-template": "*"
   }
   ```

* If not, create one:

   ```
   npm install -g yo @plone/generator-volto
   yo @plone/volto my-volto-project --canary --addon @eeacms/volto-addon-template
   cd my-volto-project
   ```

1. Install new add-ons and restart Volto:

   ```
   yarn
   yarn start
   ```

1. Go to http://localhost:3000

1. Happy editing!

## Release

See [RELEASE.md](https://github.com/eea/volto-addon-template/blob/master/RELEASE.md).

## How to contribute

See [DEVELOP.md](https://github.com/eea/volto-addon-template/blob/master/DEVELOP.md).

## Copyright and license

The Initial Owner of the Original Code is European Environment Agency (EEA).
All Rights Reserved.

See [LICENSE.md](https://github.com/eea/volto-addon-template/blob/master/LICENSE.md) for details.

## Funding

[European Environment Agency (EU)](http://eea.europa.eu)
