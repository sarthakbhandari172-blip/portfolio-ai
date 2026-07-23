"use client";

import Image from "next/image";
import { useRef, type CSSProperties, type PointerEvent } from "react";

type HeroLink = {
  id: number;
  label: string;
  url: string;
  icon_text: string;
};

type CosmicLobbyProps = {
  fullName: string;
  location: string;
  tagline: string;
  bio: string;
  links: HeroLink[];
};

type LobbyStyle = CSSProperties & {
  "--pointer-x": string;
  "--pointer-y": string;
  "--tilt-x": string;
  "--tilt-y": string;
  "--copy-x": string;
  "--copy-y": string;
  "--nebula-x": string;
  "--nebula-y": string;
};

export function CosmicLobby({
  fullName,
  location,
  tagline,
  bio,
  links,
}: CosmicLobbyProps) {
  const lobbyRef = useRef<HTMLElement>(null);
  const [firstName, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ") || "Bhandari";

  function updatePerspective(event: PointerEvent<HTMLElement>) {
    const lobby = lobbyRef.current;
    if (!lobby) return;

    const bounds = lobby.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    lobby.style.setProperty("--pointer-x", `${x * 100}%`);
    lobby.style.setProperty("--pointer-y", `${y * 100}%`);
    lobby.style.setProperty("--tilt-x", `${(0.5 - y) * 7}deg`);
    lobby.style.setProperty("--tilt-y", `${(x - 0.5) * 9}deg`);
    lobby.style.setProperty("--copy-x", `${(0.5 - x) * 14}px`);
    lobby.style.setProperty("--copy-y", `${(0.5 - y) * 10}px`);
    lobby.style.setProperty("--nebula-x", `${(0.5 - x) * 30}px`);
    lobby.style.setProperty("--nebula-y", `${(0.5 - y) * 22}px`);
  }

  function resetPerspective() {
    const lobby = lobbyRef.current;
    if (!lobby) return;
    lobby.style.setProperty("--pointer-x", "62%");
    lobby.style.setProperty("--pointer-y", "42%");
    lobby.style.setProperty("--tilt-x", "0deg");
    lobby.style.setProperty("--tilt-y", "0deg");
    lobby.style.setProperty("--copy-x", "0px");
    lobby.style.setProperty("--copy-y", "0px");
    lobby.style.setProperty("--nebula-x", "0px");
    lobby.style.setProperty("--nebula-y", "0px");
  }

  return (
    <section
      className="cosmic-lobby shell"
      id="home"
      ref={lobbyRef}
      onPointerMove={updatePerspective}
      onPointerLeave={resetPerspective}
      style={
        {
          "--pointer-x": "62%",
          "--pointer-y": "42%",
          "--tilt-x": "0deg",
          "--tilt-y": "0deg",
          "--copy-x": "0px",
          "--copy-y": "0px",
          "--nebula-x": "0px",
          "--nebula-y": "0px",
        } as LobbyStyle
      }
    >
      <div className="lobby-depth" aria-hidden="true">
        <div className="lobby-nebula" />
        <div className="lobby-stars lobby-stars-near" />
        <div className="lobby-stars lobby-stars-far" />
        <div className="lobby-horizon" />
        <div className="lobby-scan" />
      </div>

      <div className="lobby-frame" aria-hidden="true">
        <i className="frame-corner frame-corner-tl" />
        <i className="frame-corner frame-corner-tr" />
        <i className="frame-corner frame-corner-bl" />
        <i className="frame-corner frame-corner-br" />
      </div>

      <header className="lobby-telemetry">
        <p>
          <span className="telemetry-pulse" />
          SB // COMMAND LOBBY
        </p>
        <div>
          <span>SECTOR NP-977</span>
          <span>CORE ONLINE</span>
        </div>
      </header>

      <div className="lobby-main">
        <div className="lobby-copy">
          <p className="lobby-kicker">Developer profile // Player 01</p>
          <h1>
            <span>{firstName}</span>
            <strong>{lastName}</strong>
          </h1>
          <div className="lobby-rule">
            <i />
            <span>Interface initialized</span>
          </div>
          <p className="lobby-tagline">{tagline}</p>
          <p className="lobby-bio">{bio}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#work">
              <span>Enter selected work</span>
            </a>
            <a className="button button-secondary" href="#contact">
              <span>Open communication</span>
            </a>
          </div>
          {links.length ? (
            <div className="social-row" aria-label="Featured social links">
              {links.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                  <span>{link.icon_text}</span>
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="avatar-deck" aria-label={`${fullName} profile image`}>
          <div className="deck-orbit deck-orbit-outer">
            <i />
            <i />
            <i />
          </div>
          <div className="deck-orbit deck-orbit-middle" />
          <div className="deck-crosshair deck-crosshair-x" />
          <div className="deck-crosshair deck-crosshair-y" />
          <div className="avatar-energy" />
          <div className="avatar-portal">
            <Image
              src="/media/profile/cosmic-avatar.png"
              alt={fullName}
              width={1085}
              height={1449}
              priority
            />
            <div className="avatar-vignette" />
          </div>
          <div className="deck-label deck-label-origin">
            <span>ORIGIN</span>
            <strong>{location}</strong>
          </div>
          <div className="deck-label deck-label-class">
            <span>CLASS</span>
            <strong>Tech explorer</strong>
          </div>
          <div className="deck-label deck-label-status">
            <span>STATUS</span>
            <strong>Building</strong>
          </div>
        </div>
      </div>

      <footer className="lobby-status">
        <div>
          <span>01 / DOMAIN</span>
          <strong>Software systems</strong>
        </div>
        <div>
          <span>02 / SIGNAL</span>
          <strong>Hardware interfaces</strong>
        </div>
        <div>
          <span>03 / LOOP</span>
          <strong>Learn · Build · Iterate</strong>
        </div>
        <a href="#about">Descend into profile ↓</a>
      </footer>
    </section>
  );
}
