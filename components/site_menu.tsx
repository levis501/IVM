"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const menuStyle = {
  position: "absolute" as const,
  top: "6px",
  right: "6px",
  cursor: "pointer",
  color: "#f0f0f0",
  padding: "0px",
  margin: "0px",
};

const overlayStyle = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "flex-start",
  paddingTop: "36px",
  zIndex: 50,
  backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent background to indicate modal state
};

const menuContentStyle = {
  backgroundColor: "#00693f",
  color: "#f0f0f0",
  padding: "0px",
  borderBottomLeftRadius: "8px",
  borderBottomRightRadius: "8px",
  borderLeft: "1px solid #f0f0f0",
  borderRight: "1px solid #f0f0f0",
  borderBottom: "1px solid #f0f0f0",
  minWidth: "200px",
};

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px 20px",
  textAlign: "left",
  color: "#f0f0f0",
  textDecoration: "none",
  borderBottom: "1px solid rgba(240, 240, 240, 0.2)",
  transition: "background-color 0.2s",
};

const menuButtonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px 20px",
  textAlign: "left",
  color: "#f0f0f0",
  backgroundColor: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(240, 240, 240, 0.2)",
  cursor: "pointer",
  font: "inherit",
  transition: "background-color 0.2s",
};

const menuItemHoverStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.1)",
};

const menuInfoStyle: React.CSSProperties = {
  padding: "14px 20px",
  fontSize: "0.9em",
  fontStyle: "italic",
  color: "#d0d0d0",
  borderBottom: "1px solid rgba(240, 240, 240, 0.2)",
};

const menuDividerStyle: React.CSSProperties = {
  margin: "0",
  border: "none",
  borderTop: "2px solid rgba(240, 240, 240, 0.3)",
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0px',
  paddingBottom: '1px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 50
};

const headerImg = {
  width: "100vw",
  height: "36px",
}


const SiteMenu = () => {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Open menu automatically only on fresh login (not every page load)
  useEffect(() => {
    if (status === "authenticated" && session) {
      // Check if this is a fresh login
      const justLoggedIn = sessionStorage.getItem('justLoggedIn');
      if (justLoggedIn === 'true') {
        setIsOpen(true);
        // Clear the flag so menu doesn't auto-open on subsequent page navigations
        sessionStorage.removeItem('justLoggedIn');
      }
    }
  }, [status, session]);

  const toggleMenu = () => {
    console.log('[Menu] Toggle menu, current state:', isOpen);
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    console.log('[Menu] Close menu called');
    setIsOpen(false);
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    console.log('[Menu] Overlay clicked');
    toggleMenu();
  };

  const handleMenuContentClick = (e: React.MouseEvent) => {
    console.log('[Menu] Menu content clicked - preventing close');
    e.stopPropagation();
  };

  const handleLogout = async () => {
    closeMenu();
    await signOut({ callbackUrl: '/' });
  };

  const getMenuItemStyle = (itemKey: string) => ({
    ...menuItemStyle,
    ...(hoveredItem === itemKey ? menuItemHoverStyle : {}),
  });

  const getMenuButtonStyle = (itemKey: string) => ({
    ...menuButtonStyle,
    ...(hoveredItem === itemKey ? menuItemHoverStyle : {}),
  });

  return (
    <header style={headerStyle}>
      <Image
        src="/ivm_green.png"
        alt="ivm"
        width={64}
        height={64}
        style={headerImg}
        priority
      />
      <div style={menuStyle} onClick={toggleMenu} >
        &#9776; Menu
      </div>
      {isOpen && (
        <div style={overlayStyle} onClick={handleOverlayClick}>
          <div style={menuContentStyle} onClick={handleMenuContentClick}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              <li style={{ padding: 0 }}>
                <Link
                  href="/#home"
                  onClick={closeMenu}
                  style={getMenuItemStyle('home')}
                  onMouseEnter={() => setHoveredItem('home')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  Home
                </Link>
              </li>
              <li style={{ padding: 0 }}>
                <Link
                  href="/#floorplans"
                  onClick={closeMenu}
                  style={getMenuItemStyle('floorplans')}
                  onMouseEnter={() => setHoveredItem('floorplans')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  Floor Plans
                </Link>
              </li>
              <li style={{ padding: 0 }}>
                <Link
                  href="/#contact"
                  onClick={closeMenu}
                  style={getMenuItemStyle('contact')}
                  onMouseEnter={() => setHoveredItem('contact')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  Contact
                </Link>
              </li>
              <li style={{ padding: 0 }}><hr style={menuDividerStyle} /></li>
              {status === "loading" ? (
                <li style={{ ...menuInfoStyle, padding: "14px 20px" }}>Loading...</li>
              ) : session ? (
                <>
                  <li style={{ ...menuInfoStyle, borderBottom: "none" }}>
                    Signed in as: {session.user?.firstName} {session.user?.lastName}
                  </li>
                  <li style={{ padding: 0 }}>
                    <button
                      onClick={handleLogout}
                      style={getMenuButtonStyle('logout')}
                      onMouseEnter={() => setHoveredItem('logout')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li style={{ padding: 0 }}>
                  <Link
                    href="/auth/login"
                    onClick={closeMenu}
                    style={getMenuItemStyle('login')}
                    onMouseEnter={() => setHoveredItem('login')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      )
      }
    </header >
  );
}

export default SiteMenu;
