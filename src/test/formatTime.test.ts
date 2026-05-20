import { describe, it, expect } from "vitest";
import { formatTime } from "../apps/gestion_proyectos/lib/calculos";

describe("formatTime", () => {
    it("debe retornar segundos si es menor a 60", () => {
        expect(formatTime(59)).toBe("59s");
    });                                                                          /*2h 46min 40s*/

    it("deber retornar minutos y segundo si es mayor a 60", () => {
        expect(formatTime(200)).toBe("3m 20s");
    });

    it("debe retornar horas minutos y segundos si es mayor a 3600", () => {
        expect(formatTime(10000)).toBe("2h 46m 40s");
    });

    it("debe retornar 0 segundos", () => {
        expect(formatTime(0)).toBe("0s");
    });
});