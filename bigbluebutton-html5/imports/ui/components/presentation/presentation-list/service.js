import { makeCall } from '/imports/ui/services/api';
import _ from 'lodash';
import Auth from '/imports/ui/services/auth';
import UploadService from '../presentation-uploader/service';

const setPresentation = presentationID => makeCall('setPresentation', presentationID);

const removePresentation = presentationID => makeCall('removePresentation', presentationID);

const addNewPresentation = (uploadEndpoint, emptyFileName) => {
  let blob = null;
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://res.cloudinary.com/coursedy/image/upload/v1541840939/empty_slide.pdf');
  xhr.responseType = 'blob';
  xhr.onload = () => {
    blob = xhr.response;
    const file = new File([blob], emptyFileName, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });
    UploadService.uploadAndConvertPresentation(file, Auth.meetingID, uploadEndpoint);
  }
  xhr.send();
}

export default {
  setPresentation,
  removePresentation,
  addNewPresentation,
};