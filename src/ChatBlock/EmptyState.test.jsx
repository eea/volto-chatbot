import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import renderer from 'react-test-renderer';

import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-intl-redux';
import EmptyState from './EmptyState';

const mockStore = configureStore();

describe('EmptyState', () => {
  let store;
  let onChoiceMock;

  beforeEach(() => {
    store = mockStore({
      userSession: { token: '1234' },
      intl: { locale: 'en', messages: {} },
    });
    onChoiceMock = jest.fn();
  });

  function renderComponent(props) {
    return renderer.create(
      <Provider store={store}>
        <MemoryRouter>
          <EmptyState {...props} />
        </MemoryRouter>
      </Provider>,
    );
  }

  it('renders with showAssistantPrompts and persona starter messages', () => {
    const props = {
      onChoice: onChoiceMock,
      showAssistantPrompts: true,
      enableStarterPrompts: false,
      starterPromptsHeading: 'Starter Prompts',
      persona: {
        starter_messages: [
          {
            name: 'Starter 1',
            description: 'Desc 1',
            message: 'Message 1',
          },
        ],
      },
    };

    const component = renderComponent(props);
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders with enableStarterPrompts and starterPrompts', () => {
    const props = {
      onChoice: onChoiceMock,
      showAssistantPrompts: false,
      enableStarterPrompts: true,
      starterPromptsHeading: 'Starter Prompts',
      starterPrompts: [
        {
          name: 'Prompt 1',
          description: 'Prompt Desc 1',
          message: 'Prompt Message 1',
        },
      ],
    };

    const component = renderComponent(props);
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders nothing when no starter messages and no starter prompts', () => {
    const props = {
      onChoice: onChoiceMock,
      showAssistantPrompts: true,
      enableStarterPrompts: false,
      persona: {
        starter_messages: [],
      },
    };

    const component = renderComponent(props);
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders without starterPromptsHeading', () => {
    const props = {
      onChoice: onChoiceMock,
      showAssistantPrompts: true,
      enableStarterPrompts: true,
      starterPrompts: [
        {
          name: 'Prompt X',
          description: 'Desc X',
          message: 'Message X',
        },
      ],
    };

    const component = renderComponent(props);
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('calls onChoice when starter message button is clicked', () => {
    const props = {
      '@type': 'danswerChat',
      assistant: '17',
      chatTitle: 'Online public chat',
      height: '500px',
      onChoice: onChoiceMock,
      showAssistantDescription: true,
      showAssistantPrompts: true,
      showAssistantTitle: true,
      enableStarterPrompts: false,
      persona: {
        name: 'In enim justo rhoncus ut',
        description: 'Nullam dictum felis eu pede',
        starter_messages: [
          {
            description: 'Vestibulum purus quam scelerisque ut ',
            message: 'Nam at tortor in tellus',
            name: 'Curabitur at lacus ac velit',
          },
        ],
      },
    };

    const component = renderComponent(props);

    const button = component.root.findByProps({ className: 'starter-message' });

    button.props.onClick();

    expect(onChoiceMock).toHaveBeenCalledWith('Nam at tortor in tellus');
  });
});
