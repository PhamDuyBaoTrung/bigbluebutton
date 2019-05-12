import Storage from '/imports/ui/services/storage/session';
import Auth from '/imports/ui/services/auth';
import { sendAnnotation, updateAnnotation, addAnnotationToDiscardedList } from '/imports/ui/components/whiteboard/service';
import Annotations from '/imports/ui/components/whiteboard/service';

const DRAW_SETTINGS = 'drawSettings';

const getWhiteboardToolbarValues = () => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  if (!drawSettings) {
    return {};
  }

  const {
    whiteboardAnnotationTool,
    whiteboardAnnotationThickness,
    whiteboardAnnotationColor,
    textFontSize,
    textShape,
  } = drawSettings;

  return {
    tool: whiteboardAnnotationTool,
    thickness: whiteboardAnnotationThickness,
    color: whiteboardAnnotationColor,
    textFontSize,
    textShapeValue: textShape.textShapeValue ? textShape.textShapeValue : '',
    textShapeActiveId: textShape.textShapeActiveId ? textShape.textShapeActiveId : '',
  };
};

const resetTextShapeSession = () => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  if (drawSettings) {
    drawSettings.textShape.textShapeValue = '';
    drawSettings.textShape.textShapeActiveId = '';
    Storage.setItem(DRAW_SETTINGS, drawSettings);
  }
};

const setTextShapeActiveId = (id) => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  if (drawSettings) {
    console.log(`update Text shape id = ${id}`);
    if (!id || id.indexOf('-fake') >= 0) {
      console.log('Bug here ...');
    }
    drawSettings.textShape.textShapeActiveId = id;
    Storage.setItem(DRAW_SETTINGS, drawSettings);
  }
};

const getTextShapeStatus = () => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  return drawSettings ? drawSettings.textShape.status : null;
};

const setTextShapeStatus = (status) => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  if (drawSettings) {
    console.log(`update Text shape status = ${status}`);
    drawSettings.textShape.status = status;
    Storage.setItem(DRAW_SETTINGS, drawSettings);
  }
};

const setActivatedShapeId = (id) => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  if (drawSettings) {
    drawSettings.activatedShapeId = id;
    Storage.setItem(DRAW_SETTINGS, drawSettings);
  }
};

const getCurrentUserId = () => Auth.userID;

const contextMenuHandler = event => event.preventDefault();

const getCurrentAnnotationsInfo = (whiteboardId) => {
  if (!whiteboardId) {
    return null;
  }

  if (!Annotations) {
    return [];
  }

  return Annotations.find(
    {
      whiteboardId,
      // annotationType: { $ne: 'pencil_base' },
    },
    {
      sort: { position: 1 },
    },
  ).fetch();
};

export default {
  addAnnotationToDiscardedList,
  sendAnnotation,
  updateAnnotation,
  getWhiteboardToolbarValues,
  setTextShapeActiveId,
  resetTextShapeSession,
  getCurrentUserId,
  contextMenuHandler,
  getCurrentAnnotationsInfo,
  setActivatedShapeId,
  setTextShapeStatus,
  getTextShapeStatus
};
