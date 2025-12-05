import { Controller } from "@hotwired/stimulus"

// Simplified thread navigation controller
// Click on message with thread indicator → navigate to thread URL
// Drop message on room name → remove from thread
export default class extends Controller {
  connect() {
    this.boundHandleMessageClick = this.handleMessageClick.bind(this)
    document.addEventListener("click", this.boundHandleMessageClick)
    this.setupRoomNameDropTarget()
  }

  disconnect() {
    document.removeEventListener("click", this.boundHandleMessageClick)
    this.cleanupRoomNameDropTarget()
  }

  handleMessageClick(event) {
    const messageEl = event.target.closest(".message")
    if (!messageEl) return

    // Don't trigger if clicking on links or buttons inside message
    if (event.target.closest("a, button, input, textarea")) return

    // Check if this message has children (thread indicator)
    const hasThread = messageEl.querySelector(".message__thread-indicator")
    if (!hasThread) return

    const messageId = messageEl.dataset.messageId
    if (!messageId) return

    // Get room ID from the page
    const roomMeta = document.querySelector("meta[name='current-room-id']")
    if (!roomMeta) return

    // Navigate to thread view
    event.preventDefault()
    const url = `/rooms/${roomMeta.content}/${messageId}`
    Turbo.visit(url, { action: "replace" })
  }

  setupRoomNameDropTarget() {
    const roomTrigger = document.querySelector(".room-menu__trigger")
    if (!roomTrigger) return

    this.boundRoomDragOver = (e) => {
      if (!e.dataTransfer.types.includes("application/x-message-id")) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      roomTrigger.classList.add("drop-target")
    }
    this.boundRoomDragLeave = () => {
      roomTrigger.classList.remove("drop-target")
    }
    this.boundRoomDrop = async (e) => {
      roomTrigger.classList.remove("drop-target")
      const messageId = e.dataTransfer.getData("application/x-message-id")
      if (!messageId) return
      e.preventDefault()
      await this.removeFromThread(messageId)
    }

    roomTrigger.addEventListener("dragover", this.boundRoomDragOver)
    roomTrigger.addEventListener("dragleave", this.boundRoomDragLeave)
    roomTrigger.addEventListener("drop", this.boundRoomDrop)
  }

  cleanupRoomNameDropTarget() {
    const roomTrigger = document.querySelector(".room-menu__trigger")
    if (!roomTrigger) return

    if (this.boundRoomDragOver) {
      roomTrigger.removeEventListener("dragover", this.boundRoomDragOver)
      roomTrigger.removeEventListener("dragleave", this.boundRoomDragLeave)
      roomTrigger.removeEventListener("drop", this.boundRoomDrop)
    }
  }

  async removeFromThread(messageId) {
    const roomMeta = document.querySelector("meta[name='current-room-id']")
    if (!roomMeta) return

    try {
      const response = await fetch(`/rooms/${roomMeta.content}/messages/${messageId}/remove_from_thread`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/vnd.turbo-stream.html",
          "X-CSRF-Token": document.querySelector("meta[name='csrf-token']").content
        }
      })

      if (response.ok) {
        // Reload current page to reflect changes
        Turbo.visit(window.location.href, { action: "replace" })
      }
    } catch (error) {
      console.error("Failed to remove message from thread:", error)
    }
  }
}
