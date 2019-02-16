import React from 'react';
import PropTypes from 'prop-types';
import BoundaryDrawComponent from '../../annotations/boundary/component';

const ReactiveAnnotation = (props) => {
  const Component = props.drawObject;
  const {
    annotation, activeShapeId,
    slideWidth, slideHeight,
  } = props;

  return (
    <g>
      <Component
        version={props.annotation.version}
        annotation={props.annotation.annotationInfo}
        slideWidth={props.slideWidth}
        slideHeight={props.slideHeight}
      />
      {
        activeShapeId === annotation.id ?
          <BoundaryDrawComponent
            version={props.annotation.version}
            annotation={annotation}
            slideWidth={slideWidth}
            slideHeight={slideHeight}
          /> : null
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
