class MessagesController < ApplicationController
  include ActiveStorage::SetCurrent, RoomScoped

  before_action :set_room, except: :create
  before_action :set_message, only: %i[ show edit update destroy toggle_todo add_to_thread remove_from_thread move_to_room ]
  before_action :ensure_can_administer, only: %i[ edit update destroy ]

  layout false, only: :index

  def index
    @messages = find_paged_messages

    if @messages.any?
      fresh_when @messages
    else
      head :no_content
    end
  end

  def create
    set_room
    @message = @room.messages.create_with_attachment!(message_params)

    # If parent_id is provided, set the parent for threading
    if params[:parent_id].present?
      parent = @room.messages.find_by(id: params[:parent_id])
      @message.update!(parent: parent) if parent
    end

    @message.broadcast_create
    deliver_webhooks_to_bots
  rescue ActiveRecord::RecordNotFound
    render action: :room_not_found
  end

  def show
  end

  def edit
  end

  def update
    @message.update!(message_params)

    @message.broadcast_replace_to @room, :messages, target: [ @message, :presentation ], partial: "messages/presentation", attributes: { maintain_scroll: true }
    redirect_to room_message_url(@room, @message)
  end

  def destroy
    parent_id = @message.parent_id
    @message.destroy
    @message.broadcast_remove
    if parent_id && (parent = Message.find_by(id: parent_id))
      parent.touch # Invalidate cache so reply_count updates
      parent.broadcast_replace_to @room, :messages, partial: "messages/message", locals: { message: parent }
    end
  end

  def toggle_todo
    @message.toggle_todo!

    respond_to do |format|
      format.turbo_stream { head :ok }
      format.html { redirect_back(fallback_location: room_path(@room)) }
    end
  end

  def add_to_thread
    parent_id = params[:parent_id]
    parent_message = @room.messages.find(parent_id)

    # Track old parent for turbo stream update
    @old_parent = @message.parent

    # Only allow one level deep - attach to root if parent has ancestry
    @actual_parent = parent_message.is_root? ? parent_message : parent_message.root

    # If message has children, move them to the same parent (keep max 2 levels)
    @message.children.update_all(ancestry: @actual_parent.id.to_s) if @message.has_children?

    @message.update!(parent: @actual_parent)

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_back(fallback_location: room_path(@room)) }
    end
  end

  def remove_from_thread
    @old_parent = @message.parent
    @message.update!(parent: nil)
    @message.reload

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_back(fallback_location: room_path(@room)) }
    end
  end

  def move_to_room
    target_room = Current.user.rooms.find(params[:target_room_id])

    # Remove from thread if in one (but keep own children)
    @message.update!(parent: nil) if @message.parent

    # Move children too, preserving their relationship to this message
    @message.children.update_all(room_id: target_room.id)

    # Move the message itself
    @message.update!(room_id: target_room.id)

    # Broadcast removal from current room
    @message.broadcast_remove_to @room, :messages

    # Broadcast addition to new room
    @message.broadcast_create

    respond_to do |format|
      format.json { render json: { success: true, redirect_url: room_path(target_room) } }
      format.html { redirect_to room_path(target_room) }
    end
  end

  private
    def set_message
      @message = @room.messages.find(params[:id])
    end

    def ensure_can_administer
      head :forbidden unless Current.user.can_administer?(@message)
    end


    def find_paged_messages
      case
      when params[:before].present?
        @room.messages.with_creator.page_before(@room.messages.find(params[:before]))
      when params[:after].present?
        @room.messages.with_creator.page_after(@room.messages.find(params[:after]))
      else
        @room.messages.with_creator.last_page
      end
    end


    def message_params
      params.require(:message).permit(:body, :attachment, :client_message_id)
    end


    def deliver_webhooks_to_bots
      bots_eligible_for_webhook.excluding(@message.creator).each { |bot| bot.deliver_webhook_later(@message) }
    end

    def bots_eligible_for_webhook
      @room.direct? ? @room.users.active_bots : @message.mentionees.active_bots
    end
end
