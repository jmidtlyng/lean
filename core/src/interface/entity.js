module.exports = (db, sse) => {
  return {
    async entitiesContent(args, userId, type=false){
      try {
        var q = "SELECT c.*, ed.entity_type_name, ed.entity_type_handle, ed.entity_type_id, \
                    g.account_group_name, g.account_group_handle \
                  FROM (SELECT e.id AS id, et.name AS entity_type_name, \
                      et.handle AS entity_type_handle, et.id AS entity_type_id \
                    FROM entity AS e LEFT JOIN entity_type AS et ON et.id = e.entity_type \
                    WHERE et.isarchived = false AND e.isarchived = false",
            qParams = [],
            i = 1,
            baseline = 1;

        if(type){
          q += " AND et.handle = $"+i;
          qParams.push(type);
          i++;
          baseline ++;
        }

        q += ") AS ed LEFT JOIN content AS c ON c.entity = ed.id \
                LEFT JOIN (SELECT ea.entity AS entity, ag.name as account_group_name, \
                    ag.handle AS account_group_handle \
                  FROM entity_account AS ea LEFT JOIN account_group AS ag ON ag.id = ea.account_group \
                  WHERE ea.isarchived = false AND ea.account = $"+i+") AS g ON g.entity = ed.id";
        qParams.push(userId);

        i++;
        baseline++;

        for(const prop in args){
          if(i == baseline){ q += " WHERE"; } else { q += " AND"; }
          q += " $c." + i + "~ = ";
          i++;
          q += "$" + i;
          i++;

          qParams.push(prop, args[prop]);
        }

        q += " ORDER BY c.name";

        var res = await db.any(q, qParams);
        return res;
      } catch(e){ throw e }
    },
    async entityTypes(args, types){

    },
    async fields(args, types){

    },
    async activities(args, types){

    },
    async tags(args, types){

    },
    async entityContent(entityId, userId){
      try {
        const q = "SELECT c.*, et.name AS entity_type_name, et.handle AS entity_type_handle, \
                    et.id AS entity_type_id, g.account_group_name, g.account_group_handle \
                  FROM entity AS e \
                    LEFT JOIN (SELECT * FROM entity_type WHERE isarchived = false) AS et ON et.id = e.entity_type \
                    LEFT JOIN content AS c ON c.entity = e.id \
                    LEFT JOIN (SELECT ea.entity AS entity, ag.name as account_group_name, \
                        ag.handle AS account_group_handle \
                      FROM entity_account AS ea LEFT JOIN account_group AS ag ON ag.id = ea.account_group \
                      WHERE ea.isarchived = false AND ea.account = $1) AS g ON g.entity = e.id \
                  WHERE e.id = $2";

        const res = await db.one(q, [userId, entityId]);
        return res;
      } catch(e){ throw e }
    },
    async entityType(id, args){

    },
    async adminEntityContent(entityId){
      try {
        const fieldsQ = "SELECT ef.name, f.handle, f.data_type, f.settings, f.id AS field_id \
                          FROM entity_type_field AS ef \
                            LEFT JOIN (SELECT * FROM field WHERE isarchived = false) \
                              AS f ON f.id = ef.field \
                            LEFT JOIN entity AS e ON e.entity_type = ef.entity_type \
                          WHERE ef.isarchived = false AND e.id = $1",
              contentQ = "SELECT * FROM content WHERE entity = $1 AND isarchived = false";

        const fields = await db.any(fieldsQ, [entityId]);
        const content = await db.one(contentQ, [entityId]);
        const contentObj = {};

        if(fields.length > 0 && content.entity){
          for(const field of fields){
            contentObj[field.handle] = {
              fieldId: field.field_id,
              name: field.name,
              dataType: field.data_type,
              settings: field.settings,
              value: content[field.handle],
              contentId: content.id,
              entityId: content.entity };
          }
        }

        return contentObj;
      } catch(e) { console.log(e); }
    },
    async entitiesByIds(ids){
      try {
        let res = [];

        if(ids.length > 0){
          let q = "SELECT DISTINCT e.id, c.name FROM content AS c LEFT JOIN entity AS e ON e.id = c.entity \
                    WHERE c.isarchived = false AND c.isarchived = false AND e.id IN($1:csv)";
          res = await db.any(q, [ids]);
        }

        return res;
      } catch(e) { console.log(e); }
    },
    async entitiesOutsideIds(ids, types){
      try {
        let q = "SELECT DISTINCT e.id, c.name FROM content AS c LEFT JOIN entity AS e ON e.id = c.entity \
                  WHERE c.isarchived = false AND c.isarchived = false",
            qParams = [],
            i = 1;

        if(ids.length > 0){
          q += " AND e.id NOT IN($1:csv)";
          qParams.push(ids);
          i++;
        }

        if(types.length){
          q += " AND e.entity_type IN($" + i + ":csv)";
          qParams.push(types);
        }

        const res = await db.any(q, qParams);
        return res;
      } catch(e) { console.log(e); }
    },
    async createEntity(args){
      try {
        const q = "with rows as (INSERT INTO entity (entity_type) VALUES ($1) RETURNING id) \
                INSERT INTO content (entity, name) SELECT id, $2 FROM rows";

        const res = await db.none(q, [args.entity_type, args.name]);
        sse.blast('entity');
        return res;
      } catch(e) { console.log(e); }
    }
  }
}
