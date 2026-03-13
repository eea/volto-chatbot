# volto-chatbot

## Develop

1. Make sure you have `docker` and `docker compose` installed and running on your machine:

   ```Bash
   git clone https://github.com/eea/volto-chatbot.git
   cd volto-chatbot
   git checkout -b bugfix-123456 develop
   make
   make start
   ```

1. Wait for `Volto started at 0.0.0.0:3000` meesage

1. Go to http://localhost:3000

1. Initialize git hooks

   ```Bash
   yarn prepare
   ```

1. Happy hacking!

### Or add @eeacms/volto-chatbot to your Volto project

Before starting make sure your development environment is properly set. See the official Plone documentation for [creating a project with Cookieplone](https://6.docs.plone.org/install/create-project-cookieplone.html) and [installing an add-on in development mode in Volto 18 and 19](https://6.docs.plone.org/volto/development/add-ons/install-an-add-on-dev-18.html).

For new Volto 18+ projects, use Cookieplone. It includes `mrs-developer` by default.

1.  Create a new Volto project with Cookieplone

        uvx cookieplone project
        cd project-title

1.  Add the following to `mrs.developer.json`:

        {
            "volto-chatbot": {
                "output": "packages",
                "url": "https://github.com/eea/volto-chatbot.git",
                "package": "@eeacms/volto-chatbot",
                "branch": "develop",
                "path": "src"
            }
        }

1.  Add `@eeacms/volto-chatbot` to the `addons` key in your project `volto.config.js`

1.  Install or refresh the project setup

        make install

1.  Start backend in one terminal

        make backend-start

    ...wait for backend to setup and start, ending with `Ready to handle requests`

    ...you can also check http://localhost:8080/Plone

1.  Start frontend in a second terminal

        make frontend-start

1.  Go to http://localhost:3000

1.  Happy hacking!

        cd packages/volto-chatbot

For legacy Volto 17 projects, keep using the yarn-based workflow from the Volto 17 documentation.

## Cypress

To run cypress locally, first make sure you don't have any Volto/Plone running on ports `8080` and `3000`.

You don't have to be in a `clean-volto-project`, you can be in any Volto Frontend
project where you added `volto-chatbot` to `mrs.developer.json`

Go to:

```BASH
cd packages/volto-chatbot/
```

Start:

```Bash
make
make start
```

This will build and start with Docker a clean `Plone backend` and `Volto Frontend` with `volto-chatbot` block installed.

Open Cypress Interface:

```Bash
make cypress-open
```

Or run it:

```Bash
make cypress-run
```

## Mock develop environment

The following environment variables are used in the develop environment:

```Bash
MOCK_INDEX=1
MOCK_LLM_CALL=true
MOCK_STREAM_DELAY=1
```

You can also dump the Halloumi response by setting:

```Bash
DUMP_HALLOUMI_RESPONSE=1
```

This is kind of exclusive, you don't want to dump if you're mocking the LLM call.
