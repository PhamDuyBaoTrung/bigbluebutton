import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from '/imports/ui/components/icon/component';
import cx from 'classnames';
import update from 'immutability-helper';
import Auth from '/imports/ui/services/auth';
import _ from 'lodash';
import { styles } from './styles.scss';
import ButtonBase from '../../button/base/component';

const PRESENTATION_CONFIG = Meteor.settings.public.presentation;
export default class PresentationList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      boardList: props.presentations,
      isFetchingBoard: false,
    };
    this.createNewBoard = this.createNewBoard.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      boardList: nextProps.presentations,
    });
  }

  isDefault(presentation) {
    const { defaultFileName } = this.props;
    return presentation.filename === defaultFileName
      && !presentation.id.includes(defaultFileName);
  }

  updateBoardKey(id, key, value, operation = '$set') {
    this.setState(({ boardList }) => {
      const fileIndex = boardList.findIndex(f => f.id === id);

      return fileIndex === -1 ? false : {
        boardList: update(boardList, {
          [fileIndex]: {
            $apply: file =>
              update(file, {
                [key]: {
                  [operation]: value,
                },
              }),
          },
        }),
      };
    });
  }

  deepMergeUpdateBoardKey(id, key, value) {
    const applyValue = toUpdate => update(toUpdate, { $merge: value });
    this.updateBoardKey(id, key, applyValue, '$apply');
  }

  addNewPresentation(board) {
    const emptyFileName = PRESENTATION_CONFIG.emptyWhiteboardFile;
    const uploadEndpoint = PRESENTATION_CONFIG.uploadEndpoint;
    const { uploadAndConvertPresentation } = this.props;
    let blob = null;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://res.cloudinary.com/coursedy/image/upload/v1541840939/empty_slide.pdf');
    xhr.responseType = 'blob';
    xhr.onload = () => {
      blob = xhr.response;
      const file = new File([blob], emptyFileName, {
        type: 'application/pdf',
        lastModified: Date.now(),
      });
      board.file = file;
      uploadAndConvertPresentation(
        board.file, Auth.meetingID,
        uploadEndpoint, board.onUpload,
        board.onProgress, board.onConversion,
      );
    };
    xhr.send();
  }

  createNewBoard() {
    const id = _.uniqueId(PRESENTATION_CONFIG.emptyWhiteboardFile);
    const board = {
      file: null,
      id,
      filename: PRESENTATION_CONFIG.emptyWhiteboardFile,
      isCurrent: false,
      conversion: { done: false, error: false },
      upload: { done: false, error: false, progress: 0 },
      onProgress: (event) => {
        if (!event.lengthComputable) {
          this.deepMergeUpdateBoardKey(id, 'upload', {
            progress: 100,
            done: true,
          });

          return;
        }

        this.deepMergeUpdateBoardKey(id, 'upload', {
          progress: (event.loaded / event.total) * 100,
          done: event.loaded === event.total,
        });
      },
      onConversion: (conversion) => {
        this.deepMergeUpdateBoardKey(id, 'conversion', conversion);
      },
      onUpload: (upload) => {
        this.deepMergeUpdateBoardKey(id, 'upload', upload);
      },
      onDone: (newId) => {
        this.updateBoardKey(id, 'id', newId);
      },
    };
    const { boardList } = this.state;
    this.setState({
      boardList: boardList.concat(board),
      isFetchingBoard: true,
    });
    this.addNewPresentation(board);
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
    const { boardList, isFetchingBoard } = this.state;
    const baseName = Meteor.settings.public.app.basename;
    const addButtonPendingStyle = {
      width: '22px',
      height: '22px',
      backgroundImage: `url('${baseName}/resources/images/spinner-loading.gif') 22 22, default`,
    };
    return (
      <div className={styles.whiteboardListContainer}>
        {
          boardList.map((item, i) => this.renderPresentationItem(item, i))
        }
        {
          isFetchingBoard ? <div style={addButtonPendingStyle} /> : <ButtonBase
            key="Add new presentation"
            tagName="div"
            onClick={this.createNewBoard}
            className={styles.boardItemNew}
          >
            <div className={styles.addNewPresentation}>
              <span>Add</span>
              <Icon iconName="add" />
            </div>
          </ButtonBase>
        }
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