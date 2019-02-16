import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AnnotationHelpers from '../helpers';
import RectangleDrawComponent from '../rectangle/component';

export default class ImageDrawComponent extends Component {

  static checkPointInsideRectangle(annotation, px, py, slideWidth, slideHeight) {
    const {
      x, y,
      width, height,
    } = ImageDrawComponent.getCoordinates(annotation, slideWidth, slideHeight);
    return px >= x && px <= (x + width) && py >= y && py <= (y + height);
  }

  static getTopLeftCornerCoordinates(annotation) {
    const {
      x, y,
      imageWidth, imageHeight,
    } = annotation;
    return {
      startX: x,
      startY: y,
      width: imageWidth,
      height: imageHeight,
    };
  }

  static transformPointsByAction(
    annotation, action, px, py,
    ax, ay, width, height, initialX,
    initialY, slideWidth, slideHeight,
  ) {
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
        newStartX = px;
        newStartY = ay;
        newWidth = width - (px - ax);
        newHeight = height;
        break;
      case HORIZONTAL_RIGHT:
        newStartX = ax;
        newStartY = ay;
        const midRight = {
          x: ax + width,
          y: ay + (height / 2),
        };
        newWidth = width + (px - midRight.x);
        newHeight = height;
        break;
      case VERTICAL_TOP:
        newStartX = ax;
        newStartY = py;
        newWidth = width;
        newHeight = height - (py - ay);
        break;
      case VERTICAL_BOTTOM:
        newStartX = ax;
        newStartY = ay;
        const midBottom = {
          x: ax + (width / 2),
          y: ay + height,
        };
        newWidth = width;
        newHeight = height + (py - midBottom.y);
        break;
      case DRAG:
        newStartX = px + ax - initialX;
        newStartY = py + ay - initialY;
        newWidth = width;
        newHeight = height;
    }

    // update active annotation
    const newTransX = (newStartX / slideWidth) * 100;
    const newTransY = (newStartY / slideHeight) * 100;
    const newTransWidth = (newWidth / slideWidth) * 100;
    const newTransHeight = (newHeight / slideHeight) * 100;
    return Object.assign({}, annotation, {
      x: newTransX,
      y: newTransY,
      imageWidth: newTransWidth,
      imageHeight: newTransHeight,
    });
  }

  static getCoordinates(annotation, slideWidth, slideHeight) {
    const {
      x,
      y,
      imageWidth,
      imageHeight,
      src,
    } = annotation;

    const _x = (x / 100) * slideWidth;
    const _y = (y / 100) * slideHeight;
    const _width = (imageWidth / 100) * slideWidth;
    const _height = (imageHeight / 100) * slideHeight;

    return {
      x: _x,
      y: _y,
      src,
      width: _width,
      height: _height,
    };
  }

  static getImageStyles() {
    const styles = {
      width: '100%',
      height: '100%',
      resize: 'none',
      overflow: 'hidden',
      outline: 'none',
      padding: '0',
    };

    return styles;
  }

  shouldComponentUpdate(nextProps) {
    return this.props.version !== nextProps.version;
  }

  render() {
    const { annotation, slideWidth, slideHeight } = this.props;
    const results = ImageDrawComponent.getCoordinates(annotation, slideWidth, slideHeight);
    const styles = ImageDrawComponent.getImageStyles();

    return (
      <g>
        <foreignObject
          x={results.x}
          y={results.y}
          width={results.width}
          height={results.height}
          style={{ pointerEvents: 'none' }}
        >
          <img
            id={this.props.annotation.id}
            src={this.props.annotation.src}
            ref={(ref) => { this.image = ref; }}
            style={styles}
            alt={this.props.annotation.name}
          />
        </foreignObject>
      </g>
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
    src: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  // Defines the width of the slide (svg coordinate system), which needed in calculations
  slideWidth: PropTypes.number.isRequired,
  // Defines the height of the slide (svg coordinate system), which needed in calculations
  slideHeight: PropTypes.number.isRequired,
};
