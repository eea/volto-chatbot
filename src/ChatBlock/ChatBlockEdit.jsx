import React from 'react';
import { compose } from 'redux';
import superagent from 'superagent';
import { BlockDataForm, SidebarPortal } from '@plone/volto/components';

import ChatBlockView from './ChatBlockView';
import { ChatBlockSchema } from './schema';
import withDanswerData from './hocs/withDanswerData';

const ChatBlockEdit = (props) => {
  const { onChangeBlock, block, assistants, data } = props;

  const schema = React.useMemo(
    () => ChatBlockSchema({ assistants, data }),
    [assistants, data],
  );

  return (
    <div>
      <ChatBlockView {...props} isEditMode />
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

export default compose(
  withDanswerData(() => [
    'assistants',
    superagent.get('/_da/persona?include_deleted=false').type('json'),
  ]),
  // withDanswerData(() => ['tool', superagent.get('/_da/tool').type('json')]), // May be needed in the future
)(ChatBlockEdit);
