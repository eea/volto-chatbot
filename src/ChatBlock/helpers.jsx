import React from 'react';

export function withDanswerData(callback) {
  function wrapper(Component) {
    function WrappedComponent(props) {
      const [state, setState] = React.useState(null);
      React.useEffect(() => {
        async function handler() {
          const response = await fetch(
            '/_danswer/persona?include_deleted=false',
          );
          const data = await response.json();
          setState(data);
        }
        if (!state) handler();
      }, [state]);

      return <Component {...props} />;
    }
    return WrappedComponent;
  }
  return wrapper;
}
