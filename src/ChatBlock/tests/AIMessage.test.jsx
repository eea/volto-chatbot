import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import renderer from 'react-test-renderer';

import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-intl-redux';
import { AIMessage } from '../chat/AIMessage';

const mockStore = configureStore();

describe('AIMessage', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      userSession: { token: '1234' },
      intl: { locale: 'en', messages: {} },
    });
  });

  const renderComponent = (props) =>
    renderer.create(
      <Provider store={store}>
        <MemoryRouter>
          <AIMessage {...props} />
        </MemoryRouter>
      </Provider>,
    );

  it('renders AI message with content', () => {
    const props = {
      message: {
        messageId: 1,
        message: 'Hello, I am an AI assistant',
        type: 'assistant',
      },
    };

    const component = renderComponent(props);
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });

  it('renders AI message with sources', () => {
    const props = {
      message: {
        messageId: 1,
        message: 'Here is some information',
        type: 'assistant',
        documents: [
          {
            document_id: 'doc1',
            semantic_identifier: 'Source 1',
            link: 'https://example.com/1',
            source_type: 'web',
          },
        ],
      },
    };

    const component = renderComponent(props);
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });

  it('renders AI message with feedback options', () => {
    const props = {
      message: {
        messageId: 1,
        message: 'This is a response',
        type: 'assistant',
      },
      onFeedback: jest.fn(),
      enableFeedback: true,
    };

    const component = renderComponent(props);
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });

  it('renders empty AI message', () => {
    const props = {
      message: {
        messageId: 1,
        message: '',
        type: 'assistant',
      },
    };

    const component = renderComponent(props);
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });
});