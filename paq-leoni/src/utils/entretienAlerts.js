import Swal from "sweetalert2";

const baseButtonColor = "#0064c8";

export const entretienToast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
});

export const showSuccessToast = (title, text = "") =>
  entretienToast.fire({
    icon: "success",
    title,
    text,
  });

export const showInfoToast = (title, text = "") =>
  entretienToast.fire({
    icon: "info",
    title,
    text,
  });

export const showErrorAlert = (title, text = "") =>
  Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: baseButtonColor,
  });

export const showSuccessAlert = (title, text = "") =>
  Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: baseButtonColor,
  });

export const showConfirmAlert = ({
  title,
  text = "",
  icon = "warning",
  confirmButtonText = "Confirmer",
  cancelButtonText = "Annuler",
}) =>
  Swal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: baseButtonColor,
    reverseButtons: true,
  });

export const showPasswordPrompt = ({
  title = "Réinitialiser le mot de passe",
  text = "Saisissez le nouveau mot de passe.",
  confirmButtonText = "Valider",
  cancelButtonText = "Annuler",
} = {}) =>
  Swal.fire({
    icon: "question",
    title,
    text,
    input: "password",
    inputLabel: "Nouveau mot de passe",
    inputPlaceholder: "Entrez le nouveau mot de passe",
    inputAttributes: {
      autocapitalize: "off",
      autocorrect: "off",
    },
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: baseButtonColor,
    cancelButtonColor: "#94a3b8",
    reverseButtons: true,
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return "Veuillez entrer un mot de passe valide.";
      }
      return undefined;
    },
  });
