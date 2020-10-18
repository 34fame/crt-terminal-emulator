import pause from './pause.js'

// Command history
let prev = getHistory()
let historyIndex = -1
let tmp = ''
let interval

function getHistory() {
   let storage = localStorage.getItem('commandHistory')
   let prev
   if (storage) {
      try {
         let json = JSON.parse(storage)
         prev = Array.isArray(json) ? json : []
      } catch (e) {
         prev = []
      }
   } else {
      prev = []
   }
   return prev
}

function addToHistory(cmd) {
   prev = [cmd, ...prev]
   historyIndex = -1
   tmp = ''

   try {
      localStorage.setItem('commandHistory', JSON.stringify(prev))
   } catch (e) {}
}

/**
 * Convert a character that needs to be typed into something that can be shown on the screen.
 * Newlines becomes <br>
 * Tabs become three spaces.
 * Spaces become &nbsp;
 * */
function getChar(char) {
   let result
   if (typeof char === 'string') {
      if (char === '\n') {
         result = document.createElement('br')
      } else if (char === '\t') {
         let tab = document.createElement('span')
         tab.innerHTML = '&nbsp;&nbsp;&nbsp;'
         result = tab
      } else if (char === ' ') {
         let space = document.createElement('span')
         space.innerHTML = '&nbsp;'
         space.classList.add('char')
         result = space
      } else {
         let span = document.createElement('span')
         span.classList.add('char')
         span.textContent = char
         result = span
      }
   }
   return result
}

/** Types the given text on the screen */
async function type(
   text,
   {
      wait = 50,
      initialWait = 1000,
      finalWait = 500,
      typerClass = '',
      useContainer = false,
      stopBlinking = true,
      processChars = true,
      clearContainer = false,
   } = {},
   container = document.querySelector('.terminal')
) {
   return new Promise(async (resolve) => {
      if (interval) {
         clearInterval(interval)
         interval = null
      }
      // Create a div where all the characters can be appended to (or use the given container)
      let typer = useContainer ? container : document.createElement('div')
      typer.classList.add('typer', 'active')

      if (typerClass) {
         typer.classList.add(typerClass)
      }
      // Handy if reusing the same container
      if (clearContainer) {
         container.innerHTML = '&nbsp;'
      }

      if (!useContainer) {
         container.appendChild(typer)
      }

      if (initialWait) {
         await pause(initialWait / 1000)
      }

      let queue = text
      if (processChars) {
         if (Array.isArray(text)) {
            text = text.join('\n')
         }
         queue = text.split('')
      }

      let prev

      // Use an interval to repeatedly pop a character from the queue and type it on screen
      interval = setInterval(async () => {
         if (queue.length) {
            let char = queue.shift()

            // This is an optimisation for typing a large number of characters on the screen.
            // It seems the performance degrades when trying to add 500+ DOM elements rapidly on the screen.
            // So the content of the previous element is moved to the typer container and removed, which
            // reduces the amount of DOM elements.
            // This may cause issues when the element is removed while the character is still animating (red screen)
            if (processChars && prev) {
               prev.remove()
               if (prev.firstChild && prev.firstChild.nodeType === Node.TEXT_NODE) {
                  typer.innerText += prev.innerText
               } else {
                  typer.appendChild(prev)
               }
            }
            let element = processChars ? getChar(char) : char
            if (element) {
               typer.appendChild(element)

               if (element.nodeName === 'BR') {
                  scroll(container)
               }
            }
            prev = element
         } else {
            // When the queue is empty, clean up the interval
            clearInterval(interval)
            await pause(finalWait / 1000)
            if (stopBlinking) {
               typer.classList.remove('active')
            }
            resolve()
         }
      }, wait)
   })
}

function isPrintable(keycode) {
   return (
      (keycode > 47 && keycode < 58) || // number keys
      keycode === 32 || // spacebar & return key(s) (if you want to allow carriage returns)
      (keycode > 64 && keycode < 91) || // letter keys
      (keycode > 95 && keycode < 112) || // numpad keys
      (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
      (keycode > 218 && keycode < 223)
   )
}

function moveCaretToEnd(el) {
   var range, selection
   if (document.createRange) {
      range = document.createRange() //Create a range (a range is a like the selection but invisible)
      range.selectNodeContents(el) //Select the entire contents of the element with the range
      range.collapse(false) //collapse the range to the end point. false means collapse to end rather than the start
      selection = window.getSelection() //get the selection object (allows you to change selection)
      selection.removeAllRanges() //remove any selections already made
      selection.addRange(range) //make the range you have just created the visible selection
   }
}

/** Shows an input field, returns a resolved promise with the typed text on <enter> */
async function input(pw) {
   return new Promise((resolve) => {
      // This handles all user input
      const onKeyDown = (event) => {
         // ENTER
         if (event.keyCode === 13) {
            event.preventDefault()
            event.target.setAttribute('contenteditable', false)
            let result = cleanInput(event.target.textContent)

            // history
            addToHistory(result)
            resolve(result)
         }
         // UP
         else if (event.keyCode === 38) {
            if (historyIndex === -1) tmp = event.target.textContent
            historyIndex = Math.min(prev.length - 1, historyIndex + 1)
            let text = prev[historyIndex]
            event.target.textContent = text
         }
         // DOWN
         else if (event.keyCode === 40) {
            historyIndex = Math.max(-1, historyIndex - 1)
            let text = prev[historyIndex] || tmp
            event.target.textContent = text
         }
         // BACKSPACE
         else if (event.keyCode === 8) {
            // Prevent inserting a <br> when removing the last character
            if (event.target.textContent.length === 1) {
               event.preventDefault()
               event.target.innerHTML = ''
            }
         }
         // Check if character can be shown as output (skip if CTRL is pressed)
         else if (isPrintable(event.keyCode) && !event.ctrlKey) {
            event.preventDefault()
            // Wrap the character in a span
            let span = document.createElement('span')

            let keyCode = event.keyCode
            let chrCode = keyCode - 48 * Math.floor(keyCode / 48)
            let chr = String.fromCharCode(96 <= keyCode ? chrCode : keyCode)
            // Add span to the input
            span.classList.add('char')
            span.textContent = chr
            event.target.appendChild(span)

            // For password field, fill the data-pw attr with asterisks
            // which will be shown using CSS
            if (pw) {
               let length = event.target.textContent.length
               event.target.setAttribute('data-pw', Array(length).fill('*').join(''))
            }
            moveCaretToEnd(event.target)
         }
      }

      // Add input to terminal
      let terminal = document.querySelector('.terminal')
      let input = document.createElement('span')
      input.setAttribute('id', 'input')
      if (pw) {
         input.classList.add('password')
      }
      input.setAttribute('contenteditable', true)
      input.addEventListener('keydown', onKeyDown)
      terminal.appendChild(input)
      input.focus()
   })
}

// Processes the user input and executes a command
async function parse(input) {
   input = cleanInput(input)

   if (!input) {
      return
   }
   // Only allow words, separated by space
   let matches = String(input).match(/^(\w+)(?:\s((?:\w+(?:\s\w+)*)))?$/)

   if (!matches) {
      throw new Error('Invalid command')
   }
   let command = matches[1]
   let args = matches[2]

   let naughty = ['fuck', 'shit', 'die', 'ass', 'cunt']
   if (naughty.some((word) => command.includes(word))) {
      throw new Error("Please don't use that language")
   }

   let module

   // Try to import the command function
   try {
      module = await import(`../commands/${command}.js`)
   } catch (e) {
      console.error(e)
      // Kinda abusing TypeError to check if the import failed
      if (e instanceof TypeError) {
         return await type('Unknown command')
      }
      // E.g. syntax error while executing the command
      else {
         return await type('Error while executing command')
      }
   }

   // Show any output if the command exports any
   if (module && module.output) {
      await type(module.output)
   }

   await pause()

   // Execute the command (default export)
   if (module.default) {
      await module.default(args)
   }
   return
}

function cleanInput(input) {
   return input.toLowerCase().trim()
}

function scroll(el = document.querySelector('.terminal')) {
   el.scrollTop = el.scrollHeight
}

/** Types the given text and asks input */
async function prompt(text, pw = false) {
   await type(text)
   return input(pw)
}

/** Sets a global event listeners and returns when a key is hit */
async function waitForKey() {
   return new Promise((resolve) => {
      const handle = () => {
         document.removeEventListener('keyup', handle)
         document.removeEventListener('click', handle)
         resolve()
      }
      document.addEventListener('keyup', handle)
      document.addEventListener('click', handle)
   })
}

export { prompt, input, cleanInput, type, parse, scroll, waitForKey }
