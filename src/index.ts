// This is a phone input that is a slider that is meant to be really terrible

const formatNumberAsPhone = (num: number) => {
  const numStr = num.toString();
  // append 0s to the front if needed
  const numStrPadded = numStr.padStart(7, "0");
  // split into first 3 and last 4
  const firstThree = numStrPadded.slice(0, 3);
  const lastFour = numStrPadded.slice(3);
  // return formatted string
  return `${firstThree}-${lastFour}`;
};

// Cubic bezier curve for a half wave (peak to trough or trough to peak)
const halfWave = (startX: number, endX: number, amplitude: number, offset: number, startIsTrough: boolean) => {
  const halfX = (startX + endX) / 2;
  const startY = startIsTrough ? offset + amplitude : offset - amplitude;
  const endY = startIsTrough ? offset - amplitude : offset + amplitude;

  const x_1 = 0.32167769118546863;
  const x_2 = 1 - 0.46691686203245664;
  const y_2 = 1 - x_2;

  const firstControlX = startX + ((endX - startX) * x_1) / 2;
  const firstControlY = startY;

  const secondControlX = halfX - ((endX - halfX) * (1 - x_2)) / 2;
  const secondControlY = offset + (!startIsTrough ? -amplitude * y_2 : amplitude * y_2);

  const thirdControlX = halfX;
  const thirdControlY = offset;

  const finalControlX = endX - ((endX - startX) * x_1) / 2;
  const finalControlY = endY;

  let pathStr = ` C ${firstControlX} ${firstControlY}, ${secondControlX} ${secondControlY}, ${thirdControlX} ${thirdControlY}`;
  pathStr += ` S ${finalControlX} ${finalControlY}, ${endX} ${endY}`;

  return pathStr;
};

const drawTrack = (svg: SVGElement, phase: number, wavelength: number, boxHeight: number, boxWidth: number, amplitude: number) => {
  const thickness = 0.1;

  const topOffset = boxHeight / 2 - thickness / 2;
  const botOffset = boxHeight / 2 + thickness / 2;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  const pathStartX = 0 - (wavelength * phase) / (2 * Math.PI);

  let x = pathStartX;
  let pathStr = `M ${x} ${topOffset + amplitude}`;
  let flip = true;
  while (x < boxWidth) {
    const startX = x;
    const endX = x + wavelength / 2;
    pathStr += halfWave(startX, endX, amplitude, topOffset, flip);
    x += wavelength / 2;
    flip = !flip;
  }
  if (flip) {
    pathStr += ` L ${x} ${botOffset + amplitude}`;
  } else {
    pathStr += ` L ${x} ${botOffset - amplitude}`;
  }
  while (x > pathStartX) {
    const startX = x;
    const endX = x - wavelength / 2;
    pathStr += halfWave(startX, endX, amplitude, botOffset, flip);
    x -= wavelength / 2;
    flip = !flip;
  }
  pathStr += ` Z`;

  path.setAttribute("d", pathStr);
  path.setAttribute("stroke-width", "10");
  path.setAttribute("stroke", "black");

  svg.appendChild(path);
};

const drawSmallRedCircle = (svg: SVGElement, x: number, y: number) => {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", x.toString());
  circle.setAttribute("cy", y.toString());
  circle.setAttribute("r", "10");
  circle.setAttribute("fill", "red");
  svg.appendChild(circle);
};

const drawRoundingMask = (svg: SVGElement, x: number, y: number, theta: number) => {
  const innerRadius = 5.5;

  // draw a crescent
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  const startAngle = theta - Math.PI / 2;
  const endAngle = theta + Math.PI / 2;

  const startX = x + innerRadius * Math.cos(startAngle);
  const startY = y + innerRadius * Math.sin(startAngle);

  const endX = x + innerRadius * Math.cos(endAngle);
  const endY = y + innerRadius * Math.sin(endAngle);

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  const theta1 = theta + (Math.PI * 1) / 3;
  const bezierControl1X = endX + 80 * Math.cos(theta1);
  const bezierControl1Y = endY + 80 * Math.sin(theta1);

  const theta2 = theta - (Math.PI * 1) / 3;
  const bezierControl2X = startX + 80 * Math.cos(theta2);
  const bezierControl2Y = startY + 80 * Math.sin(theta2);

  let pathStr = `M ${startX} ${startY}`;
  pathStr += ` A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  pathStr += ` C ${bezierControl1X} ${bezierControl1Y}, ${bezierControl2X} ${bezierControl2Y}, ${startX} ${startY}`;
  pathStr += ` Z`;

  path.setAttribute("d", pathStr);
  path.setAttribute("fill", "white");
  path.setAttribute("stroke-width", "0");
  path.setAttribute("stroke", "white");

  svg.appendChild(path);
};

const maskSides = (svg: SVGElement, boxHeight: number, boxWidth: number, sideMaskWidth: number) => {
  const leftRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  leftRect.setAttribute("x", "0");
  leftRect.setAttribute("y", "0");
  leftRect.setAttribute("width", sideMaskWidth.toString());
  leftRect.setAttribute("height", boxHeight.toString());
  leftRect.setAttribute("fill", "white");
  svg.appendChild(leftRect);

  const rightRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rightRect.setAttribute("x", (boxWidth - sideMaskWidth).toString());
  rightRect.setAttribute("y", "0");
  rightRect.setAttribute("width", sideMaskWidth.toString());
  rightRect.setAttribute("height", boxHeight.toString());
  rightRect.setAttribute("fill", "white");
  svg.appendChild(rightRect);
};

const mirrorAngleVertically = (angle: number) => {
  return Math.PI - angle;
};

const toRun = () => {
  const app = document.getElementById("app");
  if (!app) {
    throw new Error("No app element found");
  }

  const phoneView = document.createElement("div");
  phoneView.id = "phone-view";

  const controlContainer = document.createElement("div");
  controlContainer.id = "control-container";
  controlContainer.style.width = "300px";
  controlContainer.style.height = "200px";
  app.appendChild(controlContainer);

  const boxHeight = 100;
  const boxWidth = 500;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", boxWidth.toString());
  svg.setAttribute("height", boxHeight.toString());
  svg.setAttribute("preserveAspectRatio", "none");

  // State variables
  // 0 to 2pi
  let phase = 0;
  let wavelength = 500;
  // Thumb coordinate is between 0 and 1
  let thumbCoordinate = 0.5;
  let thumbInertia = 0;
  let dragging = false;

  const amplitude = 30;
  const leftWindowBound = 30;
  const rightWindowBound = boxWidth - leftWindowBound;

  const derivativeAt = (x: number) => {
    return -amplitude * Math.sin(phase + (2 * Math.PI * x) / wavelength);
  };

  const valueAt = (x: number) => {
    return boxHeight / 2 + amplitude * Math.cos(phase + (2 * Math.PI * x) / wavelength);
  };

  const update = () => {
    if (dragging) {
      thumbInertia = 0;
      return;
    }

    const thumbX = thumbCoordinate * (rightWindowBound - leftWindowBound) + leftWindowBound;
    const force = derivativeAt(thumbX) * 0.0001;
    thumbInertia += force;
    thumbInertia *= 0.9;
    thumbCoordinate += thumbInertia;
    thumbCoordinate = Math.max(0, Math.min(1, thumbCoordinate));

    redrawThumb();
  };

  const drawThumb = () => {
    const thumbX = thumbCoordinate * (rightWindowBound - leftWindowBound) + leftWindowBound;

    const thumb = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    thumb.setAttribute("cx", thumbX.toString());

    const thumbY = valueAt(thumbX);
    thumb.setAttribute("cy", thumbY.toString());

    thumb.setAttribute("r", "10");
    thumb.setAttribute("fill", "blue");
    svg.appendChild(thumb);

    if (!dragging) {
      thumb.onmousedown = (e) => {
        if (e.button !== 0) {
          return;
        }

        dragging = true;
      };
    }

    phoneView.innerText = formatNumberAsPhone(Math.floor(thumbCoordinate * 9999999.9));
  };

  const redrawThumb = () => {
    // clear thumb
    svg.removeChild(svg.lastChild);
    drawThumb();
  };

  const drawSvg = () => {
    // clear svg
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    drawTrack(svg, phase, wavelength, boxHeight, boxWidth, amplitude);

    const leftBoxIntersectionY = valueAt(leftWindowBound);
    const rightBoxIntersectionY = valueAt(rightWindowBound);

    const leftDerivative = derivativeAt(leftWindowBound);
    const rightDerivative = derivativeAt(rightWindowBound);

    const leftRun = ((wavelength * 2) / boxWidth) * amplitude;
    const rightRun = ((-wavelength * 2) / boxWidth) * amplitude;

    const leftRise = leftDerivative;
    const rightRise = rightDerivative;

    const leftTheta = Math.atan2(leftRise, leftRun);
    const rightTheta = Math.atan2(rightRise, rightRun);

    drawRoundingMask(svg, leftWindowBound, leftBoxIntersectionY, leftTheta + Math.PI);
    drawRoundingMask(svg, rightWindowBound, rightBoxIntersectionY, Math.PI - rightTheta);

    maskSides(svg, boxHeight, boxWidth, leftWindowBound - 10);

    drawThumb();
  };

  drawSvg();

  const wavelengthSlider = document.createElement("input");
  wavelengthSlider.type = "range";
  wavelengthSlider.min = "100";
  wavelengthSlider.max = "1000";
  wavelengthSlider.value = "500";
  wavelengthSlider.oninput = () => {
    wavelength = parseInt(wavelengthSlider.value);
    drawSvg();
  };

  const phaseSlider = document.createElement("input");
  phaseSlider.type = "range";
  phaseSlider.min = "0";
  phaseSlider.max = "100";
  phaseSlider.value = "0";
  phaseSlider.oninput = () => {
    phase = (parseInt(phaseSlider.value) / 100) * 2 * Math.PI;
    drawSvg();
  };

  controlContainer.appendChild(svg);

  svg.onmousemove = (e) => {
    if (!dragging) {
      return;
    }

    const x = e.offsetX;

    let newThumbCoordinate = (x - leftWindowBound) / (rightWindowBound - leftWindowBound);
    if (newThumbCoordinate < 0) {
      newThumbCoordinate = 0;
    } else if (newThumbCoordinate > 1) {
      newThumbCoordinate = 1;
    }
    if (newThumbCoordinate !== thumbCoordinate) {
      thumbCoordinate = newThumbCoordinate;
      redrawThumb();
    }

    svg.onmouseleave = () => {
      dragging = false;
    };

    svg.onmouseup = () => {
      if (e.button !== 0) {
        return;
      }

      dragging = false;
    };
  };

  app.appendChild(wavelengthSlider);
  app.appendChild(phaseSlider);

  app.appendChild(phoneView);

  setInterval(update, 1000 / 60);
};

if (document.readyState === "complete") {
  toRun();
} else {
  document.addEventListener("DOMContentLoaded", toRun);
}
