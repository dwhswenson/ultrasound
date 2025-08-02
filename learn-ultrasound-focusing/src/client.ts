import { initializeUI, updateSpeedDisplay } from "./main.ts";

// Initialize the ultrasound visualization when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeUI();
    updateSpeedDisplay();
  });
} else {
  initializeUI();
  updateSpeedDisplay();
}
