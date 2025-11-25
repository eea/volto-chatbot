import { Checkbox, Popup } from 'semantic-ui-react';

const QualityCheckToggle = ({ isEditMode, enabled, setEnabled }) => {
  return (
    <div className="quality-check-toggle">
      <Popup
        wide
        basic
        className="quality-check-popup"
        content="Checks the AI's statements against cited sources to highlight possible inaccuracies and hallucinations."
        trigger={
          <Checkbox
            id="fact-check-toggle"
            toggle
            label="Fact-check AI answer"
            disabled={isEditMode}
            checked={enabled}
            onChange={() => setEnabled((v) => !v)}
          />
        }
      />
    </div>
  );
};

export default QualityCheckToggle;
