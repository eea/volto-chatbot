import { Popup } from 'semantic-ui-react';

export function Citation({ children, link, index, value, message }) {
  const isLinkType = value?.toString().startsWith('[');
  const document = message.documents[value];

  const innerText = isLinkType
    ? value?.toString().split('[')[1].split(']')[0]
    : index;

  const handleClick = (event) => {
    if (link) {
      event.preventDefault();
      window.open(link, '_blank');
    }
  };

  const content = link ? (
    <a
      href={link}
      tabIndex="-1"
      onClick={handleClick}
      className="cursor-pointer"
    >
      {link}
    </a>
  ) : (
    <div>This doc doesn't have a link.</div>
  );

  const popupContent = isLinkType ? (
    content
  ) : (
    <div>
      {document.match_highlights.map((text, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: text }} />
      ))}
    </div>
  );

  return (
    <Popup
      on="click"
      wide="very"
      content={popupContent}
      header={!isLinkType ? document.semantic_identifier : undefined}
      trigger={
        <span className="citation">{isLinkType ? innerText : children}</span>
      }
      popper={{ id: 'citation' }}
    />
  );
}
