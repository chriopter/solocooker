import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.element.setAttribute("draggable", "true")
    this.boundDragStart = this.dragStart.bind(this)
    this.boundDragEnd = this.dragEnd.bind(this)
    this.boundDragOver = this.dragOver.bind(this)
    this.boundDragEnter = this.dragEnter.bind(this)
    this.boundDragLeave = this.dragLeave.bind(this)
    this.boundDrop = this.drop.bind(this)

    this.element.addEventListener("dragstart", this.boundDragStart)
    this.element.addEventListener("dragend", this.boundDragEnd)

    // Make messages drop targets too (for dropping onto another message)
    this.element.addEventListener("dragover", this.boundDragOver)
    this.element.addEventListener("dragenter", this.boundDragEnter)
    this.element.addEventListener("dragleave", this.boundDragLeave)
    this.element.addEventListener("drop", this.boundDrop)
  }

  disconnect() {
    this.element.removeEventListener("dragstart", this.boundDragStart)
    this.element.removeEventListener("dragend", this.boundDragEnd)
    this.element.removeEventListener("dragover", this.boundDragOver)
    this.element.removeEventListener("dragenter", this.boundDragEnter)
    this.element.removeEventListener("dragleave", this.boundDragLeave)
    this.element.removeEventListener("drop", this.boundDrop)
  }

  dragStart(event) {
    const messageId = this.element.dataset.messageId
    if (!messageId) return

    // Set a custom type so we can identify message drags vs file drags
    event.dataTransfer.setData("application/x-message-id", messageId)
    event.dataTransfer.setData("text/plain", messageId)
    event.dataTransfer.effectAllowed = "move"

    // Add visual feedback
    this.element.classList.add("message--dragging")

    // Create a custom drag image
    const dragImage = this.element.cloneNode(true)
    dragImage.style.position = "absolute"
    dragImage.style.top = "-1000px"
    dragImage.style.opacity = "0.8"
    dragImage.style.width = "300px"
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, 10, 10)

    // Clean up the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)
  }

  dragEnd(event) {
    this.element.classList.remove("message--dragging")
  }

  // Drop target handlers
  dragOver(event) {
    // Only handle if this is a message drag (not a file drag)
    if (!event.dataTransfer.types.includes("application/x-message-id")) return

    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = "move"
  }

  dragEnter(event) {
    // Only handle if this is a message drag
    if (!event.dataTransfer.types.includes("application/x-message-id")) return

    event.preventDefault()
    event.stopPropagation()
    this.element.classList.add("message--drop-target")
  }

  dragLeave(event) {
    // Only remove class if we're leaving the message entirely
    if (!this.element.contains(event.relatedTarget)) {
      this.element.classList.remove("message--drop-target")
    }
  }

  async drop(event) {
    // Only handle if this is a message drag
    const draggedMessageId = event.dataTransfer.getData("application/x-message-id")
    if (!draggedMessageId) return

    event.preventDefault()
    event.stopPropagation()
    this.element.classList.remove("message--drop-target")

    const targetMessageId = this.element.dataset.messageId

    if (!targetMessageId) return

    // Don't allow dropping a message onto itself
    if (draggedMessageId === targetMessageId) return

    // Get room ID
    const roomMeta = document.querySelector("meta[name='current-room-id']")
    if (!roomMeta) return
    const roomId = roomMeta.content

    try {
      const response = await fetch(`/rooms/${roomId}/messages/${draggedMessageId}/add_to_thread`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/vnd.turbo-stream.html",
          "X-CSRF-Token": document.querySelector("meta[name='csrf-token']").content
        },
        body: JSON.stringify({ parent_id: targetMessageId })
      })

      if (response.ok) {
        const html = await response.text()
        // Process the Turbo Stream response
        Turbo.renderStreamMessage(html)

        // Open thread panel on the target message
        const threadPanel = document.querySelector("[data-controller='thread-panel']")
        if (threadPanel) {
          const controller = this.application.getControllerForElementAndIdentifier(threadPanel, "thread-panel")
          if (controller) {
            // Select the target message and open its thread
            document.querySelectorAll(".message--selected").forEach(el => el.classList.remove("message--selected"))
            const targetEl = document.getElementById(`message_${targetMessageId}`)
            if (targetEl) {
              targetEl.classList.add("message--selected")
            }
            controller.openThread(roomId, targetMessageId)
          }
        }
      }
    } catch (error) {
      console.error("Failed to add message to thread:", error)
    }
  }
}
