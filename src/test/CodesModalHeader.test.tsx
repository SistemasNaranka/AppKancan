import { render, screen } from "@testing-library/react";
import { CodesModalHeader } from "../apps/comisiones/components/modals/CodesModal.parts";
import { expect } from "vitest";

describe("CodesModalHeader", () => {
    const tienda = {id: 1, name: "Tienda Centro", ultra_code: 1001, company: "ABC"};
    render(<CodesModalHeader tiendaUsuario={tienda} fechaActual="2025-05-14" />)
    expect(screen.getByText(/Tienda Centro/i)).toBeInTheDocument();
});