(() => {
  const POI_TYPES = {
    tank: {
      id: "tank",
      title: "Развёртывание танка",
      colorPrimary: "#f97316",
      colorAccent: "#ea580c",
      shadow: "rgba(249, 115, 22, 0.45)",
      activeColorPrimary: "#fb923c",
      activeColorAccent: "#f97316",
      activeShadow: "rgba(251, 146, 60, 0.55)",
      badgeBg: "rgba(249, 115, 22, 0.18)",
      badgeBorder: "rgba(249, 115, 22, 0.32)",
      glyph: "🛡️",
      icon: "assets/tank.png",
      pinBackground: "rgba(249, 115, 22, 0.22)",
      pinBorder: "rgba(249, 115, 22, 0.6)",
      pinBorderActive: "rgba(253, 186, 116, 0.95)",
      pinIconColor: "#fff7ed",
      pinRadius: "8px",
    },
    mission: {
      id: "mission",
      title: "Боевой контракт",
      colorPrimary: "#38bdf8",
      colorAccent: "#0ea5e9",
      shadow: "rgba(14, 165, 233, 0.35)",
      activeColorPrimary: "#60a5fa",
      activeColorAccent: "#3b82f6",
      activeShadow: "rgba(96, 165, 250, 0.45)",
      badgeBg: "rgba(14, 165, 233, 0.18)",
      badgeBorder: "rgba(14, 165, 233, 0.32)",
      glyph: "🎯",
      icon: "assets/star.png",
      pinBackground: "rgba(56, 189, 248, 0.22)",
      pinBorder: "rgba(56, 189, 248, 0.55)",
      pinBorderActive: "rgba(125, 211, 252, 0.95)",
      pinIconColor: "#ecfeff",
      pinRadius: "8px",
    },
    weapons: {
      id: "weapons",
      title: "Оружейный ящик",
      colorPrimary: "#10b981",
      colorAccent: "#059669",
      shadow: "rgba(16, 64, 185, 0.35)",
      activeColorPrimary: "#34d399",
      activeColorAccent: "#10b981",
      activeShadow: "rgba(52, 211, 153, 0.45)",
      badgeBg: "rgba(16, 185, 129, 0.18)",
      badgeBorder: "rgba(16, 185, 129, 0.32)",
      glyph: "🗃️",
      icon: "assets/jet.png",
      pinBackground: "rgba(16, 185, 129, 0.22)",
      pinBorder: "rgba(16, 185, 129, 0.6)",
      pinBorderActive: "rgba(52, 211, 153, 0.95)",
      pinIconColor: "#ecfdf5",
      pinRadius: "8px",
    },
  };

  const poiData = [
    {
      id: "poi-tank-vanguard",
      type: "tank",
      title: "Steel Vanguard",
      description:
        "Передвижной заводской танк, готовый к вызову. Дополнительные пластины брони и автопочинка на старте.",
      position: { x: 31.6, y: 60.8 },
      visibleZoom: 1,
    },
    {
      id: "poi-tank-ridge",
      type: "tank",
      title: "Ridgebreaker Drop",
      description:
        "Глубинный сброс тяжелой техники в канйон. Идеально для прорыва укреплений на востоке.",
      position: { x: 66.2, y: 28.4 },
      visibleZoom: 1.35,
    },
    {
      id: "poi-mission-orbit",
      type: "mission",
      title: "Mission: Orbital Relay",
      description:
        "Задача: восстановить связь со спутником и получить точную отметку безопасной зоны следующего круга.",
      position: { x: 21.3, y: 37.5 },
      visibleZoom: 1.2,
    },
    {
      id: "poi-mission-safeguard",
      type: "mission",
      title: "Mission: Safeguard Sigma",
      description:
        "Кооперативный контракт: защитить грузовой конвой с редкими чипами. Успех открывает временный магазин.",
      position: { x: 52.8, y: 72.9 },
      visibleZoom: 1.65,
    },
    {
      id: "poi-weapons-cache",
      type: "weapons",
      title: "Weapons Cache Delta",
      description:
        "Глубокий склад прототипов. Внутри гарантирован апгрейд легендарного оружия и модификаторы боеприпасов.",
      position: { x: 42.6, y: 46.1 },
      visibleZoom: 1.05,
    },
    {
      id: "poi-weapons-harbor",
      type: "weapons",
      title: "Weapons Chest Harbor",
      description:
        "Плавающий контейнер с дропом. Требуется разминирование — награда включает кастомные экзоскелеты.",
      position: { x: 78.4, y: 63.8 },
      visibleZoom: 1.5,
    },
  ];

  const settings = {
    maxScaleMultiplier: 20,
    poiFocusScaleMultiplier: 10,
    poiIconBaseSize: 120,
    poiIconMinSize: 24,
    poiIconScaleCurve: 0.65,
  };

  const setupInteractiveMap = () => {
    const mapContainer = document.getElementById("map-container");
    const mapContent = document.getElementById("map-content");
    const mapImage = document.getElementById("map-image");
    const infoPanel = document.getElementById("info-panel");
    const infoTitle = document.getElementById("info-title");
    const infoDescription = document.getElementById("info-description");
    const infoCloseButton = document.getElementById("info-close");
    const infoType = document.getElementById("info-type");

    if (
      !mapContainer ||
      !mapContent ||
      !mapImage ||
      !infoPanel ||
      !infoTitle ||
      !infoDescription ||
      !infoCloseButton ||
      !infoType
    ) {
      console.warn("Карта не инициализирована: элементы не найдены в DOM.");
      return;
    }

    infoType.hidden = true;

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
    let transformAnimation = null;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

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

    const clampPosition = () => {
      const { x, y } = getClampedPosition(state.x, state.y);
      state.x = x;
      state.y = y;
    };

    const getPoiVisibilityThreshold = (poi) =>
      state.baseScale * (poi.visibleZoom ?? 1);

    const getPoiIconSize = (scale) => {
      const baseSize = settings.poiIconBaseSize;
      const minSize = settings.poiIconMinSize;
      const minScale = state.minScale;
      const maxScale = state.maxScale;
      const clampedScale = clamp(scale, minScale, maxScale);
      const span = Math.max(maxScale - minScale, 0.0001);
      let progress = (clampedScale - minScale) / span;
      progress = clamp(progress, 0, 1);
      if (settings.poiIconScaleCurve && settings.poiIconScaleCurve > 0) {
        progress = Math.pow(progress, settings.poiIconScaleCurve);
      }
      progress = clamp(progress, 0, 1);
      return baseSize - (baseSize - minSize) * progress;
    };

    const updatePoiAppearance = () => {
      const iconSize = getPoiIconSize(state.scale);
      const iconScale = iconSize / settings.poiIconBaseSize;
      poiElements.forEach(({ element, data }) => {
        const isActive = element.dataset.active === "true";
        if (isActive) {
          element.dataset.visible = "true";
          element.style.setProperty("--poi-size-scale", iconScale.toFixed(4));
          element.style.setProperty("--poi-state-scale", "1");
        } else {
          const shouldBeVisible = state.scale >= getPoiVisibilityThreshold(data);
          element.dataset.visible = shouldBeVisible ? "true" : "false";
          element.style.setProperty("--poi-size-scale", iconScale.toFixed(4));
          element.style.removeProperty("--poi-state-scale");
        }
      });

      console.debug(
        `[BF6 MAP] Zoom scale: ${state.scale.toFixed(3)} (min ${state.minScale.toFixed(
          3
        )}, max ${state.maxScale.toFixed(3)}), icon size: ${iconSize.toFixed(2)}px`
      );
    };

    const updateTransform = () => {
      mapContent.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
      updatePoiAppearance();
    };

    const stopTransformAnimation = () => {
      if (!transformAnimation) return;
      cancelAnimationFrame(transformAnimation.frameId);
      transformAnimation = null;
    };

    const animateTransform = ({ x, y, scale }, duration = 420) => {
      stopTransformAnimation();

      const start = { x: state.x, y: state.y, scale: state.scale };
      const deltaScale = scale - start.scale;
      const deltaX = x - start.x;
      const deltaY = y - start.y;

      if (
        Math.abs(deltaScale) < 0.001 &&
        Math.abs(deltaX) < 0.5 &&
        Math.abs(deltaY) < 0.5
      ) {
        state.scale = scale;
        state.x = x;
        state.y = y;
        clampPosition();
        updateTransform();
        return;
      }

      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const t = clamp(elapsed / duration, 0, 1);
        const eased = easeOutCubic(t);

        state.scale = start.scale + deltaScale * eased;
        state.x = start.x + deltaX * eased;
        state.y = start.y + deltaY * eased;
        clampPosition();
        updateTransform();

        if (t < 1) {
          transformAnimation = { frameId: requestAnimationFrame(step) };
        } else {
          transformAnimation = null;
        }
      };

      transformAnimation = { frameId: requestAnimationFrame(step) };
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

    const focusPoi = (poi) => {
      const containerWidth = mapContainer.clientWidth;
      const containerHeight = mapContainer.clientHeight;

      const mapX = (poi.position.x / 100) * dimensions.width;
      const mapY = (poi.position.y / 100) * dimensions.height;

      const targetScale = clampScale(
        Math.max(state.scale, state.baseScale * settings.poiFocusScaleMultiplier)
      );

      const rawX = containerWidth / 2 - mapX * targetScale;
      const rawY = containerHeight / 2 - mapY * targetScale;
      const { x: targetX, y: targetY } = getClampedPosition(rawX, rawY, targetScale);

      animateTransform({ x: targetX, y: targetY, scale: targetScale });
    };

    const defaultInfoTypeColor = "rgba(243, 245, 255, 0.82)";
    const defaultInfoTypeBg = "rgba(59, 130, 246, 0.16)";
    const defaultInfoTypeBorder = "rgba(59, 130, 246, 0.25)";

    const setActivePoi = (poiId) => {
      if (activePoiId && poiElements.has(activePoiId)) {
        const elem = poiElements.get(activePoiId).element;
        elem.dataset.active = "false";
        elem.style.removeProperty("--poi-state-scale");
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
      const typeMeta = POI_TYPES[poi.type];

      infoTitle.textContent = poi.title;
      infoDescription.textContent = poi.description;
      infoType.textContent = typeMeta ? typeMeta.title : "Неизвестная точка";
      infoType.hidden = false;

      infoPanel.style.setProperty(
        "--info-type-color",
        typeMeta ? typeMeta.colorPrimary : defaultInfoTypeColor
      );
      infoPanel.style.setProperty(
        "--info-type-bg",
        typeMeta ? typeMeta.badgeBg : defaultInfoTypeBg
      );
      infoPanel.style.setProperty(
        "--info-type-border",
        typeMeta ? typeMeta.badgeBorder : defaultInfoTypeBorder
      );

      infoPanel.dataset.type = typeMeta ? typeMeta.id : "unknown";
      infoPanel.dataset.state = "visible";
    };

    const hideInfo = () => {
      infoPanel.dataset.state = "hidden";
      infoPanel.dataset.type = "";
      infoType.textContent = "";
      infoType.hidden = true;
      infoPanel.style.setProperty("--info-type-color", defaultInfoTypeColor);
      infoPanel.style.setProperty("--info-type-bg", defaultInfoTypeBg);
      infoPanel.style.setProperty("--info-type-border", defaultInfoTypeBorder);

      if (activePoiId && poiElements.has(activePoiId)) {
        poiElements.get(activePoiId).element.dataset.active = "false";
      }
      activePoiId = null;
    };

    const handlePoiClick = (poi) => {
      setActivePoi(poi.id);
      focusPoi(poi);
      showInfo(poi);
    };

    const createPoiMarkers = () => {
      poiData.forEach((poi) => {
        const typeMeta = POI_TYPES[poi.type];
        if (!typeMeta) {
          console.warn(`Неизвестный тип POI: ${poi.type}`);
          return;
        }

        const poiRecord = {
          ...poi,
          visibleZoom: poi.visibleZoom ?? 1,
        };

        const button = document.createElement("button");
        button.type = "button";
        button.className = "poi";
        button.dataset.id = poiRecord.id;
        button.dataset.type = poiRecord.type;
        button.dataset.active = "false";
        button.dataset.visible = "false";
        button.style.left = `${poiRecord.position.x}%`;
        button.style.top = `${poiRecord.position.y}%`;
        button.title = poiRecord.title;
        button.setAttribute("aria-label", `${typeMeta.title}: ${poiRecord.title}`);
        button.style.setProperty("--poi-icon-base-size", `${settings.poiIconBaseSize}px`);

        if (typeMeta.pinBackground)
          button.style.setProperty("--poi-background", typeMeta.pinBackground);
        if (typeMeta.pinBorder) button.style.setProperty("--poi-border-color", typeMeta.pinBorder);
        if (typeMeta.pinBorderActive)
          button.style.setProperty("--poi-border-active-color", typeMeta.pinBorderActive);
        if (typeMeta.pinIconColor)
          button.style.setProperty("--poi-icon-color", typeMeta.pinIconColor);
        if (typeMeta.pinRadius) button.style.setProperty("--poi-radius", typeMeta.pinRadius);

        button.classList.add(`poi--${poiRecord.type}`);

        const createGlyph = () => {
          const fallback = document.createElement("span");
          fallback.className = "poi__glyph";
          fallback.textContent = typeMeta.glyph || "●";
          fallback.setAttribute("aria-hidden", "true");
          return fallback;
        };

        if (typeMeta.icon) {
          const icon = document.createElement("img");
          icon.className = "poi__icon";
          icon.src = typeMeta.icon;
          icon.alt = typeMeta.title;
          icon.decoding = "async";
          icon.loading = "lazy";
          icon.draggable = false;
          icon.addEventListener(
            "error",
            () => {
              icon.replaceWith(createGlyph());
            },
            { once: true }
          );
          button.append(icon);
        } else {
          button.append(createGlyph());
        }

        button.addEventListener("click", (event) => {
          event.stopPropagation();
          handlePoiClick(poiRecord);
        });

        button.addEventListener("pointerdown", (event) => {
          event.stopPropagation();
        });

        mapContent.append(button);
        poiElements.set(poiRecord.id, { element: button, data: poiRecord, type: typeMeta });
      });

      updatePoiAppearance();
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

      stopTransformAnimation();
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
      stopTransformAnimation();

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
      stopTransformAnimation();
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
