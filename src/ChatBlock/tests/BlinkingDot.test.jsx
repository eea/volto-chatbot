import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import renderer from 'react-test-renderer';

import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-intl-redux';
import { BlinkingDot } from '../components/BlinkingDot';

const mockStore = configureStore();

describe('BlinkingDot', () => {
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
          <BlinkingDot {...props} />
        </MemoryRouter>
      </Provider>,
    );

  it('renders blinking dot when active', () => {
    const props = {
      isActive: true,
    };

    const component = renderComponent(props);
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });

  it('renders inactive dot when not active', () => {
    const props = {
      isActive: false,
    };

    const component = renderComponent(props);
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });

  it('applies custom className', () => {
    const props = {
      isActive: true,
      className: 'custom-class',
    };

    const component = renderComponent(props);
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });

  it('applies custom size', () => {
    const props = {
      isActive: true,
      size: 20,
    };

    const component = renderComponent(props);
    const json = component.toJSON();
    expect(json).toMatchSnapshot();
  });
});
