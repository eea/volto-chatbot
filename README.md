# Volto Chatbot

[![Releases](https://img.shields.io/github/v/release/eea/volto-chatbot)](https://github.com/eea/volto-chatbot/releases)

[![Pipeline](https://ci.eionet.europa.eu/buildStatus/icon?job=volto-addons%2Fvolto-chatbot%2Fmaster&subject=master)](https://ci.eionet.europa.eu/view/Github/job/volto-addons/job/volto-chatbot/job/master/display/redirect)
[![Lines of Code](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-chatbot-master&metric=ncloc)](https://sonarqube.eea.europa.eu/dashboard?id=volto-chatbot-master)
[![Coverage](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-chatbot-master&metric=coverage)](https://sonarqube.eea.europa.eu/dashboard?id=volto-chatbot-master)
[![Bugs](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-chatbot-master&metric=bugs)](https://sonarqube.eea.europa.eu/dashboard?id=volto-chatbot-master)
[![Duplicated Lines (%)](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-chatbot-master&metric=duplicated_lines_density)](https://sonarqube.eea.europa.eu/dashboard?id=volto-chatbot-master)

[![Pipeline](https://ci.eionet.europa.eu/buildStatus/icon?job=volto-addons%2Fvolto-chatbot%2Fdevelop&subject=develop)](https://ci.eionet.europa.eu/view/Github/job/volto-addons/job/volto-chatbot/job/develop/display/redirect)
[![Lines of Code](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-chatbot-develop&metric=ncloc)](https://sonarqube.eea.europa.eu/dashboard?id=volto-chatbot-develop)
[![Coverage](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-chatbot-develop&metric=coverage)](https://sonarqube.eea.europa.eu/dashboard?id=volto-chatbot-develop)
[![Bugs](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-chatbot-develop&metric=bugs)](https://sonarqube.eea.europa.eu/dashboard?id=volto-chatbot-develop)
[![Duplicated Lines (%)](https://sonarqube.eea.europa.eu/api/project_badges/measure?project=volto-chatbot-develop&metric=duplicated_lines_density)](https://sonarqube.eea.europa.eu/dashboard?id=volto-chatbot-develop)

[Volto](https://github.com/plone/volto) add-on that integrates an AI-powered chatbot with a customizable interface and advanced settings to tailor its behavior and enhance user interactions.

## Features

https://github.com/user-attachments/assets/f9b5f813-672f-4e4d-81d0-bf2aec35b587

The **Volto Chatbot** block allows the integration of an AI-powered chatbot into your Volto project. It offers a customizable interface and advanced settings to tailor the chatbot's behavior to your needs. Below is an overview of its features and configuration options.

---

## Functionalities

| **Property**                 | **Description**                                                                 | **Type** | **Default**          |
| ---------------------------- | ------------------------------------------------------------------------------- | -------- | -------------------- |
| `assistant`                  | Choose from the list of available assistants configured in the application.     | Dropdown | -                    |
| `qgenAsistantId`             | Select an assistant for generating related questions.                           | Dropdown | -                    |
| `enableQgen`                 | Toggle the generation of related questions.                                     | Boolean  | `false`              |
| `enableFeedback`             | Enable or disable thumbs up/down feedback for assistant responses.              | Boolean  | `true`               |
| `enableMatomoTracking`       | Enable tracking of user interactions via Matomo Analytics.                      | Boolean  | `true`               |
| `enableShowTotalFailMessage` | Show total failure message.                                                     | Boolean  | `false`              |
| `showAssistantTitle`         | Display or hide the assistant's title in the chat interface.                    | Boolean  | `true`               |
| `showAssistantDescription`   | Display or hide the assistant's description in the chat interface.              | Boolean  | `true`               |
| `qualityCheck`               | Show Halloumi-based automated quality check.                                    | Dropdown | `Disabled`           |
| `onDemandInputToggle`        | Sets the default state of the fact-check AI toggle.                             | Boolean  | `true`               |
| `scrollToInput`              | Automatically scroll the page to focus on the chat input when interacting.      | Boolean  | `false`              |
| `showToolCalls`              | Show query used in retriever.                                                   | Boolean  | `true`               |
| `showAssistantPrompts`       | Show or hide predefined prompts provided by the assistant.                      | Boolean  | `true`               |
| `enableStarterPrompts`       | Define custom prompts to initiate a chat with the assistant.                    | Boolean  | `false`              |
| `starterPromptsHeading`      | Heading shown above the prompts.                                                | String   | -                    |
| `starterPromptsPosition`     | Prompts position.                                                               | Dropdown | `Top`                |
| `placeholderPrompt`          | Set placeholder text for the chat input field.                                  | String   | `Ask a question`     |
| `chatTitle`                  | Title assigned to saved chats, visible only in Danswer or analytics.            | String   | `Online public chat` |
| `height`                     | Set the height of the chat window using CSS dimensions (e.g., `500px`, `70vh`). | String   | -                    |

---

## Getting started

### Try volto-chatbot with Docker

```
git clone https://github.com/eea/volto-chatbot.git
cd volto-chatbot
make
make start
```

Go to http://localhost:3000

### Add volto-chatbot to your Volto project

1. Make sure you have a [Plone backend](https://plone.org/download) up-and-running at http://localhost:8080/Plone

   ```Bash
   docker compose up backend
   ```

1. Start Volto frontend

- If you already have a volto project, just update `package.json`:

  ```JSON
  "addons": [
      "@eeacms/volto-chatbot"
  ],

  "dependencies": {
      "@eeacms/volto-chatbot": "*"
  }
  ```

- If not, create one:

  ```
  npm install -g yo @plone/generator-volto
  yo @plone/volto my-volto-project --canary --addon @eeacms/volto-chatbot
  cd my-volto-project
  ```

1. Install new add-ons and restart Volto:

   ```
   yarn
   yarn start
   ```

## Environment Configuration

To properly configure the middleware and authenticate with the Danswer service, ensure that the following environment variables are set:

This document lists the environment variables used in the Volto Chatbot project.

- `DANSWER_URL`
  The base URL for the Danswer service. Used for API calls to Danswer.

- `DANSWER_USERNAME`
  The username for authenticating with the Danswer service. **(Deprecated: Use `DANSWER_API_KEY` instead)**

- `DANSWER_PASSWORD`
  The password for authenticating with the Danswer service. **(Deprecated: Use `DANSWER_API_KEY` instead)**

- `DANSWER_API_KEY`
  The API key for authenticating with the Danswer service. This is the recommended authentication method.

- `JEST_USE_SETUP`
  Used in Jest configuration. When set to 'ON', it enables a specific Jest setup.

- `MOCK_HALLOUMI_FILE_PATH`
  When set, this specifies the absolute path to the JSON file containing the mocked Halloumi response. Setting this variable enables mocking of Halloumi API calls.

- `DUMP_HALLOUMI_FILE_PATH`
  When set, the Halloumi response will be dumped to the specified absolute file path for debugging or to create new mock files.

- `MOCK_STREAM_DELAY`
  Specifies a delay for mock streaming, used in testing or development.

- `MOCK_LLM_FILE_PATH`
  When set, this specifies the absolute path to the JSONL file containing the mocked Danswer stream response. Setting this variable enables mocking of Danswer LLM calls.

- `DUMP_LLM_RESPONSE_FILE_PATH`
  When set, the LLM response will be dumped to the specified absolute file path for debugging or to create new mock files.

- `LLMGW_URL`
  The URL for the LLM Gateway service.

- `LLMGW_TOKEN`
  The token for authenticating with the LLM Gateway service.

## Release

See [RELEASE.md](https://github.com/eea/volto-chatbot/blob/master/RELEASE.md).

## How to contribute

See [DEVELOP.md](https://github.com/eea/volto-chatbot/blob/master/DEVELOP.md).

## Copyright and license

The Initial Owner of the Original Code is European Environment Agency (EEA).
All Rights Reserved.

See [LICENSE.md](https://github.com/eea/volto-chatbot/blob/master/LICENSE.md) for details.

## Funding

[European Environment Agency (EU)](http://eea.europa.eu)
de is European Environment Agency (EEA).
All Rights Reserved.

See [LICENSE.md](https://github.com/eea/volto-addon-template/blob/master/LICENSE.md) for details.

## Funding

[European Environment Agency (EU)](http://eea.europa.eu)
