import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import './index.css';

var tmi = require('tmi.js');

const options = {
  options : {
    debug : true
  },
  connection : {
    cluster : "aws",
    reconnect : true
  },
  identity : {
    username : "dankestmemebot1",
    password : "oauth:0s1d2v64lfimjhbrq5u57m904hb5g5",
  },
  channels : ["moonmoon_ow"]
}

// Chat state and render logic
// Check this out: https://codepen.io/halvves/pen/qQxPNo?editors=1010

const addMessage = (oldMessages, newMessage, chatLength) => { 
		const newMessages = oldMessages.concat([newMessage]);
		if(newMessages.length > chatLength) {
			return newMessages.slice(1,chatLength+1);
		}
		return newMessages;
	}

function ChatBox(props) {
	const [chatMessages, setChatMessages] = useState([]);

	useEffect(() => {
		props.onChatMessage(
			(newMessage) => 
				setChatMessages((oldChatMessages) => 
					addMessage(oldChatMessages, newMessage, props.chatLength)
			)
		);
	}, [])

	return <div>
		<h1> Chat: </h1> 
		<ul> {chatMessages.map(
		      (item,i) => <li key={i}> {(item.username + " says: " + item.messageContent)} </li>
		)} </ul>
		</div>
}

// Create convenient Twitch API using official TMI API 
function useTwitchAPI(props) {
	const [tmiAPI, setTmiAPI] = useState(new tmi.client(props.options))

	function connectToTwitch(options) {
		tmiAPI.connect();
	}

	function disconnectFromTwitch() {
		tmiAPI.disconnect();
	}

	function onChatMessage(reaction) {
		tmiAPI.on("chat", (channel,userstate,message,self) => {
		      reaction({username:userstate.username, messageContent:message})
		    });
	}

	return {
		connectToTwitch : connectToTwitch,
		disconnectFromTwitch : disconnectFromTwitch,
		onChatMessage : onChatMessage 
	}
}




// Generalization of react with Hooks
// props: immutable properties
// initialState : initial mutable state
// onEvent : pure function denoting state change as a result of new event (f(props,prevState,eventData))
// registerEventListener : lifts onEvent to mutate component state asynchronously per event stream element
// dataToJSX : GUI that displays state and props
// TODO: Consider removing props altogether, since it can be thunked where necessary
// This would have the benefit of eliminating an additional (untyped, thx JS) dependency => more bugs

function StreamingComponent(props, initialState, onEvent, registerEventListener, JsxGui) {
	const [state, setState] = useState(initialState);

	useEffect(() => 
		registerEventListener(
			(eventInput) => 
			setState(
				(prevState) => onEvent(props, prevState, eventInput)
				)
			)
	, []);	
	
	return JsxGui(props, state)
}


// Given the framework, the implementation of chat is 'perfectly declarative'
const GenericChatBox = (chatLength, onChatMessage) =>
	StreamingComponent( 
			{chatLength:chatLength},
			[],
			genericAddMessage,
			onChatMessage,
			ChatJsxGui)

const ChatJsxGui = (props,state) => 
	<div>
		<h1> Chat: </h1> 
		<ul> {state.map(
		      (item,i) => <li key={i}> {(item.username + " says: " + item.messageContent)} </li>
		)} </ul>
	</div>


const genericAddMessage = (props, prevState, eventData) => addMessage(prevState, eventData, props.chatLength); 


// Application Root
function App(props) {
	const twitchAPI = useTwitchAPI({options : props.options})

	useEffect(() => {
		twitchAPI.connectToTwitch(); 
	},[]);
	return (
		<div>
		      <h1> Twitch Channel: {props.options.channels[0]} </h1>
		      <ChatBox chatLength={props.chatLength} onChatMessage={twitchAPI.onChatMessage} />
		      {GenericChatBox(props.chatLength,twitchAPI.onChatMessage)}
		</div>
	);
}
	
ReactDOM.render(<App options={options} chatLength={5}/>, document.getElementById('root'))

/*
// Example of nested React Components
const A = (x, OtherThing) => <div> <h1> hey, {x} </h1> {OtherThing(x)}  </div>
const B = (x) => <p> I love you, {x} </p>

function genericComponent(x, Thing, OtherThing) {
	return Thing(x,OtherThing)
}

ReactDOM.render(genericComponent('bitch',A,B), document.getElementById('root'))
*/
