import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["item", "section"]

  filter(event) {
    const query = event.target.value.toLowerCase().trim()

    this.itemTargets.forEach(item => {
      const text = item.textContent.toLowerCase()
      if (query === "" || text.includes(query)) {
        item.removeAttribute("hidden")
      } else {
        item.setAttribute("hidden", "")
      }
    })
  }
}
