const socket = io();

socket.on('userAction', (data) => {
  console.log('User action received:', data);
  fetchRequests();
});
