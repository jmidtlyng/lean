module.exports = (express, api) => {
  const router = express.Router();

  router.get('/', (req, res, next) => {
    res.render('index', { title: 'Lean Pocket' });
  });

  router.post('/actions/tag/add', function(req, res, next) {
    if(req.body.tag.length > 0){
      api.tag.tagCreate(req.body.tag, req.body.field, req.body.entity, req.user.id)
        .then(()=>{ res.send({ msg: 'success' }); })
        .catch((err)=>{
          res.status(err.status || 500);
          res.render('error', { message: err.message, error: err });
        });
    } else {
      res.status(err.status || 500);
      res.render('error', { message: "Tag cannot be empty", error: "Tag cannot be empty" });
    }
  });

  router.post('/actions/:table/:command', function(req, res, next) {
    api.structure[req.params.command](req.params.table, req.body)
      .then(()=>{ res.send({ msg: 'success' }); })
      .catch((err)=>{
        res.status(err.status || 500);
        res.render('error', { message: err.message, error: err });
      });
  });


  router.get('/_json', (req, res, next)=>{
    if(req.query.type){
      const type = req.query.type;
      delete req.query.type;

      api.search.jsonSearch(req.user.id, type, req.query, req.session.user)
        .then( entityJson => res.send(entityJson))
        .catch( e => {
          res.status(e.status || 500);
          res.send({ msg: e.message, error: e });
        })
    } else {
      res.status(500);
      res.send({ msg: "No type", error: "requires type" });
    }
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
