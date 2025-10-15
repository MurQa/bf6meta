(() => {
  const poiData = [
    {
      id: "poi-aurora-spire",
      label: "A",
      name: "Aurora Spire",
      position: { x: 28.4, y: 62.1 },
      intel:
        "Заброшенный маяк с видимостью на всю прибрежную дугу. Часто появляется легендарный дрон-разведчик и аптечки повышенной ёмкости.",
    },
    {
      id: "poi-black-ridge",
      label: "B",
      name: "Black Ridge Quarry",
      position: { x: 54.6, y: 47.3 },
      intel:
        "Карьер с многоуровневой вертикалью и водой внизу. Просторный спот для снайперов, но рядом всегда крутятся команды за тяжёлым транспортом.",
    },
    {
      id: "poi-sunforge",
      label: "C",
      name: "Sunforge Array",
      position: { x: 68.8, y: 71.4 },
      intel:
        "Солнечная ферма, в центре которой активируется система EMP. При удержании зоны можно обрубить электронику противника на 45 секунд.",
    },
    {
      id: "poi-halo-basin",
      label: "D",
      name: "Halo Basin",
      position: { x: 37.2, y: 31.7 },
      intel:
        "Платформы-бастионы над кратером. Лучшее место для перехвата вражеских десантов и прикрытия союзных вездеходов.",
    },
    {
      id: "poi-stormfront",
      label: "E",
      name: "Stormfront Labs",
      position: { x: 17.9, y: 44.5 },
      intel:
        "Лабораторный комплекс с экспериментальными гаджетами. Присутствует портативный штормогенератор, который вызывает локальный туман.",
    },
    {
      id: "poi-rift-plunge",
      label: "F",
      name: "Rift Plunge",
      position: { x: 82.1, y: 22.4 },
      intel:
        "Глубокая расщелина с зиплайнами и контрабандными контейнерами. Высокий риск, но гарантированный комплект эпического вооружения.",
    },
  ];

  const settings = {
    maxScaleMultiplier: 20,
    poiFocusScaleMultiplier: 10,
  };

  const setupInteractiveMap = () => {
    const mapContainer = document.getElementById("map-container");
    const mapContent = document.getElementById("map-content");
    const mapImage = document.getElementById("map-image");
    const infoPanel = document.getElementById("info-panel");
    const infoTitle = document.getElementById("info-title");
    const infoDescription = document.getElementById("info-description");
    const infoCloseButton = document.getElementById("info-close");

    if (
      !mapContainer ||
      !mapContent ||
      !mapImage ||
      !infoPanel ||
      !infoTitle ||
      !infoDescription ||
      !infoCloseButton
    ) {
      console.warn("Карта не инициализирована: элементы не найдены в DOM.");
      return;
    }

    const state = {
      x: 0,
      y: 0,
      scale: 1,
      minScale: 0.4,
      maxScale: 6,
      baseScale: 1,
    };

    const dimensions = {
      width: 1,
      height: 1,
    };

    const poiElements = new Map();
    let activePoiId = null;

    const activePointers = new Map();
    let panSession = null;
    let pinchSession = null;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const getBounds = (scale = state.scale) => {
      const containerWidth = mapContainer.clientWidth;
      const containerHeight = mapContainer.clientHeight;
      const mapWidth = dimensions.width * scale;
      const mapHeight = dimensions.height * scale;

      let minX = containerWidth - mapWidth;
      let maxX = 0;
      let minY = containerHeight - mapHeight;
      let maxY = 0;

      if (mapWidth < containerWidth) {
        const centeredX = (containerWidth - mapWidth) / 2;
        minX = centeredX;
        maxX = centeredX;
      }

      if (mapHeight < containerHeight) {
        const centeredY = (containerHeight - mapHeight) / 2;
        minY = centeredY;
        maxY = centeredY;
      }

      return { minX, maxX, minY, maxY };
    };

    const getClampedPosition = (x, y, scale = state.scale) => {
      const bounds = getBounds(scale);
      return {
        x: clamp(x, bounds.minX, bounds.maxX),
        y: clamp(y, bounds.minY, bounds.maxY),
      };
    };

    const clampScale = (value) => clamp(value, state.minScale, state.maxScale);

    const updateTransform = () => {
      mapContent.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
    };

    const clampPosition = () => {
      const { x, y } = getClampedPosition(state.x, state.y);
      state.x = x;
      state.y = y;
    };

    const repositionForResize = () => {
      clampPosition();
      updateTransform();
    };

    const fitToContainer = () => {
      const containerWidth = mapContainer.clientWidth;
      const containerHeight = mapContainer.clientHeight;

      const scaleToFit = Math.min(
        containerWidth / dimensions.width,
        containerHeight / dimensions.height
      );

      state.baseScale = scaleToFit;
      state.scale = scaleToFit;
      state.minScale = scaleToFit;
      state.maxScale = Math.max(scaleToFit * settings.maxScaleMultiplier, scaleToFit * 2);

      const centered = getClampedPosition(
        (containerWidth - dimensions.width * state.scale) / 2,
        (containerHeight - dimensions.height * state.scale) / 2
      );

      state.x = centered.x;
      state.y = centered.y;
      updateTransform();
    };

    const animatePanTo = (targetX, targetY, duration = 320) => {
      const startX = state.x;
      const startY = state.y;
      const { x: clampedX, y: clampedY } = getClampedPosition(targetX, targetY);

      if (duration <= 0) {
        state.x = clampedX;
        state.y = clampedY;
        updateTransform();
        return;
      }

      const startTime = performance.now();
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const step = (now) => {
        const elapsed = now - startTime;
        const t = clamp(elapsed / duration, 0, 1);
        const eased = easeOutCubic(t);

        state.x = startX + (clampedX - startX) * eased;
        state.y = startY + (clampedY - startY) * eased;
        updateTransform();

        if (t < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    };

    const centerOnPoi = (poi) => {
      const containerWidth = mapContainer.clientWidth;
      const containerHeight = mapContainer.clientHeight;

      const mapX = (poi.position.x / 100) * dimensions.width;
      const mapY = (poi.position.y / 100) * dimensions.height;

      const targetX = containerWidth / 2 - mapX * state.scale;
      const targetY = containerHeight / 2 - mapY * state.scale;

      animatePanTo(targetX, targetY);
    };

    const setActivePoi = (poiId) => {
      if (activePoiId && poiElements.has(activePoiId)) {
        poiElements.get(activePoiId).element.dataset.active = "false";
      }

      const entry = poiElements.get(poiId);
      if (!entry) {
        activePoiId = null;
        return;
      }

      entry.element.dataset.active = "true";
      activePoiId = poiId;
    };

    const showInfo = (poi) => {
      infoTitle.textContent = poi.name;
      infoDescription.textContent = poi.intel;
      infoPanel.dataset.state = "visible";
    };

    const hideInfo = () => {
      infoPanel.dataset.state = "hidden";
      if (activePoiId && poiElements.has(activePoiId)) {
        poiElements.get(activePoiId).element.dataset.active = "false";
      }
      activePoiId = null;
    };

    const ensurePoiFocusScale = (poi) => {
      const desiredScale = clampScale(
        Math.max(state.scale, state.baseScale * settings.poiFocusScaleMultiplier)
      );

      if (desiredScale === state.scale) return;

      const mapX = (poi.position.x / 100) * dimensions.width;
      const mapY = (poi.position.y / 100) * dimensions.height;

      const viewportX = state.x + mapX * state.scale;
      const viewportY = state.y + mapY * state.scale;

      state.scale = desiredScale;
      state.x = viewportX - mapX * state.scale;
      state.y = viewportY - mapY * state.scale;

      clampPosition();
      updateTransform();
    };

    const handlePoiClick = (poi) => {
      ensurePoiFocusScale(poi);
      setActivePoi(poi.id);
      centerOnPoi(poi);
      showInfo(poi);
    };

    const createPoiMarkers = () => {
      poiData.forEach((poi) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "poi";
        button.dataset.id = poi.id;
        button.dataset.active = "false";
        button.style.left = `${poi.position.x}%`;
        button.style.top = `${poi.position.y}%`;
        button.title = poi.name;
        button.textContent = poi.label;
        button.setAttribute("aria-label", `${poi.name}. ${poi.intel}`);

        button.addEventListener("click", (event) => {
          event.stopPropagation();
          handlePoiClick(poi);
        });

        button.addEventListener("pointerdown", (event) => {
          event.stopPropagation();
        });

        mapContent.append(button);
        poiElements.set(poi.id, { element: button, data: poi });
      });
    };

    const getMidpoint = (pointerEvents) => {
      const points = Array.from(pointerEvents.values());
      const rect = mapContainer.getBoundingClientRect();
      const x = (points[0].clientX + points[1].clientX) / 2 - rect.left;
      const y = (points[0].clientY + points[1].clientY) / 2 - rect.top;
      return { x, y };
    };

    const getDistance = (pointerEvents) => {
      const [a, b] = Array.from(pointerEvents.values());
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    const beginPinch = () => {
      if (activePointers.size < 2) {
        pinchSession = null;
        return;
      }

      const midpoint = getMidpoint(activePointers);
      const distance = getDistance(activePointers);

      pinchSession = {
        startScale: state.scale,
        distance,
        midpoint,
        mapPoint: {
          x: (midpoint.x - state.x) / state.scale,
          y: (midpoint.y - state.y) / state.scale,
        },
      };
    };

    const updatePinch = () => {
      if (!pinchSession || activePointers.size < 2) return;

      const midpoint = getMidpoint(activePointers);
      const distance = getDistance(activePointers);
      const scaleFactor = distance / pinchSession.distance;
      const targetScale = clampScale(pinchSession.startScale * scaleFactor);

      state.scale = targetScale;
      state.x = midpoint.x - pinchSession.mapPoint.x * state.scale;
      state.y = midpoint.y - pinchSession.mapPoint.y * state.scale;

      clampPosition();
      updateTransform();
    };

    const endPinch = () => {
      pinchSession = null;
    };

    const handlePointerDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      mapContainer.setPointerCapture(event.pointerId);
      activePointers.set(event.pointerId, event);

      if (activePointers.size === 1 && !event.target.closest(".poi")) {
        panSession = {
          pointerId: event.pointerId,
          startX: state.x,
          startY: state.y,
          pointerX: event.clientX,
          pointerY: event.clientY,
        };
        mapContainer.classList.add("is-grabbing");
      } else if (activePointers.size === 2) {
        panSession = null;
        beginPinch();
      }
    };

    const handlePointerMove = (event) => {
      if (!activePointers.has(event.pointerId)) return;

      activePointers.set(event.pointerId, event);

      if (pinchSession && activePointers.size >= 2) {
        updatePinch();
        return;
      }

      if (!panSession || event.pointerId !== panSession.pointerId) return;

      const dx = event.clientX - panSession.pointerX;
      const dy = event.clientY - panSession.pointerY;

      state.x = panSession.startX + dx;
      state.y = panSession.startY + dy;

      clampPosition();
      updateTransform();
    };

    const handlePointerUp = (event) => {
      if (activePointers.has(event.pointerId)) {
        activePointers.delete(event.pointerId);
      }

      if (activePointers.size < 2) {
        endPinch();
      }

      if (panSession && event.pointerId === panSession.pointerId) {
        panSession = null;
        mapContainer.classList.remove("is-grabbing");
      }

      if (mapContainer.hasPointerCapture(event.pointerId)) {
        mapContainer.releasePointerCapture(event.pointerId);
      }
    };

    const handlePointerCancel = (event) => {
      if (activePointers.has(event.pointerId)) {
        activePointers.delete(event.pointerId);
      }
      endPinch();
      panSession = null;
      mapContainer.classList.remove("is-grabbing");
      if (mapContainer.hasPointerCapture(event.pointerId)) {
        mapContainer.releasePointerCapture(event.pointerId);
      }
    };

    const handleWheel = (event) => {
      event.preventDefault();

      const rect = mapContainer.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;

      const mapPointX = (pointerX - state.x) / state.scale;
      const mapPointY = (pointerY - state.y) / state.scale;

      const zoomIntensity = 0.0018;
      const scaleFactor = Math.exp(-event.deltaY * zoomIntensity);
      const targetScale = clampScale(state.scale * scaleFactor);

      state.scale = targetScale;
      state.x = pointerX - mapPointX * state.scale;
      state.y = pointerY - mapPointY * state.scale;

      clampPosition();
      updateTransform();
    };

    const handleResize = () => {
      const containerWidth = mapContainer.clientWidth;
      const containerHeight = mapContainer.clientHeight;
      const scaleToFit = Math.min(
        containerWidth / dimensions.width,
        containerHeight / dimensions.height
      );

      state.baseScale = scaleToFit;
      state.minScale = scaleToFit;
      state.maxScale = Math.max(scaleToFit * settings.maxScaleMultiplier, scaleToFit * 2);

      state.scale = clampScale(state.scale);
      clampPosition();
      updateTransform();
    };

    const wireEvents = () => {
      mapContainer.addEventListener("pointerdown", handlePointerDown);
      mapContainer.addEventListener("pointermove", handlePointerMove);
      mapContainer.addEventListener("pointerup", handlePointerUp);
      mapContainer.addEventListener("pointercancel", handlePointerCancel);
      mapContainer.addEventListener("wheel", handleWheel, { passive: false });

      infoCloseButton.addEventListener("click", hideInfo);

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          hideInfo();
        }
      });

      window.addEventListener("resize", () => {
        repositionForResize();
        handleResize();
      });
    };

    const initialise = () => {
      dimensions.width = mapImage.naturalWidth;
      dimensions.height = mapImage.naturalHeight;

      if (!dimensions.width || !dimensions.height) {
        console.warn("Не удалось определить размеры карты.");
        return;
      }

      mapContent.style.width = `${dimensions.width}px`;
      mapContent.style.height = `${dimensions.height}px`;

      fitToContainer();
      createPoiMarkers();
      wireEvents();
    };

    if (mapImage.complete && mapImage.naturalWidth) {
      initialise();
    } else {
      mapImage.addEventListener("load", initialise, { once: true });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupInteractiveMap, { once: true });
  } else {
    setupInteractiveMap();
  }
})();
