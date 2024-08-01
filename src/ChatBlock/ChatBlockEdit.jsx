import React from 'react';
import { ChatBlockSchema } from './schema';
import { BlockDataForm, SidebarPortal } from '@plone/volto/components';
import ChatBlockView from './ChatBlockView';
import { addAppUrl } from '@plone/volto/helpers';

const SearchBlockEdit = (props) => {
  const { onChangeBlock, block, data } = props;

  const schema = React.useMemo(() => {
    const schema = ChatBlockSchema({ formData: data });

    // schema.properties.assistant.choices = Object.keys(searchui).map((k) => [
    //   k,
    //   k,
    //   // conf[k].title || k,
    // ]);

    return schema;
  }, [data]);

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

function withDanswerAssistants(Component) {
  function WrappedComponent(props) {
    const [state, setState] = React.useState(null);
    React.useEffect(() => {
      async function handler() {
        const data = await fetch('/_danswer/persona?include_deleted=false');
        setState(data);
        console.log('data', data);
      }
      handler();
    }, []);
    return <Component {...props} />;
  }
  return WrappedComponent;
}

export default withDanswerAssistants(SearchBlockEdit);
