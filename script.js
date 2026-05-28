let current = "0";
let previous = "";
let operator = "";
let freshInput = false;

const resultEl = document.getElementById("result");
const exprEl = document.getElementById("expr");
const exprScroll = document.getElementById("exprScroll");
const resultScroll = document.getElementById("resultScroll");
const exprLine = document.getElementById("exprLine");
const resultLine = document.getElementById("resultLine");
const opButtons = document.querySelectorAll('.btn.op[data-action="op"]');

function updateScrollFade(scrollEl, lineEl) {
  if (!scrollEl || !lineEl) return;
  const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
  const sl = scrollEl.scrollLeft;
  lineEl.classList.toggle("fade-left", sl > 2);
  lineEl.classList.toggle("fade-right", maxScroll > 2 && sl < maxScroll - 2);
}

function scrollDisplayToEnd() {
  [exprScroll, resultScroll].forEach((el) => {
    if (el) el.scrollLeft = el.scrollWidth;
  });
  updateScrollFade(exprScroll, exprLine);
  updateScrollFade(resultScroll, resultLine);
}

[exprScroll, resultScroll].forEach((el, i) => {
  const line = i === 0 ? exprLine : resultLine;
  el?.addEventListener("scroll", () => updateScrollFade(el, line));
});

window.addEventListener("resize", scrollDisplayToEnd);

function formatDisplay(value) {
  if (value === "Error") return value;
  if (value.endsWith(".")) return value;
  const num = parseFloat(value);
  if (Number.isNaN(num)) return value;
  if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(6).replace(/\.?0+e/, "e");
  }
  const parts = value.split(".");
  if (parts[1]) return value;
  return String(num);
}

function setDisplay(value, animate = true) {
  resultEl.textContent = formatDisplay(value);
  resultEl.classList.toggle("err", value === "Error");
  if (animate && value !== "Error") {
    resultEl.classList.remove("pop");
    void resultEl.offsetWidth;
    resultEl.classList.add("pop");
  }
  requestAnimationFrame(scrollDisplayToEnd);
}

function updateExpr() {
  exprEl.textContent = operator ? `${previous} ${operator}` : "";
  requestAnimationFrame(scrollDisplayToEnd);
}

function setActiveOperator(op) {
  opButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.val === op);
  });
}

function calculate(a, b, op) {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? null : a / b;
    default:
      return b;
  }
}

function resetAfterError() {
  current = "0";
  previous = "";
  operator = "";
  freshInput = false;
  exprEl.textContent = "";
  setActiveOperator("");
  requestAnimationFrame(scrollDisplayToEnd);
}

function handleButton(action, val) {
  if (action === "num") {
    if (freshInput || current === "0") {
      current = val;
      freshInput = false;
    } else if (current.replace(".", "").length < 12) {
      current += val;
    }
    setDisplay(current);
  } else if (action === "dot") {
    if (freshInput) {
      current = "0.";
      freshInput = false;
    } else if (!current.includes(".")) {
      current += ".";
    }
    setDisplay(current, false);
  } else if (action === "op") {
    if (operator && !freshInput) {
      const result = calculate(parseFloat(previous), parseFloat(current), operator);
      if (result === null) {
        setDisplay("Error");
        resetAfterError();
        return;
      }
      previous = String(parseFloat(result.toFixed(10)));
      current = previous;
      setDisplay(current);
    } else {
      previous = current;
    }
    operator = val;
    freshInput = true;
    updateExpr();
    setActiveOperator(val);
  } else if (action === "equals") {
    if (!operator) return;
    const a = parseFloat(previous);
    const b = parseFloat(current);
    exprEl.textContent = `${previous} ${operator} ${current} =`;
    requestAnimationFrame(scrollDisplayToEnd);
    const result = calculate(a, b, operator);
    if (result === null) {
      setDisplay("Error");
      resetAfterError();
      return;
    }
    current = String(parseFloat(result.toFixed(10)));
    setDisplay(current);
    operator = "";
    previous = "";
    freshInput = true;
    setActiveOperator("");
  } else if (action === "clear") {
    current = "0";
    previous = "";
    operator = "";
    freshInput = false;
    setDisplay("0", false);
    exprEl.textContent = "";
    setActiveOperator("");
    requestAnimationFrame(scrollDisplayToEnd);
  } else if (action === "delete") {
    if (current === "Error") {
      resetAfterError();
      setDisplay("0", false);
      return;
    }
    if (freshInput) freshInput = false;
    if (current.length <= 1 || (current.length === 2 && current.startsWith("-"))) {
      current = "0";
    } else {
      current = current.slice(0, -1);
      if (current === "-" || current === "") current = "0";
    }
    setDisplay(current, false);
  } else if (action === "pct") {
    current = String(parseFloat(current) / 100);
    setDisplay(current);
  }
}

document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    handleButton(btn.dataset.action, btn.dataset.val);
  });
});

document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key >= "0" && key <= "9") handleButton("num", key);
  else if (key === ".") handleButton("dot");
  else if (key === "+") handleButton("op", "+");
  else if (key === "-") handleButton("op", "−");
  else if (key === "*") handleButton("op", "×");
  else if (key === "/") {
    e.preventDefault();
    handleButton("op", "÷");
  } else if (key === "Enter" || key === "=") handleButton("equals");
  else if (key === "Escape") handleButton("clear");
  else if (key === "Backspace") {
    e.preventDefault();
    handleButton("delete");
  } else if (key === "%") handleButton("pct");
});
