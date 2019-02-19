import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import Service from './service';
import PresentationList from './component';
import PresentationUploaderService from '../presentation-uploader/service';

const PresentationListContainer = props => (
  <PresentationList {...props} />
);

export default withTracker(() => {
  const PRESENTATION_CONFIG = Meteor.settings.public.presentation;
  const currentPresentations = PresentationUploaderService.getPresentations();

  return {
    presentations: currentPresentations,
    defaultFileName: PRESENTATION_CONFIG.defaultPresentationFile,
    onDeletePresentation: presentationId => Service.removePresentation(presentationId),
    onSelectPresentation: presentationId => Service.setPresentation(presentationId),
    uploadAndConvertPresentation: (file, meetingID, endpoint, onUpload, onProgress, onConversion) =>
      PresentationUploaderService.uploadAndConvertPresentation(
        file, meetingID, endpoint,
        onUpload, onProgress, onConversion,
      ),
  };
})(PresentationListContainer);
