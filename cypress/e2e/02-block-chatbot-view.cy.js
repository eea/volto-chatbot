import { slateBeforeEach, slateAfterEach } from '../support/e2e';

describe('Chatbot Block: View Mode Tests', () => {
  beforeEach(slateBeforeEach);
  afterEach(slateAfterEach);

  it('Chatbot Block: Add and save', () => {
    cy.clearSlateTitle();
    cy.getSlateTitle().type('Chatbot Test');
    cy.get('.documentFirstHeading').contains('Chatbot Test');

    cy.getSlate().click();

    // Add chatbot block
    cy.get('.ui.basic.icon.button.block-add-button').first().click();
    cy.get('.blocks-chooser .title').contains('Common').click();
    cy.get('.content.active.common .button.danswerChat')
      .click({ force: true });

    // Save
    cy.get('#toolbar-save').click();
    cy.contains('Chatbot Test');
  });
});