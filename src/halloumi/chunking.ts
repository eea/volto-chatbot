import { OpenAIEmbeddings } from '@langchain/openai';
import * as math from 'mathjs';
import { quantile } from 'd3-array';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// --- Step 1: Sentence splitting (character-based safeguard) ---
const splitToSentences = async (textCorpus: string): Promise<string[]> => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 0, // no overlap at character level
  });

  const output = await splitter.createDocuments([textCorpus]);
  return output.map((out) => out.pageContent);
};

// --- Step 2: Sentence object structure ---
const structureSentences = (sentences: string[]): SentenceObject[] =>
  sentences.map((sentence, i) => ({
    sentence,
    index: i,
  }));

// --- Step 3: Embeddings for raw sentences ---
const generateAndAttachEmbeddings = async (
  sentencesArray: SentenceObject[],
): Promise<SentenceObject[]> => {
  const embeddings = new OpenAIEmbeddings({
    modelName: process.env.OPENAI_EMBEDDING_MODEL_NAME,
    configuration: { baseURL: process.env.OPENAI_API_BASE_URL },
    apiKey: process.env.OPENAI_API_KEY,
  });

  const sentencesArrayCopy = sentencesArray.map((s) => ({ ...s }));
  const embeddingsArray = await embeddings.embedDocuments(
    sentencesArrayCopy.map((s) => s.sentence),
  );

  for (let i = 0; i < sentencesArrayCopy.length; i++) {
    sentencesArrayCopy[i].embedding = embeddingsArray[i];
  }

  return sentencesArrayCopy;
};

// --- Step 4: Cosine similarity ---
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = math.dot(vecA, vecB) as number;
  const normA = math.norm(vecA) as number;
  const normB = math.norm(vecB) as number;

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
};

// --- Step 5: Distance + semantic shifts ---
const calculateCosineDistancesAndSignificantShifts = (
  sentenceObjectArray: SentenceObject[],
  percentileThreshold: number,
): { updatedArray: SentenceObject[]; significantShiftIndices: number[] } => {
  const distances: number[] = [];

  const updatedSentenceObjectArray = sentenceObjectArray.map(
    (item, index, array) => {
      if (
        index < array.length - 1 &&
        item.embedding &&
        array[index + 1].embedding
      ) {
        const similarity = cosineSimilarity(
          item.embedding,
          array[index + 1].embedding,
        );
        const distance = 1 - similarity;
        distances.push(distance);
        return { ...item, distance_to_next: distance };
      } else {
        return { ...item, distance_to_next: undefined };
      }
    },
  );

  if (distances.length === 0) {
    return {
      updatedArray: updatedSentenceObjectArray,
      significantShiftIndices: [],
    };
  }

  const sortedDistances = [...distances].sort((a, b) => a - b);
  const quantileThreshold = percentileThreshold / 100;
  const breakpointDistanceThreshold =
    quantile(sortedDistances, quantileThreshold) ?? 0.0;

  const significantShiftIndices = distances
    .map((distance, index) =>
      distance > breakpointDistanceThreshold ? index : -1,
    )
    .filter((index) => index !== -1);

  return {
    updatedArray: updatedSentenceObjectArray,
    significantShiftIndices,
  };
};

// --- Step 6: Group strictly (no overlap) ---
const groupSentencesIntoChunks = (
  sentenceObjectArray: SentenceObject[],
  shiftIndices: number[],
): string[] => {
  const chunks: string[] = [];
  let startIdx = 0;

  for (const breakpoint of shiftIndices) {
    const group = sentenceObjectArray.slice(startIdx, breakpoint + 1);
    chunks.push(group.map((s) => s.sentence).join(' '));
    startIdx = breakpoint + 1;
  }

  if (startIdx < sentenceObjectArray.length) {
    chunks.push(
      sentenceObjectArray
        .slice(startIdx)
        .map((s) => s.sentence)
        .join(' '),
    );
  }

  return chunks;
};

// --- Step 7: Main pipeline ---
const processTextToSemanticChunks = async (
  textCorpus: string,
  percentileThreshold: number = 70,
): Promise<string[]> => {
  const sentences = await splitToSentences(textCorpus);
  const structuredSentences = structureSentences(sentences);
  const sentencesWithEmbeddings =
    await generateAndAttachEmbeddings(structuredSentences);

  const { updatedArray, significantShiftIndices } =
    calculateCosineDistancesAndSignificantShifts(
      sentencesWithEmbeddings,
      percentileThreshold,
    );

  return groupSentencesIntoChunks(updatedArray, significantShiftIndices);
};

// --- Types ---
interface SentenceObject {
  sentence: string;
  index: number;
  embedding?: number[];
  distance_to_next?: number;
}

export {
  splitToSentences,
  structureSentences,
  generateAndAttachEmbeddings,
  cosineSimilarity,
  calculateCosineDistancesAndSignificantShifts,
  groupSentencesIntoChunks,
  processTextToSemanticChunks,
};
