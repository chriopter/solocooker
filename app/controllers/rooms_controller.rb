class RoomsController < ApplicationController
  before_action :set_room, only: %i[ show destroy delete_completed_todos delete_non_todos ]
  before_action :ensure_can_administer, only: %i[ destroy ]
  before_action :remember_last_room_visited, only: :show

  def index
    redirect_to room_url(Current.user.rooms.last)
  end

  def show
    @messages = find_messages
  end

  def destroy
    @room.destroy

    broadcast_remove_room
    redirect_to root_url
  end

  def delete_completed_todos
    # Delete only completed todos
    completed_todos = @room.messages.where(todo_state: 1)
    
    # Filter to only messages the user can administer
    deletable_messages = completed_todos.select { |message| Current.user.can_administer?(message) }
    
    if deletable_messages.any?
      # Delete and broadcast removal for each message
      deletable_messages.each do |message|
        message.destroy
        message.broadcast_remove_to @room, :messages
      end
      
      respond_to do |format|
        format.turbo_stream { head :ok }
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
    # Delete only non-todo messages (todo_state IS NULL)
    non_todos = @room.messages.where(todo_state: nil)
    
    # Filter to only messages the user can administer
    deletable_messages = non_todos.select { |message| Current.user.can_administer?(message) }
    
    if deletable_messages.any?
      deletable_messages.each do |message|
        message.destroy
        message.broadcast_remove_to @room, :messages
      end
      
      respond_to do |format|
        format.turbo_stream { head :ok }
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

    def find_messages
      messages = @room.messages.with_creator

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
