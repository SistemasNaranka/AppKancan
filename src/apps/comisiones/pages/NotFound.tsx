import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button,
  Container,
  useTheme
} from "@mui/material";
import { 
  Home as HomeIcon, 
  ErrorOutline as ErrorIcon 
} from "@mui/icons-material";

export default function NotFound() {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[100]} 100%)`,
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Card 
          sx={{ 
            width: '100%',
            maxWidth: 500,
            mx: 'auto',
            boxShadow: theme.shadows[8],
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    inset: 0, 
                    backgroundColor: theme.palette.error.light,
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }} 
                />
                <ErrorIcon 
                  sx={{ 
                    position: 'relative',
                    fontSize: 64, 
                    color: theme.palette.error.main 
                  }} 
                />
              </Box>
            </Box>

            <Typography 
              variant="h1" 
              component="h1" 
              sx={{ 
                fontSize: '4rem', 
                fontWeight: 'bold', 
                color: theme.palette.text.primary,
                mb: 1,
                lineHeight: 1
              }}
            >
              404
            </Typography>

            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontSize: '1.5rem', 
                fontWeight: 'semibold', 
                color: theme.palette.text.secondary,
                mb: 2
              }}
            >
              Page Not Found
            </Typography>

            <Typography 
              variant="body1" 
              sx={{ 
                color: theme.palette.text.secondary,
                mb: 4,
                lineHeight: 1.6
              }}
            >
              Sorry, the page you are looking for doesn't exist.
              <br />
              It may have been moved or deleted.
            </Typography>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              gap: 2, 
              justifyContent: 'center' 
            }}>
              <Button
                onClick={handleGoHome}
                variant="contained"
                size="large"
                startIcon={<HomeIcon />}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Go Home
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
