import Storage from '/imports/ui/services/storage/session';
import Users from '/imports/api/users';
import Auth from '/imports/ui/services/auth';
import WhiteboardMultiUser from '/imports/api/whiteboard-multi-user/';

const DRAW_SETTINGS = 'drawSettings';

const setTextShapeValue = (text) => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  if (drawSettings) {
    drawSettings.textShape.textShapeValue = text;
    Storage.setItem(DRAW_SETTINGS, drawSettings);
  }
};

const resetTextShapeActiveId = () => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  if (drawSettings) {
    drawSettings.textShape.textShapeActiveId = '';
    drawSettings.textShape.status = '';
    Storage.setItem(DRAW_SETTINGS, drawSettings);
  }
};

const isPresenter = () => {
  const currentUser = Users.findOne({ userId: Auth.userID });
  return currentUser ? currentUser.presenter : false;
};

const getMultiUserStatus = () => {
  const data = WhiteboardMultiUser.findOne({ meetingId: Auth.meetingID });
  return data ? data.multiUser : false;
};

const activeTextShapeId = () => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  return drawSettings ? drawSettings.textShape.textShapeActiveId : '';
};

const isEditContent = () => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  return drawSettings ? drawSettings.textShape.status === 'edit': false;
};


const isResizing = () => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  const canResize = drawSettings ? drawSettings.textShape.status === 'resize': false;
  console.log(`can resize: ${canResize}`);
  return canResize;
};

export default {
  setTextShapeValue,
  activeTextShapeId,
  isPresenter,
  resetTextShapeActiveId,
  getMultiUserStatus,
  isEditContent,
  isResizing
};
