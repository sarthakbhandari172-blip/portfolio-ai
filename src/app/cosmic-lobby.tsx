"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

type HeroLink = {
  id: number;
  label: string;
  url: string;
  icon_text: string;
};

type CharacterDeckProps = {
  displayTitle: string;
  accentTitle: string;
  label: string;
  tagline: string;
  bio: string;
  imageUrl: string;
  roles: string[];
  primaryCta: { text: string; url: string };
  secondaryCta: { text: string; url: string };
  region: string;
  statusText: string;
  links: HeroLink[];
};

type DeckStyle = CSSProperties & {
  "--panel-rx": string;
  "--panel-ry": string;
  "--panel-x": string;
  "--panel-y": string;
  "--aura-x": string;
  "--aura-y": string;
  "--ring-x": string;
  "--ring-y": string;
  "--shine-x": string;
  "--shine-y": string;
  "--scene-x": string;
  "--scene-y": string;
};

type MotionState = {
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  targetRotationX: number;
  targetRotationY: number;
  currentRotationX: number;
  currentRotationY: number;
  velocityX: number;
  velocityY: number;
  lastPointerX: number;
  lastPointerY: number;
  hovering: boolean;
  dragging: boolean;
  pointerType: string;
};

export function CosmicLobby({
  displayTitle,
  accentTitle,
  label,
  tagline,
  bio,
  imageUrl,
  roles,
  primaryCta,
  secondaryCta,
  region,
  statusText,
  links,
}: CharacterDeckProps) {
  const sceneRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const eyeEnergyRef = useRef<HTMLCanvasElement>(null);
  const motionRef = useRef<MotionState>({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    targetRotationX: 0,
    targetRotationY: 0,
    currentRotationX: 0,
    currentRotationY: 0,
    velocityX: 0,
    velocityY: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    hovering: false,
    dragging: false,
    pointerType: "mouse",
  });
  const safeRoles = roles.length ? roles : ["Digital Creative"];
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRoleIndex((current) => (current + 1) % safeRoles.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [safeRoles.length]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let animationFrame = 0;
    let previousTime = performance.now();
    const animate = (time: number) => {
      const motion = motionRef.current;
      const frameRatio = Math.min(2, Math.max(0.25, (time - previousTime) / 16.667));
      const deltaSeconds = frameRatio / 60;
      previousTime = time;
      const followRate = motion.dragging ? 22 : motion.hovering ? 13 : 8;
      const ease = 1 - Math.exp(-followRate * deltaSeconds);
      motion.currentX += (motion.targetX - motion.currentX) * ease;
      motion.currentY += (motion.targetY - motion.currentY) * ease;

      if (!motion.dragging) {
        motion.targetRotationX += motion.velocityX * frameRatio;
        motion.targetRotationY += motion.velocityY * frameRatio;
        const friction = Math.pow(0.94, frameRatio);
        motion.velocityX *= friction;
        motion.velocityY *= friction;
        if (Math.abs(motion.velocityX) < 0.002) motion.velocityX = 0;
        if (Math.abs(motion.velocityY) < 0.002) motion.velocityY = 0;
      }

      const rotationRate = motion.dragging ? 24 : 11;
      const rotationEase = 1 - Math.exp(-rotationRate * deltaSeconds);
      motion.currentRotationX +=
        (motion.targetRotationX - motion.currentRotationX) * rotationEase;
      motion.currentRotationY +=
        (motion.targetRotationY - motion.currentRotationY) * rotationEase;

      const touch = motion.pointerType === "touch";
      const activeScale = motion.dragging ? 1.22 : 1;
      const x = motion.currentX;
      const y = motion.currentY;

      const hoverTiltX = motion.dragging ? 0 : -y * (touch ? 3 : 7);
      const hoverTiltY = motion.dragging ? 0 : x * (touch ? 4 : 9);
      scene.style.setProperty(
        "--panel-rx",
        `${(motion.currentRotationX + hoverTiltX).toFixed(3)}deg`,
      );
      scene.style.setProperty(
        "--panel-ry",
        `${(motion.currentRotationY + hoverTiltY).toFixed(3)}deg`,
      );
      scene.style.setProperty("--panel-x", `${(x * 11).toFixed(2)}px`);
      scene.style.setProperty("--panel-y", `${(y * 8).toFixed(2)}px`);
      scene.style.setProperty("--aura-x", `${(x * 38 * activeScale).toFixed(2)}px`);
      scene.style.setProperty("--aura-y", `${(y * 30 * activeScale).toFixed(2)}px`);
      scene.style.setProperty("--ring-x", `${(-x * 18).toFixed(2)}px`);
      scene.style.setProperty("--ring-y", `${(-y * 14).toFixed(2)}px`);
      scene.style.setProperty("--shine-x", `${(50 + x * 36).toFixed(2)}%`);
      scene.style.setProperty("--shine-y", `${(42 + y * 32).toFixed(2)}%`);
      scene.style.setProperty("--scene-x", `${(-x * 18).toFixed(2)}px`);
      scene.style.setProperty("--scene-y", `${(-y * 12).toFixed(2)}px`);
      animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    const canvas = eyeEnergyRef.current;
    const frame = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !frame || !context) return;

    type Point = { x: number; y: number };
    type Bolt = { side: "left" | "right"; points: Point[] };

    const designWidth = 1086;
    const designHeight = 1448;
    const eyePositions = {
      left: { x: 462, y: 531 },
      right: { x: 612, y: 531 },
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let animationFrame = 0;
    let morphStartedAt = performance.now();

    const makeBolt = (side: Bolt["side"]): Bolt => {
      const start = eyePositions[side];
      const direction = side === "left" ? -1 : 1;
      const endX = side === "left" ? 68 : 1018;
      const endY = start.y - 12 + (Math.random() - 0.5) * 42;
      let drift = 0;
      const points = Array.from({ length: 25 }, (_, index) => {
        const progress = index / 24;
        const envelope = Math.sin(progress * Math.PI);
        drift = drift * 0.28 + (Math.random() - 0.5) * 27;
        return {
          x:
            start.x +
            (endX - start.x) * progress +
            direction * Math.sin(progress * Math.PI * 7) * 3.5 * envelope,
          y:
            start.y +
            (endY - start.y) * progress +
            drift * envelope +
            Math.sin(progress * Math.PI * 5) * 5 * envelope,
        };
      });
      points[0] = { ...start };
      return { side, points };
    };

    const blendBolt = (from: Bolt, to: Bolt, progress: number): Bolt => ({
      side: from.side,
      points: from.points.map((point, index) => ({
        x: point.x + (to.points[index].x - point.x) * progress,
        y: point.y + (to.points[index].y - point.y) * progress,
      })),
    });

    let leftFrom = makeBolt("left");
    let leftTo = makeBolt("left");
    let rightFrom = makeBolt("right");
    let rightTo = makeBolt("right");

    const resize = () => {
      const bounds = frame.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
    };

    const strokeBolt = (
      bolt: Bolt,
      lineWidth: number,
      startColour: string,
      middleColour: string,
      shadowBlur = 0,
      shadowColour = "transparent",
      dash: number[] = [],
      dashOffset = 0,
    ) => {
      const start = bolt.points[0];
      const end = bolt.points[bolt.points.length - 1];
      const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
      gradient.addColorStop(0, startColour);
      gradient.addColorStop(0.58, middleColour);
      gradient.addColorStop(1, "rgba(111, 38, 255, 0)");
      context.beginPath();
      context.moveTo(start.x, start.y);
      bolt.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
      context.lineWidth = lineWidth;
      context.strokeStyle = gradient;
      context.shadowBlur = shadowBlur;
      context.shadowColor = shadowColour;
      context.setLineDash(dash);
      context.lineDashOffset = dashOffset;
      context.stroke();
      context.setLineDash([]);
      context.shadowBlur = 0;
    };

    const drawEyeAura = (eye: Point, intensity: number) => {
      context.save();
      context.translate(eye.x, eye.y);
      context.scale(1, 0.46);
      const aura = context.createRadialGradient(0, 0, 0, 0, 0, 42);
      aura.addColorStop(0, `rgba(250, 236, 255, ${0.55 * intensity})`);
      aura.addColorStop(0.16, `rgba(213, 157, 255, ${0.5 * intensity})`);
      aura.addColorStop(0.46, `rgba(144, 66, 255, ${0.25 * intensity})`);
      aura.addColorStop(1, "rgba(103, 41, 255, 0)");
      context.fillStyle = aura;
      context.beginPath();
      context.arc(0, 0, 42, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const render = (time: number) => {
      const morphDuration = 260;
      const rawProgress = Math.min(1, (time - morphStartedAt) / morphDuration);
      const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
      const left = blendBolt(leftFrom, leftTo, progress);
      const right = blendBolt(rightFrom, rightTo, progress);

      if (rawProgress >= 1 && !reducedMotion) {
        leftFrom = leftTo;
        leftTo = makeBolt("left");
        rightFrom = rightTo;
        rightTo = makeBolt("right");
        morphStartedAt = time;
      }

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.save();
      context.scale(width / designWidth, height / designHeight);
      context.globalCompositeOperation = "lighter";
      context.lineCap = "round";
      context.lineJoin = "round";

      const slowPulse = reducedMotion
        ? 0.62
        : 0.62 + Math.sin(time * 0.0042) * 0.13 + Math.sin(time * 0.0097) * 0.07;

      [left, right].forEach((bolt, index) => {
        const phase = index === 0 ? 0 : Math.PI * 0.18;
        const intensity = slowPulse + Math.sin(time * 0.005 + phase) * 0.05;
        strokeBolt(
          bolt,
          19,
          `rgba(123, 42, 255, ${0.12 * intensity})`,
          `rgba(103, 32, 255, ${0.065 * intensity})`,
          34,
          "rgba(126, 48, 255, 0.82)",
        );
        strokeBolt(
          bolt,
          6.5,
          `rgba(207, 125, 255, ${0.48 * intensity})`,
          `rgba(143, 62, 255, ${0.28 * intensity})`,
          17,
          "rgba(167, 69, 255, 0.9)",
        );
        strokeBolt(
          bolt,
          1.35,
          `rgba(255, 239, 255, ${0.92 * intensity})`,
          `rgba(215, 158, 255, ${0.66 * intensity})`,
          5,
          "rgba(232, 191, 255, 0.9)",
        );
        if (!reducedMotion) {
          strokeBolt(
            bolt,
            2.1,
            "rgba(255, 250, 255, 0.92)",
            "rgba(225, 181, 255, 0.48)",
            8,
            "rgba(220, 166, 255, 0.92)",
            [19, 47, 8, 38],
            -time * 0.075,
          );
        }
        drawEyeAura(eyePositions[bolt.side], intensity);
      });

      context.restore();
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(render);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    if (reducedMotion) render(performance.now());
    else animationFrame = window.requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  function setMotionTarget(event: ReactPointerEvent<HTMLDivElement>) {
    const deck = deckRef.current;
    if (!deck) return;
    const bounds = deck.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
    motionRef.current.targetX = Math.max(-1, Math.min(1, x));
    motionRef.current.targetY = Math.max(-1, Math.min(1, y));
    motionRef.current.pointerType = event.pointerType;
  }

  function enterDeck(event: ReactPointerEvent<HTMLDivElement>) {
    motionRef.current.hovering = true;
    setMotionTarget(event);
  }

  function moveDeck(event: ReactPointerEvent<HTMLDivElement>) {
    if (!motionRef.current.hovering && !motionRef.current.dragging) return;
    const motion = motionRef.current;
    if (motion.dragging) {
      const deltaX = event.clientX - motion.lastPointerX;
      const deltaY = event.clientY - motion.lastPointerY;
      const sensitivity = event.pointerType === "touch" ? 0.48 : 0.62;
      motion.targetRotationY += deltaX * sensitivity;
      motion.targetRotationX -= deltaY * sensitivity;
      motion.velocityY = deltaX * sensitivity * 0.72;
      motion.velocityX = -deltaY * sensitivity * 0.72;
      motion.lastPointerX = event.clientX;
      motion.lastPointerY = event.clientY;
    }
    setMotionTarget(event);
  }

  function pressDeck(event: ReactPointerEvent<HTMLDivElement>) {
    motionRef.current.dragging = true;
    motionRef.current.pointerType = event.pointerType;
    motionRef.current.lastPointerX = event.clientX;
    motionRef.current.lastPointerY = event.clientY;
    motionRef.current.velocityX = 0;
    motionRef.current.velocityY = 0;
    deckRef.current?.setPointerCapture(event.pointerId);
    deckRef.current?.classList.add("character-deck--dragging");
    setMotionTarget(event);
  }

  function releaseDeck(event: ReactPointerEvent<HTMLDivElement>) {
    motionRef.current.dragging = false;
    motionRef.current.targetX = 0;
    motionRef.current.targetY = 0;
    deckRef.current?.classList.remove("character-deck--dragging");
    if (deckRef.current?.hasPointerCapture(event.pointerId)) {
      deckRef.current.releasePointerCapture(event.pointerId);
    }
  }

  function leaveDeck() {
    motionRef.current.hovering = false;
    if (!motionRef.current.dragging) {
      motionRef.current.targetX = 0;
      motionRef.current.targetY = 0;
    }
  }

  return (
    <section
      className="character-lobby"
      id="home"
      ref={sceneRef}
      style={
        {
          "--panel-rx": "0deg",
          "--panel-ry": "0deg",
          "--panel-x": "0px",
          "--panel-y": "0px",
          "--aura-x": "0px",
          "--aura-y": "0px",
          "--ring-x": "0px",
          "--ring-y": "0px",
          "--shine-x": "50%",
          "--shine-y": "42%",
          "--scene-x": "0px",
          "--scene-y": "0px",
        } as DeckStyle
      }
    >
      <div className="character-lobby__world" aria-hidden="true">
        <span className="world-grid" />
        <span className="world-orbit world-orbit--one" />
        <span className="world-orbit world-orbit--two" />
        <span className="world-flare" />
        <span className="world-scan" />
      </div>

      <div className="character-lobby__grid shell">
        <div className="character-copy">
          <p className="character-label">
            <span />
            {label}
          </p>
          <h1>
            <span>{displayTitle}</span>
            <strong>{accentTitle}</strong>
          </h1>
          <p className="character-tagline">{tagline}</p>
          <p className="character-bio">{bio}</p>

          <div className="role-terminal" aria-live="polite">
            <span>&gt;</span>
            <strong key={roleIndex}>{safeRoles[roleIndex]}</strong>
            <i />
          </div>

          <div className="character-actions">
            <a className="deck-button deck-button--primary" href={primaryCta.url}>
              <span>▦</span>
              {primaryCta.text}
            </a>
            <a className="deck-button deck-button--portal" href={secondaryCta.url}>
              <span>＋</span>
              {secondaryCta.text}
            </a>
            <a className="deck-button deck-button--quiet" href="#contact">
              <span>✉</span>
              Contact
            </a>
          </div>

          {links.length ? (
            <div className="character-uplinks">
              <small>Channel uplinks:</small>
              <div>
                {links.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                    <span>{link.icon_text}</span>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="character-deck"
          ref={deckRef}
          onPointerEnter={enterDeck}
          onPointerMove={moveDeck}
          onPointerLeave={leaveDeck}
          onPointerDown={pressDeck}
          onPointerUp={releaseDeck}
          onPointerCancel={releaseDeck}
          data-cursor="inspect"
          aria-label="Interactive character interface. Move or drag to inspect."
        >
          <span className="deck-aura" />
          <span className="deck-ring deck-ring--outer" />
          <span className="deck-ring deck-ring--inner" />
          <span className="deck-reticle" />
          <div className="character-frame">
            <div className="frame-particles" aria-hidden="true" />
            <Image
              src={imageUrl}
              alt={`${displayTitle} character portrait`}
              width={1086}
              height={1448}
              quality={95}
              sizes="(max-width: 700px) 74vw, (max-width: 1100px) 72vw, 548px"
              priority
              draggable={false}
            />
            <canvas
              ref={eyeEnergyRef}
              className="frame-eye-energy"
              aria-hidden="true"
            />
            <span className="frame-eye-power" aria-hidden="true" />
            <span className="frame-grade" />
            <span className="frame-scan" />
            <span className="frame-shine" />
          </div>
          <div className="character-node character-node--region">
            <span>Region</span>
            <strong>{region}</strong>
          </div>
        </div>
      </div>

      <div className="character-status shell">
        <span>SB // CHARACTER INTERFACE</span>
        <strong>{statusText}</strong>
        <a href="#about">Scroll to initialise ↓</a>
      </div>
    </section>
  );
}
