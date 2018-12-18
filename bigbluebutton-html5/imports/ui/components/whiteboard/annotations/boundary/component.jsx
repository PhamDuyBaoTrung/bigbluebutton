import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AnnotationHelpers from '../helpers';
import TextDrawComponent from "../text/component";
import LineDrawComponent from "../line/component";
import EllipseDrawComponent from "../ellipse/component";
import TriangleDrawComponent from "../triangle/component";
import RectangleDrawComponent from "../rectangle/component";
import PencilDrawComponent from "../pencil/component";

export default class BoundaryDrawComponent extends Component {

  shouldComponentUpdate(nextProps) {
    return this.props.version !== nextProps.version;
  }

  static getShapeBoundaryData(annotation) {
    const { type } = annotation;
    let boundaryInfo;

    switch (type) {
      case 'text': {
        boundaryInfo = TextDrawComponent.getTopLeftCornerCoordinates(annotation);
        break;
      }
      case 'line': {
        boundaryInfo = LineDrawComponent.getTopLeftCornerCoordinates(annotation);
        break;
      }
      case 'ellipse': {
        boundaryInfo = EllipseDrawComponent.getTopLeftCornerCoordinates(annotation);
        break;
      }
      case 'triangle': {
        boundaryInfo = TriangleDrawComponent.getTopLeftCornerCoordinates(annotation);
        break;
      }
      case 'rectangle': {
        boundaryInfo = RectangleDrawComponent.getTopLeftCornerCoordinates(annotation);
        break;
      }
      case 'pencil': {
        boundaryInfo = PencilDrawComponent.getTopLeftCornerCoordinates(annotation);
        break;
      }
    }
    return boundaryInfo;
  }

  getCoordinates(boundaryInfo) {
    const { slideWidth, slideHeight } = this.props;

    const _x = (boundaryInfo.startX / 100) * slideWidth;
    const _y = (boundaryInfo.startY / 100) * slideHeight;
    const _width = (boundaryInfo.width / 100) * slideWidth;
    const _height = (boundaryInfo.height / 100) * slideHeight;

    return {
      _x,
      _y,
      _width,
      _height,
    };
  }

  render() {
    const { annotation, slideWidth, slideHeight } = this.props;
    const rawBoundaryData = BoundaryDrawComponent.getShapeBoundaryData(annotation.annotationInfo);
    const results = this.getCoordinates(rawBoundaryData);
    const cornerPoints = AnnotationHelpers.getCornerPoints(rawBoundaryData.startX, rawBoundaryData.startY,
      rawBoundaryData.width, rawBoundaryData.height, slideWidth, slideHeight);

    return (
      <g>
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
        {
          cornerPoints.map(p => (
            <rect
              fill="white"
              fillOpacity="0.8"
              x={p.x - 10}
              y={p.y - 10}
              key={`${p.x}_corner_${p.y}`}
              width={20}
              height={20}
              strokeWidth={20}
              stroke={'red'}
              strokeOpacity="0.8"
            />
          ))
        }
      </g>
    );
  }
}

BoundaryDrawComponent.propTypes = {
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
