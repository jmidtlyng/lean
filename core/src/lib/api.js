module.exports = (db, sse) => {
    var associations = require('../interface/associations.js')(db),
        entity = require('../interface/entity.js')(db, sse),
        field = require('../interface/field.js')(db, sse),
        search = require('../interface/search.js')(db),
        structure = require('../interface/structure.js')(db, sse),
        tag = require('../interface/tag.js')(db, sse),
        users = require('../interface/users.js')(db);

  return {
    associations: associations,
    entity: entity,
    field: field,
    search: search,
    structure: structure,
    tag: tag,
    users: users };
}
