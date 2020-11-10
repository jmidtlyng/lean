module.exports = (express, api) => {
  var router = express.Router();

  router.get('/', (req, res, next) => {
    res.render('index', { title: 'Lean Pocket' });
  });

  router.post('/actions/:table/:command', function(req, res, next) {
    api.structure[req.params.command](req.params.table, req.body)
      .then(()=>{ res.send({ msg: 'success' }); })
      .catch((err)=>{
        res.status(err.status || 500);
        res.render('error', { message: err.message, error: err });
      });
  });

  router.get('/*', (req, res, next)=>{
    res.render(req.params[0], { title: 'Lean Pocket' }, (err, html) => {
      if (err){
        res.status(err.status || 404);
        res.render('error', { message: err.message, error: err });
      } else { res.send(html) }
    });
  });

  return router;
}
