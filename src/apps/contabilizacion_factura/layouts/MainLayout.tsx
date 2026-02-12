import { ReactNode } from "react";
import { Box, Container } from "@mui/material";

interface MainLayoutProps {
    children: ReactNode;
}

/**
 * Layout principal para el módulo de Contabilización de Facturas
 */
export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                py: 3,
            }}
        >
            <Container maxWidth="xl">
                <Box
                    sx={{
                        backgroundColor: "white",
                        borderRadius: 2,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        p: { xs: 2, sm: 3, md: 4 },
                    }}
                >
                    {children}
                </Box>
            </Container>
        </Box>
    );
}
