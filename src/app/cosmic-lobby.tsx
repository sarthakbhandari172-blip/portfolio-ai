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

type EnergyPoint = { x: number; y: number };
type EnergyBolt = { main: EnergyPoint[]; branches: EnergyPoint[][] };

const ENERGY_WIDTH = 1085;
const ENERGY_HEIGHT = 1449;

function createEnergyBolt(side: "left" | "right"): EnergyBolt {
  const direction = side === "left" ? -1 : 1;
  const start = side === "left" ? { x: 455, y: 526 } : { x: 620, y: 526 };
  const distance = side === "left" ? 360 : 370;
  const points = 19;
  const main = Array.from({ length: points }, (_, index) => {
    const progress = index / (points - 1);
    const envelope = Math.sin(progress * Math.PI);
    return {
      x:
        start.x +
        direction * distance * progress +
        (Math.random() - 0.5) * 12 * envelope,
      y:
        start.y -
        42 * progress +
        Math.sin(progress * Math.PI * 5.2) * 9 * envelope +
        (Math.random() - 0.5) * 22 * envelope,
    };
  });

  const branches = [5, 9, 13].map((anchorIndex, branchIndex) => {
    const anchor = main[anchorIndex];
    const verticalDirection = branchIndex % 2 === 0 ? -1 : 1;
    return Array.from({ length: 6 }, (_, index) => {
      const progress = index / 5;
      return {
        x:
          anchor.x +
          direction * (72 + branchIndex * 11) * progress +
          (Math.random() - 0.5) * 10 * progress,
        y:
          anchor.y +
          verticalDirection * (48 + branchIndex * 9) * progress +
          Math.sin(progress * Math.PI * 3) * 7 +
          (Math.random() - 0.5) * 12 * progress,
      };
    });
  });

  return { main, branches };
}

function blendPoints(from: EnergyPoint[], to: EnergyPoint[], progress: number) {
  return from.map((point, index) => ({
    x: point.x + (to[index].x - point.x) * progress,
    y: point.y + (to[index].y - point.y) * progress,
  }));
}

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

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrame = 0;
    let morphStartedAt = performance.now();
    let leftFrom = createEnergyBolt("left");
    let leftTo = createEnergyBolt("left");
    let rightFrom = createEnergyBolt("right");
    let rightTo = createEnergyBolt("right");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const bounds = frame.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
    };

    const trace = (
      points: EnergyPoint[],
      lineWidth: number,
      strokeStyle: string,
      shadowBlur = 0,
      shadowColor = "transparent",
    ) => {
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
      context.lineWidth = lineWidth;
      context.strokeStyle = strokeStyle;
      context.shadowBlur = shadowBlur;
      context.shadowColor = shadowColor;
      context.stroke();
      context.shadowBlur = 0;
    };

    const energyPoint = (points: EnergyPoint[], progress: number) => {
      const position = progress * (points.length - 1);
      const index = Math.min(points.length - 2, Math.floor(position));
      const localProgress = position - index;
      return {
        x: points[index].x + (points[index + 1].x - points[index].x) * localProgress,
        y: points[index].y + (points[index + 1].y - points[index].y) * localProgress,
      };
    };

    const render = (time: number) => {
      const morphDuration = 210;
      let progress = Math.min(1, (time - morphStartedAt) / morphDuration);
      const easedProgress = progress * progress * (3 - 2 * progress);

      const left: EnergyBolt = {
        main: blendPoints(leftFrom.main, leftTo.main, easedProgress),
        branches: leftFrom.branches.map((branch, index) =>
          blendPoints(branch, leftTo.branches[index], easedProgress),
        ),
      };
      const right: EnergyBolt = {
        main: blendPoints(rightFrom.main, rightTo.main, easedProgress),
        branches: rightFrom.branches.map((branch, index) =>
          blendPoints(branch, rightTo.branches[index], easedProgress),
        ),
      };

      if (progress >= 1 && !reducedMotion) {
        leftFrom = leftTo;
        leftTo = createEnergyBolt("left");
        rightFrom = rightTo;
        rightTo = createEnergyBolt("right");
        morphStartedAt = time;
        progress = 0;
      }

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.save();
      context.scale(width / ENERGY_WIDTH, height / ENERGY_HEIGHT);
      context.globalCompositeOperation = "lighter";
      context.lineCap = "round";
      context.lineJoin = "round";

      const pulse = reducedMotion ? 0.42 : 0.38 + (Math.sin(time * 0.006) + 1) * 0.12;
      [left, right].forEach((bolt, boltIndex) => {
        trace(
          bolt.main,
          12,
          `rgba(89, 92, 255, ${0.07 * pulse})`,
          24,
          "rgba(93, 115, 255, 0.5)",
        );
        trace(
          bolt.main,
          3.2,
          `rgba(91, 220, 255, ${0.62 * pulse})`,
          10,
          "rgba(95, 226, 255, 0.75)",
        );
        trace(bolt.main, 1.15, `rgba(226, 253, 255, ${0.92 * pulse})`);

        bolt.branches.forEach((branch) => {
          trace(branch, 4.5, `rgba(114, 82, 255, ${0.055 * pulse})`, 12, "#795dff");
          trace(branch, 0.72, `rgba(119, 224, 255, ${0.48 * pulse})`);
        });

        if (!reducedMotion) {
          const travel = ((time / 920 + boltIndex * 0.5) % 1 + 1) % 1;
          const mote = energyPoint(bolt.main, travel);
          const glow = context.createRadialGradient(mote.x, mote.y, 0, mote.x, mote.y, 14);
          glow.addColorStop(0, "rgba(238, 255, 255, 0.9)");
          glow.addColorStop(0.22, "rgba(101, 231, 255, 0.5)");
          glow.addColorStop(1, "rgba(116, 76, 255, 0)");
          context.fillStyle = glow;
          context.beginPath();
          context.arc(mote.x, mote.y, 14, 0, Math.PI * 2);
          context.fill();
        }
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
              width={1085}
              height={1449}
              quality={95}
              sizes="(max-width: 700px) 86vw, (max-width: 1100px) 78vw, 510px"
              priority
              draggable={false}
            />
            <canvas
              ref={eyeEnergyRef}
              className="frame-eye-energy"
              aria-hidden="true"
            />
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
