// src/hooks/useEmails.js
import { useState, useEffect } from "react";
import { userService } from "../services/api";

/**
 * Charge les emails depuis la base de données via le backend.
 * type: "all" | "sl"
 */
export function useEmails(type = "all") {
  const [emailsList, setEmailsList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingEmails(true);
      try {
        const res = type === "sl"
          ? await userService.getSlEmails()
          : await userService.getAllEmails();
        setEmailsList(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Erreur chargement emails:", err);
        setEmailsList([]);
      } finally {
        setLoadingEmails(false);
      }
    };
    load();
  }, [type]);

  return { emailsList, loadingEmails };
}