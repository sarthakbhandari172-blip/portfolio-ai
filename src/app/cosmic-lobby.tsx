"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
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
  characterClass: string;
  region: string;
  systemState: string;
  statusText: string;
  links: HeroLink[];
};

type DeckStyle = CSSProperties & {
  "--deck-rx": string;
  "--deck-ry": string;
  "--deck-x": string;
  "--deck-y": string;
  "--scene-x": string;
  "--scene-y": string;
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
  characterClass,
  region,
  systemState,
  statusText,
  links,
}: CharacterDeckProps) {
  const sceneRef = useRef<HTMLElement>(null);
  const safeRoles = roles.length ? roles : ["Digital Creative"];
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRoleIndex((current) => (current + 1) % safeRoles.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [safeRoles.length]);

  function moveDeck(event: PointerEvent<HTMLElement>) {
    const scene = sceneRef.current;
    if (!scene) return;
    const bounds = scene.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    scene.style.setProperty("--deck-rx", `${y * -5}deg`);
    scene.style.setProperty("--deck-ry", `${x * 7}deg`);
    scene.style.setProperty("--deck-x", `${x * 13}px`);
    scene.style.setProperty("--deck-y", `${y * 10}px`);
    scene.style.setProperty("--scene-x", `${x * -20}px`);
    scene.style.setProperty("--scene-y", `${y * -14}px`);
  }

  function resetDeck() {
    const scene = sceneRef.current;
    if (!scene) return;
    ["--deck-rx", "--deck-ry"].forEach((property) =>
      scene.style.setProperty(property, "0deg"),
    );
    ["--deck-x", "--deck-y", "--scene-x", "--scene-y"].forEach((property) =>
      scene.style.setProperty(property, "0px"),
    );
  }

  return (
    <section
      className="character-lobby"
      id="home"
      ref={sceneRef}
      onPointerMove={moveDeck}
      onPointerLeave={resetDeck}
      style={
        {
          "--deck-rx": "0deg",
          "--deck-ry": "0deg",
          "--deck-x": "0px",
          "--deck-y": "0px",
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

        <div className="character-deck">
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
              priority
            />
            <span className="frame-grade" />
            <span className="frame-scan" />
            <i className="frame-bracket frame-bracket--tl" />
            <i className="frame-bracket frame-bracket--tr" />
            <i className="frame-bracket frame-bracket--bl" />
            <i className="frame-bracket frame-bracket--br" />
          </div>
          <div className="character-node character-node--class">
            <span>Class</span>
            <strong>{characterClass}</strong>
          </div>
          <div className="character-node character-node--region">
            <span>Region</span>
            <strong>{region}</strong>
          </div>
          <div className="character-node character-node--state">
            <span className="node-pulse" />
            <strong>{systemState}</strong>
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
