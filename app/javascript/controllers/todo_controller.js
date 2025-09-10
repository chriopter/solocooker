import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  click(event) {
    const button = event.currentTarget
    const messageElement = button.closest('.message')
    
    // Immediately toggle the visual state
    if (button.classList.contains("message__todo-btn--checked")) {
      // Checked -> Remove (no todo)
      button.classList.remove("message__todo-btn--checked")
      button.classList.remove("message__todo-btn--unchecked")
      // Remove the checked class from message
      messageElement.classList.remove("message--todo-checked")
      messageElement.classList.remove("message--todo")
    } else if (button.classList.contains("message__todo-btn--unchecked")) {
      // Unchecked -> Checked
      button.classList.remove("message__todo-btn--unchecked")
      button.classList.add("message__todo-btn--checked")
      button.classList.add("no-hover") // Temporarily disable hover effect
      // Add the checked class to message
      messageElement.classList.add("message--todo")
      messageElement.classList.add("message--todo-checked")
      
      // Remove no-hover class when mouse leaves
      button.addEventListener('mouseleave', () => {
        button.classList.remove('no-hover')
      }, { once: true })
    } else {
      // No todo -> Unchecked
      button.classList.add("message__todo-btn--unchecked")
      button.classList.add("no-hover") // Temporarily disable hover effect
      // Add todo class but not checked
      messageElement.classList.add("message--todo")
      messageElement.classList.remove("message--todo-checked")
      
      // Remove no-hover class when mouse leaves
      button.addEventListener('mouseleave', () => {
        button.classList.remove('no-hover')
      }, { once: true })
    }
  }
}