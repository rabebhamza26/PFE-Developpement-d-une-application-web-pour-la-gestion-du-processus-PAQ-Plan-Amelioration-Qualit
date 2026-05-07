// src/hooks/usePermissions.js
import { useAuth } from "../context/AuthContext";

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || "";
  const permissions = user?.permissions || [];

  const has = (perm) => permissions.includes(perm);

  return {
    // Rôles
    isSL:         role === "SL",
    isSGL:        role === "SGL",
    isQMSegment:  role === "QM_SEGMENT",
    isQMPlant:    role === "QM_PLANT",
    isHP:         role === "HP",
    isRH:         role === "RH",
    isAdmin:      role === "ADMIN",

    // Entretien Explicatif
    canCreateExplicatif:   has("explicatif:create"),   // SL, SGL
    canUpdateExplicatif:   has("explicatif:update"),   // SL, SGL
    canDeleteExplicatif:   has("explicatif:delete"),   // SL, SGL
    canValidateExplicatif: has("explicatif:validate"),  // SL, SGL
    canReadExplicatif:     has("explicatif:read"),

    // Entretien d'Accord
    canCreateAccord:   has("accord:create"),    // SL
    canUpdateAccord:   has("accord:update"),    // SL
    canDeleteAccord:   has("accord:delete"),    // SL
    canValidateAccord: has("accord:validate"),  // SL, QM_SEGMENT
    canReadAccord:     has("accord:read"),

    // Entretien de Mesure
    canCreateMesure:    has("mesure:create"),    // SL
    canUpdateMesure:    has("mesure:update"),    // SGL
    canDeleteMesure:    has("mesure:delete"),    // SGL
    canValidate1Mesure: has("mesure:validate1"), // QM_SEGMENT
    canValidate2Mesure: has("mesure:validate2"), // SGL
    canReadMesure:      has("mesure:read"),

    // Entretien de Décision
    canCreateDecision:    has("decision:create"),    // SL
    canUpdateDecision:    has("decision:update"),    // SL
    canDeleteDecision:    has("decision:delete"),
    canValidate1Decision: has("decision:validate1"), // HP, SGL
    canValidate2Decision: has("decision:validate2"), // QM_PLANT
    canReadDecision:      has("decision:read"),

    // Entretien Final
    canCreateFinal:   has("final:create"),    // RH
    canUpdateFinal:   has("final:update"),    // RH
    canDeleteFinal:   has("final:delete"),    // RH
    canValidateFinal: has("final:validate"),  // RH
    canReadFinal:     has("final:read"),

    // Défaut grave
    canNotifyDefautGrave: has("defaut:grave:notify"), // SL, SGL

    // Positif
    canSendPositif:    has("positif:send"),    // SL
    canArchivePositif: has("positif:archive"), // SL
    canReadPositif:    has("positif:read"),
  };
}