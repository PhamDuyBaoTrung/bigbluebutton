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
      // cursors
      canHSplitOnRight: false,
      canHSplitOnLeft: false,
      canVSplitOnTop: false,
      canVSplitOnBottom: false,

    };

    this.activeAnnotation = undefined;
    this.isPressed = false;
    this.cornerPointR = 10;

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  // main mouse down handler
  handleMouseDown(event) {
    const isLeftClick = event.button === 0;

    // if our current drawing state is not drawing the box and not writing the text
    if (isLeftClick) {
      this.isPressed = true;
      window.addEventListener('mouseup', this.handleMouseUp);
      window.addEventListener('mousemove', this.handleMouseMove);

      const { clientX, clientY } = event;
      const { annotationsInfo } = this.props;
      this.commonUpdateShapeHandler(clientX, clientY, annotationsInfo);
    }
  }

  commonUpdateShapeHandler(clientX, clientY, annotations) {
    const activeAnnotation = this.findActiveAnnotation(annotations, clientX, clientY);
    if (activeAnnotation) {
      this.activeAnnotation = activeAnnotation;
      const { updateAnnotation, setTextShapeActiveId } = this.props.actions;
      activeAnnotation.status = DRAW_UPDATE;
      activeAnnotation.annotationInfo.status = DRAW_UPDATE;
      updateAnnotation(activeAnnotation, activeAnnotation.annotationInfo.text);
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

  checkPointInsideBox(px, py, startPointX, startPointY, endPointX, endPointY) {
    return px >= startPointX && px <= endPointX
      && py >= startPointY && py <= endPointY;
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
    // transform client coordination to svg coordination
    const { annotationsInfo, slideWidth, slideHeight } = this.props;
    const { getTransformedSvgPoint } = this.props.actions;
    const transformedSvgPoint = getTransformedSvgPoint(clientX, clientY);
    annotationsInfo.forEach((annotation) => {
      const ac = this.getCoordinates(annotation.annotationInfo, slideWidth, slideHeight);
      const isActive = this.checkPointInsideBox(transformedSvgPoint.x, transformedSvgPoint.y, ac.x, ac.y, ac.x + ac.width, ac.y + ac.height);
      if (isActive && this.activeAnnotation) {
        console.log('Checking splitting...');
        this.canActivateHSplit(transformedSvgPoint.x, transformedSvgPoint.y, ac.width, ac.height, ac.x, ac.y);
      }
    });
  }

  canActivateHSplit(x, y, width, height, sx, sy) {
    // top left corner coordinates
    const midLeft = {
      x: sx,
      y: sy + (height / 2),
    };
    // top right corner coordinates
    const midRight = {
      x: sx + width,
      y: sy + (height / 2),
    };
    // bottom right corner coordinates
    const midTop = {
      x: sx + (width / 2),
      y: sy,
    };
    // bottom left corner coordinates
    const midBottom = {
      x: sx + (width / 2),
      y: sy + height,
    };
    console.log(`X: ${x}, Y: ${y}, midRightX: ${midRight.x}, midRightY: ${midRight.y}, cornerPointR: ${this.cornerPointR}, 
      Rect(${midRight.x - this.cornerPointR}, ${midRight.y - this.cornerPointR}, ${midRight.x + this.cornerPointR}, ${midRight.y + this.cornerPointR})`);
    const canHSplitOnRight = this.checkPointInsideBox(x, y, midRight.x - this.cornerPointR, midRight.y - this.cornerPointR, midRight.x + this.cornerPointR, midRight.y + this.cornerPointR);
    const canHSplitOnLeft = this.checkPointInsideBox(x, y, midLeft.x - this.cornerPointR, midLeft.y - this.cornerPointR, midLeft.x + this.cornerPointR, midLeft.y + this.cornerPointR);
    const canVSplitOnTop = this.checkPointInsideBox(x, y, midTop.x - this.cornerPointR, midTop.y - this.cornerPointR, midTop.x + this.cornerPointR, midTop.y + this.cornerPointR);
    const canVSplitOnBottom = this.checkPointInsideBox(x, y, midBottom.x - this.cornerPointR, midBottom.y - this.cornerPointR, midBottom.x + this.cornerPointR, midBottom.y + this.cornerPointR);
    this.setState({
      canHSplitOnRight,
      canHSplitOnLeft,
      canVSplitOnTop,
      canVSplitOnBottom,
    });
  }

  // main mouse up handler
  handleMouseUp(evt) {
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.isPressed = false;
    const { clientX, clientY } = evt;
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
      const { updateAnnotation } = this.props.actions;
      this.activeAnnotation.annotationInfo.text = this.props.drawSettings.textShapeValue;
      updateAnnotation(this.activeAnnotation);
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
      this.activeAnnotation._id,
      this.props.drawSettings.textShapeValue,
    );
    setTextShapeActiveId('');
  }

  handleDrawText(startPoint, width, height, status, id, _id, text) {
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
    const baseName = Meteor.settings.public.app.basename;
    let cursor = 'pointer';
    if (this.state.canHSplitOnLeft || this.state.canHSplitOnRight) {
      cursor = 'ew-resize';
    } else if (this.state.canVSplitOnBottom || this.state.canVSplitOnTop) {
      cursor = 'ns-resize';
    }
    const textDrawStyle = {
      width: '100%',
      height: '100%',
      touchAction: 'none',
      zIndex: 2 ** 31 - 1,
      cursor,
    };
    const { contextMenuHandler } = this.props.actions;
    return (
      <div
        role="presentation"
        style={textDrawStyle}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
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
