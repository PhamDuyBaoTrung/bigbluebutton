import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AnnotationHelpers from '../helpers';

export default class RectangleDrawComponent extends Component {

  static checkPointInsideRectangle(annotation, x, y, slideWidth, slideHeight) {
    const {px, py, width, height} = this.getCoordinates(annotation, slideWidth, slideHeight);
    return x >= px && x <= (px + width) && y >= py && y <= (py + height);
  }

  static getTopLeftCornerCoordinates(annotation) {
    const { points } = annotation;
    if (!Array.isArray(points) || points.length < 4) {
      return null;
    }
    return {
      startX: points[0],
      startY: points[1],
      width: points[2] - points[0],
      height: points[3] - points[1],
    }
  }

  static transformPointsByAction(annotation, action, px, py, ax, ay, width, height) {
    const ANNOTATION_CONFIG = Meteor.settings.public.whiteboard.annotations;
    const HORIZONTAL_LEFT = ANNOTATION_CONFIG.resize.horizontal_left;
    const HORIZONTAL_RIGHT = ANNOTATION_CONFIG.resize.horizontal_right;
    const VERTICAL_TOP = ANNOTATION_CONFIG.resize.vertical_top;
    const VERTICAL_BOTTOM = ANNOTATION_CONFIG.resize.vertical_bottom;
    let newStartX = ax;
    let newStartY = ay;
    let newWidth = width;
    let newHeight = height;
    switch (action) {
      case HORIZONTAL_LEFT:
        newStartX = px;
        newWidth = width - (px - ax);
        break;
      case HORIZONTAL_RIGHT:
        newWidth = px - ax;
        break;
      case VERTICAL_TOP:
        newStartY = py;
        newHeight = height - (py - ay);
        break;
      case VERTICAL_BOTTOM:
        newHeight = py - ay;
        break;
    }

    // update active annotation
    const newTransX = (newStartX / this.props.slideWidth) * 100;
    const newTransY = (newStartY / this.props.slideHeight) * 100;
    const newTransWidth = (newWidth / this.props.slideWidth) * 100;
    const newTransHeight = (newHeight / this.props.slideHeight) * 100;
    annotation.points[0] = newTransX;
    annotation.points[1] = newTransY;
    annotation.points[2] = newTransX + newTransWidth;
    annotation.points[3] = newTransY + newTransHeight;
    return annotation;
  }

  shouldComponentUpdate(nextProps) {
    return this.props.version !== nextProps.version;
  }

  getCoordinates(annotation, slideWidth, slideHeight) {
    const { points } = annotation;
    // x1 and y1 are the coordinates of the top left corner of the annotation
    // x2 and y2 are the coordinates of the bottom right corner of the annotation
    let x1 = points[0];
    let y1 = points[1];
    let x2 = points[2];
    let y2 = points[3];

    // Presenter pulled rectangle to the left
    if (x2 < x1) {
      x1 = points[2];
      x2 = points[0];
    }

    // Presenter pulled Rectangle to the top
    if (y2 < y1) {
      y1 = points[3];
      y2 = points[1];
    }

    const x = (x1 / 100) * slideWidth;
    const y = (y1 / 100) * slideHeight;
    const width = ((x2 - x1) / 100) * slideWidth;
    const height = ((y2 - y1) / 100) * slideHeight;

    return {
      x,
      y,
      width,
      height,
    };
  }

  render() {
    const { annotation, slideWidth, slideHeight } = this.props;
    const results = this.getCoordinates(annotation, slideWidth, slideHeight);

    return (
      <rect
        x={results.x}
        y={results.y}
        width={results.width}
        height={results.height}
        fill="none"
        stroke={AnnotationHelpers.getFormattedColor(annotation.color)}
        strokeWidth={AnnotationHelpers.getStrokeWidth(annotation.thickness, slideWidth)}
        style={{ WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)' }}
      />
    );
  }
}

RectangleDrawComponent.propTypes = {
  // Defines a version of the shape, so that we know if we need to update the component or not
  version: PropTypes.number.isRequired,
  // Defines an annotation object, which contains all the basic info we need to draw a rectangle
  annotation: PropTypes.shape({
    points: PropTypes.arrayOf(PropTypes.number).isRequired,
    color: PropTypes.number.isRequired,
    thickness: PropTypes.number.isRequired,
  }).isRequired,
  // Defines the width of the slide (svg coordinate system), which needed in calculations
  slideWidth: PropTypes.number.isRequired,
  // Defines the height of the slide (svg coordinate system), which needed in calculations
  slideHeight: PropTypes.number.isRequired,
};
