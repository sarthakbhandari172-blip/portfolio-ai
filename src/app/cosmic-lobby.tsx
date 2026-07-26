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
            <svg
              className="frame-eye-filter-defs"
              width="0"
              height="0"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <filter id="eye-aura-distort" x="-8%" y="-35%" width="116%" height="170%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.006 0.022"
                    numOctaves="1"
                    seed="11"
                    result="eyeNoise"
                  >
                    <animate
                      attributeName="baseFrequency"
                      dur="5.4s"
                      values="0.006 0.022;0.009 0.028;0.007 0.019;0.006 0.022"
                      repeatCount="indefinite"
                    />
                  </feTurbulence>
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="eyeNoise"
                    scale="2.2"
                    xChannelSelector="R"
                    yChannelSelector="B"
                  >
                    <animate
                      attributeName="scale"
                      dur="4.6s"
                      values="1.2;3.1;1.7;2.6;1.2"
                      repeatCount="indefinite"
                    />
                  </feDisplacementMap>
                </filter>
              </defs>
            </svg>
            <Image
              className="frame-eye-aura frame-eye-aura--bloom"
              src={imageUrl}
              alt=""
              width={1085}
              height={1449}
              quality={95}
              sizes="(max-width: 700px) 74vw, (max-width: 1100px) 72vw, 548px"
              draggable={false}
              aria-hidden="true"
            />
            <Image
              className="frame-eye-aura frame-eye-aura--core"
              src={imageUrl}
              alt=""
              width={1085}
              height={1449}
              quality={95}
              sizes="(max-width: 700px) 74vw, (max-width: 1100px) 72vw, 548px"
              draggable={false}
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
