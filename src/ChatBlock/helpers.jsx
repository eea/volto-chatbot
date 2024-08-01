import React from 'react';

export function withDanswerData(callback) {
  function wrapper(Component) {
    function WrappedComponent(props) {
      const [state, setState] = React.useState(null);
      const isEmpty = !state;

      React.useEffect(() => {
        async function handler() {
          const [name, fetcher] = callback(props);
          if (fetcher) {
            const response = await fetcher;
            const data = await response.json();
            setState({ [name]: data });
          }
        }
        if (isEmpty) handler();
      });

      console.log('state', state);

      return state ? (
        <Component {...props} {...state} />
      ) : (
        <div>Fetching external data...</div>
      );
    }
    return WrappedComponent;
  }
  return wrapper;
}
