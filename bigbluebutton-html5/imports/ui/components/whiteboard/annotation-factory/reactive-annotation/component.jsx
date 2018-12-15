import React from 'react';
import PropTypes from 'prop-types';
import AnnotationHelper from '../../annotations/helpers';

const ReactiveAnnotation = (props) => {
  const Component = props.drawObject;
  const { annotation, slideWidth, slideHeight } = props;
  const cornerPoints = AnnotationHelper.getCornerPoints(annotation.annotationInfo.x, annotation.annotationInfo.y,
    annotation.annotationInfo.textBoxWidth, annotation.annotationInfo.textBoxHeight, slideWidth, slideHeight);

  return (
    <g>
      <Component
        version={props.annotation.version}
        annotation={props.annotation.annotationInfo}
        slideWidth={props.slideWidth}
        slideHeight={props.slideHeight}
      />
      {
        cornerPoints.map(p => (
          <rect
            fill="white"
            fillOpacity="0.8"
            x={p.x - 10}
            y={p.y - 10}
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
};

ReactiveAnnotation.propTypes = {
  annotation: PropTypes.objectOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ])).isRequired,
  drawObject: PropTypes.func.isRequired,
  slideWidth: PropTypes.number.isRequired,
  slideHeight: PropTypes.number.isRequired,
};

export default ReactiveAnnotation;
