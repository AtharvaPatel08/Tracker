import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import './BubbleMenu.css';

const BubbleMenu = ({
  logo,
  items = [],
  menuAriaLabel = "Toggle navigation",
  menuBg = "rgba(10, 10, 10, 0.85)",
  menuContentColor = "#D4AF37",
  useFixedPosition = false,
  animationEase = "back.out(1.7)",
  animationDuration = 0.45,
  staggerDelay = 0.1
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const overlayRef = useRef(null);
  const itemsContainerRef = useRef(null);
  const itemsRef = useRef([]);
  const timelineRef = useRef(null);

  useEffect(() => {
    // Reset refs array to match items length
    itemsRef.current = itemsRef.current.slice(0, items.length);
  }, [items]);

  // Initialize GSAP Timeline for the slide/fade entry and item stagger
  useEffect(() => {
    // Kill existing timeline if any
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const tl = gsap.timeline({ paused: true });

    // Animate overlay transition (opacity and scale/zoom effect)
    tl.to(overlayRef.current, {
      opacity: 1,
      scale: 1,
      duration: animationDuration,
      ease: animationEase,
    });

    // Animate items inside overlay with stagger
    const validItems = itemsRef.current.filter(Boolean);
    if (validItems.length > 0) {
      tl.fromTo(
        validItems,
        {
          opacity: 0,
          scale: 0.8,
          y: 20
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: animationDuration * 0.8,
          ease: "power2.out",
          stagger: staggerDelay
        },
        "-=0.2" // slight overlap with overlay expansion
      );
    }

    timelineRef.current = tl;

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [animationDuration, animationEase, staggerDelay, items]);

  // Trigger GSAP timeline on isOpen change
  useEffect(() => {
    if (!timelineRef.current) return;

    if (isOpen) {
      timelineRef.current.play();
    } else {
      timelineRef.current.reverse();
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleItemClick = (e, onClickCallback) => {
    // Close the menu on item click
    setIsOpen(false);
    if (onClickCallback) {
      onClickCallback(e);
    }
  };

  return (
    <nav
      ref={containerRef}
      className={`bubble-menu bubble-menu-wrapper ${useFixedPosition ? 'fixed-pos' : 'absolute-pos'}`}
      style={{ '--menu-content-color': menuContentColor }}
    >
      {/* TRIGGER BUBBLE TRIGGER */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        aria-label={menuAriaLabel}
        aria-expanded={isOpen}
        className={`bubble bubble-trigger ${isOpen ? 'active' : ''}`}
        style={{ backgroundColor: menuBg }}
      >
        <span className="burger-icon">
          <span className="line line-1" style={{ backgroundColor: menuContentColor }} />
          <span className="line line-2" style={{ backgroundColor: menuContentColor }} />
          <span className="line line-3" style={{ backgroundColor: menuContentColor }} />
        </span>
      </button>

      {/* OVERLAY PANEL */}
      <div
        ref={overlayRef}
        className="bubble-menu-overlay"
        style={{
          backgroundColor: menuBg,
          pointerEvents: isOpen ? 'auto' : 'none',
          opacity: 0,
          transform: 'scale(0.9)'
        }}
      >
        {/* LOGO */}
        {logo && <div className="bubble-menu-logo-wrapper">{logo}</div>}

        {/* MENU ITEMS */}
        <div ref={itemsContainerRef} className="bubble-menu-items">
          {items.map((item, index) => {
            const rot = item.rotation || 0;
            const hBg = item.hoverStyles?.bgColor || '#ffffff';
            const hText = item.hoverStyles?.textColor || '#000000';

            return (
              <a
                key={index}
                ref={el => (itemsRef.current[index] = el)}
                href={item.href}
                aria-label={item.ariaLabel || item.label}
                className="pill-link"
                style={{
                  transform: `rotate(${rot}deg) translateZ(0)`,
                  '--hover-bg': hBg,
                  '--hover-color': hText,
                  color: menuContentColor,
                  borderColor: `${menuContentColor}33`
                }}
                onClick={(e) => handleItemClick(e, item.onClick)}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BubbleMenu;
