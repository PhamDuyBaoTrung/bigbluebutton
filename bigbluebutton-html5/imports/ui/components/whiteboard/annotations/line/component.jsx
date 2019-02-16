import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AnnotationHelpers from '../helpers';

export default class LineDrawComponent extends Component {

  static getCoordinates(annotation, slideWidth, slideHeight) {
    const { points } = annotation;

    const x1 = (points[0] / 100) * slideWidth;
    const y1 = (points[1] / 100) * slideHeight;
    const x2 = (points[2] / 100) * slideWidth;
    const y2 = (points[3] / 100) * slideHeight;

    return {
      x1,
      y1,
      x2,
      y2,
    };
  }

  static checkPointInsideLine(annotation, x, y, slideWidth, slideHeight) {
    const { x1, y1, x2, y2 } = LineDrawComponent.getCoordinates(annotation, slideWidth, slideHeight);
    if (x1 === x2) {
      return x >= (x1 - 10) && x <= (x2 + 10) && y >= y1 && y <= y2;
    } else {
      return x >= x1 && x <= x2 && y >= (y1 - 10) && y <= (y2 + 10);
    }
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

  static transformPointsByAction(annotation, action, px, py, ax, ay, width, height, initialX, initialY, slideWidth, slideHeight) {
    const ANNOTATION_CONFIG = Meteor.settings.public.whiteboard.annotations;
    const HORIZONTAL_LEFT = ANNOTATION_CONFIG.resize.horizontal_left;
    const HORIZONTAL_RIGHT = ANNOTATION_CONFIG.resize.horizontal_right;
    const VERTICAL_TOP = ANNOTATION_CONFIG.resize.vertical_top;
    const VERTICAL_BOTTOM = ANNOTATION_CONFIG.resize.vertical_bottom;
    const DRAG = ANNOTATION_CONFIG.drag;
    let newStartX = ax;
    let newStartY = ay;
    let newWidth = width;
    let newHeight = height;
    switch (action) {
      case HORIZONTAL_LEFT:
        if (width > 0) {
          newStartX = px;
          newWidth = width - (px -ax);
        }
        break;
      case HORIZONTAL_RIGHT:
        if (width > 0) {
          newWidth = px - ax;
        }
        break;
      case VERTICAL_TOP:
        if (height > 0) {
          newStartY = py;
          newHeight = height - (py -ay);
        }
        break;
      case VERTICAL_BOTTOM:
        if (height > 0) {
          newHeight = py -ay;
        }
        break;
      case DRAG:
        newStartX = px + ax - initialX;
        newStartY = py + ay - initialY;
        newWidth = width;
        newHeight = height;
        break;
    }

    // update active annotation
    const newTransX = (newStartX / slideWidth) * 100;
    const newTransY = (newStartY / slideHeight) * 100;
    const newTransWidth = (newWidth / slideWidth) * 100;
    const newTransHeight = (newHeight / slideHeight) * 100;

    annotation.points[0] = newTransX;
    annotation.points[1] = newTransY;
    annotation.points[2] = newTransX + newTransWidth;
    annotation.points[3] = newTransY + newTransHeight;
    return annotation;
  }

  shouldComponentUpdate(nextProps) {
    return this.props.version !== nextProps.version;
  }

  render() {
    const { annotation, slideWidth, slideHeight } = this.props;
    const results = this.getCoordinates(annotation, slideWidth, slideHeight);
    const { x1, y1, x2, y2 } = results;

    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={AnnotationHelpers.getFormattedColor(annotation.color)}
        strokeLinejoin="round"
        strokeWidth={AnnotationHelpers.getStrokeWidth(annotation.thickness, slideWidth)}
        style={{ WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)' }}
      />
    );
  }
}

LineDrawComponent.propTypes = {
  // Defines a version of the shape, so that we know if we need to update the component or not
  version: PropTypes.number.isRequired,
  // Defines an annotation object, which contains all the basic info we need to draw a line
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
