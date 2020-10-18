import { type } from './io.js'
import { boot } from './screens.js'

async function onload() {
   const urlParams = new URLSearchParams(window.location.search)
   const command = urlParams.get('command')
   const { main } = await import('./screens.js')
   const { parse } = await import('./io.js')

   if (command) {
      await type('> ' + command, { initialWait: 3000, finalWait: 1500 })
      await parse(command)
      main()
   } else {
      boot()
   }
}

function handleClick(event) {
   if (event) {
      event.preventDefault()
   }
   let input = document.querySelector("[contenteditable='true']")
   if (input) {
      input.focus()
   }
}

Object.assign(window, {
   onload,
   handleClick,
})
