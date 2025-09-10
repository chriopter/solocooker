import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  async deleteCompletedTodos(event) {
    event.preventDefault()
    
    const roomId = this.data.get("room-id")
    const url = `/rooms/${roomId}/delete_completed_todos`
    
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content,
          "Accept": "text/vnd.turbo-stream.html"
        }
      })
      
      if (!response.ok) {
        if (response.status === 204) {
          // No content - no todos to delete or no permission
          console.log("No completed todos to delete or insufficient permissions")
        } else {
          throw new Error(`Failed to delete completed todos: ${response.status}`)
        }
      }
    } catch (error) {
      console.error("Error deleting completed todos:", error)
    }
  }
}