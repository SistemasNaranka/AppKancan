import { useState, useEffect, useRef } from "react";
import * as yup from "yup";
import {
  checkPdfPassword,
  extractTransactionsFromPdf,
  type PageText,
  type AuditSummary,
} from "../services/pdfExtractor";
import { exportPagesToExcel } from "../services/excelExporter";

const passwordSchema = yup.object({
  password: yup
    .string()
    .required("La contraseña es obligatoria"),
});

export const usePdfConverter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [password, setPassword] = useState<string>("");
  const [openPasswordDialog, setOpenPasswordDialog] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [numPagesTotal, setNumPagesTotal] = useState<number>(0);
  const [suggestedEndPage, setSuggestedEndPage] = useState<number>(0);
  const [isPasswordValidated, setIsPasswordValidated] = useState<boolean>(false);
  const [wasPasswordProtected, setWasPasswordProtected] = useState<boolean>(false);

  const [startPage, setStartPage] = useState<string>("2");
  const [endPageInput, setEndPageInput] = useState<string>("3");
  const [endPageTouched, setEndPageTouched] = useState<boolean>(false);

  const [extractedPages, setExtractedPages] = useState<PageText[]>([]);
  const [audit, setAudit] = useState<AuditSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragCounter = useRef(0);

  const parsePageNumber = (value: string, fallback: number = 1): number => {
    const num = parseInt(value, 10);
    return isNaN(num) || num < 1 ? fallback : num;
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setPasswordError("");
    setPassword("");
    setShowPassword(false);
    setLoading(false);

    // Al cancelar el modal de clave, se descarta el archivo y se vuelve al estado inicial
    if (!isPasswordValidated) {
      setFile(null);
      setFileBuffer(null);
      setWasPasswordProtected(false);
      setSuggestedEndPage(0);
      setNumPagesTotal(0);
      setExtractedPages([]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setErrorMsg("El archivo debe ser un PDF.");
      return;
    }

    setFile(selectedFile);
    setErrorMsg("");
    setExtractedPages([]);
    setPassword("");
    setPasswordError("");
    setShowPassword(false);
    setIsPasswordValidated(false);
    setWasPasswordProtected(false);
    setEndPageTouched(false);
    setSuggestedEndPage(0);

    try {
      const buffer = await selectedFile.arrayBuffer();
      setFileBuffer(buffer);
      const result = await checkPdfPassword(buffer, "");
      setOpenPasswordDialog(false);
      setPasswordError("");
      setNumPagesTotal(result.numPages);
      setSuggestedEndPage(result.suggestedEndPage);
      setIsPasswordValidated(true);
      if (result.numPages > 0) {
        setEndPageInput(String(result.suggestedEndPage));
      }
    } catch (err: any) {
      if (err.name === "PasswordException" || err.message?.includes("password")) {
        setWasPasswordProtected(true);
        setOpenPasswordDialog(true);
        setPasswordError("");
      } else {
        console.error("Error al cargar PDF:", err);
        setErrorMsg("Error al leer el archivo PDF.");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await processSelectedFile(e.target.files[0]);
    e.target.value = "";
  };

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
        dragCounter.current += 1;
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await processSelectedFile(e.dataTransfer.files[0]);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handlePasswordSubmit = async () => {
    if (!fileBuffer) return;
    setPasswordError("");

    try {
      await passwordSchema.validate({ password }, { abortEarly: false });
    } catch (yupErr: any) {
      if (yupErr instanceof yup.ValidationError) {
        setPasswordError(yupErr.errors[0]);
        return;
      }
    }

    setLoading(true);
    try {
      const result = await checkPdfPassword(fileBuffer, password);
      setOpenPasswordDialog(false);
      setPasswordError("");
      setNumPagesTotal(result.numPages);
      setSuggestedEndPage(result.suggestedEndPage);
      setIsPasswordValidated(true);
      if (!endPageTouched && result.numPages > 0) {
        setEndPageInput(String(result.suggestedEndPage));
      }
    } catch (err: any) {
      if (err.name === "PasswordException" || err.message?.includes("password")) {
        setPasswordError("La contraseña ingresada es incorrecta. Intenta nuevamente.");
      } else {
        console.error(err);
        setPasswordError("Error al comprobar la contraseña.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!fileBuffer) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const result = await extractTransactionsFromPdf({
        buffer: fileBuffer,
        password,
        startPage: parsePageNumber(startPage, 1),
        endPage: parsePageNumber(endPageInput, 1),
        knownSuggestedEndPage: suggestedEndPage,
      });
      setOpenPasswordDialog(false);
      setPasswordError("");
      setNumPagesTotal(result.numPagesTotal);
      setExtractedPages(result.pages);
      setAudit(result.audit);
    } catch (err: any) {
      if (err.name === "PasswordException" || err.message?.includes("password")) {
        setOpenPasswordDialog(true);
        setPasswordError("La contraseña ingresada es incorrecta. Intenta nuevamente.");
      } else {
        console.error(err);
        setErrorMsg(`Error procesando el PDF: ${err.message || err}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    const fileName = file
      ? `${file.name.replace(".pdf", "")}_convertido.xlsx`
      : "extracto_contable.xlsx";
    await exportPagesToExcel({ pages: extractedPages, fileName, audit });
  };

  const totalMovimientos = extractedPages.reduce(
    (acc, p) => acc + p.transactions.length,
    0
  );
  const hayResultados = extractedPages.length > 0;

  return {
    file,
    fileBuffer,
    password,
    setPassword,
    openPasswordDialog,
    passwordError,
    showPassword,
    setShowPassword,
    loading,
    numPagesTotal,
    suggestedEndPage,
    isPasswordValidated,
    wasPasswordProtected,
    startPage,
    setStartPage,
    endPageInput,
    setEndPageInput,
    setEndPageTouched,
    extractedPages,
    setExtractedPages,
    audit,
    errorMsg,
    isDragging,
    totalMovimientos,
    hayResultados,
    parsePageNumber,
    handleClosePasswordDialog,
    handleFileChange,
    handlePasswordSubmit,
    handleConvert,
    handleExportToExcel,
  };
};
