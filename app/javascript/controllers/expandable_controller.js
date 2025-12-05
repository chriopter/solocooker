import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.content = this.element.querySelector(".message__body-content")
    if (!this.content) return

    requestAnimationFrame(() => {
      const isTruncated = this.content.scrollHeight > this.content.clientHeight + 1
      if (isTruncated) {
        this.addReadMore()
      }
    })
  }

  disconnect() {
    if (this.link) this.link.remove()
  }

  addReadMore() {
    this.link = document.createElement("span")
    this.link.className = "thread-view__read-more"
    this.link.textContent = " ...read more"
    this.link.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.toggle()
    })
    this.content.appendChild(this.link)
  }

  toggle() {
    const expanded = this.content.classList.toggle("expanded")
    this.link.textContent = expanded ? " show less" : " ...read more"
  }
}
