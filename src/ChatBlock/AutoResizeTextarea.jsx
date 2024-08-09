import { TextArea } from 'semantic-ui-react';
import React from 'react';

export default React.forwardRef(function AutoResizeTextarea(
  { trigger, ...rest },
  ref,
) {
  return (
    <>
      <TextArea {...rest} ref={ref} />
      {trigger}
    </>
  );
});
