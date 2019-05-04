import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AnnotationHelpers from '../helpers';
import TextDrawComponent from '../text/component';
import LineDrawComponent from '../line/component';
import EllipseDrawComponent from '../ellipse/component';
import TriangleDrawComponent from '../triangle/component';
import RectangleDrawComponent from '../rectangle/component';
import PencilDrawComponent from '../pencil/component';
import ImageDrawComponent from '../image/component';

export default class BoundaryDrawComponent extends Component {

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
      case 'image': {
        boundaryInfo = ImageDrawComponent.getTopLeftCornerCoordinates(annotation);
        break;
      }
      default: {
        console.error(`Not supported annotation type ${type}`);
      }
    }
    return boundaryInfo;
  }

  shouldComponentUpdate(nextProps) {
    return this.props.version !== nextProps.version;
  }

  getCoordinates(boundaryInfo) {
    const { slideWidth, slideHeight } = this.props;

    const x = (boundaryInfo.startX / 100) * slideWidth;
    const y = (boundaryInfo.startY / 100) * slideHeight;
    const width = (boundaryInfo.width / 100) * slideWidth;
    const height = (boundaryInfo.height / 100) * slideHeight;

    return {
      x,
      y,
      width,
      height,
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
          fill='none'
          stroke='#1caba0'
          strokeWidth={3}
          style={{ WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)' }}
        />
        {
          cornerPoints.map(p => (
            <g>
              <rect
                fill='white'
                fillOpacity='0.8'
                x={p.x - 3.5}
                y={p.y - 3.5}
                key={`${p.x}_corner_${p.y}`}
                width={7}
                height={7}
                strokeWidth={7}
                stroke='#1caba0'
                strokeOpacity='0.8'
              />
            </g>
          ))
        }
      </g>
    );
  }
}

BoundaryDrawComponent.propTypes = {
  // Defines a version of the shape, so that we know if we need to update the component or not
  version: PropTypes.number.isRequired,
  // Defines an annotation object, which contains all the basic info we need to draw a rectangle
  annotation: PropTypes.shape({
    points: PropTypes.arrayOf(PropTypes.number),
    color: PropTypes.number.isRequired,
    thickness: PropTypes.number.isRequired,
  }).isRequired,
  // Defines the width of the slide (svg coordinate system), which needed in calculations
  slideWidth: PropTypes.number.isRequired,
  // Defines the height of the slide (svg coordinate system), which needed in calculations
  slideHeight: PropTypes.number.isRequired,
};
