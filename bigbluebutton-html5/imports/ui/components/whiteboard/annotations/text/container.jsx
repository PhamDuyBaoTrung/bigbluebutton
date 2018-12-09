import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import TextShapeService from './service';
import TextDrawComponent from './component';

const TextDrawContainer = props => (
  <TextDrawComponent {...props} />
);

export default withTracker((params) => {
  const isPresenter = TextShapeService.isPresenter();
  const isMultiUser = TextShapeService.getMultiUserStatus();
  const activeTextShapeId = TextShapeService.activeTextShapeId();
  let isActive = false;

  if ((isPresenter || isMultiUser) && activeTextShapeId.indexOf(params.annotation.id) >= 0) {
    isActive = true;
  }
  const currentShape = params.annotation.id;
  console.log(`active Shape: ${activeTextShapeId} - current shape ${currentShape} - isActive ${isActive}`);
  return {
    isActive,
    setTextShapeValue: TextShapeService.setTextShapeValue,
    resetTextShapeActiveId: TextShapeService.resetTextShapeActiveId,
  };
})(TextDrawContainer);
