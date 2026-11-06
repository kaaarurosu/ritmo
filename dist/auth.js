"use strict";

const SUPABASE_URL = "https://dxopgqakugyuakujrvxs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qdhAFzxtzJGkzGoaYwYcxg_vKpbVakN";
const authClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const authScreen = document.querySelector("#auth-screen");
const app = document.querySelector(".app");
const authForm = document.querySelector("#auth-form");
const authSubmit = document.querySelector(".auth-submit");
const authSwitch = document.querySelector("#auth-switch");
const authMessage = document.querySelector("#auth-message");
let signUpMode = false;

function showMessage(message, error = false) {
  authMessage.textContent = message;
  authMessage.classList.toggle("error", error);
}

function updateUser(user) {
  if (!user) return;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Mi espacio";
  document.querySelector("#user-name").textContent = name;
  document.querySelector("#user-email").textContent = user.email || "Sesión activa";
  document.querySelector("#user-avatar").textContent = name.charAt(0).toUpperCase();
}

function setAuthenticated(session) {
  const signedIn = Boolean(session?.user);
  authScreen.hidden = signedIn;
  app.hidden = !signedIn;
  if (signedIn) updateUser(session.user);
}

authSwitch.addEventListener("click", () => {
  signUpMode = !signUpMode;
  authSubmit.textContent = signUpMode ? "Crear cuenta" : "Iniciar sesión";
  authSwitch.textContent = signUpMode ? "¿Ya tienes cuenta? Iniciar sesión" : "¿No tienes cuenta? Crear una";
  document.querySelector('[name="password"]').autocomplete = signUpMode ? "new-password" : "current-password";
  showMessage("");
});

document.querySelector("#google-login").addEventListener("click", async () => {
  showMessage("Abriendo Google…");
  const { error } = await authClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin }
  });
  if (error) showMessage(error.message, true);
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = authForm.elements.email.value.trim();
  const password = authForm.elements.password.value;
  authSubmit.disabled = true;
  showMessage(signUpMode ? "Creando tu cuenta…" : "Iniciando sesión…");
  const result = signUpMode
    ? await authClient.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    : await authClient.auth.signInWithPassword({ email, password });
  authSubmit.disabled = false;
  if (result.error) {
    showMessage(result.error.message, true);
  } else if (signUpMode && !result.data.session) {
    showMessage("Cuenta creada. Revisa tu correo para confirmarla.");
  }
});

document.querySelector("#logout").addEventListener("click", () => authClient.auth.signOut());
authClient.auth.onAuthStateChange((_event, session) => setAuthenticated(session));
authClient.auth.getSession().then(({ data }) => setAuthenticated(data.session));
