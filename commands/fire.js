/** Credits: http://maettig.com/code/javascript/asciifire.html */
import { el } from '../js/screens.js'
import { waitForKey } from '../js/io.js'
import clear from './clear.js'

async function fire() {
   clear()

   return new Promise(async (resolve) => {
      let size = 80 * 25
      let fire
      let b = []
      let i
      for (i = 0; i < size + 81; i++) b[i] = 0
      let char = ' .:*sS#$'.split('')
      let element = el('pre')
      element.classList.add('fire')
      let interval

      function f() {
         for (i = 0; i < 10; i++) b[Math.floor(Math.random() * 80) + 80 * 24] = 70
         fire = ''
         for (i = 0; i < size; i++) {
            b[i] = Math.floor((b[i] + b[i + 1] + b[i + 80] + b[i + 81]) / 4)
            fire += char[b[i] > 7 ? 7 : b[i]]
            if (i % 80 > 78) fire += '\r\n'
         }
         element.innerHTML = fire
      }

      interval = setInterval(f, 30)

      await waitForKey()

      clearInterval(interval)
      clear()

      resolve()
   })
}

export default fire
