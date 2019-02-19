import {makeCall} from '/imports/ui/services/api';

const setPresentation = presentationID => makeCall('setPresentation', presentationID);

const removePresentation = presentationID => makeCall('removePresentation', presentationID);

export default {
  setPresentation,
  removePresentation,
};