import clear from '../commands/clear.js'
import { parse, type, prompt, input } from './io.js'
import pause from './pause.js'
import alert from './alert.js'

/** Boot screen */
async function boot() {
   clear()
   await type([
      'Welcome to ECMA industries(TM) terminal',
      ' ',
      '> SET TERMINAL/BOOT',
      'Loading........................',
      'Please wait........',
      '..........',
      '...',
      '.',
      'OK.',
      ' ',
      '> SET TERMINAL/LOGON',
      'USER AUTHENTICATION CHECK',
   ])

   await pause()
   return login()
}

/** Login screen */
async function login() {
   clear()
   let user = await prompt('Username:')
   let password = await prompt('Password:', true)

   if (user === 'admin' && password === 'admin') {
      await pause()
      await alert('AUTHENTICATION SUCCESSFUL')
      clear()
      return main()
   } else {
      await type(['Incorrect user and/or password.', 'Please try again'])
      await pause(3)
      clear()
      return login()
   }
}

/** Main input terminal, recursively calls itself */
async function main() {
   let command = await input()
   try {
      await parse(command)
   } catch (e) {
      if (e.message) await type(e.message)
   }
   main()
}

function addClasses(el, ...cls) {
   let list = [...cls].filter(Boolean)
   el.classList.add(...list)
}

function getScreen(...cls) {
   let div = document.createElement('div')
   addClasses(div, 'fullscreen', ...cls)
   document.querySelector('#crt').appendChild(div)
   return div
}

function el(type, container = document.querySelector('.terminal'), cls = '') {
   let el = document.createElement(type)
   addClasses(el, cls)

   container.appendChild(el)
   return el
}

function div(...args) {
   return el('div', ...args)
}

export { boot, login, main, getScreen, div, el }
