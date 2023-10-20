document.addEventListener('DOMContentLoaded', function() {
  const checkbox = document.getElementById("checkbox");
  if (checkbox) {
    checkbox.addEventListener("change", () => {
      document.body.classList.toggle("dark");
    });
  } else {
    console.error("Checkbox element not found");
  }
});
