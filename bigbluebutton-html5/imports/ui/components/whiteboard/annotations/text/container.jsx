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
  const isEditable = TextShapeService.isEditContent();
  const isResizing = TextShapeService.isResizing();
  let isActive = false;
  console.log(`activeText ${activeTextShapeId} - current text: ${params.annotation.id}`);
  if ((isPresenter || isMultiUser) && activeTextShapeId !== null && activeTextShapeId.indexOf(params.annotation.id) >= 0) {
    isActive = true;
  }
  return {
    isActive, isEditable, isResizing,
    setTextShapeValue: TextShapeService.setTextShapeValue,
    resetTextShapeActiveId: TextShapeService.resetTextShapeActiveId,
  };
})(TextDrawContainer);
