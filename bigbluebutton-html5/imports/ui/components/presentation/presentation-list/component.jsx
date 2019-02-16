import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from '/imports/ui/components/icon/component';
import cx from 'classnames';
import { styles } from './styles.scss';
import ButtonBase from '../../button/base/component';

export default class PresentationList extends Component {

  isDefault(presentation) {
    const { defaultFileName } = this.props;
    return presentation.filename === defaultFileName
      && !presentation.id.includes(defaultFileName);
  }

  renderPresentationItem(item, i) {
    const { onSelectPresentation, onDeletePresentation } = this.props;

    const isActualCurrent = item.isCurrent;
    const isUploading = !item.upload.done && item.upload.progress > 0;
    const isConverting = !item.conversion.done && item.upload.done;
    const hasError = item.conversion.error || item.upload.error;
    const isProcessing = (isUploading || isConverting) && !hasError;

    if (hasError) {
      return null;
    }

    const itemClassName = {
      [styles.boardItemCurrent]: isActualCurrent,
      [styles.boardItemNew]: item.id.indexOf(item.filename) !== -1,
      [styles.boardItemUploading]: isUploading,
      [styles.boardItemConverting]: isConverting,
      [styles.boardItemError]: hasError,
      [styles.boardItemAnimated]: isProcessing,
    };

    const hideRemove = this.isDefault(item);

    return (
      <ButtonBase
        key={item.id}
        tagName="div"
        label=""
        onClick={() => onSelectPresentation(item.id)}
        className={`${styles.boardItem} ${cx(itemClassName)}`}
      >
        <div className={styles.boardItemName} colSpan={!isActualCurrent ? 2 : 0}>
          <span>{`Board ${i + 1}`}</span>
        </div>
        <div className={styles.boardItemActions}>
          { hideRemove ? null : (
            <ButtonBase
              className={cx(styles.itemAction, styles.itemActionRemove)}
              label="Remove presentation"
              onClick={() => onDeletePresentation(item.id)}
            >
              <Icon iconName="delete" />
            </ButtonBase>
          )}
        </div>
      </ButtonBase>
    );
  }

  render() {
    const { presentations, addPresentation } = this.props;
    return (
      <div className={styles.whiteboardListContainer}>
        {
          presentations.map((item, i) => this.renderPresentationItem(item, i))
        }
        <ButtonBase
          key="Add new presentation"
          tagName="div"
          onClick={addPresentation}
          className={styles.boardItemNew}
        >
          <div className={styles.addNewPresentation}>
            <span>Add</span>
            <Icon iconName="add" />
          </div>
        </ButtonBase>
      </div>
    );
  }
}

PresentationList.propTypes = {
  // Number of current slide being displayed
  presentations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired,
    isCurrent: PropTypes.bool.isRequired,
    conversion: PropTypes.object,
    upload: PropTypes.object,
  })).isRequired,
  // create new presentation
  addPresentation: PropTypes.func.isRequired,
  // activate a presentation
  onSelectPresentation: PropTypes.func.isRequired,
  // delete a presentation
  onDeletePresentation: PropTypes.func.isRequired,
  defaultFileName: PropTypes.string.isRequired,
};