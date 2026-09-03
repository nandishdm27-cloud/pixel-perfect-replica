import { createFileRoute } from "@tanstack/react-router";
import { Delete, Eraser, History, Minus, Moon, Plus, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type HistoryItem = { expression: string; result: string };
const operatorLabels = ["÷", "×", "−", "+"] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Calculator — Fast, Focused Calculations" },
      { name: "description", content: "A polished calculator for everyday math with keyboard support and session history." },
      { property: "og:title", content: "My Calculator — Fast, Focused Calculations" },
      { property: "og:description", content: "A polished calculator for everyday math with keyboard support and session history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function formatNumber(value: number) {
  if (!Number.isFinite(value)) throw new Error("Cannot divide by zero");
  return String(Math.abs(value) < 1e-12 ? 0 : Number(value.toPrecision(12)));
}

function evaluateExpression(source: string) {
  const input = source.replaceAll("×", "*").replaceAll("÷", "/").replaceAll("−", "-");
  let cursor = 0;
  const skipSpaces = () => { while (input[cursor] === " ") cursor += 1; };
  const match = (character: string) => { skipSpaces(); if (input[cursor] === character) { cursor += 1; return true; } return false; };
  const parseExpression = (): number => { let value = parseTerm(); while (true) { if (match("+")) value += parseTerm(); else if (match("-")) value -= parseTerm(); else return value; } };
  const parseTerm = (): number => { let value = parseUnary(); while (true) { if (match("*")) value *= parseUnary(); else if (match("/")) { const divisor = parseUnary(); if (divisor === 0) throw new Error("Cannot divide by zero"); value /= divisor; } else return value; } };
  const parseUnary = (): number => { if (match("+")) return parseUnary(); if (match("-")) return -parseUnary(); return parsePostfix(); };
  const parsePostfix = (): number => { let value = parsePrimary(); while (match("%")) value /= 100; return value; };
  const parsePrimary = (): number => {
    skipSpaces(); const start = cursor; let decimalSeen = false;
    while (/[0-9.]/.test(input[cursor] ?? "")) { if (input[cursor] === ".") { if (decimalSeen) throw new Error("Invalid number"); decimalSeen = true; } cursor += 1; }
    if (start === cursor || input.slice(start, cursor) === ".") throw new Error("Invalid calculation");
    const number = Number(input.slice(start, cursor)); if (!Number.isFinite(number)) throw new Error("Invalid number"); return number;
  };
  const result = parseExpression(); skipSpaces(); if (cursor !== input.length) throw new Error("Invalid calculation"); return formatNumber(result);
}

function Index() {
  const [expression, setExpression] = useState("");
  const [display, setDisplay] = useState("0");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const expressionLabel = useMemo(() => expression || "Ready for your calculation", [expression]);
  const lastCharacter = expression.at(-1) ?? "";
  const isOperator = operatorLabels.includes(lastCharacter as (typeof operatorLabels)[number]);
  const clearError = () => { if (error) setError(""); };

  const addNumber = (value: string) => {
    clearError(); if (justEvaluated) { setExpression(value); setDisplay(value); setJustEvaluated(false); return; }
    const next = expression === "0" ? value : expression + value; setExpression(next); setDisplay(next);
  };
  const addDecimal = () => {
    clearError(); if (justEvaluated) { setExpression("0."); setDisplay("0."); setJustEvaluated(false); return; }
    const currentNumber = expression.split(/[+×÷−]/).at(-1) ?? ""; if (currentNumber.includes(".")) return;
    const next = expression && !isOperator ? expression + "." : expression + "0."; setExpression(next); setDisplay(next);
  };
  const addOperator = (operator: string) => {
    clearError(); if (!expression && operator !== "−") return; let next = justEvaluated ? display : expression;
    if (operator === "−" && (!next || operatorLabels.includes(next.at(-1) as (typeof operatorLabels)[number]))) next += operator;
    else if (operator !== "−" && operatorLabels.includes(next.at(-1) as (typeof operatorLabels)[number])) next = next.slice(0, -1) + operator;
    else next += operator;
    setExpression(next); setDisplay(next); setJustEvaluated(false);
  };
  const calculate = () => {
    if (!expression || isOperator || lastCharacter === ".") return;
    try { const result = evaluateExpression(expression); setHistory((items) => [{ expression, result }, ...items].slice(0, 8)); setDisplay(result); setExpression(result); setJustEvaluated(true); setError(""); }
    catch (calculationError) { setError(calculationError instanceof Error ? calculationError.message : "Invalid calculation"); setDisplay("Error"); }
  };
  const toggleSign = () => {
    clearError(); if (!expression || justEvaluated) { const next = expression.startsWith("-") ? expression.slice(1) : `−${expression || "0"}`; setExpression(next); setDisplay(next); setJustEvaluated(false); return; }
    const match = expression.match(/(\d+(?:\.\d+)?%?)$/); if (!match || match.index === undefined) return;
    const numberStart = match.index; const before = expression[numberStart - 1]; const isNegative = before === "−" && (numberStart === 1 || operatorLabels.includes(expression[numberStart - 2] as (typeof operatorLabels)[number]));
    const next = isNegative ? expression.slice(0, numberStart - 1) + expression.slice(numberStart) : expression.slice(0, numberStart) + "−" + expression.slice(numberStart); setExpression(next); setDisplay(next);
  };
  const backspace = () => { clearError(); if (justEvaluated) { setExpression(""); setDisplay("0"); setJustEvaluated(false); return; } const next = expression.slice(0, -1); setExpression(next); setDisplay(next || "0"); };
  const clearAll = () => { setExpression(""); setDisplay("0"); setError(""); setJustEvaluated(false); };
  const press = (key: string) => {
    if (/^[0-9]$/.test(key)) addNumber(key); else if (key === ".") addDecimal(); else if (operatorLabels.includes(key as (typeof operatorLabels)[number])) addOperator(key);
    else if (key === "%") { if (expression && !isOperator && lastCharacter !== "%") { setExpression(expression + "%"); setDisplay(expression + "%"); } }
    else if (key === "Enter" || key === "=") calculate(); else if (key === "Backspace") backspace(); else if (key === "Escape") clearAll();
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { const key = event.key === "*" ? "×" : event.key === "/" ? "÷" : event.key === "-" ? "−" : event.key; if (/^[0-9.]$/.test(key) || operatorLabels.includes(key as (typeof operatorLabels)[number]) || ["%", "Enter", "=", "Backspace", "Escape"].includes(key)) { event.preventDefault(); press(key); } };
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <main className={isLight ? "calculator-shell light-mode" : "calculator-shell"}>
      <div className="app-container">
        <header className="app-header"><div className="brand-lockup"><div className="brand-mark" aria-hidden="true"><Plus size={18} strokeWidth={3} /></div><div><p className="eyebrow">Everyday math, simplified</p><h1>My Calculator</h1></div></div><button className="icon-button" onClick={() => setIsLight((value) => !value)} aria-label={`Switch to ${isLight ? "dark" : "light"} theme`} title={`Switch to ${isLight ? "dark" : "light"} theme`}>{isLight ? <Moon size={18} /> : <Sun size={18} />}</button></header>
        <div className="workspace">
          <section className="calculator-panel" aria-label="Calculator">
            <div className={`display ${error ? "display-error" : ""}`}><div className="expression-label">{expressionLabel}</div><output className="display-value" aria-live="polite">{display}</output>{error && <p className="error-message" role="alert">{error}</p>}</div>
            <div className="keypad">
              <button className="key key-action" onClick={clearAll}>AC</button><button className="key key-action" onClick={toggleSign} aria-label="Toggle positive or negative">+/−</button><button className="key key-action" onClick={() => press("%")}>%</button><button className="key key-operator" onClick={() => addOperator("÷")} aria-label="Divide">÷</button>
              {["7", "8", "9"].map((number) => <button className="key key-number" key={number} onClick={() => addNumber(number)}>{number}</button>)}<button className="key key-operator" onClick={() => addOperator("×")} aria-label="Multiply">×</button>
              {["4", "5", "6"].map((number) => <button className="key key-number" key={number} onClick={() => addNumber(number)}>{number}</button>)}<button className="key key-operator" onClick={() => addOperator("−")} aria-label="Subtract"><Minus size={22} /></button>
              {["1", "2", "3"].map((number) => <button className="key key-number" key={number} onClick={() => addNumber(number)}>{number}</button>)}<button className="key key-operator" onClick={() => addOperator("+")} aria-label="Add"><Plus size={22} /></button>
              <button className="key key-number key-zero" onClick={() => addNumber("0")}>0</button><button className="key key-number" onClick={addDecimal}>.</button><button className="key key-delete" onClick={backspace} aria-label="Backspace"><Delete size={21} /></button><button className="key key-equals" onClick={calculate} aria-label="Calculate result">=</button>
            </div>
          </section>
          <aside className="history-panel" aria-label="Calculation history"><div className="history-heading"><div className="history-title"><History size={18} /><h2>Recent calculations</h2></div>{history.length > 0 && <button className="clear-history" onClick={() => setHistory([])}>Clear all</button>}</div>
            {history.length === 0 ? <div className="empty-history"><div className="empty-icon"><History size={20} /></div><p>No calculations yet</p><span>Your recent work will appear here.</span></div> : <div className="history-list">{history.map((item, index) => <button className="history-item" key={`${item.expression}-${index}`} onClick={() => { setExpression(item.result); setDisplay(item.result); setJustEvaluated(true); setError(""); }}><span>{item.expression}</span><strong>= {item.result}</strong></button>)}</div>}
            <div className="history-footer"><Eraser size={14} /><span>History lasts for this session</span></div>
          </aside>
        </div>
        <footer className="app-footer"><span>Built for focus</span><span className="footer-dot" /><span>Keyboard ready</span><span className="footer-key">Enter</span><span className="footer-key">Esc</span></footer>
      </div>
    </main>
  );
}