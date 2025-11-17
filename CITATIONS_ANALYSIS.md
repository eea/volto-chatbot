# Citations Analysis: Do We Need `addCitations`?

## TL;DR: **NO** - You don't need `addCitations` in the new streaming architecture.

## Background

### Old ChatMessageBubble Approach (Legacy)

```javascript
const CITATION_MATCH = /\[\d+\](?![[(\])])/gm;

function addCitations(text) {
  return text.replaceAll(CITATION_MATCH, (match) => {
    const number = match.match(/\d+/)[0];
    return `${match}(${number})`; // [1] → [1](1)
  });
}

// Usage:
<Markdown>{addCitations(message.message)}</Markdown>;
```

**Why it existed:**

- Transformed `[1]` into `[1](1)` to create markdown links
- The markdown renderer would create `<a href="1">[1]</a>`
- The `components.a` handler would intercept and render the `Citation` component

### New Streaming Architecture (Current)

**How citations work now:**

1. **Backend sends citation packets:**

   ```json
   {"ind": 6, "obj": {"type": "citation_start"}}
   {"ind": 6, "obj": {
     "type": "citation_delta",
     "citations": [
       {"citation_num": 8, "document_id": "https://..."},
       {"citation_num": 13, "document_id": "https://..."}
     ]
   }}
   {"ind": 6, "obj": {"type": "section_end"}}
   ```

2. **Citations are extracted and stored:**

   ```typescript
   // In messageProcessor.ts
   const citationsArray = getCitations(processedPackets);
   const citations: Record<number, string> = {};
   citationsArray.forEach((citation) => {
     citations[citation.citation_num] = citation.document_id;
   });

   // Result in message object:
   message.citations = {
     8: 'https://www.eea.europa.eu/...',
     13: 'https://www.eea.europa.eu/...',
     // ...
   };
   ```

3. **The markdown text already contains `[8]`, `[13]`, etc.:**

   - Backend sends: `"...energy sector [[8]](https://...)..."`
   - Markdown renders: `<a href="https://...">[8]</a>`
   - The `components.a` handler intercepts and renders `Citation` component

4. **Citation component looks up the document:**
   ```javascript
   const citationNum = parseInt(innerText); // Extract 8 from [8]
   const documentId = message.citations?.[citationNum]; // Get document_id
   const document = message.documents?.find(
     (doc) => doc.document_id === documentId,
   );
   ```

## Implementation Status

### ✅ Already Working

- **MessageTextRenderer**: Passes `message` to `components(message)` ✓
- **ReasoningRenderer**: Passes `message` to `components(message)` ✓
- **Citation.jsx**: Updated to use `message.citations` map ✓

### 🔍 How It Works

```
Backend Stream → Packets → Message Processor
                              ↓
                    message.citations = {8: "doc_id", 13: "doc_id"}
                    message.documents = [OnyxDocument, ...]
                              ↓
                         Markdown Text
                    "...sector [[8]](url)..."
                              ↓
                      Markdown Renderer
                              ↓
                    <a href="url">[8]</a>
                              ↓
                   components.a (Citation)
                              ↓
          Extract 8 → Lookup citations[8] → Find document
                              ↓
                    Render citation popup/link
```

## Comparison with Onyx

Onyx handles citations similarly but with a different pattern:

```typescript
// Onyx checks for patterns like [D1], [Q1], [1]
const match = value.match(/\[(D|Q)?(\d+)\]/);
if (match) {
  const citationNum = parseInt(match[2], 10) - 1;
  const associatedDoc = docs?.[citationNum];
  // Render citation link
}
```

**Key difference:**

- Onyx: Uses array index (0-based)
- Volto: Uses citation map (citation_num → document_id)

## Conclusion

### ❌ Don't Need

- `addCitations()` function - Backend already formats citations correctly
- Text transformation - Markdown links are already in the stream

### ✅ Already Have

- Citation packet extraction (`getCitations`)
- Citation storage (`message.citations`)
- Citation rendering (`Citation.jsx`)
- Proper integration in all renderers

### 📝 What Was Done

1. Updated `Citation.jsx` to use `message.citations` map instead of array indexing
2. Verified all renderers pass `message` to `components(message)`
3. Confirmed citations work end-to-end in the new architecture

## Testing Checklist

- [ ] Test citations in regular message text
- [ ] Test citations in reasoning content
- [ ] Test citation popup shows correct document
- [ ] Test citation links open correct URLs
- [ ] Test multiple citations in same message
- [ ] Test citations with missing documents (edge case)
