# <%= name %>

[![Releases](https://img.shields.io/github/v/release/eea/<%= name %>)](https://github.com/eea/<%= name %>/releases)

[![Pipeline](https://ci.eionet.europa.eu/buildStatus/icon?job=volto-addons%2F<%= name %>%2Fmaster&subject=master)](https://ci.eionet.europa.eu/view/Github/job/volto-addons/job/<%= name %>/job/master/display/redirect)
[![Lines of Code](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=<%= name %>-master&metric=ncloc)](https://sonarqube.eea.europa.eu/dashboard?id=<%= name %>-master)
[![Coverage](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=<%= name %>-master&metric=coverage)](https://sonarqube.eea.europa.eu/dashboard?id=<%= name %>-master)
[![Bugs](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=<%= name %>-master&metric=bugs)](https://sonarqube.eea.europa.eu/dashboard?id=<%= name %>-master)
[![Duplicated Lines (%)](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=<%= name %>-master&metric=duplicated_lines_density)](https://sonarqube.eea.europa.eu/dashboard?id=<%= name %>-master)

[![Pipeline](https://ci.eionet.europa.eu/buildStatus/icon?job=volto-addons%2F<%= name %>%2Fdevelop&subject=develop)](https://ci.eionet.europa.eu/view/Github/job/volto-addons/job/<%= name %>/job/develop/display/redirect)
[![Lines of Code](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=<%= name %>-develop&metric=ncloc)](https://sonarqube.eea.europa.eu/dashboard?id=<%= name %>-develop)
[![Coverage](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=<%= name %>-develop&metric=coverage)](https://sonarqube.eea.europa.eu/dashboard?id=<%= name %>-develop)
[![Bugs](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=<%= name %>-develop&metric=bugs)](https://sonarqube.eea.europa.eu/dashboard?id=<%= name %>-develop)
[![Duplicated Lines (%)](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=<%= name %>-develop&metric=duplicated_lines_density)](https://sonarqube.eea.europa.eu/dashboard?id=<%= name %>-develop)


[Volto](https://github.com/plone/volto) add-on

## Features

Demo GIF

## Getting started

### Try <%= name %> with Docker

      git clone https://github.com/eea/<%= name %>.git
      cd <%= name %>
      make
      make start

Go to http://localhost:3000

### Add <%= name %> to your Volto project

1. Make sure you have a [Plone backend](https://plone.org/download) up-and-running at http://localhost:8080/Plone

   ```Bash
   docker compose up backend
   ```

1. Start Volto frontend

* If you already have a volto project, just update `package.json`:

   ```JSON
   "addons": [
       "<%= addonName %>"
   ],

   "dependencies": {
       "<%= addonName %>": "*"
   }
   ```

* If not, create one:

   ```
   npm install -g yo @plone/generator-volto
   yo @plone/volto my-volto-project --canary --addon <%= addonName %>
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

See [RELEASE.md](https://github.com/eea/<%= name %>/blob/master/RELEASE.md).

## How to contribute

See [DEVELOP.md](https://github.com/eea/<%= name %>/blob/master/DEVELOP.md).

## Copyright and license

The Initial Owner of the Original Code is European Environment Agency (EEA).
All Rights Reserved.

See [LICENSE.md](https://github.com/eea/<%= name %>/blob/master/LICENSE.md) for details.

## Funding

[European Environment Agency (EU)](http://eea.europa.eu)
