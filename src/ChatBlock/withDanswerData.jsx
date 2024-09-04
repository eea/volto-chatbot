import React from 'react';
import {
  PlaceholderParagraph,
  PlaceholderLine,
  Placeholder,
} from 'semantic-ui-react';

const Loader = () => (
  <Placeholder>
    <PlaceholderParagraph>
      <PlaceholderLine />
      <PlaceholderLine />
      <PlaceholderLine />
      <PlaceholderLine />
    </PlaceholderParagraph>
  </Placeholder>
);

export default function withDanswerData(callback) {
  function wrapper(Component) {
    function WrappedComponent(props) {
      const [state, setState] = React.useState(null);
      const [name, fetcher, depKey] = callback(props);

      React.useEffect(() => {
        async function handler() {
          if (fetcher) {
            const response = await fetcher;
            setState({ [name]: response.body });
          }
        }
        handler();
        // the fetcher is not a stable function, but we depend on the relevant depKey
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [depKey, name]);

      return state ? (
        <Component {...props} {...state} />
      ) : (
        <Loader active={true} />
      );
    }
    return WrappedComponent;
  }
  return wrapper;
}
