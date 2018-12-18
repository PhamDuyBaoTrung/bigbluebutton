import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AnnotationHelpers from '../helpers';

export default class TriangleDrawComponent extends Component {

  static checkPointInsideTriangle(annotation, x, y, slideWidth, slideHeight) {
    const { x1, y1, x2, y2, x3, y3 } = TriangleDrawComponent.getTriangleCoordinates(annotation, slideWidth, slideHeight);
    const A = TriangleDrawComponent.calculateArea(x1, y1, x2, y2, x3, y3);
    const A1 = TriangleDrawComponent.calculateArea(x, y, x2, y2, x3, y3);
    const A2 = TriangleDrawComponent.calculateArea(x1, y1, x, y, x3, y3);
    const A3 = TriangleDrawComponent.calculateArea(x1, y1, x2, y2, x, y);
    const delta = Math.abs(A1 + A2 + A3 - A);
    console.log(`Delta: ${delta} and is Active ${delta <= 1}`);
    return delta <= 1;
  }

  static getTriangleCoordinates(annotation, slideWidth, slideHeight) {
    const { points } = annotation;
    // points[0] and points[1] are x and y coordinates of the top left corner of the annotation
    // points[2] and points[3] are x and y coordinates of the bottom right corner of the annotation
    const xBottomLeft = points[0];
    const yBottomLeft = points[3];
    const xBottomRight = points[2];
    const yBottomRight = points[3];
    const xTop = ((xBottomRight - xBottomLeft) / 2) + xBottomLeft;
    const yTop = points[1];

    return {
      x1: (xTop / 100) * slideWidth,
      y1: (yTop / 100) * slideHeight,
      x2: (xBottomLeft / 100) * slideWidth,
      y2: (yBottomLeft / 100) * slideHeight,
      x3: (xBottomRight / 100) * slideWidth,
      y3: (yBottomRight / 100) * slideHeight
    }
  }

  static calculateArea(x1, y1, x2, y2, x3, y3) {
    return Math.abs((x1*(y2-y3) + x2*(y3-y1)+ x3*(y1-y2))/2.0);
  }

  static getTopLeftCornerCoordinates(annotation) {
    const { points } = annotation;
    if (!Array.isArray(points) || points.length < 4) {
      return null;
    }
    // points[0] and points[1] are x and y coordinates of the top left corner of the annotation
    // points[2] and points[3] are x and y coordinates of the bottom right corner of the annotation
    const xBottomLeft = points[0];
    const yBottomLeft = points[3];
    const xBottomRight = points[2];
    const yTop = points[1];
    return {
      startX: xBottomLeft,
      startY: yTop,
      width: xBottomRight - xBottomLeft,
      height: yBottomLeft - yTop,
    }
  }

  static transformPointsByAction(annotation, action, px, py, ax, ay, width, height, slideWidth, slideHeight) {
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

  getCoordinates(annotation, slideWidth, slideHeight) {
    const { points } = annotation;

    // points[0] and points[1] are x and y coordinates of the top left corner of the annotation
    // points[2] and points[3] are x and y coordinates of the bottom right corner of the annotation
    const xBottomLeft = points[0];
    const yBottomLeft = points[3];
    const xBottomRight = points[2];
    const yBottomRight = points[3];
    const xTop = ((xBottomRight - xBottomLeft) / 2) + xBottomLeft;
    const yTop = points[1];

    const path = `M${(xTop / 100) * slideWidth
        },${(yTop / 100) * slideHeight
        },${(xBottomLeft / 100) * slideWidth
        },${(yBottomLeft / 100) * slideHeight
        },${(xBottomRight / 100) * slideWidth
        },${(yBottomRight / 100) * slideHeight
        }Z`;

    return path;
  }

  render() {
    const { annotation, slideWidth, slideHeight } = this.props;
    const path = this.getCoordinates(annotation, slideWidth, slideHeight);
    return (
      <path
        style={{ WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)' }}
        fill="none"
        stroke={AnnotationHelpers.getFormattedColor(annotation.color)}
        d={path}
        strokeWidth={AnnotationHelpers.getStrokeWidth(annotation.thickness, slideWidth)}
        strokeLinejoin="miter"
      />
    );
  }
}

TriangleDrawComponent.propTypes = {
  // Defines a version of the shape, so that we know if we need to update the component or not
  version: PropTypes.number.isRequired,
  // Defines an annotation object, which contains all the basic info we need to draw a triangle
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
