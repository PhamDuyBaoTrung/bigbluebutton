import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AnnotationHelpers from '../helpers';

export default class PencilDrawComponent extends Component {
  static getInitialCoordinates(annotation, slideWidth, slideHeight) {
    const { points } = annotation;
    let i = 2;
    let path = '';
    if (points && points.length >= 2) {
      path = `M${(points[0] / 100) * slideWidth
      }, ${(points[1] / 100) * slideHeight}`;
      while (i < points.length) {
        path = `${path} L${(points[i] / 100) * slideWidth
        }, ${(points[i + 1] / 100) * slideHeight}`;
        i += 2;
      }
    }

    return { path, points };
  }

  static checkPointInsidePencil(annotation, x, y, slideWidth, slideHeight) {
    const { points } = annotation;
    let i = 0;
    while (i < points.length) {
      const px = (points[i] / 100) * slideWidth;
      const py = (points[i + 1] / 100) * slideHeight;
      console.log(`pointer: [${x}, ${y}], px: ${px}, py: ${py}`);
      const isContained = x >= (px - 10) && x <= (px + 10) && y >= (py - 10) && y <= (py + 10);
      if (isContained) {
        return true;
      }
      i = i + 2;
    }
    return false;
  }

  static getTopLeftCornerCoordinates(annotation) {
    const { points } = annotation;
    if (!Array.isArray(points) || points.length < 2) {
      return null;
    }
    let minX = points[0];
    let maxX = points[0];
    let minY = points[1];
    let maxY = points[1];
    let i = 2;
    while (i < points.length) {
      if (points[i] > maxX) {
        maxX = points[i];
      } else if (points[i] < minX) {
        minX = points[i];
      }

      if (points[i + 1] > maxY) {
        maxY = points[i + 1];
      } else if (points[i + 1] < minY){
        minY = points[i + 1];
      }
      i += 2;
    }
    return {
      startX: minX,
      startY: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  static transformPointsByAction(annotation, action, px, py, ax, ay, width, height, initialX, initialY) {
    const ANNOTATION_CONFIG = Meteor.settings.public.whiteboard.annotations;
    const HORIZONTAL_LEFT = ANNOTATION_CONFIG.resize.horizontal_left;
    const HORIZONTAL_RIGHT = ANNOTATION_CONFIG.resize.horizontal_right;
    const VERTICAL_TOP = ANNOTATION_CONFIG.resize.vertical_top;
    const VERTICAL_BOTTOM = ANNOTATION_CONFIG.resize.vertical_bottom;
    const DRAG = ANNOTATION_CONFIG.drag;
    const { points } = annotation;
    let newPoints;
    switch (action) {
      case HORIZONTAL_LEFT:
        newPoints = this.leftHorizontalResizingCompute(points, px, py, ax, ay, width, height);
        break;
      case HORIZONTAL_RIGHT:
        newPoints = this.rightHorizontalResizingCompute(points, px, py, ax, ay, width, height);
        break;
      case VERTICAL_TOP:
        newPoints = this.topVerticalResizingCompute(points, px, py, ax, ay, width, height);
        break;
      case VERTICAL_BOTTOM:
        newPoints = this.bottomVerticalResizingCompute(points, px, py, ax, ay, width, height);
        break;
      case DRAG:
        newPoints = this.draggingCompute(points, px, py, ax, ay, initialX, initialY);
        break;
    }
    // transform to svg coordinators
    newPoints = newPoints.map((p, i) => {
      // y coordinate
      if (i % 2 !== 0) {
        return (p / this.props.slideHeight) * 100;
      } else {
        return (p / this.props.slideWidth) * 100;
      }
    });
    annotation.points = newPoints;
    return annotation;
  }

  /**
   * calcualtion the transformed point values when resizing pencil shape by left-horizontal
   * @param points
   * @param px
   * @param py
   * @param ax
   * @param ay
   * @param width
   * @param height
   * @returns {*}
   */
  leftHorizontalResizingCompute(points, px, py, ax, ay, width, height) {
    points.forEach((p, i) => {
      if ((i % 2) !== 0) {
        return p;
      } else {
        return p + (((px - ax)(ax + width - p)) / width);
      }
    });
    return points;
  }

  /**
   * calcualtion the transformed point values when resizing pencil shape by right-horizontal
   * @param points
   * @param px
   * @param py
   * @param ax
   * @param ay
   * @param width
   * @param height
   * @returns {*}
   */
  rightHorizontalResizingCompute(points, px, py, ax, ay, width, height) {
    points.forEach((p, i) => {
      if ((i % 2) !== 0) {
        return p;
      } else {
        return p + (((px - ax - w)(p - ax)) / width);
      }
    });
    return points;
  }

  /**
   * calcualtion the transformed point values when resizing pencil shape by top-vertical
   * @param points
   * @param px
   * @param py
   * @param ax
   * @param ay
   * @param width
   * @param height
   * @returns {*}
   */
  topVerticalResizingCompute(points, px, py, ax, ay, width, height) {
    points.forEach((p, i) => {
      if ((i % 2) !== 0) {
        return p + (((py - ay)(ay + height - p)) / height);
      } else {
        return p;
      }
    });
    return points;
  }

  /**
   * calcualtion the transformed point values when resizing pencil shape by bottom-vertical
   * @param points
   * @param px
   * @param py
   * @param ax
   * @param ay
   * @param width
   * @param height
   * @returns {*}
   */
  bottomVerticalResizingCompute(points, px, py, ax, ay, width, height) {
    points.forEach((p, i) => {
      if ((i % 2) !== 0) {
        return p - (((ay + height - py)(p - ay)) / height);
      } else {
        return p;
      }
    });
    return points;
  }

  draggingCompute(points, px, py, ax, ay, initialX, initialY) {
    points.forEach((p, i) => {
      // y coordinate
      if ((i % 2) !== 0) {
        return py + ay - initialY;
      } else {
        return px + ax - initialX;
      }
    });
    return points;
  }

  static getFinalCoordinates(annotation, slideWidth, slideHeight) {
    const { points, commands } = annotation;

    let path = '';
    let i;
    let j;
    for (i = 0, j = 0; i < commands.length; i += 1) {
      switch (commands[i]) {
        // MOVE_TO - consumes 1 pair of values
        case 1:
          path = `${path} M${(points[j] / 100) * slideWidth} ${(points[j + 1] / 100) * slideHeight}`;
          j += 2;
          break;

          // LINE_TO - consumes 1 pair of values
        case 2:
          path = `${path} L${(points[j] / 100) * slideWidth} ${(points[j + 1] / 100) * slideHeight}`;
          j += 2;
          break;

          // QUADRATIC_CURVE_TO - consumes 2 pairs of values
          // 1st pair is a control point, second is a coordinate
        case 3:
          path = `${path} Q${(points[j] / 100) * slideWidth}, ${
            (points[j + 1] / 100) * slideHeight}, ${(points[j + 2] / 100) * slideWidth}, ${
            (points[j + 3] / 100) * slideHeight}`;
          j += 4;
          break;

          // CUBIC_CURVE_TO - consumes 3 pairs of values
          // 1st and 2nd are control points, 3rd is an end coordinate
        case 4:
          path = `${path} C${(points[j] / 100) * slideWidth}, ${
            (points[j + 1] / 100) * slideHeight}, ${(points[j + 2] / 100) * slideWidth}, ${
            (points[j + 3] / 100) * slideHeight}, ${(points[j + 4] / 100) * slideWidth}, ${
            (points[j + 5] / 100) * slideHeight}`;
          j += 6;
          break;

        default:
          break;
      }
    }

    // If that's just one coordinate at the end (dot) - we want to display it.
    // So adding L with the same X and Y values to the path
    if (path && points.length === 2) {
      path = `${path} L${(points[0] / 100) * slideWidth} ${(points[1] / 100) * slideHeight}`;
    }

    return { path, points };
  }

  constructor(props) {
    super(props);

    const { annotation, slideWidth, slideHeight } = this.props;

    this.path = this.getCoordinates(annotation, slideWidth, slideHeight);

    this.getCurrentPath = this.getCurrentPath.bind(this);
    this.getCoordinates = this.getCoordinates.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return this.props.version !== nextProps.version;
  }

  componentWillUpdate(nextProps) {
    const { annotation, slideWidth, slideHeight } = nextProps;
    if (annotation.points.length !== this.props.annotation.points.length) {
      this.path = this.getCoordinates(annotation, slideWidth, slideHeight);
    }
  }

  getCoordinates(annotation, slideWidth, slideHeight) {
    if ((!annotation || annotation.points.length === 0)
        || (annotation.status === 'DRAW_END' && !annotation.commands)) {
      return undefined;
    }

    let data;
    // Final message, display smoothes coordinates
    if (annotation.status === 'DRAW_END') {
      data = PencilDrawComponent.getFinalCoordinates(annotation, slideWidth, slideHeight);
    // Not a final message, but rendering it for the first time, creating a new path
    } else if (!this.path) {
      data = PencilDrawComponent.getInitialCoordinates(annotation, slideWidth, slideHeight);
    // If it's not the first 2 cases - means we just got an update, updating the coordinates
    } else {
      data = this.updateCoordinates(annotation, slideWidth, slideHeight);
    }

    this.points = data.points;
    return data.path;
  }

  getCurrentPath() {
    return this.path ? this.path : 'M -1 -1';
  }

  updateCoordinates(annotation, slideWidth, slideHeight) {
    const { points } = annotation;
    let i = this.points.length;
    let path = '';

    while (i < points.length) {
      path = `${path} L${(points[i] / 100) * slideWidth
      }, ${(points[i + 1] / 100) * slideHeight}`;
      i += 2;
    }
    path = this.path + path;

    return { path, points };
  }

  render() {
    const { annotation, slideWidth } = this.props;
    return (
      <path
        fill="none"
        stroke={AnnotationHelpers.getFormattedColor(annotation.color)}
        d={this.getCurrentPath()}
        strokeWidth={AnnotationHelpers.getStrokeWidth(annotation.thickness, slideWidth)}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)' }}
      />
    );
  }
}

PencilDrawComponent.propTypes = {
  // Defines a version of the shape, so that we know if we need to update the component or not
  version: PropTypes.number.isRequired,
  // Defines an annotation object, which contains all the basic info we need to draw with a pencil
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
