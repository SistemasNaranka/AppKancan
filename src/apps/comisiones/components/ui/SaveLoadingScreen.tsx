import React from 'react';

interface SaveLoadingScreenProps {
  showSaveLoading: boolean;
  saveSuccess: boolean;
  saveError: boolean;
}

export const SaveLoadingScreen: React.FC<SaveLoadingScreenProps> = ({ 
  showSaveLoading, 
  saveSuccess, 
  saveError 
}) => {
  if (!showSaveLoading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        backgroundColor: saveSuccess
          ? "#4caf50"
          : saveError
            ? "#f44336"
            : "#2196f3",
        color: "white",
        padding: "8px 16px",
        borderRadius: 4,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      {saveSuccess ? (
        <>
          <span style={{ fontSize: 16 }}>✓</span>
          Guardado correctamente
        </>
      ) : saveError ? (
        <>
          <span style={{ fontSize: 16 }}>✕</span>
          Error al guardar
        </>
      ) : (
        <>
          <span className="animate-spin" style={{ display: "inline-block", fontSize: 16 }}>
            ⟳
          </span>
          Guardando...
        </>
      )}
    </div>
  );
};