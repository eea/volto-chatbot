import React from 'react';
import { BlockDataForm, SidebarPortal } from '@plone/volto/components';

import ChatBlockView from './ChatBlockView';
import { ChatBlockSchema } from './schema';
import { withDanswerData } from './helpers';

const SearchBlockEdit = (props) => {
  const { onChangeBlock, block, data, assistants } = props;
  console.log(assistants, data);

  const schema = React.useMemo(
    () => ChatBlockSchema({ assistants }),
    [assistants],
  );

  return (
    <div>
      <ChatBlockView {...props} mode="edit"></ChatBlockView>
      <SidebarPortal selected={props.selected}>
        <BlockDataForm
          schema={schema}
          title={schema.title}
          block={block}
          onChangeBlock={onChangeBlock}
          onChangeField={(id, value) => {
            onChangeBlock(props.block, {
              ...props.data,
              [id]: value,
            });
          }}
          formData={props.data}
        />
      </SidebarPortal>
    </div>
  );
};

export default withDanswerData((props) => [
  'assistants',
  fetch('/_danswer/persona?include_deleted=false'),
])(SearchBlockEdit);
