import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import renderer from 'react-test-renderer';

import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-intl-redux';
import { ToolCall } from './ChatMessageBubble';

const mockStore = configureStore();

describe('ToolCall', () => {
  it('should render the component', () => {
    const store = mockStore({
      userSession: { token: '1234' },
      intl: {
        locale: 'en',
        messages: {},
      },
    });

    const props = {
      tool_name: 'run_search',
      tool_args: {
        query: 'Tell me a joke',
      },
      tool_result: [],
    };

    const component = renderer.create(
      <Provider store={store}>
        <MemoryRouter>
          <ToolCall {...props} />
        </MemoryRouter>
      </Provider>,
    );
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });
});
