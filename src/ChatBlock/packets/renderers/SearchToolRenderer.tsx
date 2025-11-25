import type {
  SearchToolPacket,
  SearchToolStart,
  SearchToolDelta,
  SectionEnd,
  OnyxDocument,
} from '../../types/streamingModels';
import type { MessageRenderer } from '../../types/interfaces';
import { useEffect, useState, useRef, useMemo } from 'react';
import { PacketType } from '../../types/streamingModels';
import { SourceChip } from '../../components/SourceChip';
import { BlinkingDot } from '../../components/BlinkingDot';
import SVGIcon from '../../components/Icon';
import { WebResultIcon } from '../../components/WebResultIcon';
import SearchIcon from '../../../icons/search.svg';
import GlobeIcon from '../../../icons/globe.svg';
import FileIcon from '../../../icons/file.svg';

const INITIAL_RESULTS_TO_SHOW = 3;
const RESULTS_PER_EXPANSION = 10;

const INITIAL_QUERIES_TO_SHOW = 3;
const QUERIES_PER_EXPANSION = 5;

const SEARCHING_MIN_DURATION_MS = 1000; // 1 second minimum for "Searching" state
const SEARCHED_MIN_DURATION_MS = 1000; // 1 second minimum for "Searched" state

/**
 * ResultIcon component that displays either a favicon for web results or a FileIcon for internal documents
 */
const ResultIcon = ({
  doc,
  size,
  isInternetSearch,
}: {
  doc: OnyxDocument;
  size: number;
  isInternetSearch: boolean;
}) => {
  // Check if this is a web/internet result
  if (doc.link && (isInternetSearch || doc.source_type === 'web')) {
    return <WebResultIcon url={doc.link} size={size} />;
  }
  // For internal documents without links, use FileIcon
  return <SVGIcon name={FileIcon} size={size} />;
};

const constructCurrentSearchState = (
  packets: SearchToolPacket[],
): {
  queries: string[];
  results: OnyxDocument[];
  isSearching: boolean;
  isComplete: boolean;
  isInternetSearch: boolean;
} => {
  const searchStart = packets.find(
    (packet) => packet.obj.type === PacketType.SEARCH_TOOL_START,
  )?.obj as SearchToolStart | null;

  const searchDeltas = packets
    .filter((packet) => packet.obj.type === PacketType.SEARCH_TOOL_DELTA)
    .map((packet) => packet.obj as SearchToolDelta);

  const searchEnd = packets.find(
    (packet) => packet.obj.type === PacketType.SECTION_END,
  )?.obj as SectionEnd | null;

  // Extract queries from ToolDelta packets
  const queries = searchDeltas
    .flatMap((delta) => delta?.queries || [])
    .filter((query, index, arr) => arr.indexOf(query) === index); // Remove duplicates

  const seenDocIds = new Set<string>();
  const results = searchDeltas
    .flatMap((delta) => delta?.documents || [])
    .filter((doc) => {
      if (!doc || !doc.document_id) return false;
      if (seenDocIds.has(doc.document_id)) return false;
      seenDocIds.add(doc.document_id);
      return true;
    });

  const isSearching = Boolean(searchStart && !searchEnd);
  const isComplete = Boolean(searchStart && searchEnd);
  const isInternetSearch = searchStart?.is_internet_search || false;

  return { queries, results, isSearching, isComplete, isInternetSearch };
};

export const SearchToolRenderer: MessageRenderer<SearchToolPacket> = ({
  packets,
  onComplete,
  animate,
  children,
}) => {
  const { queries, results, isSearching, isComplete, isInternetSearch } =
    constructCurrentSearchState(packets);

  // Track search timing for minimum display duration
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [shouldShowAsSearching, setShouldShowAsSearching] = useState(false);
  const [shouldShowAsSearched, setShouldShowAsSearched] = useState(isComplete);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completionHandledRef = useRef(false);

  // Track how many results to show
  const [resultsToShow, setResultsToShow] = useState(INITIAL_RESULTS_TO_SHOW);

  // Track how many queries to show
  const [queriesToShow, setQueriesToShow] = useState(INITIAL_QUERIES_TO_SHOW);

  // Track when search starts (even if the search completes instantly)
  useEffect(() => {
    if ((isSearching || isComplete) && searchStartTime === null) {
      setSearchStartTime(Date.now());
      setShouldShowAsSearching(true);
    }
  }, [isSearching, isComplete, searchStartTime]);

  // Handle search completion with minimum duration
  useEffect(() => {
    if (
      isComplete &&
      searchStartTime !== null &&
      !completionHandledRef.current
    ) {
      completionHandledRef.current = true;
      const elapsedTime = Date.now() - searchStartTime;
      const minimumSearchingDuration = animate ? SEARCHING_MIN_DURATION_MS : 0;
      const minimumSearchedDuration = animate ? SEARCHED_MIN_DURATION_MS : 0;

      const handleSearchingToSearched = () => {
        setShouldShowAsSearching(false);
        setShouldShowAsSearched(true);

        searchedTimeoutRef.current = setTimeout(() => {
          setShouldShowAsSearched(false);
          onComplete();
        }, minimumSearchedDuration);
      };

      if (elapsedTime >= minimumSearchingDuration) {
        // Enough time has passed for searching, transition to searched immediately
        handleSearchingToSearched();
      } else {
        // Not enough time has passed for searching, delay the transition
        const remainingTime = minimumSearchingDuration - elapsedTime;
        timeoutRef.current = setTimeout(
          handleSearchingToSearched,
          remainingTime,
        );
      }
    }
  }, [isComplete, searchStartTime, animate, onComplete]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (searchedTimeoutRef.current) {
        clearTimeout(searchedTimeoutRef.current);
      }
    };
  }, []);

  const status = useMemo(() => {
    const searchType = isInternetSearch ? 'the web' : 'internal documents';

    // If we have documents to show and we're in the searched state, show "Searched"
    if (results.length > 0) {
      // If we're still showing as searching (before transition), show "Searching"
      if (shouldShowAsSearching) {
        return `Searching ${searchType}`;
      }
      // Otherwise show "Searched"
      return `Searched ${searchType}`;
    }

    // Handle states based on timing
    if (shouldShowAsSearched) {
      return `Searched ${searchType}`;
    }
    if (isSearching || isComplete || shouldShowAsSearching) {
      return `Searching ${searchType}`;
    }
    return null;
  }, [
    isSearching,
    isComplete,
    shouldShowAsSearching,
    shouldShowAsSearched,
    results.length,
    isInternetSearch,
  ]);

  // Determine the icon based on search type
  const IconComponent = ({ size }: { size: number }) => (
    <SVGIcon name={isInternetSearch ? GlobeIcon : SearchIcon} size={size} />
  );

  // Don't render anything if search hasn't started
  if (queries.length === 0) {
    return children({
      icon: IconComponent,
      status: status,
      content: <div></div>,
    });
  }

  return children({
    icon: IconComponent,
    status,
    content: (
      <div className="search-tool-renderer">
        <div className="queries-section">
          <div className="queries-header">
            <strong>Queries</strong>
          </div>
          <div className="queries-list">
            {queries.slice(0, queriesToShow).map((query, index) => (
              <div
                key={index}
                className="query-item"
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
              >
                <SourceChip
                  icon={<SVGIcon name={SearchIcon} size={16} />}
                  title={query}
                />
              </div>
            ))}
            {queries.length > queriesToShow && (
              <div
                className="query-item more-button"
                style={{
                  animationDelay: `${queriesToShow * 30}ms`,
                }}
              >
                <SourceChip
                  title={`${queries.length - queriesToShow} more...`}
                  onClick={() => {
                    setQueriesToShow((prevQueries) =>
                      Math.min(
                        prevQueries + QUERIES_PER_EXPANSION,
                        queries.length,
                      ),
                    );
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {queries.length === 0 && <BlinkingDot />}

        <div className="results-section">
          <div className="results-header">
            <strong>{isInternetSearch ? 'Results' : 'Documents'}</strong>
          </div>

          <div className="results-list">
            {results.slice(0, resultsToShow).map((result, index) => (
              <div
                key={result.document_id}
                className="result-item"
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
              >
                <SourceChip
                  icon={
                    <ResultIcon
                      doc={result}
                      size={16}
                      isInternetSearch={isInternetSearch}
                    />
                  }
                  title={result.semantic_identifier || ''}
                  onClick={() => {
                    if (result.link) {
                      window.open(result.link, '_blank');
                    }
                  }}
                />
              </div>
            ))}
            {results.length > resultsToShow && (
              <div
                className="result-item more-button"
                style={{
                  animationDelay: `${
                    Math.min(resultsToShow, results.length) * 30
                  }ms`,
                }}
              >
                <SourceChip
                  title={`${results.length - resultsToShow} more...`}
                  onClick={() => {
                    setResultsToShow((prevResults) =>
                      Math.min(
                        prevResults + RESULTS_PER_EXPANSION,
                        results.length,
                      ),
                    );
                  }}
                />
              </div>
            )}

            {results.length === 0 && queries.length > 0 && <BlinkingDot />}
          </div>
        </div>
      </div>
    ),
  });
};
