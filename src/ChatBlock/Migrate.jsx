import { Button } from 'semantic-ui-react';

export default function Migrate(props) {
  function migrate() {
    props.onChange('@type', 'eeaChatbot');
  }

  return (
    <Button style={{ display: 'block', width: '100%' }} onClick={migrate}>
      Migrate to V2
    </Button>
  );
}
