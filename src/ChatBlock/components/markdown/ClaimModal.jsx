import { Modal, ModalContent, ModalHeader } from 'semantic-ui-react';
import cx from 'classnames';
import { convertToPercentage } from '../../utils';
import SVGIcon from '../Icon';
import { getSupportedBgColor } from './colors';
import { ClaimSegments } from './ClaimSegments';

import BotIcon from '../../../icons/bot.svg';

const stripHtml = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

function stripMarkdown(md) {
  return (
    stripHtml(md)
      .replace(/[`*_~>#-]/g, '') // formatting chars
      .replace(/\n{2,}/g, '\n') // extra newlines
      // [[1]](url) → <sup>1</sup>
      .replace(/\[\[(\d+)\]\]\([^)]*\)/g, '<sup>$1</sup>')
      // optional: strip normal markdown links [text](url) → text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .trim()
  );
}

const trimNonAlphanumeric = (str) =>
  stripMarkdown(str).replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

export function ClaimModal({ claim, markers, text, citedSources }) {
  const highlightText = trimNonAlphanumeric(text?.[0] || '');

  return (
    <Modal
      className={cx('claim-modal', getSupportedBgColor(claim.score, 'claim'))}
      trigger={
        <span
          className={cx('claim', getSupportedBgColor(claim.score, 'claim'))}
        >
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
          <blockquote className="claim-quote">
            &ldquo;
            <span
              dangerouslySetInnerHTML={{
                __html: stripMarkdown(claim.claimString).replace(
                  highlightText,
                  `<b>${highlightText}</b>`,
                ),
              }}
            />
            &rdquo;
          </blockquote>
        </div>
      </ModalHeader>
      <ModalContent>
        <div className="claim-verification-card">
          <div className="score-badge-section">
            <div className="score-badge">
              <span className="score-percentage">
                {convertToPercentage(claim.score)}
              </span>
              <span className="score-label">Citation Support</span>
            </div>
            <div className="score-progress-bar">
              <div
                className="score-progress-fill"
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
