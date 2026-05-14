// src/hooks/usePermissions.js
import { useAuth } from "../context/AuthContext";

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || "";
  const permissions = user?.permissions || [];

  const has = (perm) => permissions.includes(perm);

  // Vérification des rôles
  const isSL = role === "SL";
  const isSGL = role === "SGL";
  const isQMSegment = role === "QM_SEGMENT";
  const isQMPlant = role === "QM_PLANT";
  const isHP = role === "HP";
  const isRH = role === "RH";
  const isAdmin = role === "ADMIN";

  // ⚠️ Pour l'entretien explicatif, SEULS SL et SGL ont accès
  // ADMIN n'a PAS accès aux entretiens explicatifs
  const canCreateExplicatif = (isSL || isSGL) && has("explicatif:create");
  const canUpdateExplicatif = (isSL || isSGL) && has("explicatif:update");
  const canDeleteExplicatif = (isSL || isSGL) && has("explicatif:delete");
  const canValidateExplicatif = (isSL || isSGL) && has("explicatif:validate");
  const canReadExplicatif = (isSL || isSGL) && has("explicatif:read");

  return {
    // Rôles
    isSL,
    isSGL,
    isQMSegment,
    isQMPlant,
    isHP,
    isRH,
    isAdmin,

    // ========== ENTRETIEN EXPLICATIF (Niveau 1) ==========
    // ⚠️ Seuls SL et SGL (PAS ADMIN)
    canCreateExplicatif,
    canUpdateExplicatif,
    canDeleteExplicatif,
    canValidateExplicatif,
    canReadExplicatif,

    // ========== ENTRETIEN D'ACCORD (Niveau 2) ==========
    canCreateAccord: (isSL ) && has("accord:create"),
    canUpdateAccord: (isSL ) && has("accord:update"),
    canDeleteAccord: (isSL ) && has("accord:delete"),
    canValidateAccord: (isSL || isQMSegment ) && has("accord:validate"),
    canReadAccord: has("accord:read"),

    // ========== ENTRETIEN DE MESURE (Niveau 3) ==========
    canCreateMesure: (isSL ) && has("mesure:create"),
    canUpdateMesure: (isSGL ) && has("mesure:update"),
    canDeleteMesure: (isSGL  ) && has("mesure:delete"),
    canValidate1Mesure: (isQMSegment ) && has("mesure:validate1"),
    canValidate2Mesure: (isSGL ) && has("mesure:validate2"),
    canReadMesure: has("mesure:read"),

    // ========== ENTRETIEN DE DÉCISION (Niveau 4) ==========
    canCreateDecision: (isSL ) && has("decision:create"),
    canUpdateDecision: (isSL  ) && has("decision:update"),
    canDeleteDecision: (isSL  ) && has("decision:delete"),
    canValidate1Decision: (isHP || isSGL ) && has("decision:validate1"),
    canValidate2Decision: (isQMPlant ) && has("decision:validate2"),
    canReadDecision: has("decision:read"),

    // ========== ENTRETIEN FINAL (Niveau 5) ==========
    canCreateFinal: (isRH ) && has("final:create"),
    canUpdateFinal: (isRH ) && has("final:update"),
    canDeleteFinal: (isRH ) && has("final:delete"),
    canValidateFinal: (isRH ) && has("final:validate"),
    canReadFinal: has("final:read"),

    // ========== ENTRETIEN POSITIF ==========
    canSendPositif: (isSL ) && has("positif:send"),
    canArchivePositif: (isSL ) && has("positif:archive"),
    canReadPositif: has("positif:read"),
  };
}