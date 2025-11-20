import React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  LinearProgress,
  Skeleton,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
  variant?: "circular" | "linear" | "skeleton";
  fullScreen?: boolean;
  skeletonItems?: number;
}

const LoadingContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "fullScreen",
})<{ fullScreen?: boolean }>(({ theme, fullScreen }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2),
  ...(fullScreen && {
    minHeight: "100vh",
    width: "100%",
  }),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: 16,
  boxShadow: theme.shadows[4],
  minWidth: 280,
}));

const SkeletonContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Cargando...",
  size = "medium",
  variant = "circular",
  fullScreen = false,
  skeletonItems = 3,
}) => {
  const theme = useTheme();

  const getSize = () => {
    switch (size) {
      case "small":
        return 32;
      case "large":
        return 64;
      default:
        return 48;
    }
  };

  const renderContent = () => {
    switch (variant) {
      case "linear":
        return (
          <Box sx={{ width: "100%", maxWidth: 400 }}>
            <LinearProgress
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.grey[200],
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, textAlign: "center" }}
            >
              {message}
            </Typography>
          </Box>
        );

      case "skeleton":
        return (
          <SkeletonContainer>
            {Array.from({ length: skeletonItems }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={60}
                sx={{
                  borderRadius: 2,
                  animationDelay: `${index * 0.1}s`,
                }}
              />
            ))}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", mt: 1 }}
            >
              {message}
            </Typography>
          </SkeletonContainer>
        );

      default: // circular
        return (
          <>
            <CircularProgress
              size={getSize()}
              thickness={4}
              sx={{
                color: theme.palette.primary.main,
                "& .MuiCircularProgress-circle": {
                  strokeLinecap: "round",
                },
              }}
            />
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                textAlign: "center",
                fontWeight: 500,
                maxWidth: 300,
              }}
            >
              {message}
            </Typography>
          </>
        );
    }
  };

  if (fullScreen) {
    return (
      <LoadingContainer fullScreen>
        <StyledPaper elevation={8}>{renderContent()}</StyledPaper>
      </LoadingContainer>
    );
  }

  return <LoadingContainer>{renderContent()}</LoadingContainer>;
};

export default LoadingSpinner;
