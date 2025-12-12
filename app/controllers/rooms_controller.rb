class RoomsController < ApplicationController
  before_action :set_room, only: %i[ show destroy delete_completed_todos delete_non_todos ]
  before_action :ensure_can_administer, only: %i[ destroy ]
  before_action :remember_last_room_visited, only: :show

  def index
    redirect_to room_url(Current.user.rooms.last)
  end

  def show
    if params[:thread_id].present?
      @thread_parent = @room.messages.find_by(id: params[:thread_id])
      if @thread_parent
        @messages = @thread_parent.children.with_creator.with_attachment_details.with_boosts.ordered
      else
        redirect_to room_path(@room), alert: "Thread not found"
        nil
      end
    else
      @messages = find_messages
    end
  end

  def destroy
    @room.destroy

    broadcast_remove_room
    redirect_to root_url
  end

  def delete_completed_todos
    # Scope to thread children if parent_id provided, otherwise root messages only
    base_scope = if params[:parent_id].present?
      @room.messages.where(ancestry: params[:parent_id])
    else
      @room.messages.roots_only
    end

    # Delete only completed todos
    completed_todos = base_scope.where(todo_state: 1)

    # Filter to only messages the user can administer
    @deleted_messages = completed_todos.select { |message| Current.user.can_administer?(message) }

    if @deleted_messages.any?
      # Track parent IDs before deleting
      parent_ids = @deleted_messages.map(&:parent_id).compact.uniq

      # Delete and broadcast removal for each message
      @deleted_messages.each do |message|
        message.destroy
        message.broadcast_remove_to @room, :messages
      end

      # Find and touch affected parents
      @affected_parents = Message.where(id: parent_ids)
      @affected_parents.each do |parent|
        parent.touch
        parent.broadcast_replace_to @room, :messages, partial: "messages/message", locals: { message: parent }
      end

      respond_to do |format|
        format.turbo_stream
        format.html { redirect_back(fallback_location: room_path(@room)) }
      end
    else
      respond_to do |format|
        format.turbo_stream { head :no_content }
        format.html {
          redirect_back(fallback_location: room_path(@room),
                       alert: "No completed todos to delete or you don't have permission")
        }
      end
    end
  end

  def delete_non_todos
    # Scope to thread children if parent_id provided, otherwise root messages only
    base_scope = if params[:parent_id].present?
      @room.messages.where(ancestry: params[:parent_id])
    else
      @room.messages.roots_only
    end

    # Delete only non-todo messages (todo_state IS NULL)
    non_todos = base_scope.where(todo_state: nil)

    # Filter to only messages the user can administer
    @deleted_messages = non_todos.select { |message| Current.user.can_administer?(message) }

    if @deleted_messages.any?
      # Track parent IDs before deleting
      parent_ids = @deleted_messages.map(&:parent_id).compact.uniq

      @deleted_messages.each do |message|
        message.destroy
        message.broadcast_remove_to @room, :messages
      end

      # Find and touch affected parents
      @affected_parents = Message.where(id: parent_ids)
      @affected_parents.each do |parent|
        parent.touch
        parent.broadcast_replace_to @room, :messages, partial: "messages/message", locals: { message: parent }
      end

      respond_to do |format|
        format.turbo_stream
        format.html { redirect_back(fallback_location: room_path(@room)) }
      end
    else
      respond_to do |format|
        format.turbo_stream { head :no_content }
        format.html {
          redirect_back(fallback_location: room_path(@room),
                       alert: "No messages to delete or you don't have permission")
        }
      end
    end
  end

  private
    def set_room
      if room = Current.user.rooms.find_by(id: params[:room_id] || params[:id])
        @room = room
      else
        redirect_to root_url, alert: "Room not found or inaccessible"
      end
    end

    def ensure_can_administer
      head :forbidden unless Current.user.can_administer?(@room)
    end

    def ensure_permission_to_create_rooms
      if Current.account&.settings&.restrict_room_creation_to_administrators? && !Current.user.administrator?
        head :forbidden
      end
    end

    def find_messages
      # Only show root messages (not thread children) in main feed
      messages = @room.messages.roots_only.with_creator.with_attachment_details.with_boosts

      if show_first_message = messages.find_by(id: params[:message_id])
        @messages = messages.page_around(show_first_message)
      else
        @messages = messages.last_page
      end
    end

    def room_params
      params.require(:room).permit(:name)
    end

    def broadcast_remove_room
      broadcast_remove_to :rooms, target: [ @room, :list ]
    end
end
