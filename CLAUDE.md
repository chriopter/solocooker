# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Campfire is a Rails 8 web-based chat application with features including multiple rooms, direct messages, file attachments, search, web push notifications, @mentions, and bot API support. It's a single-tenant application using SQLite for data storage and Redis for caching/background jobs.

## Development Commands

### Running the Application
```bash
bin/dev          # Start Rails server and Redis using foreman
bin/rails server # Start Rails server only (port 3000)
bin/setup        # Initial setup of the application
```

### Testing
```bash
bin/rails test              # Run unit tests
bin/rails test:system       # Run system tests
bin/rails test test/path/to/test.rb:LINE  # Run specific test
bin/ci                      # Run full CI suite (style, security, tests)
```

### Code Quality & Linting
```bash
bin/rubocop                 # Run Ruby style checks
bin/brakeman                # Run security analysis
bin/bundler-audit           # Audit gems for vulnerabilities
bin/importmap audit         # Check importmap dependencies
```

### Database
```bash
bin/rails db:migrate        # Run pending migrations
bin/rails db:seed           # Load seed data
bin/rails db:seed:replant   # Clear and reload seed data
bin/rails console           # Open Rails console
```

## Architecture

### Core Models & Relationships

**User** (`app/models/user.rb`)
- Central authentication model with secure passwords
- Has many memberships, rooms (through memberships), messages, push_subscriptions, boosts, searches, sessions
- Supports bot users (see `app/models/user/bot.rb`)
- Avatar system with token-based URLs

**Room** (`app/models/room.rb`)
- Three types: `Rooms::Open` (public), `Rooms::Closed` (invite-only), `Rooms::Direct` (DMs)
- Has many memberships, users (through memberships), messages
- Handles message reception, unread tracking, and push notifications

**Message** (`app/models/message.rb`)
- Belongs to room and creator (User)
- Uses ActionText for rich text content
- Supports attachments, mentions, boosts, and sound commands
- Includes todo state tracking (recently added feature)
- Client message IDs for deduplication

**Membership** (`app/models/membership.rb`)
- Join table between users and rooms
- Tracks involvement level (mentions/everything) and unread status
- Handles connection state for presence

### Frontend Architecture

- **Hotwire Stack**: Turbo + Stimulus for reactive UI without complex JavaScript
- **Stimulus Controllers** (`app/javascript/controllers/`): Handle client-side interactions
  - `todo_controller.js`: Manages todo state toggling (new feature)
  - `composer_controller.js`: Message composition with file uploads
  - `sidebar_controller.js`: Collapsible sidebar navigation
  - Other controllers for autocomplete, notifications, scrolling, etc.

### Background Jobs

- Uses Resque with Redis for job processing
- Key jobs: `Room::PushMessageJob`, `Push::NotificationJob`
- Configured via `resque-pool` for worker management

### Real-time Features

- ActionCable for WebSocket connections
- Channels: `ApplicationCable`, `RoomChannel`
- Broadcasts for message updates, user presence

### Authentication & Security

- Session-based authentication with secure tokens
- Transfer sessions for device switching
- Bot authentication via API keys
- Account-level access controls

## Key Patterns

1. **Current Model**: Thread-local storage for current user/account context
2. **Concerns**: Shared behavior modules (e.g., `Mentionable`, `Searchable`, `Broadcasts`)
3. **Service Objects**: Background job classes for async processing
4. **View Components**: Partial-based UI composition with Turbo Frames
5. **Active Storage**: File uploads with image processing

## Recent Changes

- Added todo state to messages (see modified files in git status)
- New `todo_controller.js` for frontend todo toggling
- Route added: `PATCH /rooms/:room_id/messages/:id/toggle_todo`