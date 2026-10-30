/**
 * Расчёты пожаротушения для горных выработок — 12 расчётов
 *
 *  1. calcTrunks         — количество стволов              Nств = Sп × Jн / qств
 *  2. calcFlow           — требуемый расход воды           Qтр = Sп × Jн
 *  3. calcHoses          — количество пожарных рукавов     n = 1,2 × L / lp
 *  4. calcFlood          — время затопления выработки      t = V / q
 *  5. calcFoam           — расход пенообразователя         Qтр = Jн × Sп
 *  6. calcPowder         — огнетушащий порошок             M = Sп × Jн × τ × K3
 *  7. calcPowderReserve  — запас порошка на участок ГСР    Mун = M1 × Nоч × Kзап
 *  8. calcVolume         — объём выработки                 V = A × B × C
 *  9. calcFireArea       — площадь пожара                  Sп = A × B
 * 10. calcHoseResistance — потери напора в рукавной линии  h = n × Sp × Q²
 * 11. calcFireIndex      — индексы Грэхема и Янга
 * 12. calcInertGas       — подача инертного газа
 *
 * Модуль без зависимостей — подключается в любой TS/JS-проект.
 * Каждая функция возвращает результат или null, если данные некорректны.
 * Для каждого расчёта есть описание (FIREFIGHTING_CALCS) и текстовый отчёт (buildReport).
 *
 * Пример:
 *   import { calcTrunks, calcFireIndex, buildReport } from "./firefighting-calc"
 *   calcTrunks({ Sp: 20, Jn: 0.55, qStv: 3.7 })            // { exact: 2.97, count: 3 }
 *   calcFireIndex({ CO: 0.008, O2: 18.5, CO2: 1.2 })        // { Ig, Iy, isFire, ... }
 */

// ═══════════════════════════════ ОБЩЕЕ ═══════════════════════════════

/** "0,55" → 0.55; пустое/некорректное → NaN */
export function parseNum(v: string | number): number {
  if (typeof v === "number") return v
  return parseFloat(String(v).replace(",", "."))
}

const ok = (...vals: number[]) => vals.every(v => !isNaN(v) && v > 0)

/** Описание одного расчёта: название, формула, параметры */
export interface CalcInfo {
  key: string
  label: string
  title: string
  formula: string
  params: { sym: string; desc: string }[]
}

// ═════════════════════════ 1. КОЛИЧЕСТВО СТВОЛОВ ═════════════════════════

/** Нормативная интенсивность подачи воды, л/(с·м²) */
export const WATER_INTENSITY = { nonCombustibleSupport: 0.55, combustibleSupport: 1.66 }

export function calcTrunks(p: { Sp: number; Jn: number; qStv: number }) {
  if (!ok(p.Sp, p.Jn, p.qStv)) return null
  const exact = (p.Sp * p.Jn) / p.qStv
  return { exact, count: Math.ceil(exact) }
}

// ═════════════════════════ 2. ТРЕБУЕМЫЙ РАСХОД ВОДЫ ═════════════════════════

export function calcFlow(p: { Sp: number; Jn: number }) {
  if (!ok(p.Sp, p.Jn)) return null
  const ls = p.Sp * p.Jn
  return { ls, m3h: ls * 3.6 }
}

// ═════════════════════════ 3. КОЛИЧЕСТВО РУКАВОВ ═════════════════════════

export function calcHoses(p: { L: number; lp?: number }) {
  const lp = p.lp ?? 20
  if (!ok(p.L, lp)) return null
  const exact = (1.2 * p.L) / lp
  return { exact, count: Math.ceil(exact) }
}

// ═════════════════════════ 4. ВРЕМЯ ЗАТОПЛЕНИЯ ═════════════════════════

export function calcFlood(p: { V: number; q: number }) {
  if (!ok(p.V, p.q)) return null
  const hours = p.V / p.q
  return { hours, minutes: hours * 60 }
}

// ═════════════════════════ 5. РАСХОД ПЕНООБРАЗОВАТЕЛЯ ═════════════════════════

export function calcFoam(p: { Sp: number; Jn: number }) {
  if (!ok(p.Sp, p.Jn)) return null
  const ls = p.Jn * p.Sp
  return { ls, m3h: ls * 3.6 }
}

// ═════════════════════════ 6. ОГНЕТУШАЩИЙ ПОРОШОК ═════════════════════════

export const POWDER_MATERIALS = [
  { key: "wood", label: "Деревянная крепь (класс А)", Jn: 0.3, K3: 2.0 },
  { key: "oil", label: "ГСМ, масла, нефтепродукты (класс B)", Jn: 0.4, K3: 1.5 },
  { key: "electric", label: "Электрооборудование под напряжением", Jn: 0.35, K3: 2.0 },
  { key: "belt", label: "Конвейерная лента (резина)", Jn: 0.3, K3: 2.0 },
] as const

export type PowderMaterialKey = (typeof POWDER_MATERIALS)[number]["key"]

/**
 * @param Sp        площадь пожара, м²
 * @param Jn        интенсивность подачи порошка, кг/(м²·с)
 * @param tau       расчётное время тушения, с (обычно 60)
 * @param K3        коэффициент запаса
 * @param cartridge ёмкость одного огнетушителя/баллона, кг (обычно 5)
 */
export function calcPowder(p: { Sp: number; Jn: number; tau?: number; K3: number; cartridge?: number }) {
  const tau = p.tau ?? 60
  const one = p.cartridge ?? 5
  if (!ok(p.Sp, p.Jn, tau, p.K3)) return null
  const M = p.Sp * p.Jn * tau * p.K3
  return { M, N: one > 0 ? Math.ceil(M / one) : 0 }
}

/** Расчёт порошка по материалу из справочника */
export function calcPowderByMaterial(material: PowderMaterialKey, Sp: number, tau = 60, cartridge = 5) {
  const m = POWDER_MATERIALS.find(x => x.key === material)!
  return calcPowder({ Sp, Jn: m.Jn, tau, K3: m.K3, cartridge })
}

// ═════════════════════════ 7. ЗАПАС ПОРОШКА НА УЧАСТОК ГСР ═════════════════════════

/**
 * @param M1        расход порошка на 1 очаг, кг (результат calcPowder)
 * @param Noch      количество одновременных очагов (обычно 1)
 * @param Kzap      коэффициент запаса на участок (обычно 3)
 * @param cartridge ёмкость огнетушителя/баллона, кг (обычно 50)
 */
export function calcPowderReserve(p: { M1: number; Noch?: number; Kzap?: number; cartridge?: number }) {
  const Noch = p.Noch ?? 1
  const Kzap = p.Kzap ?? 3
  const one = p.cartridge ?? 50
  if (!ok(p.M1, Noch, Kzap)) return null
  const Mun = p.M1 * Noch * Kzap
  return { Mun, N: one > 0 ? Math.ceil(Mun / one) : 0 }
}

// ═════════════════════════ 8. ОБЪЁМ ВЫРАБОТКИ ═════════════════════════

export function calcVolume(p: { A: number; B: number; C: number }) {
  if (!ok(p.A, p.B, p.C)) return null
  return { V: p.A * p.B * p.C }
}

// ═════════════════════════ 9. ПЛОЩАДЬ ПОЖАРА ═════════════════════════

export function calcFireArea(p: { A: number; B: number }) {
  if (!ok(p.A, p.B)) return null
  return { Sp: p.A * p.B }
}

// ═════════════════════════ 10. СОПРОТИВЛЕНИЕ РУКАВНОЙ ЛИНИИ ═════════════════════════

export function calcHoseResistance(p: { n: number; Sp: number; Q: number }) {
  if (!ok(p.n, p.Sp, p.Q)) return null
  return { h: p.n * p.Sp * p.Q * p.Q }
}

// ═════════════════════════ 11. ПОЖАРНОЕ СОСТОЯНИЕ (ГРЭХЕМ, ЯНГ) ═════════════════════════

export const GRAHAM_SCALE = [
  { range: "< 0.1", max: 0.1, label: "Пожара нет / начальная стадия" },
  { range: "0.1–0.5", max: 0.5, label: "Пожар в начальной стадии" },
  { range: "0.5–1.0", max: 1.0, label: "Активное горение" },
  { range: "> 1.0", max: Infinity, label: "Интенсивное горение" },
]

export const YOUNG_SCALE = [
  { range: "< 0.5", max: 0.5, label: "Пожара нет" },
  { range: "0.5–1.5", max: 1.5, label: "Признаки самонагревания" },
  { range: "1.5–3.0", max: 3.0, label: "Самонагревание / начало пожара" },
  { range: "> 3.0", max: Infinity, label: "Активный пожар" },
]

/**
 * Ig = CO / (21 − O₂)
 * Iy = (CO₂ − 0,04 + CO) / O₂ × 100
 * Пожар, если Ig ≥ 0,5 или Iy ≥ 1,5
 * @param CO, O2, CO2, N2 — концентрации газов, % (N2 — справочно)
 */
export function calcFireIndex(p: { CO: number; O2: number; CO2: number; N2?: number }) {
  if ([p.CO, p.O2, p.CO2].some(isNaN) || p.O2 <= 0) return null
  const defO2 = 21 - p.O2
  const Ig = defO2 > 0 ? parseFloat((p.CO / defO2).toFixed(4)) : 0
  const Iy = parseFloat((((p.CO2 - 0.04 + p.CO) / p.O2) * 100).toFixed(3))
  const igStatus = GRAHAM_SCALE.find(s => Ig < s.max)!.label
  const iyStatus = YOUNG_SCALE.find(s => Iy < s.max)!.label
  const isFire = Ig >= 0.5 || Iy >= 1.5
  return { Ig, Iy, igStatus, iyStatus, isFire, fireStage: isFire ? "ПОЖАР" : "НЕТ ПРИЗНАКОВ ПОЖАРА" }
}

// ═════════════════════════ 12. ИНЕРТНЫЙ ГАЗ ═════════════════════════

export type InertGasType = "N2" | "CO2"
export const INERT_GAS_LABELS: Record<InertGasType, string> = { N2: "Азот (N₂)", CO2: "Углекислый газ (CO₂)" }

/**
 * Vin = V × (O₂нач − O₂цель) / (20,9 − O₂цель)
 * t   = Vin / q × 60 [мин];  kh = Vin / V
 * @param V   объём изолируемого пространства, м³
 * @param O2  текущее содержание O₂, %
 * @param O2t целевое содержание O₂ (обычно ≤ 2), %
 * @param q   производительность подачи газа, м³/ч
 */
export function calcInertGas(p: { V: number; O2: number; O2t: number; q: number; gas?: InertGasType }) {
  if ([p.V, p.O2, p.O2t, p.q].some(isNaN) || p.O2 <= p.O2t || p.q <= 0) return null
  const Vin = parseFloat(((p.V * (p.O2 - p.O2t)) / (20.9 - p.O2t)).toFixed(1))
  const t = parseFloat(((Vin / p.q) * 60).toFixed(0))
  const kh = parseFloat((Vin / p.V).toFixed(2))
  return { Vin, t, kh, gas: p.gas ?? "N2" }
}

// ═════════════════════════ СПРАВОЧНИК РАСЧЁТОВ ═════════════════════════

export const FIREFIGHTING_CALCS: CalcInfo[] = [
  { key: "trunks", label: "Кол-во стволов", title: "Количество стволов для тушения пожара", formula: "Nств = Sп × Jн / qств", params: [
    { sym: "Sп", desc: "Площадь пожара, м²" },
    { sym: "Jн", desc: "Нормативная интенсивность, л/(с·м²) — негорючая крепь: 0,55; горючая: 1,66" },
    { sym: "qств", desc: "Расход одного ствола, л/с (водяная завеса на копрах: ≥ 7 л/с)" },
  ] },
  { key: "flow", label: "Требуемый расход", title: "Требуемый расход воды на тушение пожара", formula: "Qтр = Sп × Jн", params: [
    { sym: "Qтр", desc: "Требуемый расход раствора, л/с" },
    { sym: "Sп", desc: "Площадь пожара, м²" },
    { sym: "Jн", desc: "Нормативная интенсивность, л/(с·м²)" },
  ] },
  { key: "hoses", label: "Кол-во рукавов", title: "Количество пожарных рукавов от водоисточника до места пожара", formula: "n = 1,2 × L / lp", params: [
    { sym: "n", desc: "Количество пожарных рукавов, шт." },
    { sym: "L", desc: "Расстояние от пожара до водоисточника, м" },
    { sym: "lp", desc: "Средняя длина одного рукава, м (обычно 20 м)" },
  ] },
  { key: "flood", label: "Время затопления", title: "Время затопления горной выработки", formula: "t = V / q", params: [
    { sym: "t", desc: "Время заполнения выработки, ч" },
    { sym: "V", desc: "Объём выработки, м³" },
    { sym: "q", desc: "Скорость заполнения (приход), м³/ч" },
  ] },
  { key: "foam", label: "Расход пенообразователя", title: "Требуемый расход раствора пенообразователя", formula: "Qтр = Jн × Sп", params: [
    { sym: "Qтр", desc: "Требуемый расход раствора пенообразователя, л/с" },
    { sym: "Jн", desc: "Нормативная интенсивность подачи раствора, л/(с·м²)" },
    { sym: "Sп", desc: "Площадь пожара, м²" },
  ] },
  { key: "powder", label: "Огнетуш. порошок", title: "Количество огнетушащего порошка для тушения пожара в выработке", formula: "M = Sп × Jн × τ × K3", params: [
    { sym: "M", desc: "Требуемое количество огнетушащего порошка, кг" },
    { sym: "Sп", desc: "Площадь пожара, м²" },
    { sym: "Jн", desc: "Нормативная интенсивность подачи порошка, кг/(м²·с)" },
    { sym: "τ", desc: "Расчётное время тушения, с (обычно 60 с)" },
    { sym: "K3", desc: "Коэффициент запаса на неполноту тушения и потери" },
  ] },
  { key: "powder-reserve", label: "Запас порошка на участок", title: "Нормативный запас огнетушащего порошка на участок ведения ГСР", formula: "Mун = M1 × Nоч × Kзап", params: [
    { sym: "Mун", desc: "Нормативный запас огнетушащего порошка на участок ведения ГСР, кг" },
    { sym: "M1", desc: "Расход порошка на тушение одного очага пожара, кг" },
    { sym: "Nоч", desc: "Максимальное количество одновременно ликвидируемых очагов на участке, шт." },
    { sym: "Kзап", desc: "Нормативный коэффициент резерва (рабочий + базовый + транспортный запас)" },
  ] },
  { key: "volume", label: "Объём выработки", title: "Объём горной выработки", formula: "V = A × B × C", params: [
    { sym: "V", desc: "Объём выработки, м³" },
    { sym: "A", desc: "Длина выработки, м" },
    { sym: "B", desc: "Ширина выработки, м" },
    { sym: "C", desc: "Высота выработки, м" },
  ] },
  { key: "area", label: "Площадь пожара", title: "Площадь пожара в горной выработке", formula: "Sп = A × B", params: [
    { sym: "Sп", desc: "Площадь пожара, м²" },
    { sym: "A", desc: "Длина охваченного участка, м" },
    { sym: "B", desc: "Ширина охваченного участка, м" },
  ] },
  { key: "resistance", label: "Сопротивление линии", title: "Потери напора в рукавной линии", formula: "h = n × Sp × Q²", params: [
    { sym: "h", desc: "Потери напора в рукавной линии, м вод. ст." },
    { sym: "n", desc: "Количество рукавов в линии, шт." },
    { sym: "Sp", desc: "Сопротивление одного рукава (справочное значение)" },
    { sym: "Q", desc: "Расход воды через линию, л/с" },
  ] },
  { key: "fire-index", label: "Пожарное состояние", title: "Индексы пожарного состояния атмосферы (Грэхем, Янг)", formula: "Ig = CO / (21 − O₂);  Iy = (CO₂ + CO − 0,04) / O₂ × 100", params: [
    { sym: "CO", desc: "Окись углерода, %" },
    { sym: "O₂", desc: "Кислород, %" },
    { sym: "CO₂", desc: "Углекислый газ, %" },
    { sym: "N₂", desc: "Азот, % (необязательно)" },
  ] },
  { key: "inert-gas", label: "Инертный газ", title: "Расчёт подачи инертного газа для тушения подземного пожара", formula: "Vin = V × (O₂н − O₂ц) / (20,9 − O₂ц);  t = Vin / q", params: [
    { sym: "V", desc: "Объём изолируемого пространства, м³" },
    { sym: "O₂н", desc: "Начальное содержание кислорода, %" },
    { sym: "O₂ц", desc: "Целевое содержание O₂ (обычно ≤ 2%), %" },
    { sym: "20,9", desc: "Содержание O₂ в воздухе, %" },
    { sym: "q", desc: "Производительность подачи инертного газа, м³/ч" },
    { sym: "t", desc: "Время, необходимое для инертизации, мин" },
  ] },
]

// ═════════════════════════ ОТЧЁТ ═════════════════════════

export interface ReportRow { label: string; value: string | number; unit?: string }

/** Текстовый отчёт по расчёту: название, формула, исходные данные, результаты */
export function buildReport(title: string, formula: string, inputs: ReportRow[], results: ReportRow[]): string {
  const row = (r: ReportRow) => `  ${r.label}: ${r.value}${r.unit ? " " + r.unit : ""}`
  return [
    title.toUpperCase(),
    `Формула: ${formula}`,
    "",
    "Исходные данные:",
    ...inputs.map(row),
    "",
    "Результаты:",
    ...results.map(row),
  ].join("\n")
}

export default FIREFIGHTING_CALCS
