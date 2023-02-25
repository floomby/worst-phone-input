// This is a phone input that is a slider that is meant to be really terrible

const formatNumberAsPhone = (num: number) => {
  const numStr = num.toString();
  // append 0s to the front if needed
  const numStrPadded = numStr.padStart(7, "0");
  const firstThree = numStrPadded.slice(0, 3);
  const lastFour = numStrPadded.slice(3);
  return `${firstThree}-${lastFour}`;
};

// Cubic bezier curve for a half wave (peak to trough or trough to peak)
const halfWave = (startX: number, endX: number, amplitude: number, offset: number, startIsTrough: boolean) => {
  const halfX = (startX + endX) / 2;
  const startY = startIsTrough ? offset + amplitude : offset - amplitude;
  const endY = startIsTrough ? offset - amplitude : offset + amplitude;

  // numbers calculated using the optimal-bezier-approximator.ts script
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

const drawRoundingMask = (svg: SVGElement, x: number, y: number, theta: number) => {
  const innerRadius = 5.5;

  // draw a crescent thing (its a goofy shape ok, idk what it is called)
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  const startAngle = theta - Math.PI / 2;
  const endAngle = theta + Math.PI / 2;

  const startX = x + innerRadius * Math.cos(startAngle);
  const startY = y + innerRadius * Math.sin(startAngle);

  const endX = x + innerRadius * Math.cos(endAngle);
  const endY = y + innerRadius * Math.sin(endAngle);

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  const theta1 = theta + Math.PI / 3;
  const bezierControl1X = endX + 90 * Math.cos(theta1);
  const bezierControl1Y = endY + 90 * Math.sin(theta1);

  const theta2 = theta - Math.PI / 3;
  const bezierControl2X = startX + 90 * Math.cos(theta2);
  const bezierControl2Y = startY + 90 * Math.sin(theta2);

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

const drawSimpleTrack = (svg: SVGElement, boxHeight: number, boxWidth: number, xPadding: number) => {
  const thickness = 10;

  // draw a path with rounded corners
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  const topOffset = boxHeight / 2 - thickness / 2;
  const botOffset = boxHeight / 2 + thickness / 2;

  const pathStartX = xPadding;
  const pathEndX = boxWidth - xPadding;

  let pathStr = `M ${pathStartX} ${topOffset}`;
  pathStr += ` L ${pathEndX} ${topOffset}`;
  pathStr += ` A ${thickness / 2} ${thickness / 2} 0 0 1 ${pathEndX} ${botOffset}`;
  pathStr += ` L ${pathStartX} ${botOffset}`;
  pathStr += ` A ${thickness / 2} ${thickness / 2} 0 0 1 ${pathStartX} ${topOffset}`;
  pathStr += ` Z`;

  path.setAttribute("d", pathStr);
  path.setAttribute("stroke-width", "0");
  path.setAttribute("stroke", "black");
  path.setAttribute("fill", "black");

  svg.appendChild(path);
};

const toRun = () => {
  const app = document.getElementById("app");
  if (!app) {
    throw new Error("No app element found");
  }

  const header = document.createElement("h2");
  header.classList.add("unselectable");
  app.appendChild(header);

  const controlContainer = document.createElement("div");
  controlContainer.id = "control-container";
  controlContainer.style.width = "300px";
  controlContainer.style.height = "200px";
  app.appendChild(controlContainer);

  const boxHeight = 100;
  const boxWidth = 500;

  const footerHeight = 50;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.setAttribute("width", boxWidth.toString());
  svg.setAttribute("height", (boxHeight + footerHeight).toString());
  svg.setAttribute("preserveAspectRatio", "none");

  const mainGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

  mainGroup.setAttribute("width", boxWidth.toString());
  mainGroup.setAttribute("height", boxHeight.toString());

  svg.appendChild(mainGroup);

  // State variables
  // 0 to 2pi
  let phase = 0;
  let draggingPhase = false;
  let wavelength = 500;
  let draggingWavelength = false;
  // Thumb coordinate is between 0 and 1
  let thumbCoordinate = 0.5;
  let thumbInertia = 0;
  let dragging = false;

  const minWavelength = 100;
  const maxWavelength = 2000;

  const simpleSliderXPadding = 20;

  // Phase slider
  const phaseGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

  phaseGroup.setAttribute("width", (boxWidth / 2).toString());
  phaseGroup.setAttribute("height", footerHeight.toString());
  phaseGroup.setAttribute("transform", `translate(0, ${boxHeight})`);

  svg.appendChild(phaseGroup);

  drawSimpleTrack(phaseGroup, footerHeight, boxWidth / 2, simpleSliderXPadding);

  const drawPhaseThumb = () => {
    const thumbXCoordinate = (phase / (2 * Math.PI)) * (boxWidth / 2 - 2 * simpleSliderXPadding) + simpleSliderXPadding;

    const thumb = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    thumb.setAttribute("cx", thumbXCoordinate.toString());
    thumb.setAttribute("cy", (footerHeight / 2).toString());
    thumb.setAttribute("r", "10");
    thumb.setAttribute("fill", draggingPhase ? "orange" : "blue");
    thumb.setAttribute("stroke", "purple");
    thumb.setAttribute("stroke-width", "3");
    thumb.style.cursor = "pointer";
    if (!draggingPhase) {
      thumb.classList.add("svg-thumb");
    }

    phaseGroup.appendChild(thumb);

    thumb.onmousedown = (e) => {
      if (e.button !== 0) {
        return;
      }

      draggingPhase = true;
      e.stopPropagation();
    };
  };

  const redrawPhaseThumb = () => {
    // Remove the old thumb
    const thumb = phaseGroup.querySelector("circle");
    if (thumb) {
      phaseGroup.removeChild(thumb);
    }
    drawPhaseThumb();
  };

  drawPhaseThumb();

  // Wavelength slider
  const wavelengthGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

  wavelengthGroup.setAttribute("width", (boxWidth / 2).toString());
  wavelengthGroup.setAttribute("height", footerHeight.toString());
  wavelengthGroup.setAttribute("transform", `translate(${boxWidth / 2}, ${boxHeight})`);

  svg.appendChild(wavelengthGroup);

  drawSimpleTrack(wavelengthGroup, footerHeight, boxWidth / 2, simpleSliderXPadding);

  const drawWavelengthThumb = () => {
    const thumbXCoordinate =
      ((wavelength - minWavelength) / (maxWavelength - minWavelength)) * (boxWidth / 2 - 2 * simpleSliderXPadding) + simpleSliderXPadding;

    const thumb = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    thumb.setAttribute("cx", thumbXCoordinate.toString());
    thumb.setAttribute("cy", (footerHeight / 2).toString());
    thumb.setAttribute("r", "10");
    thumb.setAttribute("fill", draggingWavelength ? "orange" : "blue");
    thumb.setAttribute("stroke", "purple");
    thumb.setAttribute("stroke-width", "3");
    thumb.style.cursor = "pointer";
    if (!draggingWavelength) {
      thumb.classList.add("svg-thumb");
    }

    wavelengthGroup.appendChild(thumb);

    thumb.onmousedown = (e) => {
      if (e.button !== 0) {
        return;
      }

      draggingWavelength = true;
      e.stopPropagation();
    };
  };

  const redrawWavelengthThumb = () => {
    // Remove the old thumb
    const thumb = wavelengthGroup.querySelector("circle");
    if (thumb) {
      wavelengthGroup.removeChild(thumb);
    }
    drawWavelengthThumb();
  };

  drawWavelengthThumb();

  // Main slider
  const amplitude = 30;
  const leftWindowBound = 20;
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
    thumb.setAttribute("fill", dragging ? "orange" : "blue");
    thumb.setAttribute("stroke", "purple");
    thumb.setAttribute("stroke-width", "3");
    thumb.style.cursor = "pointer";
    if (!dragging) {
      thumb.classList.add("svg-thumb");
    }
    mainGroup.appendChild(thumb);

    if (!dragging) {
      thumb.onmousedown = (e) => {
        if (e.button !== 0) {
          return;
        }

        dragging = true;
        e.stopPropagation();
      };
    }

    header.innerText = `Current Phone Number: ${formatNumberAsPhone(Math.floor(thumbCoordinate * 9999999.9))}`;
  };

  const redrawThumb = () => {
    // clear thumb
    mainGroup.removeChild(mainGroup.lastChild);
    drawThumb();
  };

  const drawSvg = () => {
    while (mainGroup.firstChild) {
      mainGroup.removeChild(mainGroup.firstChild);
    }

    drawTrack(mainGroup, phase, wavelength, boxHeight, boxWidth, amplitude);

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

    drawRoundingMask(mainGroup, leftWindowBound, leftBoxIntersectionY, leftTheta + Math.PI);
    drawRoundingMask(mainGroup, rightWindowBound, rightBoxIntersectionY, Math.PI - rightTheta);

    maskSides(mainGroup, boxHeight, boxWidth, leftWindowBound - 10);

    drawThumb();
  };

  drawSvg();

  controlContainer.appendChild(svg);

  svg.onmousemove = (e) => {
    const x = e.offsetX;

    if (dragging) {
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
    }

    if (draggingPhase) {
      let newPhase = ((x - simpleSliderXPadding) / (boxWidth / 2 - simpleSliderXPadding * 2)) * 2 * Math.PI;

      if (newPhase < 0) {
        newPhase = 0;
      } else if (newPhase > 2 * Math.PI) {
        newPhase = 2 * Math.PI;
      }
      if (newPhase !== phase) {
        phase = newPhase;
        redrawPhaseThumb();
        drawSvg();
      }
    }

    if (draggingWavelength) {
      let newWavelength =
        ((x - simpleSliderXPadding - boxWidth / 2) / (boxWidth / 2 - simpleSliderXPadding * 2)) * (maxWavelength - minWavelength) +
        minWavelength;

      if (newWavelength < minWavelength) {
        newWavelength = minWavelength;
      } else if (newWavelength > maxWavelength) {
        newWavelength = maxWavelength;
      }
      if (newWavelength !== wavelength) {
        wavelength = newWavelength;
        redrawWavelengthThumb();
        drawSvg();
      }
    }
  };

  svg.onmouseleave = () => {
    const thumbNeedsRedraw = dragging;
    const phaseThumbNeedsRedraw = draggingPhase;
    const wavelengthThumbNeedsRedraw = draggingWavelength;

    dragging = false;
    draggingPhase = false;
    draggingWavelength = false;

    if (thumbNeedsRedraw) {
      redrawThumb();
    }
    if (phaseThumbNeedsRedraw) {
      redrawPhaseThumb();
    }
    if (wavelengthThumbNeedsRedraw) {
      redrawWavelengthThumb();
    }
  };

  svg.onmouseup = (e) => {
    if (e.button !== 0) {
      return;
    }

    const thumbNeedsRedraw = dragging;
    const phaseThumbNeedsRedraw = draggingPhase;
    const wavelengthThumbNeedsRedraw = draggingWavelength;

    dragging = false;
    draggingPhase = false;
    draggingWavelength = false;

    if (thumbNeedsRedraw) {
      redrawThumb();
    }
    if (phaseThumbNeedsRedraw) {
      redrawPhaseThumb();
    }
    if (wavelengthThumbNeedsRedraw) {
      redrawWavelengthThumb();
    }
  };

  setInterval(update, 1000 / 60);
};

toRun();
