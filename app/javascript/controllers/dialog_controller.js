import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["dialog"]

  connect() {
    this.dialogTarget.setAttribute("aria-hidden", "true")
  }

  open(event) {
    // Don't open if we're in an input field (unless it's the trigger button)
    if (event && event.target.matches("input, textarea, [contenteditable]")) return

    this.dialogTarget.show()
    this.dialogTarget.setAttribute("aria-hidden", "false")

    // Focus the search input if present
    const searchInput = this.dialogTarget.querySelector("input[type=search]")
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 50)
    }
  }

  close() {
    this.dialogTarget.close()
    this.dialogTarget.setAttribute("aria-hidden", "true")
  }

  toggle(event) {
    if (this.dialogTarget.open) {
      this.close()
    } else {
      this.open(event)
    }
  }

  closeOnClickOutside({ target }) {
    if (!this.element.contains(target)) {
      this.close()
    }
  }
}
