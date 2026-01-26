import '@testing-library/jest-dom/extend-expect';
import { ChatBlockSchema } from '../schema';

describe('ChatBlockSchema', () => {
  const mockAssistants = [
    { id: 1, name: 'Assistant 1' },
    { id: 2, name: 'Assistant 2' },
  ];

  it('returns schema object with title', () => {
    const schema = ChatBlockSchema({ assistants: mockAssistants, data: {} });
    expect(schema.title).toBe('Chatbot');
  });

  it('returns schema with fieldsets', () => {
    const schema = ChatBlockSchema({ assistants: mockAssistants, data: {} });
    expect(schema.fieldsets).toBeDefined();
    expect(Array.isArray(schema.fieldsets)).toBe(true);
    expect(schema.fieldsets.length).toBeGreaterThan(0);
  });

  it('returns schema with properties', () => {
    const schema = ChatBlockSchema({ assistants: mockAssistants, data: {} });
    expect(schema.properties).toBeDefined();
  });

  it('includes assistant choices from assistants array', () => {
    const schema = ChatBlockSchema({ assistants: mockAssistants, data: {} });
    expect(schema.properties.assistant.choices).toEqual([
      ['1', 'Assistant 1'],
      ['2', 'Assistant 2'],
    ]);
  });

  it('handles empty assistants array', () => {
    const schema = ChatBlockSchema({ assistants: [], data: {} });
    expect(schema.properties.assistant.choices).toEqual([]);
  });

  it('handles undefined assistants', () => {
    const schema = ChatBlockSchema({ assistants: undefined, data: {} });
    expect(schema.properties.assistant.choices).toEqual([]);
  });

  it('includes starterPrompts field when enableStarterPrompts is true', () => {
    const schema = ChatBlockSchema({
      assistants: mockAssistants,
      data: { enableStarterPrompts: true },
    });
    expect(schema.fieldsets[0].fields).toContain('starterPrompts');
  });

  it('excludes starterPrompts field when enableStarterPrompts is false', () => {
    const schema = ChatBlockSchema({
      assistants: mockAssistants,
      data: { enableStarterPrompts: false },
    });
    expect(schema.fieldsets[0].fields).not.toContain('starterPrompts');
  });

  it('includes feedbackReasons field when enableFeedback is true', () => {
    const schema = ChatBlockSchema({
      assistants: mockAssistants,
      data: { enableFeedback: true },
    });
    expect(schema.fieldsets[0].fields).toContain('feedbackReasons');
  });

  it('excludes feedbackReasons field when enableFeedback is false', () => {
    const schema = ChatBlockSchema({
      assistants: mockAssistants,
      data: { enableFeedback: false },
    });
    expect(schema.fieldsets[0].fields).not.toContain('feedbackReasons');
  });

  it('includes quality check fields when qualityCheck is enabled', () => {
    const schema = ChatBlockSchema({
      assistants: mockAssistants,
      data: { qualityCheck: 'enabled' },
    });
    expect(schema.fieldsets[0].fields).toContain('maxContextSegments');
    expect(schema.fieldsets[0].fields).toContain('noSupportDocumentsMessage');
    expect(schema.fieldsets[0].fields).toContain('qualityCheckContext');
    expect(schema.fieldsets[0].fields).toContain('qualityCheckStages');
  });

  it('excludes quality check fields when qualityCheck is disabled', () => {
    const schema = ChatBlockSchema({
      assistants: mockAssistants,
      data: { qualityCheck: 'disabled' },
    });
    expect(schema.fieldsets[0].fields).not.toContain('maxContextSegments');
    expect(schema.fieldsets[0].fields).not.toContain('qualityCheckContext');
  });

  it('includes onDemandInputToggle when qualityCheck is ondemand_toggle', () => {
    const schema = ChatBlockSchema({
      assistants: mockAssistants,
      data: { qualityCheck: 'ondemand_toggle' },
    });
    expect(schema.fieldsets[0].fields).toContain('onDemandInputToggle');
  });

  it('excludes onDemandInputToggle when qualityCheck is not ondemand_toggle', () => {
    const schema = ChatBlockSchema({
      assistants: mockAssistants,
      data: { qualityCheck: 'enabled' },
    });
    expect(schema.fieldsets[0].fields).not.toContain('onDemandInputToggle');
  });

  it('includes totalFailMessage when enableShowTotalFailMessage is true', () => {
    const schema = ChatBlockSchema({
      assistants: mockAssistants,
      data: { enableShowTotalFailMessage: true },
    });
    expect(schema.fieldsets[0].fields).toContain('totalFailMessage');
  });

  it('excludes totalFailMessage when enableShowTotalFailMessage is false', () => {
    const schema = ChatBlockSchema({
      assistants: mockAssistants,
      data: { enableShowTotalFailMessage: false },
    });
    expect(schema.fieldsets[0].fields).not.toContain('totalFailMessage');
  });

  it('has required array', () => {
    const schema = ChatBlockSchema({ assistants: mockAssistants, data: {} });
    expect(schema.required).toBeDefined();
    expect(Array.isArray(schema.required)).toBe(true);
  });

  it('has default values for key properties', () => {
    const schema = ChatBlockSchema({ assistants: mockAssistants, data: {} });
    expect(schema.properties.placeholderPrompt.default).toBe('Ask a question');
    expect(schema.properties.chatTitle.default).toBe('Online public chat');
    expect(schema.properties.enableFeedback.default).toBe(true);
    expect(schema.properties.qualityCheck.default).toBe('disabled');
  });

  it('has qualityCheckStages with default score ranges', () => {
    const schema = ChatBlockSchema({ assistants: mockAssistants, data: {} });
    expect(schema.properties.qualityCheckStages.default).toBeDefined();
    expect(Array.isArray(schema.properties.qualityCheckStages.default)).toBe(
      true,
    );
    expect(schema.properties.qualityCheckStages.default.length).toBe(5);
  });

  it('has feedbackReasons with default choices', () => {
    const schema = ChatBlockSchema({ assistants: mockAssistants, data: {} });
    expect(schema.properties.feedbackReasons.default).toBeDefined();
    expect(Array.isArray(schema.properties.feedbackReasons.default)).toBe(true);
  });

  it('has deepResearch property with choices', () => {
    const schema = ChatBlockSchema({ assistants: mockAssistants, data: {} });
    expect(schema.properties.deepResearch.choices).toBeDefined();
    expect(schema.properties.deepResearch.choices).toContainEqual([
      'always_on',
      'Always on',
    ]);
  });
});
