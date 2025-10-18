const roleSelect = document.getElementById("role");
const areaGroup = document.getElementById("areaGroup");

roleSelect.addEventListener("change", function () {
  if (this.value === "technician") {
    areaGroup.style.display = "block";
    document.getElementById("area").required = true;
  } else {
    areaGroup.style.display = "none";
    document.getElementById("area").required = false;
  }
});
