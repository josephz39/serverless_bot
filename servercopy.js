import fastify from "fastify";
import rawBody from "fastify-raw-body"; 
import {
	InteractionResponseType,
	InteractionType,
	verifyKey, 
} from "discord-interactions";
 
const server = fastify({
	logger: true,
});
 
server.register(rawBody, {
	runFirst: true,
});
 
server.get("/", (request, response) => {
	server.log.info("Handling GET request");
});
 
server.addHook("preHandler", async (request, response) => {
	// We don't want to check GET requests to our root url
	if (request.method === "POST") {
		const signature = request.headers["x-signature-ed25519"]; 
		const timestamp = request.headers["x-signature-timestamp"]; 
		const isValidRequest = verifyKey(
			request.rawBody, 
			signature, 
			timestamp, 
			process.env.PUBLIC_KEY, 
		); 
		if (!isValidRequest) {
			server.log.info("Invalid Request"); 
			return response.status(401).send({ error: "Bad request signature " }); 
		} 
	} 
}); 
 
server.post("/", async (request, response) => {
	const message = request.body;
 
	if (message.type === InteractionType.PING) {
		server.log.info("Handling Ping request");
		response.send({
			type: InteractionResponseType.PONG,
		});
	} else {
		server.log.error("Unknown Type");
		response.status(400).send({ error: "Unknown Type" });
	}
});
 
server.listen(3000, async (error, address) => {
	if (error) {
		server.log.error(error);
		process.exit(1);
	}
	server.log.info(`server listening on ${address}`);
});