import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  dragenter(event) {
    // Ignore message drags - only handle file drops
    if (event.dataTransfer.types.includes("application/x-message-id")) return
    event.preventDefault()
  }

  dragover(event) {
    // Ignore message drags - only handle file drops
    if (event.dataTransfer.types.includes("application/x-message-id")) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  drop(event) {
    // Ignore message drags - only handle file drops
    if (event.dataTransfer.types.includes("application/x-message-id")) return
    event.preventDefault()
    this.dispatch("drop", { detail: { files: event.dataTransfer.files }})
  }
}
