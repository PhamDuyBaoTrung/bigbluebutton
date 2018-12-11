const colourToHex = (value) => {
  let hex;
  hex = parseInt(value, 10).toString(16);
  while (hex.length < 6) {
    hex = `0${hex}`;
  }

  return `#${hex}`;
};

const getFormattedColor = (color) => {
  let _color = color || '0';

  if (!_color.toString().match(/#.*/)) {
    _color = colourToHex(_color);
  }

  return _color;
};

const getStrokeWidth = (thickness, slideWidth) => (thickness * slideWidth) / 100;

/**
  A utility function to calculate area of triangle formed by (x1, y1), (x2, y2) and (x3, y3)
 */
const area = (x1, y1, x2, y2, x3, y3) => {
  return Math.sqrt(((x1 * (y2 - y3)) + (x2 * (y3 - y1)) + (x3 * (y1 - y2))) / 2.0);
};

/**
  A function to check whether point P(x, y) lies inside the rectangle formed by A(x1, y1),
  B(x2, y2), C(x3, y3) and D(x4, y4)
 */
const checkPointInsideRectangleInternal = (x1, y1, x2, y2, x3, y3, x4, y4, x,y) => {
  /* Calculate area of rectangle ABCD */
  const A = area(x1, y1, x2, y2, x3, y3) + area(x1, y1, x4, y4, x3, y3);

  /* Calculate area of triangle PAB */
  const A1 = area(x, y, x1, y1, x2, y2);

  /* Calculate area of triangle PBC */
  const A2 = area(x, y, x2, y2, x3, y3);

  /* Calculate area of triangle PCD */
  const A3 = area(x, y, x3, y3, x4, y4);

  /* Calculate area of triangle PAD */
  const A4 = area(x, y, x1, y1, x4, y4);

  /* Check if sum of A1, A2, A3 and A4
  is same as A */
  return (A === A1 + A2 + A3 + A4);
};

const checkPointInsideRectangle = (x, y, cx, cy, r = 10) => {
  // top left corner coordinates
  const topLeft = {
    x: cx - r,
    y: cy + r,
  };
  // top right corner coordinates
  const topRight = {
    x: cx + r,
    y: cy + r,
  };
  // bottom right corner coordinates
  const bottomRight = {
    x: cx + r,
    y: cy - r,
  };
  // bottom left corner coordinates
  const bottomLeft = {
    x: cx - r,
    y: cy - r,
  };

  return checkPointInsideRectangleInternal(topLeft.x, topLeft.y, topRight.x, topRight.y, bottomRight.x,
    bottomRight.y, bottomLeft.x, bottomLeft.y, x, y);
};

const getCornerPoints = (startX, startY, width, height, slideWidth, slideHeight) => {
  const _startX = (startX / 100) * slideWidth;
  const _startY = (startX / 100) * slideHeight;
  const _width = (width / 100) * slideWidth;
  const _height = (height / 100) * slideHeight;
  console.log(`top-left-x: ${_startX}`)
  return [
    { x: _startX, y: _startY }, // top left corner
    { x: _startX + (_width / 2), y: _startY }, // top mid corner
    { x: _startX + _width, y: _startY }, // top right corner
    { x: _startX + _width, y: _startY - (_height / 2) }, // top right mid corner
    { x: _startX + _width, y: _startY - _height }, // bottom right corner
    { x: _startX + (_width / 2), y: _startY - _height }, // bottom mid corner
    { x: _startX, y: _startY - _height }, // bottom left corner,
    { x: _startX, y: _startY - (_height / 2) }, // bottom left corner,
  ];
};

export default {
  getFormattedColor,
  getStrokeWidth,
  checkPointInsideRectangle,
  getCornerPoints,
};
