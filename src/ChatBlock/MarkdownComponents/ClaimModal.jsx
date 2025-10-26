import { Modal, ModalContent, ModalHeader } from 'semantic-ui-react';
import { convertToPercentage, SVGIcon } from '../utils';
import { getSupportedBgColor, getSupportedTextColor } from './colors';
import { ClaimSegments } from './ClaimSegments';

import BotIcon from '@eeacms/volto-chatbot/icons/bot.svg';
import './colors.less';

export function ClaimModal({ claim, markers, text, citedSources }) {
  // console.log({ claim, markers, text, citedSources });
  return (
    <Modal
      className="claim-modal"
      trigger={
        <span className={`claim ${getSupportedBgColor(claim.score)}`}>
          {text}
        </span>
      }
    >
      <ModalHeader>
        <div className="circle assistant">
          <SVGIcon name={BotIcon} size="20" color="white" />
        </div>
        <h5 className={`claim claim-text ${getSupportedBgColor(claim.score)}`}>
          &ldquo;{text}&rdquo;
        </h5>
      </ModalHeader>
      <ModalContent>
        <div className="claim-source">
          <p className="claim-score">
            Supported by citations:{' '}
            <span className={getSupportedTextColor(claim.score)}>
              {convertToPercentage(claim.score)}
            </span>
          </p>

          <p className="claim-rationale">
            <strong>Rationale: </strong>
            {claim.rationale}
          </p>
        </div>

        <ClaimSegments
          segmentIds={claim.segmentIds}
          segments={markers?.segments || {}}
          citedSources={citedSources}
        />
      </ModalContent>
    </Modal>
  );
}
