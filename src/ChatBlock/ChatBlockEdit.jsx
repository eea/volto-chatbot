import React from 'react';
import superagent from 'superagent';
import { BlockDataForm, SidebarPortal } from '@plone/volto/components';

import ChatBlockView from './ChatBlockView';
import { ChatBlockSchema } from './schema';
import withDanswerData from './withDanswerData';

const SearchBlockEdit = (props) => {
  const { onChangeBlock, block, assistants } = props;

  const schema = React.useMemo(
    () => ChatBlockSchema({ assistants }),
    [assistants],
  );

  return (
    <div>
      <ChatBlockView {...props} mode="edit" />
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

export default withDanswerData(() => [
  'assistants',
  superagent.get('/_danswer/persona?include_deleted=false').type('json'),
])(SearchBlockEdit);
