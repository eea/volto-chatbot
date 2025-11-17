import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import renderer from 'react-test-renderer';

import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-intl-redux';
import { SourceDetails } from '../components/Source';

const mockStore = configureStore();

jest.mock('@plone/volto/helpers/Loadable/Loadable', () => ({
  injectLazyLibs: () => (Component) => (props) => (
    <Component {...props} luxon={require('luxon')} />
  ),
}));

describe('SourceDetails', () => {
  it('should render the component with link type', () => {
    const store = mockStore({
      userSession: { token: '1234' },
      intl: {
        locale: 'en',
        messages: {},
      },
    });

    const props = {
      index: '1',
      source: {
        blurb: 'Vestibulum purus quam scelerisque ut',
        link: 'https://www.example.com',
        source_type: 'web',
        semantic_identifier: 'Nam at tortor in tellus',
        updated_at: null,
      },
    };

    const component = renderer.create(
      <Provider store={store}>
        <MemoryRouter>
          <SourceDetails {...props} />
        </MemoryRouter>
      </Provider>,
    );
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });

  it('should render the component with doc type', () => {
    const store = mockStore({
      userSession: { token: '1234' },
      intl: {
        locale: 'en',
        messages: {},
      },
    });

    const props = {
      index: '2',
      source: {
        blurb: 'Vestibulum purus quam scelerisque ut',
        link: 'https://www.example.com',
        source_type: 'file',
        semantic_identifier: 'Nam at tortor in tellus',
        updated_at: null,
      },
    };

    const component = renderer.create(
      <Provider store={store}>
        <MemoryRouter>
          <SourceDetails {...props} />
        </MemoryRouter>
      </Provider>,
    );
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });
});
