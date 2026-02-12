import { Box, Typography, Paper } from "@mui/material";
import WavingHandIcon from "@mui/icons-material/WavingHand";

/**
 * Componente de mensaje de bienvenida reutilizable
 */
export default function WelcomeMessage() {
    return (
        <Paper
            elevation={3}
            sx={{
                p: { xs: 4, sm: 6, md: 8 },
                borderRadius: 4,
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                maxWidth: 700,
                width: "100%",
                mx: "auto",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.12)",
                },
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    textAlign: "center",
                }}
            >
                {/* Icono animado */}
                <Box
                    sx={{
                        position: "relative",
                        display: "inline-flex",
                        animation: "wave 2s ease-in-out infinite",
                        "@keyframes wave": {
                            "0%, 100%": { transform: "rotate(0deg)" },
                            "10%, 30%": { transform: "rotate(14deg)" },
                            "20%": { transform: "rotate(-8deg)" },
                            "40%": { transform: "rotate(-4deg)" },
                            "50%": { transform: "rotate(10deg)" },
                            "60%": { transform: "rotate(0deg)" },
                        },
                    }}
                >
                    <WavingHandIcon
                        sx={{
                            fontSize: { xs: 72, sm: 96 },
                            color: "#FFB74D",
                            filter: "drop-shadow(0 4px 8px rgba(255, 183, 77, 0.3))",
                        }}
                    />
                </Box>

                {/* Mensaje de bienvenida */}
                <Box sx={{ mt: 2 }}>
                    <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            mb: 2,
                            fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem" },
                            background: "linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        ¡Hola Silvia!
                    </Typography>

                    <Typography
                        variant="h5"
                        sx={{
                            color: "text.secondary",
                            fontWeight: 500,
                            mb: 1,
                            fontSize: { xs: "1.1rem", sm: "1.3rem", md: "1.5rem" },
                            lineHeight: 1.6,
                        }}
                    >
                        ¿Cómo estás?
                    </Typography>

                    <Typography
                        variant="h6"
                        sx={{
                            color: "text.secondary",
                            fontWeight: 400,
                            fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
                            lineHeight: 1.8,
                            mt: 3,
                        }}
                    >
                        ¿En qué podemos ayudarte el día de hoy?
                    </Typography>
                </Box>

                {/* Decoración adicional */}
                <Box
                    sx={{
                        mt: 4,
                        width: "100%",
                        height: 4,
                        borderRadius: 2,
                        background:
                            "linear-gradient(90deg, #1976d2 0%, #9c27b0 50%, #1976d2 100%)",
                        backgroundSize: "200% 100%",
                        animation: "gradient 3s ease infinite",
                        "@keyframes gradient": {
                            "0%": { backgroundPosition: "0% 50%" },
                            "50%": { backgroundPosition: "100% 50%" },
                            "100%": { backgroundPosition: "0% 50%" },
                        },
                    }}
                />
            </Box>
        </Paper>
    );
}
