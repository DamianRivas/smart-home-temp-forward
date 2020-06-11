require("dotenv").config();
const zmq = require("zeromq");
const knex = require("knex")({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "smartify_home",
  },
});

async function run() {
  const sock = new zmq.Subscriber();

  const forwarderIP = `tcp://${process.env.FORWARDER_IP}:${process.env.RECEIVER_PORT}`;

  sock.connect(forwarderIP);
  sock.subscribe("");
  console.log("Subscriber connected to forwarder IP: " + forwarderIP);

  let hour = new Date(Date.now()).getHours();
  console.log(hour);

  for await (const [topic, msg] of sock) {
    const data = topic.toString();
    const message = JSON.parse(data.substr(data.indexOf(" ") + 1));
    const t = data.substr(0, data.indexOf(" "));
    if (t == "SERVER" && Object.keys(message).includes("temperature")) {
      console.log("TOPIC:", topic.toString());
      console.log("MESSAGE:", message);
      const { temperature, room_id } = message;
      knex("temps")
        .insert({ temp: temperature, room_id })
        .then(() => {
          console.log("INSERTED INTO DB");
        });
    }
  }
}

run();
