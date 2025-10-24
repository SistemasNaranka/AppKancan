import { useEffect, useState } from "react";
import { ToggleButton, ToggleButtonGroup, Box } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

export default function PromotionsViewSelector() {
  const navigate = useNavigate();
  const { vista } = useParams();
  const [selectedView, setSelectedView] = useState(vista || "anual");

  useEffect(() => {
    setSelectedView(vista || "anual");
  }, [vista]);

  const handleChange = (_: any, value: string | null) => {
    if (value) {
      setSelectedView(value);
      navigate(value === "anual" ? "/promociones" : `/promociones/${value}`);
    }
  };

  return (
    <Box display="flex" justifyContent="center" mb={2}>
      <ToggleButtonGroup
        color="primary"
        value={selectedView}
        exclusive
        onChange={handleChange}
        size="small"
      >
        <ToggleButton value="anual">Vista Anual</ToggleButton>
        <ToggleButton value="mensual">Vista Mensual</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
