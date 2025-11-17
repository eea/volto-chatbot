import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import renderer from 'react-test-renderer';

import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-intl-redux';
import { Citation } from '../components/markdown/Citation';

const mockStore = configureStore();

describe('Citation', () => {
  it('should render the component with link', () => {
    const store = mockStore({
      userSession: { token: '1234' },
      intl: {
        locale: 'en',
        messages: {},
      },
    });

    const component = renderer.create(
      <Provider store={store}>
        <MemoryRouter>
          <Citation
            message={{
              messageId: 6428,
              message: 'Donec quam felis ultricies nec',
              type: 'assistant',
              query: 'Pellentesque libero tortor tincidunt et?',
              documents: [
                {
                  document_id: 'https://www.example.com',
                  semantic_identifier: 'Nam ipsum risus rutrum vitae',
                  link: 'https://www.example.com',
                  blurb:
                    'Nullam nulla eros, ultricies sit amet, nonummy id, imperdiet feugiat, pede. ',
                  source_type: 'web',
                  match_highlights: ['', 'Praesent ac sem eget est', ''],
                  updated_at: null,
                  db_doc_id: 99186,
                },
              ],
              citations: {
                1: 99186,
              },
              parentMessageId: 6427,
              alternateAssistantID: null,
            }}
            value={['[1]']}
            link="https://www.example.com"
          />
        </MemoryRouter>
      </Provider>,
    );
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });
});

describe('Citation', () => {
  it('should render the component without link', () => {
    const store = mockStore({
      userSession: { token: '1234' },
      intl: {
        locale: 'en',
        messages: {},
      },
    });

    const component = renderer.create(
      <Provider store={store}>
        <MemoryRouter>
          <Citation
            message={{
              messageId: 6428,
              message: 'Donec quam felis ultricies nec',
              type: 'assistant',
              query: 'Pellentesque libero tortor tincidunt et?',
              documents: [
                {
                  document_id: 'https://www.example.com',
                  semantic_identifier: 'Nam ipsum risus rutrum vitae',
                  link: 'https://www.example.com',
                  blurb:
                    'Nullam nulla eros, ultricies sit amet, nonummy id, imperdiet feugiat, pede. ',
                  source_type: 'web',
                  match_highlights: ['', 'Praesent ac sem eget est', ''],
                  updated_at: null,
                  db_doc_id: 99186,
                },
              ],
              citations: {
                1: 99186,
              },
              parentMessageId: 6427,
              alternateAssistantID: null,
            }}
            value={['[1]']}
            link=""
          />
        </MemoryRouter>
      </Provider>,
    );
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });
});
