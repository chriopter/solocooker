# Solocooker

Solocooker is a campfire fork which adds the ability to convert messages to to-dos as well as a recycle button ♻️.\
The recycle button deletes completed to-dos (click) or cleans up the whole room except incompleted todos (click and hold).

I use this like a disposable piece of paper while working, wrapping up by deleting all notes soon as i found the core of a problem.\
Works great on shared projects as well.

![output](https://github.com/user-attachments/assets/5c1b5e44-08c3-4125-990c-c3647943c66a)

# Details / Changes from campfire
- Message have three states (normal, incomplete and completed to do). Clicking the to-do circle will always push it into the next state, e.g. a finished to-do can be a normal message again.
- Rooms shared with others are marked with a symbol in the list
- You can message yourself in Pings to allow quick notes
- Recycle button: Click to delete completed todos, hold to delete all messages except incomplete todos

# Installation
Run `bin/setup` to install dependencies and prepare the database, then start with `bin/dev`. For production deployment, use `bin/deploy` which uses Kamal for containerized deployment, expects secrets from 1PW.

# Thank you
This idea was originally a rails app i build for myself, thankfully 37Signals Open-Sourced campfire which i now use as base with just some UI changes on top.
https://github.com/basecamp/once-campfire

This is work in progress, therefore e.g. some assets are still shared with campfire (favicon etc.)
