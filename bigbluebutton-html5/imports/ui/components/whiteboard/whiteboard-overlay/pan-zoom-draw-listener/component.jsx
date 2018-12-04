import React from 'react';
// import PropTypes from 'prop-types';

const ANNOTATION_CONFIG = Meteor.settings.public.whiteboard.annotations;
const DRAW_UPDATE = ANNOTATION_CONFIG.status.update;
const DRAW_END = ANNOTATION_CONFIG.status.end;

export default class PanZoomDrawListener extends React.Component {
  constructor() {
    super();

    this.state = {
      // text shape state properties
      pointerX: undefined,
      pointerY: undefined,
      pointerWidth: 10,
      pointerHeight: 10,
    };

    this.activeAnnotation = undefined;

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  // main mouse down handler
  handleMouseDown(event) {
    const isLeftClick = event.button === 0;

    // if our current drawing state is not drawing the box and not writing the text
    if (isLeftClick) {
      window.addEventListener('mouseup', this.handleMouseUp);
      window.addEventListener('mousemove', this.handleMouseMove, true);

      const { clientX, clientY } = event;
      const { annotationsInfo } = this.props;
      this.commonUpdateShapeHandler(clientX, clientY, annotationsInfo);
    }
  }

  commonUpdateShapeHandler(clientX, clientY, annotations) {
    const activeAnnotation = this.findActiveAnnotation(annotations, clientX, clientY);
    if (activeAnnotation) {
      this.activeAnnotation = activeAnnotation;
      const { sendAnnotation, setTextShapeActiveId } = this.props.actions;
      activeAnnotation.status = DRAW_UPDATE;
      activeAnnotation.annotationInfo.status = DRAW_UPDATE;
      activeAnnotation.id = this.getActiveShapeId();
      sendAnnotation(activeAnnotation);
      setTextShapeActiveId(activeAnnotation.id);
    }
  }

  findActiveAnnotation(annotations, clientX, clientY) {
    if (!Array.isArray(annotations) || annotations.length === 0) {
      return null;
    }

    const { getTransformedSvgPoint } = this.props.actions;
    const transformedSvgPoint = getTransformedSvgPoint(clientX, clientY);
    const activeAnnotation = annotations.find(annotation => (
      this.isActiveAnnotation(annotation, transformedSvgPoint.x, transformedSvgPoint.y)));
    return activeAnnotation;
  }

  isActiveAnnotation(annotation, x, y) {
    const { slideWidth, slideHeight } = this.props;
    const annotationCoordinate =
      this.getCoordinates(annotation.annotationInfo, slideWidth, slideHeight);
    const startPointX = annotationCoordinate.x;
    const startPointY = annotationCoordinate.y;
    const endPointX = startPointX + annotationCoordinate.width;
    const endPointY = startPointY + annotationCoordinate.height;
    return x >= startPointX && x <= endPointX
      && y >= startPointY && y <= endPointY;
  }

  getCoordinates(annotation, slideWidth, slideHeight) {
    const {
      x, y,
      textBoxWidth,
      textBoxHeight,
      fontColor,
      fontSize,
      calcedFontSize,
      text,
    } = annotation;

    const _x = (x / 100) * slideWidth;
    const _y = (y / 100) * slideHeight;
    const _width = (textBoxWidth / 100) * slideWidth;
    const _height = (textBoxHeight / 100) * slideHeight;
    const _fontColor = fontColor;
    const _fontSize = fontSize;
    const _calcedFontSize = (calcedFontSize / 100) * slideHeight;
    const _text = text;

    return {
      x: _x,
      y: _y,
      text: _text,
      width: _width,
      height: _height,
      fontSize: _fontSize,
      fontColor: _fontColor,
      calcedFontSize: _calcedFontSize,
    };
  }

  // main mouse move handler
  handleMouseMove(event) {
    const { clientX, clientY } = event;
  }

  // main mouse up handler
  handleMouseUp(evt) {
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove, true);
    const { clientX, clientY } = evt;
    console.log(`End of Mouse Moving at x = ${clientX} y=${clientY}`);
    this.commonEndUpdateShape(clientX, clientY);
  }

  commonEndUpdateShape(clientX, clientY) {
    if (!this.activeAnnotation) {
      return;
    }
    const { getTransformedSvgPoint } = this.props.actions;
    const transformedSvgPoint = getTransformedSvgPoint(clientX, clientY);
    const isActive =
      this.isActiveAnnotation(this.activeAnnotation, transformedSvgPoint.x, transformedSvgPoint.y);
    if (!isActive) {
      const { sendAnnotation } = this.props.actions;
      this.activeAnnotation.annotationInfo.text = this.props.drawSettings.textShapeValue;
      this.activeAnnotation.id = this.getActiveShapeId();
      sendAnnotation(this.activeAnnotation);
      console.log(`End Shape updated ${this.activeAnnotation.id}`);
      this.sendLastUpdate();
      this.resetState();
    }
  }

  getActiveShapeId() {
    if (!this.activeAnnotation) {
      return null;
    }
    return this.activeAnnotation.id.split('-fake')[0];
  }

  sendLastUpdate() {
    if (!this.activeAnnotation) {
      return;
    }
    const { setTextShapeActiveId } = this.props.actions;
    this.handleDrawText(
      { x: this.activeAnnotation.annotationInfo.x, y: this.activeAnnotation.annotationInfo.y },
      this.activeAnnotation.annotationInfo.textBoxWidth,
      this.activeAnnotation.annotationInfo.textBoxHeight,
      DRAW_END,
      this.getActiveShapeId(),
      this.props.drawSettings.textShapeValue,
    );
    setTextShapeActiveId('');
  }

  handleDrawText(startPoint, width, height, status, id, text) {
    const { normalizeFont, sendAnnotation } = this.props.actions;

    const annotation = {
      id,
      status,
      annotationType: 'text',
      annotationInfo: {
        x: startPoint.x, // left corner
        y: startPoint.y, // left corner
        fontColor: this.props.drawSettings.color,
        calcedFontSize: normalizeFont(this.props.drawSettings.textFontSize), // fontsize
        textBoxWidth: width, // width
        text,
        textBoxHeight: height, // height
        id,
        whiteboardId: this.props.whiteboardId,
        status,
        fontSize: this.props.drawSettings.textFontSize,
        dataPoints: `${startPoint.x},${startPoint.y}`,
        type: 'text',
      },
      wbId: this.props.whiteboardId,
      userId: this.props.userId,
      position: 0,
    };

    sendAnnotation(annotation);
  }

  resetState() {
    this.state = {
      // text shape state properties
      pointerX: undefined,
      pointerY: undefined,
      pointerWidth: 10,
      pointerHeight: 10,
    };
    this.activeAnnotation = undefined;
  }

  render() {
    const textDrawStyle = {
      width: '100%',
      height: '100%',
      touchAction: 'none',
      zIndex: 2 ** 31 - 1,
    };
    const { contextMenuHandler } = this.props.actions;
    return (
      <div
        role="presentation"
        style={textDrawStyle}
        onMouseDown={this.handleMouseDown}
        onTouchStart={this.handleTouchStart}
        onContextMenu={contextMenuHandler}
      >
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x={this.state.pointerX}
            y={this.state.pointerY}
            fill="none"
            stroke="black"
            strokeWidth="1"
            width={this.state.pointerWidth}
            height={this.state.pointerHeight}
          />
        </svg>
      </div>);
  }
}
