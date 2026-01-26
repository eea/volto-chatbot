import React from 'react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom/extend-expect';
import Spinner from '../components/Spinner';

describe('Spinner', () => {
  it('renders correctly', () => {
    const component = renderer.create(<Spinner />);
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders a div with spinner class', () => {
    const component = renderer.create(<Spinner />);
    const tree = component.toJSON();
    expect(tree.type).toBe('div');
    expect(tree.props.className).toBe('spinner');
  });
});
