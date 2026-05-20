import { describe, it, expect } from "vitest";
import { getCargoNombreHelper } from "../apps/comisiones/hooks/employeeOperations.utils";
import { DirectusCargo } from "../apps/comisiones/types/modal";

describe("getCargoHelper", () => {
    const cargoDemo: DirectusCargo[] = [
        { id: 1, nombre: "Gerente"},
        {id: 2, nombre: "Vendedor" },
    ];

    it("debe retornar el nombre si el cargo es un objeto con nombre", () => {
        expect(getCargoNombreHelper({nombre: "Gerente"}, cargoDemo)).toBe("Gerente");
    });

    it("si es un numero y existe en el array se retoma con el cargo", () => {
        expect(getCargoNombreHelper(1, cargoDemo)).toBe("Gerente")
    });

    it("Si es un número que no existe en el array se retornar Asesor por default", () => {
        expect(getCargoNombreHelper({id: 4}, cargoDemo)).toBe("Asesor");
    });

    it("Si es otra cosa (string, null..) retorna Asesor por default", () =>{
        expect(getCargoNombreHelper({id: null, nombre: null}, cargoDemo)).toBe("Asesor");
    });


})
