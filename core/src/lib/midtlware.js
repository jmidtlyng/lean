module.exports = (express, api) => {
  var router = express.Router();

  router.get('*/_list', (req, res, next)=>{
    req.url = req.params[0];

    api.entity.entitiesContent(req.query, req.user.id)
      .then((entities)=>{
        res.locals.entities = entities;
        next();
      }).catch((e)=>{
        console.log(e);
        next();
      })
  });

  router.get('*/_list/:type', (req, res, next)=>{
    req.url = req.params[0];

    api.entity.entitiesContent(req.query, req.user.id, req.params.type)
      .then((entities)=>{
        res.locals.entities = entities;
        next();
      }).catch((e)=>{
        console.log(e);
        next();
      })
  });

  router.get('*/_single/:entityId', (req, res, next)=>{
    req.url = req.params[0];

    if(req.user.isadmin){
      api.entity.adminEntityContent(req.params.entityId)
        .then((entity)=>{
          res.locals.entity = entity;
          next();
        }).catch((e)=>{
          console.log(e);
          next();
        })
    } else {
      api.entity.entityContent(req.params.entityId, req.user.id)
        .then((entity)=>{
          res.locals.entity = entity;
          next();
        }).catch((e)=>{
          console.log(e);
          next();
        })
    }
  });

  router.get('*/_q_c/:entityId', (req, res, next)=>{
    if(req.session.user){
      req.url = req.params[0];

      api.entity.entityContent(req.params.entityId, req.user)
        .then((data)=>{
          res.locals.data = data;
          next();
        }).catch((e)=>{
          console.log(e);
          next();
        })
    } else { next(); }
  });

  router.get('*/_tags', (req, res, next)=>{
    req.url = req.params[0];

    if(req.query.search && req.query.search.length > 0){
      api.tag.getTags(req.user.id, req.query.search)
        .then((entities)=>{
          res.locals.entities = entities;
          next();
        }).catch((e)=>{
          console.log(e);
          next();
        })
    } else {
      api.tag.getTags(req.user.id)
        .then((entities)=>{
          res.locals.entities = entities;
          next();
        }).catch((e)=>{
          console.log(e);
          next();
        })
    }
  });

  router.get('*/_tags_in_groups', (req, res, next)=>{
    req.url = req.params[0];

    if(req.query.search && req.query.search.length > 0){
      api.tag.getGroupTags(req.query.groups, req.user.id, req.query.search)
        .then((entities)=>{
          res.locals.entities = entities;
          next();
        }).catch((e)=>{
          console.log(e);
          next();
        })
    } else {
      api.tag.getGroupTags(req.query.groups, req.user.id)
        .then((entities)=>{
          res.locals.entities = entities;
          next();
        }).catch((e)=>{
          console.log(e);
          next();
        })
    }
  });

  router.get('*/cm/:entityIds', (req, res, next)=>{
    req.url = req.params[0];
    const entityIds = Array.isArray(req.params.entityIds)
      ? req.params.entityIds : [req.params.entityIds];

    api.search.entitiesContent(entityIds, req.user)
      .then((data)=>{
        res.locals.data = data;
        next();
      }).catch((e)=>{
        console.log(e);
        next();
      })
  });

  router.get('*/_assoc', (req, res, next)=>{
    req.url = req.params[0];

    api.associations.associatedEntities(req.user.id, req.query.parent, req.query.field)
      .then((data)=>{
        res.locals.data = data;
        next();
      }).catch((e)=>{
        console.log(e);
        next();
      })
  });

  router.get('*/_unassoc', (req, res, next)=>{
    req.url = req.params[0];

    api.associations.unassociatedEntities(req.query.parent, req.query.field)
      .then((data)=>{
        res.locals.data = data;
        next();
      }).catch((e)=>{
        console.log(e);
        next();
      })
  });

  router.get('*/q_content_image_reload', (req, res, next)=>{
    req.url = req.params[0];
    api.search.entityContent(req.params.entityId, req.user)
      .then((data)=>{
        res.locals.data = data[req.params.handle];
        next();
      }).catch((e)=>{
        console.log(e);
        next();
      })
  });
/*
  router.post('/_action/create_assoc', (req, res, next)=>{
    req.url = req.params[0];

    api.associations.createAssociation(req.query.parent, req.query.child, req.query.handle)
      .then((data)=>{
        res.locals.data = data;
        next();
      }).catch((e)=>{
        console.log(e);
        next();
      })
  });

  router.post('/_action/q_archive_assoc', (req, res, next)=>{
    req.url = req.params[0];

    api.associations.archiveAssociation(req.query.parent, req.query.child, req.query.handle)
      .then((data)=>{
        res.locals.data = data;
        next();
      }).catch((e)=>{
        console.log(e);
        next();
      })
  });
*/
  return {
    basic(){
      router.get('/', (req, res, next)=>{
        if(req.session.user){
          next();
        } else {
          api.users.permission(req.user.id).then(userAccess => {
            req.session.user = userAccess;
            console.log(userAccess);
            next();
          }).catch(e=>{
            console.log(e);
            next();
          })
        }
      });

      router.get('*', (req, res, next)=>{
        res.locals.currentUser = req.user;
        res.locals.currentUser.access = req.session.user;
        res.locals.requestQuery = req.query;
        next();
      });
      /*
        router.get('/search/:entityType', (req, res, next)=>{
          req.url = req.params[0];
          var entityType = req.params.entityType,
              entityTypeFieldAccess = req.session.user.global[req.params.entityType].fields;

          api.search.typeSearch(entityType, req.query, entityTypeFieldAccess)
            .then((data)=>{
              res.locals.data = data;
              next();
            }).catch((e)=>{
              console.log(e);
              next();
            })
        });
      */
      return router;
    },
    admin(){
      router.get('*/q/:table', (req, res, next)=>{
        req.url = req.params[0];
        api.structure.query(req.params.table, req.query)
          .then((data)=>{
            res.locals.data = data;
            next();
          }).catch((err)=>{
            res.locals.data = [{err: err}];
            next();
          });
      });

      router.get('*/q/:table/lj/:leftJoinedTable', (req, res, next)=>{
        req.url = req.params[0];
        api.structure.leftJoinQuery(req.params.table, req.params.leftJoinedTable, req.query)
          .then((data)=>{
            res.locals.data = data;
            next();
          }).catch((err)=>{
            res.locals.data = [{err: err}];
            next();
          });
      });

      router.get('*/q/:table/rj/:rightJoinedTable', (req, res, next)=>{
        req.url = req.params[0];
        api.structure.rightJoinQuery(req.params.table, req.params.rightJoinedTable, req.query)
          .then((data)=>{
            res.locals.data = data;
            next();
          }).catch((err)=>{
            res.locals.data = [{err: err}];
            next();
          });
      });

      router.get('*/q/:table/rnj/:joinedTable', (req, res, next)=>{
        req.url = req.params[0];
        api.structure.rightNullJoinQuery(req.params.table, req.params.joinedTable, req.query)
          .then((data)=>{
            res.locals.data = data;
            next();
          }).catch((err)=>{
            res.locals.data = [{err: err}];
            next();
          });
      });

      router.get('*/q/:table/lnj/:joinedTable', (req, res, next)=>{
        req.url = req.params[0];
        api.structure.leftNullJoinQuery(req.params.table, req.params.joinedTable, req.query)
          .then((data)=>{
            res.locals.data = data;
            next();
          }).catch((err)=>{
            res.locals.data = [{err: err}];
            next();
          });
      });

      router.get('*/_field_types', (req, res, next)=>{
        req.url = req.params[0];
        if(req.query.data_type){
          api.field.fieldTypeSettings(req.query.data_type).then((data)=>{
              res.locals.data = data;
              next();
            }).catch((err)=>{
              res.locals.data = [{err: err}];
              next();
            });
        } else {
          api.field.allFieldTypeSettings().then((data)=>{
              res.locals.data = data;
              next();
            }).catch((err)=>{
              res.locals.data = [{err: err}];
              next();
            });
        }
      })

      router.get('*/q_field_access/:accessTable', (req, res, next)=>{
        req.url = req.params[0];

        api.field.adminFieldAccess(req.params.accessTable, req.query.account_group, req.query.entity_type)
          .then((data)=>{
            res.locals.data = data;
            next();
          }).catch((err)=>{
            res.locals.data = [{err: err}];
            next();
          });
      })

      router.post('/actions/field/create', (req, res, next)=>{
        api.field.create(req.body)
          .then(()=>{ res.send({ msg: 'success' }); })
          .catch((err)=>{
            res.status(err.status || 500);
            res.render('error', { message: err.message, error: err });
          });
      })

      router.post('/actions/entity/create', (req, res, next)=>{
        api.entity.createEntity(req.body)
          .then(()=>{ res.send({ msg: 'success' }); })
          .catch((err)=>{
            res.status(err.status || 500);
            res.render('error', { message: err.message, error: err });
          });
      })

      return router;
    }
  }

  function filterOutput(data, userAccess){
    var returnArray = [];

    for(entityType in userAccess){
      if(entityType.entity_type = data[0].entity_type){
        for(entity in data){
          var filteredRow = {};
          for(field in entity_type.fields){
            if(field.read || field.write){
              filteredRow[field.handle] = {
                value: entity[field.handle],
                read: field.read,
                write: field.write
              }
            }
          }
        }
      }
    }
  }
}