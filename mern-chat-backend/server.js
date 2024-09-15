const express = require('express');
const app = express();
const userRoutes = require('./routes/userRoutes')
const User = require('./models/User');
const Task = require("./models/Task");
const Message = require('./models/Message')
const rooms = ['general', 'tech', 'finance', 'crypto'];
const cors = require('cors');

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());

app.use('/users', userRoutes) 
require('./connection')

const server = require('http').createServer(app);
const PORT = 5001;
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})


async function getLastMessagesFromRoom(room){
  let roomMessages = await Message.aggregate([
    {$match: {to: room}},
    {$group: {_id: '$date', messagesByDate: {$push: '$$ROOT'}}}
  ])
  return roomMessages;
}

function sortRoomMessagesByDate(messages){
  return messages.sort(function(a, b){
    let date1 = a._id.split('/');
    let date2 = b._id.split('/');

    date1 = date1[2] + date1[0] + date1[1]
    date2 =  date2[2] + date2[0] + date2[1];

    return date1 < date2 ? -1 : 1
  })
}

// socket connection

io.on('connection', (socket)=> {

  socket.on('new-user', async ()=> {
    const members = await User.find();
    io.emit('new-user', members)
  })

  socket.on('join-room', async(newRoom, previousRoom)=> {
    socket.join(newRoom);
    socket.leave(previousRoom);
    let roomMessages = await getLastMessagesFromRoom(newRoom);
    roomMessages = sortRoomMessagesByDate(roomMessages);
    socket.emit('room-messages', roomMessages)
  })

  socket.on('message-room', async(room, content, sender, time, date) => {
    const newMessage = await Message.create({content, from: sender, time, date, to: room});
    let roomMessages = await getLastMessagesFromRoom(room);
    roomMessages = sortRoomMessagesByDate(roomMessages);
    // sending message to room
    io.to(room).emit('room-messages', roomMessages);
    socket.broadcast.emit('notifications', room)
  })

  app.delete('/logout', async(req, res)=> {
    try {
      const {_id, newMessages} = req.body;
      const user = await User.findById(_id);
      user.status = "offline";
      user.newMessages = newMessages;
      await user.save();
      const members = await User.find();
      socket.broadcast.emit('new-user', members);
      res.status(200).send();
    } catch (e) {
      console.log(e);
      res.status(400).send()
    }
  })
  Task.find().then((tasks) => {
    socket.emit("allTasks", tasks);
  })
  socket.on("addTask", async (data) => {
    const newTask = new Task({ task: data.task });
    await newTask.save(); // Save task to database

    // Broadcast the new task to all clients

    Task.find().then((tasks) => {
      io.emit("allTasks", tasks); // Emit all tasks to all clients
    });
  });
  socket.on('deleteTask', (taskId) => {
    Task.findByIdAndDelete(taskId).then(() => {
      Task.find().then((tasks) => {
        io.emit('allTasks', tasks);
      });
    });
  });

})

 
app.get('/rooms', (req, res)=> {
  res.json(rooms)
})


server.listen(PORT, ()=> {
  console.log('listening to port', PORT)
})

const Document = require("./Document.js")
 
const defaultValue = ""

io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    console.log(documentId);
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return 

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: defaultValue })
}


// Listen for "addTask" event
// socket.on("addTask", async (data) => {
//   const newTask = new Task({ task: data.task });
//   await newTask.save(); // Save task to database

//   // Broadcast the new task to all clients

//   Task.find().then((tasks) => {
//     io.emit("allTasks", tasks); // Emit all tasks to all clients
// });
// });
//   socket.on('deleteTask', (taskId) => {
//     Task.findByIdAndDelete(taskId).then(() => {
//       Task.find().then((tasks) => {
//         io.emit('allTasks', tasks);
//       });
//     });
//   });

