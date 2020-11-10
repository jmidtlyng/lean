module.exports = (app) => {
  let clients = [];

  app.get('/events', (req, res) => {
      req.socket.setTimeout(0);

      res.set({'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive'});

      res.flushHeaders();
      res.write(`\nevent: connected\ndata: connected!\n\n`);

      const clientId = Date.now();
      const newClient = { id: clientId, res };
      clients.push(newClient);

      res.socket.on('end', e => {
        clients = clients.filter(c => c.id !== clientId);
        res.end();
      });
    });

  return {
    blast(e){clients.forEach(c => c.res.write(`event: ${e}\ndata: 1\n\n`));}
  }
}
