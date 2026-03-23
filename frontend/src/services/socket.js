import { io } from 'socket.io-client';

import { BACKEND_URL } from './api';

const SOCKET_URL = BACKEND_URL;

const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true
});

export default socket;
