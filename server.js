// Require the framework and instantiate it

// ESM
import Fastify from 'fastify'
import rawBody from 'fastify-raw-body'
import { InteractionResponseType, verifyKey, verifyKeyMiddleware, InteractionType } from "discord-interactions" 


const server = Fastify({
    logger: true
})

server.register(rawBody, { 
    runFirst: true, 
}) 
  
// Declare a route
server.get('/', function (request, reply) {
    server.log.info("Handling GET request")
    reply.send({ hello: 'world' })
})

server.addHook("preHandler", async (request, response) => {
	// We don't want to check GET requests to our root url
	if (request.method === "POST") {
		const signature = request.headers["x-signature-ed25519"]; 
		const timestamp = request.headers["x-signature-timestamp"]; 
		const isValidRequest = verifyKey(
			request.rawBody, 
			signature, 
			timestamp, 
			//process.env.PUBLIC_KEY,
            "b5a30c18e969d830b2d39502d3db91236ef76c4b6fc5a1ed8bc76ea7afc1d43b" 
		) 
		if (!isValidRequest) {
			server.log.info("Invalid Request"); 
			return response.status(401).send({ error: "Bad request signature " }) 
		} 
	} 
})

/*server.post('/interactions', verifyKeyMiddleware('b5a30c18e969d830b2d39502d3db91236ef76c4b6fc5a1ed8bc76ea7afc1d43b'), (req, res) => {
	const message = req.body;
	if (message.type === InteractionType.APPLICATION_COMMAND) {
	  res.send({
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
		  content: 'Hello world',
		},
	  });
	}
});*/

server.post("/interactions", async (request, response) => {
	const message = request.body; 
 
	if (message.type === InteractionType.PING) {
		server.log.info("Handling Ping request") 
		response.send({
			type: InteractionResponseType.PONG, 
		}); 
	} else {
		server.log.error("Unknown Type"); 
		response.status(400).send({ error: "Unknown Type" }) 
	} 
}) 


// Run the server!
server.listen({ port: 3000 }, function (err, address) {
    if (err) {
        server.log.error(err)
        process.exit(1)
    }
    // Server is now listening on ${address}
})