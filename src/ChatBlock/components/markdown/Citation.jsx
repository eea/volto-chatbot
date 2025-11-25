import { Popup } from 'semantic-ui-react';

export function Citation({ link, index, value, message }) {
  const isLinkType = value?.toString().startsWith('[');

  const innerText = isLinkType
    ? value?.toString().split('[')[1].split(']')[0]
    : index;

  // New streaming architecture: use citations map to find document
  const citationNum = parseInt(innerText);
  const documentId = message?.citations?.[citationNum];
  const document = documentId
    ? message?.documents?.find((doc) => doc.document_id === documentId)
    : null;

  const handleClick = (event) => {
    if (link) {
      event.preventDefault();
      window.open(link, '_blank');
    }
  };

  const content = link ? (
    <div>
      <p>
        <a href={link} tabIndex="-1" onClick={handleClick}>
          {link}
        </a>
      </p>

      {document?.match_highlights?.map((text, i) =>
        text ? (
          <p key={i} dangerouslySetInnerHTML={{ __html: `...${text}...` }} />
        ) : null,
      )}
    </div>
  ) : (
    <div>This doc doesn't have a link.</div>
  );

  const popupContent = isLinkType ? (
    content
  ) : (
    <div>
      {document?.match_highlights?.map((text, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: text }} />
      ))}
    </div>
  );

  return (
    <>
      {link ? (
        <a href={link} tabIndex="-1" onClick={handleClick}>
          <span className="chat-citation">{innerText}</span>
        </a>
      ) : (
        <Popup
          on="click"
          wide="very"
          content={popupContent}
          header={!isLinkType ? document.semantic_identifier : undefined}
          trigger={<span className="chat-citation">{innerText}</span>}
          popper={{ id: 'chat-citation-popup' }}
        />
      )}
    </>
  );
}
