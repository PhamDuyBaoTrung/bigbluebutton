import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AnnotationHelpers from '../helpers';

export default class EllipseDrawComponent extends Component {

  static getTopLeftCornerCoordinates(annotation) {
    const { points } = annotation;
    if (!Array.isArray(points) || points.length < 4) {
      return null;
    }
    // x1 and y1 - coordinates of the ellipse's top left corner
    // x2 and y2 - coordinates of the ellipse's bottom right corner
    const x1 = points[0];
    const y1 = points[1];
    const x2 = points[2];
    const y2 = points[3];
    return {
      startX: x1,
      startY: y1,
      width: x2 - x1,
      height: y2 - y1,
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

  static checkPointInsideEllipse(annotation, x, y, slideWidth, slideHeight) {
    const { cx, cy, rx, ry, } = this.getCoordinates(annotation, slideWidth, slideHeight);
    const deltaX = Math.abs(x - cx);
    const deltaY = Math.abs(y = cy);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    return ((distance >= rx) && (distance <= ry)) ||
      ((distance <= rx) && (distance >= ry));
  }

  shouldComponentUpdate(nextProps) {
    return this.props.version !== nextProps.version;
  }

  getCoordinates(annotation, slideWidth, slideHeight) {
    const { points } = annotation;

    // x1 and y1 - coordinates of the ellipse's top left corner
    // x2 and y2 - coordinates of the ellipse's bottom right corner
    const x1 = points[0];
    const y1 = points[1];
    const x2 = points[2];
    const y2 = points[3];

    // rx - horizontal radius
    // ry - vertical radius
    // cx and cy - coordinates of the ellipse's center
    let rx = (x2 - x1) / 2;
    let ry = (y2 - y1) / 2;
    const cx = ((rx + x1) * slideWidth) / 100;
    const cy = ((ry + y1) * slideHeight) / 100;
    rx = Math.abs((rx / 100) * slideWidth);
    ry = Math.abs((ry / 100) * slideHeight);

    return {
      cx,
      cy,
      rx,
      ry,
    };
  }

  render() {

    const { annotation, slideWidth, slideHeight } = this.props;
    const results = this.getCoordinates(annotation, slideWidth, slideHeight);
    const { cx, cy, rx, ry } = results;

    return (
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={AnnotationHelpers.getFormattedColor(annotation.color)}
        strokeWidth={AnnotationHelpers.getStrokeWidth(annotation.thickness, slideWidth)}
        style={{ WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)' }}
      />
    );
  }
}

EllipseDrawComponent.propTypes = {
  // Defines a version of the shape, so that we know if we need to update the component or not
  version: PropTypes.number.isRequired,
  // Defines an annotation object, which contains all the basic info we need to draw an ellipse
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
