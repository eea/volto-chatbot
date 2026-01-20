import { Modal, ModalContent, ModalHeader } from 'semantic-ui-react';
import { convertToPercentage } from '../../utils';
import SVGIcon from '../Icon';
import { getSupportedBgColor, getScoreLevel } from './colors';
import { ClaimSegments } from './ClaimSegments';

import BotIcon from '../../../icons/bot.svg';
import './colors.less';

export function ClaimModal({ claim, markers, text, citedSources }) {
  const scoreLevel = getScoreLevel(claim.score);

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
        <div className="claim-modal-header">
          <div className="claim-header-top">
            <div className="circle assistant">
              <SVGIcon name={BotIcon} size="20" color="white" />
            </div>
            <span className="claim-label">Verified Claim</span>
          </div>
          <blockquote
            className={`claim-quote ${getSupportedBgColor(claim.score)}`}
          >
            &ldquo;{text}&rdquo;
          </blockquote>
        </div>
      </ModalHeader>
      <ModalContent>
        <div className={`claim-verification-card ${scoreLevel}`}>
          <div className="score-badge-section">
            <div className={`score-badge ${scoreLevel}`}>
              <span className="score-percentage">
                {convertToPercentage(claim.score)}
              </span>
              <span className="score-label">Citation Support</span>
            </div>
            <div className="score-progress-bar">
              <div
                className={`score-progress-fill ${scoreLevel}`}
                style={{ width: `${claim.score * 100}%` }}
              />
            </div>
          </div>
          <div className="rationale-section">
            <h5 className="rationale-header">Rationale</h5>
            <p className="claim-rationale">{claim.rationale}</p>
          </div>
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
