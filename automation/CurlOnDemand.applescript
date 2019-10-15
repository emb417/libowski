(*

File: CurlOnDemand.applescript

Abstract: This script demonstrates the AppleScript "Message Received" handler for Messages. It will parse incoming messages to curl local server.

Version: 1.0

*)

using terms from application "Messages"

	on encodeMessage(theMessage)
		set encodedMessage to theMessage
		if (encodedMessage starts with "holds ") or (encodedMessage starts with "due ") then
			set encodedMessage to do shell script "echo " & quoted form of encodedMessage & " | sed -e 's/ /\\//g'"
		end if
		set encodedMessage to do shell script "echo " & quoted form of encodedMessage & " | sed -e 's/ /\\//'"
		if (encodedMessage starts with "due/") or (encodedMessage starts with "holds/") or (encodedMessage starts with "now/") then
			set encodedMessage to do shell script "echo " & quoted form of encodedMessage & " | sed -e 's/ /\\//'"
		end if
		set encodedMessage to do shell script "echo " & quoted form of encodedMessage & " | sed -e 's/ /+/g'"
		return encodedMessage
	end encodeMessage

	on curlOnDemand(theMessage)
		if (theMessage starts with "what ps4 games are at bms") then
			set theMessage to "now/bms/ps4"
		end if
		if (theMessage starts with "what blurays are at bms") then
			set theMessage to "now/bms/bluray"
		end if
		if (theMessage starts with "what ps4 games are at bcc") then
			set theMessage to "now/bcc/ps4"
		end if
		if (theMessage starts with "what blurays are at bcc") then
			set theMessage to "now/bcc/bluray"
		end if
		if (theMessage starts with "what ps4 games are at cmc") then
			set theMessage to "now/cmc/ps4"
		end if
		if (theMessage starts with "what blurays are at cmc") then
			set theMessage to "now/cmc/bluray"
		end if
		if (theMessage starts with "what ps4 games are at cmb") then
			set theMessage to "now/cmb/ps4"
		end if
		if (theMessage starts with "what blurays are at cmb") then
			set theMessage to "now/cmb/bluray"
		end if
		if (theMessage starts with "what’s due" and name of theBuddy is "+1 (555) 123-4567") or (theMessage starts with "what's due" and name of theBuddy is "+1 (555) 123-4567") then
			set theMessage to "due/1234567890/1234"
		end if
		if (theMessage starts with "renew") then
		set theMessage to do shell script "echo " & quoted form of theMessage & " | sed -e 's/[rR]enew/due 1234567890 1234 renew/'"
		end if
		if (theMessage starts with "what’s requested" and name of theBuddy is "+1 (555) 123-4567") or (theMessage starts with "what's requested" and name of theBuddy is "+1 (555) 123-4567") then
			set theMessage to "holds/1234567890/1234"
		end if
		if (theMessage starts with "request hold for") then
			set theMessage to do shell script "echo " & quoted form of theMessage & " | sed -e 's/[rR]equest hold for/holds 1234567890 1234 add/'"
		end if
		if (theMessage starts with "cancel hold for") then
			set theMessage to do shell script "echo " & quoted form of theMessage & " | sed -e 's/[cC]ancel hold for/holds 1234567890 1234 cancel/'"
		end if
		if (theMessage starts with "what's up") or (theMessage starts with "what’s up") then
			set theMessage to "news"
		end if
		if (theMessage starts with "where is") then
			set theMessage to do shell script "echo " & quoted form of theMessage & " | sed -e 's/[wW]here is/find/'"
		end if
		if (theMessage starts with "where’s") then
			set theMessage to do shell script "echo " & quoted form of theMessage & " | sed -e 's/[wW]here’s/find/'"
		end if
		if (theMessage starts with "where's") then
			set theMessage to do shell script "echo " & quoted form of theMessage & " | sed -e 's/[wW]here\\'s/find/'"
		end if		
		set thePath to encodeMessage(theMessage)
		if (thePath is "branches") or (thePath starts with "hours") or (thePath is "list") or (thePath is "help") or (thePath is "news") or (thePath starts with "add/") or (thePath starts with "remove/") or (thePath starts with "due/") or (thePath starts with "holds/") or (thePath starts with "find/") or (thePath starts with "status/") or (thePath starts with "now/") then
			set theResponse to do shell script "curl http://127.0.0.1:1337/" & thePath
			if (theResponse is "{}") then
				return "Mark it a zero."
			end if
			return theResponse
		end if
		if (theMessage starts with "where am i") then
			return "Yeah, well, I'm outta here."
		end if
		return "Yeah, well, that's just, like, your opinion, man."
	end curlOnDemand

	on message received theMessage from theBuddy for theChat
		set theResponse to curlOnDemand(theMessage)
		send theResponse to theChat
	end message received

	on active chat message received theMessage from theBuddy for theChat
		set theResponse to curlOnDemand(theMessage)
		send theResponse to theChat
	end active chat message received

	on received text invitation theMessage from theBuddy for theChat

	end received text invitation

	on addressed chat room message received theMessage from theBuddy for theChat

	end addressed chat room message received

	on addressed message received theMessage from theBuddy for theChat

	end addressed message received

	on received audio invitation theText from theBuddy for theChat

	end received audio invitation

	on received video invitation theText from theBuddy for theChat

	end received video invitation

	on received file transfer invitation theFileTransfer

	end received file transfer invitation

	on buddy authorization requested theRequest

	end buddy authorization requested

	on message sent theMessage for theChat

	end message sent

	on chat room message received theMessage from theBuddy for theChat

	end chat room message received

	on av chat started

	end av chat started

	on av chat ended

	end av chat ended

	on login finished for theService

	end login finished

	on logout finished for theService

	end logout finished

	on buddy became available theBuddy

	end buddy became available

	on buddy became unavailable theBuddy

	end buddy became unavailable

	on completed file transfer

	end completed file transfer

end using terms from
