import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.holdTimer = null
    this.countdownTimer = null
    this.touchStartTime = null
    this.holdTriggered = false
  }
  
  async handleClick(event) {
    event.preventDefault()
    
    // Don't handle click if a hold was triggered (for mobile)
    if (this.holdTriggered) {
      this.holdTriggered = false
      return
    }
    
    const span = event.currentTarget.querySelector("span:first-child")
    
    const response = await this.delete("/delete_completed_todos")
    
    // Animate based on result
    span.style.animation = response.status === 204 
      ? "error-shake 0.2s ease" 
      : "success-bounce 0.4s ease"
    
    setTimeout(() => span.style.animation = "", 400)
  }
  
  startHold(event) {
    event.preventDefault()
    
    // Track touch start time for mobile
    if (event.type === 'touchstart') {
      this.touchStartTime = Date.now()
    }
    
    this.holdTimer = setTimeout(() => {
      this.holdTriggered = true
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
          clearInterval(this.countdownTimer)
          this.deleteAll()
        }
      }, 1000)
    }, 500)
  }
  
  cancelHold(event) {
    // For touch events, check if this was a quick tap
    if (event && event.type === 'touchend' && this.touchStartTime) {
      const touchDuration = Date.now() - this.touchStartTime
      if (touchDuration < 200 && !this.holdTriggered) {
        // This was a quick tap, trigger the click behavior
        setTimeout(() => this.handleClick(event), 0)
        return
      }
    }
    
    // Reset everything except holdTriggered flag which is handled in handleClick
    clearTimeout(this.holdTimer)
    clearInterval(this.countdownTimer)
    this.touchStartTime = null
    
    const button = this.element
    button.classList.remove("recycle-active")
    button.querySelector("span:first-child").textContent = "♻️"
  }
  
  async deleteAll() {
    await this.delete("/delete_completed_todos")
    await this.delete("/delete_non_todos")
    this.resetState()
  }
  
  resetState() {
    clearTimeout(this.holdTimer)
    clearInterval(this.countdownTimer)
    this.holdTriggered = false
    this.touchStartTime = null
    
    const button = this.element
    button.classList.remove("recycle-active")
    button.querySelector("span:first-child").textContent = "♻️"
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