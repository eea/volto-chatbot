const ScoreRangeSchema = {
  title: 'Score Range',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['start', 'end', 'label', 'color'],
    },
  ],
  properties: {
    start: {
      title: 'Score start',
      description: 'Lower bound for this range',
      type: 'number',
    },
    end: {
      title: 'Score end',
      description: 'Upper bound for this range',
      type: 'number',
    },
    label: {
      title: 'Label',
      widget: 'slate',
      description:
        'Message to be shown to the users (rich text). If you include the {score} placeholder, it will be replaced with the score.',
    },
    // icon: {
    //   title: 'Icon name',
    //   description: 'Semantic-ui Icon names',
    //   default: 'exclamation',
    // },
    color: {
      title: 'Message color',
      description: (
        <>
          Color for the message box. See{' '}
          <a href="https://react.semantic-ui.com/collections/message/#variations-color">
            documentation
          </a>
        </>
      ),
      choices: [
        ['red', 'red'],
        ['orange', 'orange'],
        ['yellow', 'yellow'],
        ['olive', 'olive'],
        ['green', 'green'],
        ['teal', 'teal'],
        ['blue', 'blue'],
        ['violet', 'violet'],
        ['purple', 'purple'],
        ['pink', 'pink'],
        ['brown', 'brown'],
        ['black', 'black'],
      ],
    },
  },
};
export function ChatBlockSchema({ assistants, data }) {
  const assistantChoices = () =>
    Array.isArray(assistants)
      ? assistants.map(({ id, name }) => [id.toString(), name])
      : [];

  return {
    title: 'Chatbot',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [
          'assistant',
          'qgenAsistantId',
          'placeholderPrompt',
          'starterPromptsHeading',
          'enableStarterPrompts',
          ...(data.enableStarterPrompts ? ['starterPrompts'] : []),
          'showAssistantPrompts',
          'enableQgen',
          'enableShowTotalFailMessage',
          ...(data.enableShowTotalFailMessage ? ['totalFailMessage'] : []),
          'qualityCheck',
          ...(data.qualityCheck && data.qualityCheck === 'ondemand_toggle'
            ? ['onDemandInputToggle']
            : []),
          ...(data.qualityCheck && data.qualityCheck !== 'disabled'
            ? [
                'noSupportDocumentsMessage',
                'qualityCheckContext',
                'qualityCheckStages',
              ]
            : []),
          'enableFeedback',
          ...(data.enableFeedback ? ['feedbackReasons'] : []),
          'enableMatomoTracking',
        ],
      },
      {
        id: 'displaySettings',
        title: 'Display settings',
        fields: [
          'height',
          'starterPromptsPosition',
          'scrollToInput',
          'showToolCalls',
          'showAssistantTitle',
          'showAssistantDescription',
          'chatTitle',
          'displayMode',
          ...(data.displayMode === "sidebar" ? ['sidebarStartButtonText'] : []),
        ]
      }
    ],
    properties: {
      enableShowTotalFailMessage: {
        title: 'Show total failure message',
        type: 'boolean',
        default: false,
      },
      totalFailMessage: {
        title: "Message when there's no citations",
        widget: 'slate',
        default: [
          {
            type: 'p',
            children: [
              {
                text: "The AI provided answer doesn't include citations. For safety reasons we will not show it.",
              },
            ],
          },
        ],
      },
      noSupportDocumentsMessage: {
        title: 'No sources message',
        description: 'This message will be shown instead of the sources',
        widget: 'slate',
        default: [
          {
            type: 'p',
            children: [
              { text: 'No supported information found in the documents' },
            ],
          },
        ],
      },
      assistant: {
        title: 'Assistant',
        choices: assistantChoices(),
      },
      qgenAsistantId: {
        title: 'QAssistant',
        choices: assistantChoices(),
        description: 'The assistant used to generate the related questions',
      },
      enableQgen: {
        title: 'Enable related question generation',
        type: 'boolean',
        default: false,
      },
      enableFeedback: {
        title: 'Enable feedback',
        type: 'boolean',
        default: true,
      },
      qualityCheck: {
        title: 'Quality checks',
        choices: [
          ['disabled', 'Disabled'],
          ['enabled', 'Enabled'],
          ['ondemand', 'On demand'],
          ['ondemand_toggle', 'On demand (show toggle on input)'],
        ],
        default: 'disabled',
        description: 'Show Halloumi-based automated quality check',
      },
      onDemandInputToggle: {
        title: 'Fact-check AI toggle default state',
        type: 'boolean',
        default: true,
        description:
          'Sets the default state of the fact-check AI toggle. When enabled, quality checks run automatically; when disabled, users must enable them manually.',
      },
      qualityCheckContext: {
        title: 'Context documents',
        default: 'citations',
        choices: [
          ['citations', 'Only cited documents'],
          ['all', 'All documents passed to LLM'],
        ],
      },
      qualityCheckStages: {
        title: 'Score ranges',
        widget: 'object_list',
        schema: ScoreRangeSchema,
        description: `Messages to be shown based on the averaged Halloumi
score. Make sure that there are no gaps in the ranges and that the entire
range is from 0 to 100`,
        default: [
          {
            '@id': 'one',
            label:
              '❌Not supported by our content. Likely guesses—always double-check.',
            start: 0,
            end: 19,
            color: 'red',
          },
          {
            '@id': 'two',
            label:
              '🔍Mostly not supported—likely based on AI logic. Please verify elsewhere.',
            start: 20,
            end: 39,
            color: 'orange',
          },
          {
            '@id': 'three',
            label:
              '❗Partially supported. Double-check if using for important decisions.',
            start: 40,
            end: 59,
            color: 'yellow',
          },
          {
            '@id': 'four',
            label:
              '⚠️ Mostly supported, but some parts may not be. Consider checking key points.',
            start: 60,
            end: 94,
            color: 'olive',
          },
          {
            '@id': 'five',
            label:
              '✅Fully supported by our content. Safe to trust—no need to double-check.',
            start: 95,
            end: 100,
            color: 'green',
          },
        ],
      },
      feedbackReasons: {
        title: 'Feedback reasons',
        description: 'Select the reasons for negative feedback.',
        choices: [
          ['Repetitive', 'Repetitive'],
          ['Irrelevant', 'Irrelevant'],
          ['Inaccurate/Incomplete', 'Inaccurate/Incomplete'],
          ['Unclear', 'Unclear'],
          ['Slow', 'Slow'],
          ['Wrong source(s)', 'Wrong source(s)'],
          ['Too long', 'Too long'],
          ['Too short', 'Too short'],
          ['Outdated sources', 'Outdated sources'],
          [
            'Too many follow-up questions needed',
            'Too many follow-up questions needed',
          ],
        ],
        isMulti: true,
        default: [
          'Repetitive',
          'Irrelevant',
          'Inaccurate/Incomplete',
          'Unclear',
          'Slow',
          'Wrong source(s)',
          'Too long',
          'Too short',
          'Outdated sources',
          'Too many follow-up questions needed',
        ],
      },
      enableStarterPrompts: {
        title: 'Enable custom starter prompts',
        type: 'boolean',
        default: false,
        description:
          'Define custom clickable messages to initiate a chat with the assistant.',
      },
      starterPrompts: {
        title: 'Starter prompts',
        widget: 'object_list',
        schema: {
          title: 'Prompt',
          fieldsets: [
            {
              id: 'default',
              title: 'Default',
              fields: ['name', 'description', 'message'],
            },
          ],
          properties: {
            name: {
              title: 'Title',
              description: 'Starter prompt title shown on the button.',
            },
            description: {
              title: 'Description',
              description: 'Starter prompt description shown on the button.',
            },
            message: {
              title: 'Message',
              type: 'string',
              description:
                'Message sent to the assistant when the button is clicked.',
            },
          },
          required: ['message', 'name'],
        },
      },
      starterPromptsPosition: {
        title: 'Prompts Position',
        type: 'string',
        choices: [
          ['top', 'Top'],
          ['bottom', 'Bottom'],
        ],
        default: 'top',
      },
      starterPromptsHeading: {
        title: data.displayMode === 'sidebar' ? 'Sidebar title' : 'Prompts Heading',
        type: 'string',
        description:
          'Heading shown above the starter prompts (e.g. "Try the following questions")',
      },
      enableMatomoTracking: {
        type: 'boolean',
        title: 'Enable Matomo tracking',
        configPath: 'enableMatomoTracking',
        default: true,
        description:
          'Enable tracking of user interactions via Matomo Analytics. When enabled, the chatbot will send events for: ' +
          'starter prompt clicks, user-submitted questions, clicks on related questions, and feedback on answers (positive/negative).',
      },
      showToolCalls: {
        title: 'Show query used in retriever',
        type: 'boolean',
        default: true,
      },
      placeholderPrompt: {
        default: 'Ask a question',
        title: 'Prompt',
      },
      showAssistantTitle: {
        title: 'Show assistant title',
        type: 'boolean',
        default: true,
      },
      showAssistantDescription: {
        title: 'Show assistant description',
        type: 'boolean',
        default: true,
      },
      showAssistantPrompts: {
        title: 'Show predefined prompts',
        type: 'boolean',
        default: true,
        description: 'Display assistant-provided prompts.',
      },
      chatTitle: {
        title: 'Chat title',
        description: 'Chat are saved with this title. Visible only in Danswer',
        default: 'Online public chat',
      },
      height: {
        title: (
          <a
            target="_blank"
            rel="noreferrer"
            href="https://developer.mozilla.org/en-US/docs/Web/CSS/height"
          >
            Height
          </a>
        ),
        description:
          'Chat window height. ' +
          'Use CSS numeric dimension (ex: 500px or 70vh).',
      },
      scrollToInput: {
        title: 'Scroll the page to focus on the chat input',
        type: 'boolean',
      },
      displayMode: {
        title: 'Display',
        type: 'string',
        factory: 'Choice',
        choices: [
          ['page', 'On page'],
          ['sidebar', 'In sidebar'],
        ],
        // Simulate default value without actually setting it so it isn't saved in data.
        placeholder: 'above',
        noValueOption: false,
      },
      sidebarStartButtonText: {
        title: 'Start button text',
        type: 'string'
      }
      // showInSidebar: {
      //   title: 'Global mode',
      //   description: 'Render the chatbot within a sidebar which can be shown by clicking a button. First block on the page has the controls.',
      //   type: 'boolean'
      // }
    },
    required: [],
  };
}
