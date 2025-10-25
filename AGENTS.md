# Project Overview: Volto Chatbot

This project is a Volto add-on designed to integrate an AI-powered chatbot into a Volto (React-based frontend for Plone) project. It provides a customizable interface and advanced settings to tailor the chatbot's behavior and enhance user interactions. The chatbot integrates with the Danswer service for its AI capabilities.

**Key Technologies:**
*   **Frontend:** React, Volto (Plone frontend framework)
*   **Backend Integration:** Danswer service
*   **Development Tools:** Node.js, Cypress (E2E testing), Jest (unit testing), ESLint (linting), Prettier (code formatting), Stylelint (CSS linting).

## Building and Running

### Using Docker (for quick setup)

To get started quickly with Docker:

1.  Clone the repository:
    ```bash
    git clone https://github.com/eea/volto-chatbot.git
    ```
2.  Navigate into the project directory:
    ```bash
    cd volto-chatbot
    ```
3.  Build the Docker images:
    ```bash
    make
    ```
4.  Start the services:
    ```bash
    make start
    ```
    The application will be accessible at `http://localhost:3000`.

### Integrating into an Existing Volto Project

1.  **Ensure Plone Backend is Running:** Make sure you have a Plone backend up and running, typically at `http://localhost:8080/Plone`. You can start it with Docker:
    ```bash
    docker compose up backend
    ```
2.  **Update `package.json`:** In your Volto project's `package.json`, add `@eeacms/volto-chatbot` to the `addons` array and `dependencies`:
    ```json
    "addons": [
        "@eeacms/volto-chatbot"
    ],
    "dependencies": {
        "@eeacms/volto-chatbot": "*"
    }
    ```
3.  **Install and Start:**
    ```bash
    yarn install
    yarn start
    ```

### Environment Configuration

The project requires specific environment variables for Danswer service authentication. Create a `.env` file in your project root with the following content:

```env
DANSWER_URL=https://api.danswer.com
DANSWER_USERNAME=your_username
DANSWER_PASSWORD=your_password
```

*   `DANSWER_URL`: The base URL of the Danswer service.
*   `DANSWER_USERNAME`: Username for Danswer authentication.
*   `DANSWER_PASSWORD`: Password for Danswer authentication.

## Development Conventions

The project adheres to several development conventions to maintain code quality and consistency.

*   **Linting:**
    *   Run ESLint checks: `make lint`
    *   Fix ESLint issues automatically: `make lint-fix`
*   **Code Formatting:**
    *   Check code formatting with Prettier: `make prettier`
    *   Fix formatting issues automatically: `make prettier-fix`
*   **Styling (CSS/LESS):**
    *   Run Stylelint checks: `make stylelint`
    *   Fix Stylelint issues automatically: `make stylelint-fix`
*   **Testing:**
    *   Run unit tests (likely Jest): `make test`
    *   Update snapshots for tests: `make test-update`
    *   Run Cypress end-to-end tests in headless mode: `make cypress-run`
    *   Open Cypress test runner: `make cypress-open`
    *   **Specific test file:** `make addon-test TEST_FILE=src/addons/volto-chatbot/src/halloumi/preprocessing.test.js`
*   **Pre-commit Hook:** A `pre-commit` hook is configured to automatically run `stylelint:fix`, `prettier:fix`, and `lint:fix` before each commit.
*   **Internationalization:** Generate translation files: `make i18n`
*   **Git Workflow:** When committing changes, always use `git status` to review changes and then `git add <relevant files changed>` to stage specific files, instead of `git add .`.

For more detailed contribution guidelines, refer to `DEVELOP.md`.
For release procedures, refer to `RELEASE.md`.