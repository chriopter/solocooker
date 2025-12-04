import { Controller } from "@hotwired/stimulus"

// This controller makes the main messages area a drop target
// for removing messages from threads (making them parentless again)
// It handles drops on empty space OR when Shift key is held
export default class extends Controller {
  connect() {
    this.boundDragOver = this.dragOver.bind(this)
    this.boundDragEnter = this.dragEnter.bind(this)
    this.boundDragLeave = this.dragLeave.bind(this)
    this.boundDrop = this.drop.bind(this)

    this.element.addEventListener("dragover", this.boundDragOver)
    this.element.addEventListener("dragenter", this.boundDragEnter)
    this.element.addEventListener("dragleave", this.boundDragLeave)
    this.element.addEventListener("drop", this.boundDrop)
  }

  disconnect() {
    this.element.removeEventListener("dragover", this.boundDragOver)
    this.element.removeEventListener("dragenter", this.boundDragEnter)
    this.element.removeEventListener("dragleave", this.boundDragLeave)
    this.element.removeEventListener("drop", this.boundDrop)
  }

  dragOver(event) {
    // Only handle if this is a message drag
    if (!event.dataTransfer.types.includes("application/x-message-id")) return

    // Show as droppable when on empty space or holding Shift
    const onMessage = event.target.closest(".message")
    if (!onMessage || event.shiftKey) {
      event.preventDefault()
      event.dataTransfer.dropEffect = "move"
    }
  }

  dragEnter(event) {
    // Only handle if this is a message drag
    if (!event.dataTransfer.types.includes("application/x-message-id")) return

    const onMessage = event.target.closest(".message")
    if (!onMessage || event.shiftKey) {
      event.preventDefault()
      this.element.classList.add("messages--drop-target")
    }
  }

  dragLeave(event) {
    // Only remove class if we're leaving the messages area entirely
    if (!this.element.contains(event.relatedTarget)) {
      this.element.classList.remove("messages--drop-target")
    }
  }

  async drop(event) {
    // Only handle if this is a message drag
    const messageId = event.dataTransfer.getData("application/x-message-id")
    if (!messageId) return

    // Only handle drops on empty space or when Shift is held
    const onMessage = event.target.closest(".message")
    if (onMessage && !event.shiftKey) return

    event.preventDefault()
    event.stopPropagation()
    this.element.classList.remove("messages--drop-target")

    // Get room ID
    const roomMeta = document.querySelector("meta[name='current-room-id']")
    if (!roomMeta) return
    const roomId = roomMeta.content

    try {
      const response = await fetch(`/rooms/${roomId}/messages/${messageId}/remove_from_thread`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/vnd.turbo-stream.html",
          "X-CSRF-Token": document.querySelector("meta[name='csrf-token']").content
        }
      })

      if (response.ok) {
        const html = await response.text()
        // Process the Turbo Stream response
        Turbo.renderStreamMessage(html)

        // Close thread panel and deselect
        const threadPanel = document.querySelector("[data-controller='thread-panel']")
        if (threadPanel && threadPanel.classList.contains("open")) {
          const controller = this.application.getControllerForElementAndIdentifier(threadPanel, "thread-panel")
          if (controller && controller.parentIdValue) {
            controller.openThread(roomId, controller.parentIdValue)
          }
        }
      }
    } catch (error) {
      console.error("Failed to remove message from thread:", error)
    }
  }
}
