import React, { Component } from 'react';
import PropTypes from 'prop-types';

const ANNOTATION_CONFIG = Meteor.settings.public.whiteboard.annotations;
const CURSOR_INTERVAL = 16;
const DRAW_START = ANNOTATION_CONFIG.status.start;
const DRAW_END = ANNOTATION_CONFIG.status.end;

export default class PresentationOverlay extends Component {
  constructor(props) {
    super(props);

    // last sent coordinates
    this.lastSentClientX = 0;
    this.lastSentClientY = 0;

    // last updated coordinates
    this.currentClientX = 0;
    this.currentClientY = 0;

    // id of the setInterval()
    this.intervalId = 0;

    // using store image annotation
    this.imageAnnotation = null;

    // Mobile Firefox has a bug where e.preventDefault on touchstart doesn't prevent
    // onmousedown from triggering right after. Thus we have to track it manually.
    // In case if it's fixed one day - there is another issue, React one.
    // https://github.com/facebook/react/issues/9809
    // Check it to figure if you can add onTouchStart in render(), or should use raw DOM api
    this.touchStarted = false;

    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
    this.checkCursor = this.checkCursor.bind(this);
    this.mouseEnterHandler = this.mouseEnterHandler.bind(this);
    this.mouseOutHandler = this.mouseOutHandler.bind(this);
    this.getTransformedSvgPoint = this.getTransformedSvgPoint.bind(this);
    this.svgCoordinateToPercentages = this.svgCoordinateToPercentages.bind(this);
    this.onDropFile = this.onDropFile.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
  }

  onDropFile(ev) {
    ev.preventDefault();
    const file = ev.dataTransfer.items[0].getAsFile();

    const { clientX, clientY } = ev;
    const { sendAnnotation, slideWidth, slideHeight } = this.props;
    const id = this.generateNewShapeId();
    const imageAnnotation = this.createImageAnnotation(
      id, null, 0, 0,
      DRAW_START, clientX, clientY,
    );
    const that = this;
    const img = new Image();
    img.onload = function () {
      imageAnnotation.annotationInfo.imageWidth = (this.width / slideWidth) * 100;
      imageAnnotation.annotationInfo.imageHeight = (this.height / slideHeight) * 100;
      imageAnnotation.annotationInfo.src = this.src;
      sendAnnotation(imageAnnotation);
      this.imageAnnotation = imageAnnotation;
      that.handleDroppedFile(file);
    };
    img.src = window.URL.createObjectURL(file);
  }

  onDragOver(ev) {
    ev.stopPropagation();
    ev.preventDefault();
  }

  onUploadingImage(e) {
    const progress = Math.round((e.loaded * 100.0) / e.total);
    document.getElementById('progress').style.width = `${progress}%`;
  }

  // transforms the coordinate from window coordinate system
  // to the main svg coordinate system
  getTransformedSvgPoint(clientX, clientY) {
    const svgObject = this.props.getSvgRef();
    const screenPoint = svgObject.createSVGPoint();
    screenPoint.x = clientX;
    screenPoint.y = clientY;

    // transform a screen point to svg point
    const CTM = svgObject.getScreenCTM();
    return screenPoint.matrixTransform(CTM.inverse());
  }

  generateNewShapeId() {
    this.imageCount = this.imageCount + 1;
    return `${this.props.userId}-${this.imageCount}-${new Date().getTime()}`;
  }

  handleDroppedFile(file, annotation) {
    const { uploadImage } = this.props;
    // Reset the upload progress bar
    document.getElementById('progress').style.width = 0;
    uploadImage(
      file,
      this.uploadImageErrorHandler.bind(this),
      this.afterUploadImage.bind(this),
      this.onUploadingImage.bind(this),
    );
  }

  uploadImageErrorHandler(error) {
    console.warn(`An error occurd when try to upload image ${error}`);
  }

  afterUploadImage(result) {
    const { sendAnnotation, slideWidth, slideHeight } = this.props;
    const cloneAnnotation = Object.assign({}, this.imageAnnotation);
    cloneAnnotation.annotationInfo.src = result.secure_url;
    cloneAnnotation.annotationInfo.imageWidth = (result.width / slideWidth) * 100;
    cloneAnnotation.annotationInfo.imageHeight = (result.height / slideHeight) * 100;
    cloneAnnotation.status = DRAW_END;
    cloneAnnotation.annotationInfo.status = DRAW_END;
    sendAnnotation(cloneAnnotation);
    this.imageAnnotation = null;
  }

  createImageAnnotation(id, src, width, height, status, clientX, clientY) {
    const { slideWidth, slideHeight } = this.props;
    const transformedSvgPoint = this.getTransformedSvgPoint(clientX, clientY);
    const x = (transformedSvgPoint.x / slideWidth) * 100;
    const y = (transformedSvgPoint.y / slideHeight) * 100;
    return {
      id,
      status,
      annotationType: 'image',
      annotationInfo: {
        x, // left corner
        y, // left corner
        src,
        imageWidth: (width / slideWidth) * 100, // width
        imageHeight: (height / slideHeight) * 100, // height
        id,
        whiteboardId: this.props.whiteboardId,
        status,
        type: 'image',
      },
      wbId: this.props.whiteboardId,
      userId: this.props.userId,
      position: 0,
    };
  }

  checkCursor() {
    // check if the cursor hasn't moved since last check
    if (this.lastSentClientX !== this.currentClientX
      || this.lastSentClientY !== this.currentClientY) {
      const { currentClientX, currentClientY } = this;
      // retrieving a transformed coordinate
      let transformedSvgPoint = this.getTransformedSvgPoint(currentClientX, currentClientY);
      // determining the cursor's coordinates as percentages from the slide's width/height
      transformedSvgPoint = this.svgCoordinateToPercentages(transformedSvgPoint);
      // updating last sent raw coordinates
      this.lastSentClientX = currentClientX;
      this.lastSentClientY = currentClientY;

      // sending the update to the server
      this.props.updateCursor({ xPercent: transformedSvgPoint.x, yPercent: transformedSvgPoint.y });
    }
  }

  // receives an svg coordinate and changes the values to percentages of the slide's width/height
  svgCoordinateToPercentages(svgPoint) {
    const point = {
      x: (svgPoint.x / this.props.slideWidth) * 100,
      y: (svgPoint.y / this.props.slideHeight) * 100,
    };

    return point;
  }


  handleTouchStart(event) {
    // to prevent default behavior (scrolling) on devices (in Safari), when you draw a text box
    event.preventDefault();

    window.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchcancel', this.handleTouchCancel, true);

    this.touchStarted = true;

    const { clientX, clientY } = event.changedTouches[0];
    this.currentClientX = clientX;
    this.currentClientY = clientY;

    const intervalId = setInterval(this.checkCursor, CURSOR_INTERVAL);
    this.intervalId = intervalId;
  }

  handleTouchMove(event) {
    event.preventDefault();

    const { clientX, clientY } = event.changedTouches[0];

    this.currentClientX = clientX;
    this.currentClientY = clientY;
  }

  handleTouchEnd(event) {
    event.preventDefault();

    // touch ended, removing the interval
    clearInterval(this.intervalId);
    this.intervalId = 0;

    // resetting the touchStarted flag
    this.touchStarted = false;

    // setting the coords to negative values and send the last message (the cursor will disappear)
    this.currentClientX = -1;
    this.currentClientY = -1;
    this.checkCursor();

    window.removeEventListener('touchend', this.handleTouchEnd, { passive: false });
    window.removeEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.removeEventListener('touchcancel', this.handleTouchCancel, true);
  }

  handleTouchCancel(event) {
    event.preventDefault();

    // touch was cancelled, removing the interval
    clearInterval(this.intervalId);
    this.intervalId = 0;

    // resetting the touchStarted flag
    this.touchStarted = false;

    // setting the coords to negative values and send the last message (the cursor will disappear)
    this.currentClientX = -1;
    this.currentClientY = -1;
    this.checkCursor();

    window.removeEventListener('touchend', this.handleTouchEnd, { passive: false });
    window.removeEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.removeEventListener('touchcancel', this.handleTouchCancel, true);
  }

  mouseMoveHandler(event) {
    if (this.touchStarted) {
      return;
    }

    // for the case where you change settings in one of the lists (which are displayed on the slide)
    // the mouse starts pointing to the slide right away and mouseEnter doesn't fire
    // so we call it manually here
    if (!this.intervalId) {
      this.mouseEnterHandler();
    }

    this.currentClientX = event.clientX;
    this.currentClientY = event.clientY;
  }

  mouseEnterHandler() {
    if (this.touchStarted) {
      return;
    }

    const intervalId = setInterval(this.checkCursor, CURSOR_INTERVAL);
    this.intervalId = intervalId;
  }

  mouseOutHandler() {
    // mouse left the whiteboard, removing the interval
    clearInterval(this.intervalId);
    this.intervalId = 0;

    // setting the coords to negative values and send the last message (the cursor will disappear)
    this.currentClientX = -1;
    this.currentClientY = -1;
    this.checkCursor();
  }

  render() {
    return (
      <foreignObject
        clipPath="url(#viewBox)"
        x="0"
        y="0"
        width={this.props.slideWidth}
        height={this.props.slideHeight}
        // maximun value of z-index to prevent other things from overlapping
        style={{ zIndex: 2 ** 31 - 1 }}
      >
        <div
          onTouchStart={this.handleTouchStart}
          onMouseOut={this.mouseOutHandler}
          onMouseEnter={this.mouseEnterHandler}
          onMouseMove={this.mouseMoveHandler}
          onDragOver={this.onDragOver}
          onDrop={this.onDropFile}
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
        >
          <div className="progress" id="progress"></div>
          {this.props.children}
        </div>
      </foreignObject>
    );
  }
}

PresentationOverlay.propTypes = {
  // Defines a function which returns a reference to the main svg object
  getSvgRef: PropTypes.func.isRequired,

  // Defines the calculated slide width (in svg coordinate system)
  slideWidth: PropTypes.number.isRequired,

  // Defines the calculated slide height (in svg coordinate system)
  slideHeight: PropTypes.number.isRequired,

  // A function to send a cursor update
  updateCursor: PropTypes.func.isRequired,

  // As a child we expect only a WhiteboardOverlay at this point
  children: PropTypes.element.isRequired,

  whiteboardId: PropTypes.string,

  // Defines method to send Annotation
  sendAnnotation: PropTypes.func.isRequired,
};
