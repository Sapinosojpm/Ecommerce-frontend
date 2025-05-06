import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket'],
  autoConnect: true,
  reconnectionAttempts: 5
});

const LiveStreamViewer = ({ userName = 'Viewer' }) => {  // Default to 'Viewer' if not provided
  const remoteVideoRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stream, setStream] = useState(null);
  const [viewers, setViewers] = useState(0);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [isLive, setIsLive] = useState(false);
  const peerConnection = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const chatBoxRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionState, setConnectionState] = useState('disconnected');

  // Auto-scroll chat
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [comments]);

  // Connection state monitoring
  useEffect(() => {
    console.log('Connection state changed:', connectionState);
  }, [connectionState]);

  // Video element verification
  useEffect(() => {
    if (remoteVideoRef.current) {
      console.log('Video element initialized:', {
        autoPlay: remoteVideoRef.current.autoplay,
        playsInline: remoteVideoRef.current.playsInline,
        readyState: remoteVideoRef.current.readyState
      });
    }
  }, []);

  // Socket and WebRTC setup
  useEffect(() => {
    // Socket event listeners
    const socketListeners = {
      'connect': () => {
        console.log('Connected to server');
        setIsConnected(true);
        setConnectionState('socket-connected');
      },
      'disconnect': () => {
        console.log('Disconnected from server');
        setIsConnected(false);
        setConnectionState('socket-disconnected');
      },
      'viewer-count': (count) => {
        setViewers(count);
      },
      'stream-ended': () => {
        console.log('Stream ended by admin');
        cleanupConnection();
      },
      'offer': async ({ offer }) => {
        console.log('Received offer from admin');
        if (!peerConnection.current) {
          createPeerConnection();
        }

        try {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          console.log('Set remote description');

          const answer = await peerConnection.current.createAnswer({
            offerToReceiveAudio: false,
            offerToReceiveVideo: false
          }).catch(error => {
            console.error('Error creating answer:', error);
            throw error;
          });

          await peerConnection.current.setLocalDescription(answer);
          console.log('Created answer');

          socket.emit('answer', { 
            answer: peerConnection.current.localDescription 
          });
        } catch (error) {
          console.error('Error handling offer:', error);
          handleConnectionFailure();
        }
      },
      'ice-candidate': async ({ viewerId, candidate }) => {
        console.log('Received ICE candidate from admin');
        if (peerConnection.current) {
          try {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
            console.log('Added ICE candidate');
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
      },
      'new-comment': (newComment) => {
        setComments(prev => [...prev, newComment]);
      }
    };

    // Add all socket listeners
    Object.entries(socketListeners).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Join as viewer
    socket.emit('viewer-join');
    setIsLoading(false);

    // WebSocket monitoring
    const logSocket = (event, ...args) => {
      console.log(`Socket ${event}`, args);
    };
    socket.onAny(logSocket);

    return () => {
      // Cleanup socket listeners
      Object.keys(socketListeners).forEach(event => {
        socket.off(event);
      });
      socket.offAny(logSocket);
      
      cleanupConnection();
      socket.emit('viewer-leave');
    };
  }, []);

  const createPeerConnection = () => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate to admin');
          socket.emit('ice-candidate', {
            target: 'admin-room',
            candidate: event.candidate
          });
        }
      };

      pc.ontrack = (event) => {
        console.log('Received track event:', event.track.kind);
        
        if (event.track.kind === 'video') {
          console.log('Video track settings:', {
            width: event.track.getSettings().width,
            height: event.track.getSettings().height,
            frameRate: event.track.getSettings().frameRate
          });
        }

        if (!remoteVideoRef.current.srcObject) {
          remoteVideoRef.current.srcObject = new MediaStream();
        }
        
        const stream = remoteVideoRef.current.srcObject;
        stream.addTrack(event.track);
        
        setIsLive(true);
        setConnectionState('stream-active');
        console.log('Stream active:', stream.active);
        console.log('Tracks in stream:', stream.getTracks().map(t => t.kind));
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        setConnectionState(`ice-${pc.iceConnectionState}`);
        
        if (pc.iceConnectionState === 'disconnected' || 
            pc.iceConnectionState === 'failed') {
          console.log('Connection to stream lost');
          setIsLive(false);
          handleConnectionFailure();
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        setConnectionState(pc.connectionState);
      };

      pc.onnegotiationneeded = () => console.log('Negotiation needed');
      pc.onsignalingstatechange = () => 
        console.log('Signaling state:', pc.signalingState);
      pc.onicegatheringstatechange = () => 
        console.log('ICE gathering state:', pc.iceGatheringState);

      peerConnection.current = pc;
      console.log('Created peer connection');
      setConnectionState('peer-connection-created');
    } catch (error) {
      console.error('Error creating peer connection:', error);
      setConnectionState('peer-connection-failed');
      handleConnectionFailure();
    }
  };

  const cleanupConnection = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => {
        track.stop();
        if (remoteVideoRef.current.srcObject) {
          remoteVideoRef.current.srcObject.removeTrack(track);
        }
      });
      remoteVideoRef.current.srcObject = null;
    }
    
    setIsLive(false);
    setConnectionState('disconnected');
    setRetryCount(0);
  };

  const handleConnectionFailure = () => {
    if (retryCount < 3) {
      setTimeout(() => {
        console.log(`Retrying connection (attempt ${retryCount + 1})`);
        setRetryCount(retryCount + 1);
        cleanupConnection();
        createPeerConnection();
      }, 2000 * (retryCount + 1)); // Exponential backoff
    } else {
      console.log('Max retry attempts reached');
    }
  };

  const handlePostComment = () => {
    if (comment.trim()) {
      socket.emit('post-comment', { 
        comment, 
        name: userName // Use the passed userName instead of hardcoded 'Viewer'
      });
      setComment('');
    }
  };

  return (
    <div className="max-w-6xl p-6 mx-auto mt-[5%] space-y-6 bg-gray-100 shadow-lg rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {isLive ? 'Live Stream' : 'Stream Offline'}
          </h2>
          <p className="text-sm text-gray-600">
            {viewers} {viewers === 1 ? 'viewer' : 'viewers'} watching
          </p>
          <p className="text-xs text-gray-500">
            Connection state: {connectionState}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isLive && (
            <span className="flex items-center px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-full">
              <span className="w-3 h-3 mr-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>
          )}
          {!isLive && retryCount > 0 && (
            <span className="px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-200 rounded-full">
              Reconnecting...
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isLive ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted
                controls
                className="w-full bg-black rounded-lg shadow-md aspect-video"
                onError={(e) => console.error('Video error:', e.target.error)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-gray-200 rounded-lg shadow-md aspect-video">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-4 text-lg font-medium text-gray-600">
                  The stream is currently offline
                </p>
                <p className="text-sm text-gray-500">
                  {retryCount > 0 ? 'Attempting to reconnect...' : 'Please check back later'}
                </p>
                {retryCount >= 3 && (
                  <button
                    onClick={() => {
                      setRetryCount(0);
                      createPeerConnection();
                    }}
                    className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Retry Connection
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-white">Live Chat</h3>
              <div ref={chatBoxRef} className="h-64 mt-3 space-y-3 overflow-y-auto">
                {comments.map((msg, i) => (
                  <div key={i} className="p-2 bg-gray-700 rounded-md shadow-sm">
                    <p className="text-sm font-semibold text-blue-400">
                      {msg.name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-white">{msg.comment}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-gray-400">
                    No messages yet. Be the first to chat!
                  </p>
                )}
              </div>
              <div className="flex mt-3">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                  className="flex-1 p-2 border border-gray-300 rounded-l-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Send a message..."
                  // disabled={!isConnected}
                />
                <button
                  onClick={handlePostComment}
                  className="px-4 py-2 text-white bg-gray-600 rounded-r-md hover:bg-gray-700 disabled:opacity-50"
                  // disabled={!isConnected || !comment.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="p-4 text-center bg-yellow-100 rounded-md">
          <p className="text-yellow-800">
            Connection lost. Trying to reconnect...
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveStreamViewer;