/**
 * Phone mask — маска українського номера: +38 (0XX) XXX XX XX
 *
 * Розмітка:
 *   input[type="tel"][data-phone-mask]
 *   (перевірку формату робить pattern на інпуті — браузер не відправить неповний номер)
 *
 * Поведінка:
 *   - фокус на порожньому полі — підставляється "+38 (0";
 *   - друк, вставка, автозаповнення — номер у будь-якому вигляді (0671234567, +380671234567, 67 123 45 67)
 *     приводиться до маски;
 *   - Backspace / Delete стирають цифри, а не дужки й пробіли (курсор не "застрягає");
 *   - пішли з поля, нічого не набравши, — поле очищається, щоб не лишався лише префікс.
 */
function initPhoneMask(options = {}) {
  const { selector = '[data-phone-mask]' } = options

  const inputs = [...document.querySelectorAll(selector)]

  if (!inputs.length) return null

  const PREFIX = '+38 (0'

  // лише 9 цифр після "+38 (0": XX XXX XX XX
  const toDigits = (value) => {
    let digits = value.replace(/\D/g, '')
    if (digits.startsWith('380')) digits = digits.slice(3)
    else if (digits.startsWith('38')) digits = digits.slice(2)
    if (digits.startsWith('0')) digits = digits.slice(1)
    return digits.slice(0, 9)
  }

  const format = (digits) => {
    let out = PREFIX + digits.slice(0, 2)
    if (digits.length > 2) out += ') ' + digits.slice(2, 5)
    if (digits.length > 5) out += ' ' + digits.slice(5, 7)
    if (digits.length > 7) out += ' ' + digits.slice(7, 9)
    return out
  }

  // позиція курсора після n-ї цифри номера (префікс "+38 (0" не рахується)
  const caretAfter = (value, n) => {
    if (n <= 0) return PREFIX.length
    let count = 0
    for (let i = PREFIX.length; i < value.length; i++) {
      if (/\d/.test(value[i])) count++
      if (count === n) return i + 1
    }
    return value.length
  }

  // скільки цифр номера стоїть перед позицією курсора
  const digitsBefore = (value, pos) => toDigits(value.slice(0, pos)).length

  inputs.forEach((input) => {
    const apply = (digits, caretDigits = digits.length) => {
      input.value = format(digits)
      const pos = caretAfter(input.value, caretDigits)
      if (document.activeElement === input) input.setSelectionRange(pos, pos)
    }

    input.addEventListener('focus', () => {
      if (!input.value) apply('')
    })

    input.addEventListener('blur', () => {
      if (!toDigits(input.value)) input.value = ''
    })

    // стирання: прибираємо саме цифру, навіть якщо зліва від курсора дужка чи пробіл
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Backspace' && event.key !== 'Delete') return
      const { selectionStart: start, selectionEnd: end, value } = input
      const digits = toDigits(value)
      const before = digitsBefore(value, start)

      event.preventDefault()

      if (start !== end) {
        // виділено фрагмент — прибираємо цифри з виділення
        const after = digitsBefore(value, end)
        apply(digits.slice(0, before) + digits.slice(after), before)
      } else if (event.key === 'Backspace' && before > 0) {
        apply(digits.slice(0, before - 1) + digits.slice(before), before - 1)
      } else if (event.key === 'Delete') {
        apply(digits.slice(0, before) + digits.slice(before + 1), before)
      }
    })

    // друк, вставка, автозаповнення
    input.addEventListener('input', () => {
      const pos = input.selectionStart ?? input.value.length
      const before = digitsBefore(input.value, pos)
      apply(toDigits(input.value), before)
    })

    // номер могли підставити до запуску скрипта (автозаповнення)
    if (input.value) input.value = format(toDigits(input.value))
  })

  return inputs
}

window.initPhoneMask = initPhoneMask
