import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import renderer from 'react-test-renderer';

import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-intl-redux';
import EmptyState from './EmptyState';

const mockStore = configureStore();

describe('EmptyState', () => {
  it('should render the component', () => {
    const store = mockStore({
      userSession: { token: '1234' },
      intl: {
        locale: 'en',
        messages: {},
      },
    });

    const props = {
      '@type': 'danswerChat',
      assistant: '17',
      chatTitle: 'Online public chat',
      height: '500px',
      onChoice: jest.fn(),
      showAssistantDescription: true,
      showAssistantPrompts: true,
      showAssistantTitle: true,
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

    const component = renderer.create(
      <Provider store={store}>
        <MemoryRouter>
          <EmptyState {...props} />
        </MemoryRouter>
      </Provider>,
    );
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });
});
