import React, { useEffect } from "react";

export const AZUL_INSTITUCIONAL = "#004680";
export const AZUL_FOCO = "#008CFF";

export const fakeFieldStyle = (
  isActive: boolean,
  extraStyles?: React.CSSProperties
): React.CSSProperties => ({
  boxSizing: "border-box",
  width: "100%",
  borderRadius: 8,
  backgroundColor: "#ffffff",
  transition: "all 0.15s ease-in-out",
  border: isActive ? `3px solid ${AZUL_FOCO}` : "1px solid #cbd5e1",
  boxShadow: isActive
    ? "0 0 0 3px rgba(0, 140, 255, 0.25), 0 4px 12px rgba(0, 140, 255, 0.15)"
    : "none",
  position: "relative",
  zIndex: isActive ? 10 : 1,
  pointerEvents: "none",
  ...extraStyles,
});

export const FakeCancelButton: React.FC<{ label?: string }> = ({ label = "Cancelar" }) => (
  <div
    style={{
      padding: "6px 16px",
      borderRadius: 8,
      border: "1px solid #cbd5e1",
      color: "#475569",
      fontWeight: 600,
      fontSize: "0.875rem",
      letterSpacing: "0.02857em",
      cursor: "not-allowed",
      textTransform: "uppercase",
      userSelect: "none",
    }}
  >
    {label}
  </div>
);

export const FakePrimaryButton: React.FC<{ label?: string }> = ({ label = "Guardar" }) => (
  <div
    style={{
      padding: "6px 22px",
      borderRadius: 8,
      backgroundColor: AZUL_INSTITUCIONAL,
      color: "#fff",
      fontWeight: 600,
      fontSize: "0.875rem",
      letterSpacing: "0.02857em",
      cursor: "not-allowed",
      textTransform: "uppercase",
      boxShadow:
        "0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)",
      userSelect: "none",
    }}
  >
    {label}
  </div>
);

interface GenericTourModalProps {
  title: string;
  subtitle?: string;
  avatar?: string;
  headerBg?: string;
  maxWidth?: number;
  dimContent?: boolean;
  dimFooter?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const GenericTourModal: React.FC<GenericTourModalProps> = ({
  title,
  subtitle,
  avatar,
  headerBg = AZUL_INSTITUCIONAL,
  maxWidth = 600,
  dimContent = false,
  dimFooter = true,
  footer,
  children,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: 9000,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        touchAction: "none",
        overscrollBehavior: "contain",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "85vh",
          backgroundColor: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow:
            "0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)",
          margin: 16,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            backgroundColor: headerBg,
            color: "#fff",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            position: "relative",
            zIndex: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {avatar && (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  flexShrink: 0,
                }}
              >
                {avatar}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.2 }}>
                {title}
              </div>
              {subtitle && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 2,
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.7,
              flexShrink: 0,
              cursor: "not-allowed",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </div>
        </div>

        <div
          style={{
            padding: 24,
            overflowY: "hidden",
            flex: 1,
            borderBottom: footer ? "1px solid rgba(0, 0, 0, 0.12)" : "none",
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            style={{
              padding: "16px 24px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
              backgroundColor: "#f8fafc",
              position: "relative",
              zIndex: dimFooter ? 4 : 6,
            }}
          >
            {footer}
          </div>
        )}

        {dimContent && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              zIndex: 5,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default GenericTourModal;