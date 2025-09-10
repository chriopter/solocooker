import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.holdTimer = null
    this.countdownTimer = null
    this.isHolding = false
  }
  
  async handleClick(event) {
    event.preventDefault()
    
    // Only handle clicks on desktop (non-touch devices)
    if (this.isTouchDevice()) return
    
    await this.quickDelete()
  }
  
  async handleTouchStart(event) {
    event.preventDefault()
    this.isHolding = false
    
    this.holdTimer = setTimeout(() => {
      this.startHoldCountdown()
    }, 500)
  }
  
  async handleTouchEnd(event) {
    event.preventDefault()
    
    if (this.holdTimer) {
      clearTimeout(this.holdTimer)
      this.holdTimer = null
      
      // If we weren't holding, this was a quick tap
      if (!this.isHolding) {
        await this.quickDelete()
      }
    }
    
    this.cancelHold()
  }
  
  handleMouseDown(event) {
    event.preventDefault()
    
    // Only handle mouse events on desktop
    if (this.isTouchDevice()) return
    
    this.holdTimer = setTimeout(() => {
      this.startHoldCountdown()
    }, 500)
  }
  
  handleMouseUp(event) {
    event.preventDefault()
    this.cancelHold()
  }
  
  handleMouseLeave(event) {
    this.cancelHold()
  }
  
  async quickDelete() {
    const span = this.element.querySelector("span:first-child")
    const response = await this.delete("/delete_completed_todos")
    
    // Animate based on result
    span.style.animation = response.status === 204 
      ? "error-shake 0.2s ease" 
      : "success-bounce 0.4s ease"
    
    setTimeout(() => span.style.animation = "", 400)
  }
  
  startHoldCountdown() {
    this.isHolding = true
    const button = this.element
    const span = button.querySelector("span:first-child")
    
    button.classList.add("recycle-active")
    span.textContent = "🗑️ 3"
    
    let count = 3
    this.countdownTimer = setInterval(() => {
      count--
      if (count > 0) {
        span.textContent = `🗑️ ${count}`
      } else {
        this.deleteAll()
      }
    }, 1000)
  }
  
  cancelHold() {
    clearTimeout(this.holdTimer)
    clearInterval(this.countdownTimer)
    this.holdTimer = null
    this.countdownTimer = null
    this.isHolding = false
    
    const button = this.element
    button.classList.remove("recycle-active")
    button.querySelector("span:first-child").textContent = "♻️"
  }
  
  async deleteAll() {
    await this.delete("/delete_completed_todos")
    await this.delete("/delete_non_todos")
    this.cancelHold()
  }
  
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
  
  async delete(endpoint) {
    const roomId = this.data.get("room-id")
    return fetch(`/rooms/${roomId}${endpoint}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": document.querySelector("[name='csrf-token']").content,
        "Accept": "text/vnd.turbo-stream.html"
      }
    })
  }
}