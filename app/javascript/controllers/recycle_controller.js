import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.holdTimer = null
    this.countdownTimer = null
  }
  
  async handleClick(event) {
    event.preventDefault()
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
    
    this.holdTimer = setTimeout(() => {
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
  
  cancelHold() {
    clearTimeout(this.holdTimer)
    clearInterval(this.countdownTimer)
    
    const button = this.element
    button.classList.remove("recycle-active")
    button.querySelector("span:first-child").textContent = "♻️"
  }
  
  async deleteAll() {
    await this.delete("/delete_completed_todos")
    await this.delete("/delete_non_todos")
    this.cancelHold()
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