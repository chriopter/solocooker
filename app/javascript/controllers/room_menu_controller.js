import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["dialog", "list"]

  connect() {
    this.dialogTarget.setAttribute("aria-hidden", "true")
  }

  open(event) {
    if (event && event.target.matches("input, textarea, [contenteditable]")) return

    this.dialogTarget.show()
    this.dialogTarget.setAttribute("aria-hidden", "false")
    this.buildMenu()
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

  buildMenu() {
    const list = this.listTarget
    if (list.dataset.built === "true") return

    // Wait for turbo frame to load
    const frame = this.element.querySelector("turbo-frame")
    if (!frame) return

    const checkLoaded = () => {
      // Find new ping link
      const newPing = frame.querySelector("a.direct__new, a.direct.direct__new")
      // Find all direct message links
      const directs = frame.querySelectorAll("a.direct:not(.direct__new)")
      // Find all room links
      const rooms = frame.querySelectorAll("a.room:not(.rooms__new-btn)")
      // Find new room link
      const newRoom = frame.querySelector("a.rooms__new-btn, a[href='/rooms/opens/new']")
      // Find settings links
      const settings = frame.querySelectorAll(".sidebar__tools a")

      if (directs.length === 0 && rooms.length === 0) {
        // Not loaded yet, try again
        setTimeout(checkLoaded, 100)
        return
      }

      list.innerHTML = ""

      // Add direct messages section (with new ping button)
      const dmSection = document.createElement("div")
      dmSection.className = "room-menu__section"

      // Add "New Ping" button first
      if (newPing) {
        const pingItem = this.createActionItem(newPing, "New Ping", "messages-add")
        if (pingItem) dmSection.appendChild(pingItem)
      }

      // Add direct messages
      directs.forEach(link => {
        const item = this.createDirectItem(link)
        if (item) dmSection.appendChild(item)
      })

      if (dmSection.children.length > 0) {
        list.appendChild(dmSection)
      }

      // Add rooms section
      const roomsSection = document.createElement("div")
      roomsSection.className = "room-menu__section"

      rooms.forEach(link => {
        const item = this.createRoomItem(link)
        if (item) roomsSection.appendChild(item)
      })

      // Add "New Room" button at end
      if (newRoom) {
        const newRoomItem = this.createActionItem(newRoom, "New Room", "add")
        if (newRoomItem) roomsSection.appendChild(newRoomItem)
      }

      if (roomsSection.children.length > 0) {
        list.appendChild(roomsSection)
      }

      // Add settings section
      if (settings.length > 0) {
        const settingsSection = document.createElement("div")
        settingsSection.className = "room-menu__section room-menu__section--settings"

        settings.forEach(link => {
          const item = this.createSettingsItem(link)
          if (item) settingsSection.appendChild(item)
        })

        list.appendChild(settingsSection)
      }

      list.dataset.built = "true"
    }

    checkLoaded()
  }

  createActionItem(originalLink, label, iconName) {
    const href = originalLink.getAttribute("href")
    if (!href) return null

    const item = document.createElement("a")
    item.href = href
    item.className = "room-menu__item room-menu__item--action"

    // Create a + icon span
    const iconSpan = document.createElement("span")
    iconSpan.className = "room-menu__action-icon"
    iconSpan.textContent = "+"
    item.appendChild(iconSpan)

    const nameSpan = document.createElement("span")
    nameSpan.className = "room-menu__name"
    nameSpan.textContent = label
    item.appendChild(nameSpan)

    return item
  }

  createDirectItem(originalLink) {
    const href = originalLink.getAttribute("href")
    if (!href) return null

    const item = document.createElement("a")
    item.href = href
    item.className = "room-menu__item"

    // Get avatar image
    const avatar = originalLink.querySelector("img")
    if (avatar) {
      const img = document.createElement("img")
      img.src = avatar.src
      img.className = "room-menu__avatar"
      item.appendChild(img)
    }

    // Get name text
    let name = ""
    const authorSpan = originalLink.querySelector(".direct__author .txt-nowrap")
    if (authorSpan) {
      name = authorSpan.textContent.replace("Ping with", "").replace("Start a ping with", "").trim()
    }

    if (!name) {
      name = originalLink.textContent.replace("Ping with", "").trim()
    }

    const nameSpan = document.createElement("span")
    nameSpan.className = "room-menu__name"
    nameSpan.textContent = name
    item.appendChild(nameSpan)

    return item
  }

  createRoomItem(originalLink) {
    const href = originalLink.getAttribute("href")
    if (!href) return null

    const item = document.createElement("a")
    item.href = href
    item.className = "room-menu__item"

    // Get room name (may include emoji)
    const roomName = originalLink.querySelector(".overflow-ellipsis")
    let name = roomName ? roomName.textContent.trim() : originalLink.textContent.trim()

    const nameSpan = document.createElement("span")
    nameSpan.className = "room-menu__name"
    nameSpan.textContent = name
    item.appendChild(nameSpan)

    // Check if shared room (has group icon)
    const groupIcon = originalLink.querySelector("img[src*='group']")
    if (groupIcon) {
      const badge = document.createElement("span")
      badge.className = "room-menu__badge"
      badge.textContent = "shared"
      item.appendChild(badge)
    }

    return item
  }

  createSettingsItem(originalLink) {
    const href = originalLink.getAttribute("href")
    if (!href) return null

    const item = document.createElement("a")
    item.href = href
    item.className = "room-menu__item room-menu__item--settings"

    // Get icon/avatar
    const icon = originalLink.querySelector("img")
    if (icon) {
      const img = document.createElement("img")
      img.src = icon.src
      img.className = "room-menu__icon"
      item.appendChild(img)
    }

    // Get label from for-screen-reader span
    const label = originalLink.querySelector(".for-screen-reader")
    const nameSpan = document.createElement("span")
    nameSpan.className = "room-menu__name"
    nameSpan.textContent = label ? label.textContent.trim() : "Settings"
    item.appendChild(nameSpan)

    return item
  }
}
