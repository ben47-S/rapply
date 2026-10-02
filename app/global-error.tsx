"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#12161F", color: "#ECE6D6" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "24rem",
              background: "#1A2130",
              border: "1px solid #2E3850",
              borderRadius: "0.375rem",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>
              Une erreur est survenue
            </p>
            <p style={{ fontSize: "0.875rem", color: "#9CA3B8", marginBottom: "1.5rem" }}>
              Vérifie ta connexion, puis réessaie.
            </p>
            <button
              onClick={reset}
              style={{
                width: "100%",
                border: "1px solid #C89B3C",
                color: "#C89B3C",
                background: "transparent",
                padding: "0.625rem",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
