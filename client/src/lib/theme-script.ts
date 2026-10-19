export const THEME_KEY = "dd_theme";

/**
 * Runs in <head> before the page paints, so a saved dark theme doesn't flash light.
 * Keep it in step with applyTheme in theme.ts. Lives outside that client module so
 * the root layout (a server component) gets the string itself.
 */
export const themeScript = `(()=>{try{var t=localStorage.getItem("${THEME_KEY}");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
