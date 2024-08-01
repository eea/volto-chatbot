import React from 'react';
import { ChatBlockSchema } from './schema';
import { BlockDataForm, SidebarPortal } from '@plone/volto/components';
import ChatBlockView from './ChatBlockView';
import { addAppUrl } from '@plone/volto/helpers';
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

// function withDanswerAssistants(Component) {
//   function WrappedComponent(props) {
//     const [state, setState] = React.useState(null);
//     React.useEffect(() => {
//       async function handler() {
//         const response = await fetch('/_danswer/persona?include_deleted=false');
//         const data = await response.json();
//         setState(data);
//       }
//       if (!state) handler();
//     }, [state]);
//     return state ? (
//       <Component {...props} assistants={state} />
//     ) : (
//       <div>Fetching danswer backend data</div>
//     );
//   }
//   return WrappedComponent;
// }

export default withDanswerData((props) => [
  'assistants',
  fetch('/_danswer/persona?include_deleted=false'),
])(SearchBlockEdit);
