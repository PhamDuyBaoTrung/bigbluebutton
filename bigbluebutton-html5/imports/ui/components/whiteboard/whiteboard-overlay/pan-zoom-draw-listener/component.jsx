import React from 'react';
// import PropTypes from 'prop-types';

const ANNOTATION_CONFIG = Meteor.settings.public.whiteboard.annotations;
const DRAW_UPDATE = ANNOTATION_CONFIG.status.update;

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
      this.commonUpdateShapeHandler(clientX, clientY);
    }
  }

  commonUpdateShapeHandler(clientX, clientY, annotations) {
    console.log(`LIST ANNOTATION ${annotations}`);
    if (Array.isArray(annotations)) {
      const activeAnnotation = annotations.find((annotation) => {
        const startPointX = annotation.annotationInfo.points[0];
        const startPointY = annotation.annotationInfo.points[1];
        const endPointX = annotation.annotationInfo.points[2];
        const endPointY = annotation.annotationInfo.points[3];
        return clientX >= startPointX && clientX <= endPointX
          && clientY >= startPointY && clientY <= endPointY;
      });
      console.log(`ACTIVE ANNOTATION ${activeAnnotation}`);
      if (activeAnnotation) {
        const { sendAnnotation, setTextShapeActiveId } = this.props.actions;
        activeAnnotation.status = DRAW_UPDATE;
        sendAnnotation(activeAnnotation);
        setTextShapeActiveId(activeAnnotation.id);
      }
    }
  }

  // main mouse move handler
  handleMouseMove(event) {
    const { clientX, clientY } = event;
    console.log(`Moving at x = ${clientX} y=${clientY}`);
  }

  // main mouse up handler
  handleMouseUp(evt) {
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove, true);
    const { clientX, clientY } = evt;
    console.log(`End of Mouse Moving at x = ${clientX} y=${clientY}`);
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
