#!/usr/bin/env bash
if [ "$#" -eq 1 ]; then stdinmsg=$(cat); fi
exec <"$0" || exit; read v; read v; read v; exec /usr/bin/osascript - "$@" "$stdinmsg"; exit

-- another way of waiting until an app is running
on waitUntilRunning(appname, delaytime)
    repeat until my appIsRunning(appname)
        tell application "Messages" to close window 1
        delay delaytime
    end repeat

    -- the fact that Messages.app is running
    -- does not mean it is ready to send,
    -- unfortunately, add another small delay
    delay delaytime
end waitUntilRunning

on appIsRunning(appName)
    application appname is running
end appIsRunning

on run {targetBuddyPhone, targetMessage}
    tell application "Messages"
        -- if Messages.app was not running, launch it
        set wasRunning to true
        if it is not running then
            set wasRunning to false
            launch
            my waitUntilRunning("Messages", 1)
            close window 1
        end if

        -- send the message
        set targetService to 1st service whose service type = iMessage
        set targetBuddy to buddy targetBuddyPhone of targetService
        send targetMessage to targetBuddy

        -- if the app was not running, close the window
        if not wasRunning
            quit
        end if
    end tell
end run
