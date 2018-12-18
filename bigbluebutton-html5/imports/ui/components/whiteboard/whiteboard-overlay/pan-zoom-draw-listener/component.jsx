import React from 'react';
import TextDrawComponent from "../../annotations/text/component";
import LineDrawComponent from "../../annotations/line/component";
import EllipseDrawComponent from "../../annotations/ellipse/component";
import TriangleDrawComponent from "../../annotations/triangle/component";
import RectangleDrawComponent from "../../annotations/rectangle/component";
import PencilDrawComponent from "../../annotations/pencil/component";
import BoundaryDrawComponent from "../../annotations/boundary/component";
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
      moveInsideSelectedShape: false,
      moveInsideOtherShape: false,
      // action
      isDragging: false,
      isResizing: false,
    };

    // initial mousedown coordinates
    this.initialX = undefined;
    this.initialY = undefined;

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
    const { getTransformedSvgPoint } = this.props.actions;
    const transformedSvgPoint = getTransformedSvgPoint(clientX, clientY);
    // saving initial X and Y coordinates for further displaying of the textarea
    this.initialX = transformedSvgPoint.x;
    this.initialY = transformedSvgPoint.y;

    const activeAnnotation = this.findActiveAnnotation(annotations, transformedSvgPoint.x, transformedSvgPoint.y);
    if (!activeAnnotation) {
      return;
    }

    if (!this.activeAnnotation) {
      this.activeAnnotation = activeAnnotation;
      const { updateAnnotation, setTextShapeActiveId, setActivatedShapeId } = this.props.actions;
      activeAnnotation.status = DRAW_UPDATE;
      activeAnnotation.annotationInfo.status = DRAW_UPDATE;
      updateAnnotation(activeAnnotation);
      if (activeAnnotation.annotationInfo.type === 'text') {
        setTextShapeActiveId(activeAnnotation.id);
      }
      setActivatedShapeId(activeAnnotation.id);
    } else {
      const { slideWidth, slideHeight } = this.props;
      const ac = this.getCoordinates(this.activeAnnotation.annotationInfo, slideWidth, slideHeight);
      this.canActivateHSplit(transformedSvgPoint.x, transformedSvgPoint.y, ac.width, ac.height, ac.x, ac.y);
      if (this.state.canVSplitOnBottom || this.state.canVSplitOnTop
        || this.state.canHSplitOnRight || this.state.canHSplitOnLeft) {
        this.setState({ isResizing: true });
      } else {
        this.setState({ isDragging: true });
      }
    }
  }

  findActiveAnnotation(annotations, x, y) {
    if (!Array.isArray(annotations) || annotations.length === 0) {
      return null;
    }
    const activeAnnotation = annotations.find(annotation => (
      this.checkCursorInsideShape(annotation.annotationInfo, x, y)));
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

  /**
   * (x1, y1) is top left coordinate of shape
   * (x2, y2) is bottom right coordinate of shape
   * (px, py) is cursor coordinate
   * @param type
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   * @param px
   * @param py
   */
  checkCursorInsideShape(annotation, px, py) {
    const { type } = annotation;
    const { slideWidth, slideHeight } = this.props;
    switch (type) {
      case 'text': {
        return TextDrawComponent.checkPointInsidePencil(annotation, px, py, slideWidth, slideHeight);
      }
      case 'line': {
        return LineDrawComponent.checkPointInsideLine(annotation, px, py, slideWidth, slideHeight);
      }
      case 'ellipse': {
        return EllipseDrawComponent.checkPointInsideEllipse(annotation, px, py, slideWidth, slideHeight);
      }
      case 'triangle': {
        return TriangleDrawComponent.checkPointInsideTriangle(annotation, px, py, slideWidth, slideHeight);
      }
      case 'rectangle': {
        return RectangleDrawComponent.checkPointInsideRectangle(annotation, px, py, slideWidth, slideHeight);
      }
      case 'pencil': {
        return PencilDrawComponent.checkPointInsidePencil(annotation, px, py, slideWidth, slideHeight);
      }
    }
  }

  checkPointInsideBox(px, py, startPointX, startPointY, endPointX, endPointY) {
    return px >= startPointX && px <= endPointX
      && py >= startPointY && py <= endPointY;
  }

  getCoordinates(annotation, slideWidth, slideHeight) {
    const {
      fontColor,
      fontSize,
      calcedFontSize,
      text,
    } = annotation;

    const boundary = BoundaryDrawComponent.getShapeBoundaryData(annotation);

    const _x = (boundary.startX / 100) * slideWidth;
    const _y = (boundary.startY / 100) * slideHeight;
    const _width = (boundary.width / 100) * slideWidth;
    const _height = (boundary.height / 100) * slideHeight;
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
    const { annotationsInfo } = this.props;
    this.commonMouseMoveHandler(clientX, clientY, annotationsInfo);
  }

  commonMouseMoveHandler(clientX, clientY, annotations) {
    // transform client coordination to svg coordination
    const {slideWidth, slideHeight } = this.props;
    const { getTransformedSvgPoint } = this.props.actions;
    const transformedSvgPoint = getTransformedSvgPoint(clientX, clientY);
    // no need to change cursor behavior when dragging or resizing
    if ((this.state.isDragging || this.state.isResizing) && this.activeAnnotation) {
      // transformed active shape coordination
      const ac = this.getCoordinates(this.activeAnnotation.annotationInfo, slideWidth, slideHeight);
      // when user is dragging or resizing, only need to update shape position
      this.updateNewPositionOfAnnotation(ac.x, ac.y, ac.width, ac.height,
        transformedSvgPoint.x, transformedSvgPoint.y);
    } else {
      // find the selectable shape
      const activeAnnotation = this.findActiveAnnotation(annotations, transformedSvgPoint.x, transformedSvgPoint.y);
      // stop processing if moving to empty shapes space
      if (!activeAnnotation) {
        this.setState({
          moveInsideSelectedShape: false,
          moveInsideOtherShape: false,
          canHSplitOnRight: false,
          canHSplitOnLeft: false,
          canVSplitOnTop: false,
          canVSplitOnBottom: false,
          isResizing: false,
          isDragging: false
        });
        return;
      }
      // change cursor behavior
      this.setState({
        moveInsideSelectedShape: this.activeAnnotation && activeAnnotation._id === this.activeAnnotation._id,
        moveInsideOtherShape: !this.activeAnnotation || activeAnnotation._id !== this.activeAnnotation._id,
      });
      // transformed active coordinations
      const ac = this.getCoordinates(activeAnnotation.annotationInfo, slideWidth, slideHeight);
      // check cursor position for resizing
      if (this.state.moveInsideSelectedShape) {
        this.canActivateHSplit(transformedSvgPoint.x, transformedSvgPoint.y,
          ac.width, ac.height, ac.x, ac.y);
      }
      // update position of shape
      this.updateNewPositionOfAnnotation(ac.x, ac.y, ac.width, ac.height,
        transformedSvgPoint.x, transformedSvgPoint.y);
    }
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
    const canHSplitOnRight = this.checkPointInsideBox(x, y, midRight.x - this.cornerPointR, midRight.y - this.cornerPointR, midRight.x + this.cornerPointR, midRight.y + this.cornerPointR);
    const canHSplitOnLeft = this.checkPointInsideBox(x, y, midLeft.x - this.cornerPointR,
      midLeft.y - this.cornerPointR, midLeft.x + this.cornerPointR, midLeft.y + this.cornerPointR);
    const canVSplitOnTop = this.checkPointInsideBox(x, y, midTop.x - this.cornerPointR,
      midTop.y - this.cornerPointR, midTop.x + this.cornerPointR, midTop.y + this.cornerPointR);
    const canVSplitOnBottom = this.checkPointInsideBox(x, y, midBottom.x - this.cornerPointR, midBottom.y - this.cornerPointR, midBottom.x + this.cornerPointR, midBottom.y + this.cornerPointR);
    this.setState({
      canHSplitOnRight,
      canHSplitOnLeft,
      canVSplitOnTop,
      canVSplitOnBottom,
    });
  }

  updateShapePositionByTypeAndAction(action, ax, ay, aw, ah, px, py) {
    const { annotationInfo } = this.activeAnnotation;
    const { type } = annotationInfo;
    let newAnnotation;
    switch (type) {
      case 'text': {
        newAnnotation = TextDrawComponent.transformPointsByAction(annotationInfo, action, px, py, ax, ay, aw, ah);
        break;
      }
      case 'line': {
        newAnnotation = LineDrawComponent.transformPointsByAction(annotationInfo, action, px, py, ax, ay, aw, ah);
        break;
      }
      case 'ellipse': {
        newAnnotation = EllipseDrawComponent.transformPointsByAction(annotationInfo, action, px, py, ax, ay, aw, ah);
        break;
      }
      case 'triangle': {
        newAnnotation = TriangleDrawComponent.transformPointsByAction(annotationInfo, action, px, py, ax, ay, aw, ah);
        break;
      }
      case 'rectangle': {
        newAnnotation = RectangleDrawComponent.transformPointsByAction(annotationInfo, action, px, py, ax, ay, aw, ah);
        break;
      }
      case 'pencil': {
        newAnnotation = PencilDrawComponent.transformPointsByAction(annotationInfo, action, px, py, ax, ay, aw, ah);
        break;
      }
    }
    return newAnnotation;
  }

  updateNewPositionOfAnnotation(ax, ay, aw, ah, px, py) {
    if (!this.activeAnnotation || (!this.state.isResizing && !this.state.isDragging)) {
      return;
    }
    const ANNOTATION_CONFIG = Meteor.settings.public.whiteboard.annotations;
    const HORIZONTAL_LEFT = ANNOTATION_CONFIG.resize.horizontal_left;
    const HORIZONTAL_RIGHT = ANNOTATION_CONFIG.resize.horizontal_right;
    const VERTICAL_TOP = ANNOTATION_CONFIG.resize.vertical_top;
    const VERTICAL_BOTTOM = ANNOTATION_CONFIG.resize.vertical_bottom;
    const DRAG = ANNOTATION_CONFIG.drag;

    let newAnnotation;
    if (this.state.isResizing && this.state.canHSplitOnLeft) {
      newAnnotation = this.updateShapePositionByTypeAndAction(HORIZONTAL_LEFT, ax, ay, aw, ah, px, py);
    } else if (this.state.isResizing && this.state.canHSplitOnRight) {
      newAnnotation = this.updateShapePositionByTypeAndAction(HORIZONTAL_RIGHT, ax, ay, aw, ah, px, py);
    } else if (this.state.isResizing && this.state.canVSplitOnTop) {
      newAnnotation = this.updateShapePositionByTypeAndAction(VERTICAL_TOP, ax, ay, aw, ah, px, py);
    } else if (this.state.isResizing && this.state.canVSplitOnBottom) {
      newAnnotation = this.updateShapePositionByTypeAndAction(VERTICAL_BOTTOM, ax, ay, aw, ah, px, py);
    } else if (this.state.isDragging) {
      newAnnotation = this.updateShapePositionByTypeAndAction(DRAG, ax, ay, aw, ah, px, py);
    }

    // update active annotation
    this.activeAnnotation.annotationInfo = newAnnotation;
    const { updateAnnotation } = this.props.actions;
    updateAnnotation(this.activeAnnotation);

    if (this.state.isDragging) {
      this.initialX = px;
      this.initialY = py;
    }
  }

  updateShapePosition(ax, ay, aw, ah, px, py) {
    if (!this.activeAnnotation || (!this.state.isResizing && !this.state.isDragging)) {
      return;
    }
    let newStartX = ax;
    let newStartY = ay;
    let newWidth = aw;
    let newHeight = ah;
    if (this.state.isResizing && this.state.canHSplitOnLeft) {
      newStartX = px;
      newStartY = ay;
      const deltaX = px - ax;
      newWidth = aw - deltaX;
      newHeight = ah;
    } else if (this.state.isResizing && this.state.canHSplitOnRight) {
      newStartX = ax;
      newStartY = ay;
      const midRight = {
        x: ax + aw,
        y: ay + (ah / 2),
      };
      const deltaX = px - midRight.x;
      console.log(`ax: ${ax}, aWidth: ${aw}, 
      _activeWidth: ${this.activeAnnotation.annotationInfo.textBoxWidth},
      _activeHeight: ${this.activeAnnotation.annotationInfo.textBoxHeight},
      _activeX: ${this.activeAnnotation.annotationInfo.x},
      _activeY: ${this.activeAnnotation.annotationInfo.y},
      px: ${px}, midRightX: ${midRight.x},
      deltaX=${deltaX}`);
      newWidth = aw + deltaX;
      newHeight = ah;
    } else if (this.state.isResizing && this.state.canVSplitOnTop) {
      newStartX = ax;
      newStartY = py;
      const deltaY = py - ay;
      newWidth = aw;
      newHeight = ah - deltaY;
    } else if (this.state.isResizing && this.state.canVSplitOnBottom) {
      newStartX = ax;
      newStartY = ay;
      const midBottom = {
        x: ax + (aw / 2),
        y: ay + ah,
      };
      const deltaY = py - midBottom.y;
      newWidth = aw;
      newHeight = ah + deltaY;
    } else if (this.state.isDragging) {
      newStartX = px + ax - this.initialX;
      newStartY = py + ay - this.initialY;
      newWidth = aw;
      newHeight = ah;
    }

    console.log(`isResizing: ${this.state.isResizing}, newX: ${newStartX}, oldX: ${ax}, 
    newY: ${newStartY}, oldY: ${ay}, px: ${px}, py: ${py}`);

    // update active annotation
    const newTransX = (newStartX / this.props.slideWidth) * 100;
    const newTransY = (newStartY / this.props.slideHeight) * 100;
    const newTransWidth = (newWidth / this.props.slideWidth) * 100;
    const newTransHeight = (newHeight / this.props.slideHeight) * 100;
    this.activeAnnotation.annotationInfo.x = newTransX;
    this.activeAnnotation.annotationInfo.y = newTransY;
    this.activeAnnotation.annotationInfo.textBoxWidth = newTransWidth;
    this.activeAnnotation.annotationInfo.textBoxHeight = newTransHeight;
    console.log(`newTransX: ${newTransX}, newTransY: ${newTransY}, newTransWidth: ${newTransWidth}, 
    newTransHeight: ${newTransHeight}`);
    const { updateAnnotation } = this.props.actions;
    updateAnnotation(this.activeAnnotation);

    if (this.state.isDragging) {
      this.initialX = px;
      this.initialY = py;
    }
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
      this.activeAnnotation = undefined;
    }
    this.resetState();
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
    const { setTextShapeActiveId, setActivatedShapeId } = this.props.actions;
    this.handleDrawText(
      { x: this.activeAnnotation.annotationInfo.x, y: this.activeAnnotation.annotationInfo.y },
      this.activeAnnotation.annotationInfo.textBoxWidth,
      this.activeAnnotation.annotationInfo.textBoxHeight,
      DRAW_END,
      this.getActiveShapeId(),
      this.props.drawSettings.textShapeValue,
    );
    if (this.activeAnnotation.annotationInfo.type === 'text') {
      setTextShapeActiveId(null);
    }
    setActivatedShapeId(null);
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
    this.setState({
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
      moveInsideSelectedShape: false,
      moveInsideOtherShape: false,
      // action
      isDragging: false,
      isResizing: false,
    });
    this.initialX = undefined;
    this.initialY = undefined;
  }

  render() {
    const baseName = Meteor.settings.public.app.basename;
    let cursor = 'pointer';
    if (this.state.canHSplitOnLeft || this.state.canHSplitOnRight) {
      cursor = `url('${baseName}/resources/images/whiteboard-cursor/resize_h.png') 0 8, default`;
    } else if (this.state.canVSplitOnBottom || this.state.canVSplitOnTop) {
      cursor = `url('${baseName}/resources/images/whiteboard-cursor/resize_v.png') 8 0, default`;
    } else if (this.state.moveInsideSelectedShape) {
      cursor = `url('${baseName}/resources/images/whiteboard-cursor/drag.png') 8 8, default`;
    } else if (this.state.moveInsideOtherShape) {
      cursor = `url('${baseName}/resources/images/whiteboard-cursor/hand.png') 4 16, default`;
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
