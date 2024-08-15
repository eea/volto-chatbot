import TextareaAutosize from 'react-textarea-autosize';

import React from 'react';

export default React.forwardRef(function AutoResizeTextarea(
  { trigger, ...rest },
  ref,
) {
  return (
    <>
      <TextareaAutosize {...rest} ref={ref} />
      {trigger}
    </>
  );
});
