module.exports = (db) => {
  return {
    async typeSearch(entityTypeHandle, args, permittedFields){
      try {
        /*
          var q = "SELECT",
              qParams = [],
              i = 0;
        */
        let q = "SELECT c.*, et.handle AS entity_type_handle \
              FROM entity AS e \
                LEFT JOIN content AS c ON c.entity = e.id \
                LEFT JOIN entity_type AS et ON et.id = e.entity_type \
              WHERE e.isarchived = false AND et.handle = $1";
        /*
          for(const prop in permittedFields){
            if(permittedFields[prop].read || permittedFields[prop].write){
              i++;
              if(permittedFields[prop].data_type == "entities"){
                q += " ARRAY(SELECT name FROM content WHERE entity = ANY(c.$" + i + "~))";
              } else if(permittedFields[prop].data_type == "entity"){
                q += " (SELECT name FROM content WHERE entity = c.$" + i + "~)";
              } else { q += " c.$" + i + "~"; }

              i++;
              q += " AS $" + i + "~,";

              qParams.push(prop, prop);
            }
          }

          i++;
          q += " e.entity_type AS entity_type, et.handle AS entity_type_handle, \
                  et.name AS entity_type_name, e.id AS entity_id \
                FROM entity AS e \
                  LEFT JOIN content AS c ON c.entity = e.id \
                  LEFT JOIN entity_type AS et ON et.id = e.entity_type \
                WHERE e.isarchived = false AND et.handle LIKE $" + i;
          qParams.push(entityTypeHandle);

          for(const prop in args){
            i++;
            q += " AND c.$" + i + "~ = ";
            i++;
            q += "$" + i;

            qParams.push(prop, args[prop]);
          }
        */

        //var result = await db.any(q,qParams);
        var result = await db.any(q,[entityTypeHandle]);
        return result;
      } catch(e){ return null; }
    },
    async entity(entityId, userId){
      var q = "SELECT c.*, eag.account_group_handle AS account_group, et.handle AS entity_type_handle \
                FROM content AS c \
                  LEFT JOIN entity AS e ON e.id = c.entity \
                  LEFT JOIN (SELECT ea.entity AS entity_id, ag.handle AS account_group_handle \
                    FROM entity_account AS ea \
                      LEFT JOIN account_group AS ag ON ag.id = ea.account_group \
                    WHERE ea.isarchived = false AND ag.isarchived = false AND account = $1) \
                      AS eag ON eag.entity_id = e.id \
                  LEFT JOIN entity_type AS et ON et.id = e.entity_type \
                WHERE c.entity = $2"



      var result = await db.one(q, [userId, entityId]);
      return result;
    },
    async entities(entityIds){
      try {
        var q = "SELECT c.*, et.handle AS entity_type_handle \
                  FROM content AS c \
                    LEFT JOIN entity AS e ON e.id = c.entity \
                    LEFT JOIN entity_type AS et ON et.id = e.entity_type \
                  WHERE c.entity IN ($1:csv)"
        var result = await db.any(q, [entityIdInput]);
        return result;
      } catch(e){ console.log(e) }
    },
    async entityContent(entityId, user){
      try {
        const fieldsQ = "SELECT ef.name, f.handle, f.data_type, f.settings, f.id AS field_id \
                          FROM entity_type_field AS ef \
                            LEFT JOIN (SELECT * FROM field WHERE isarchived = false) \
                              AS f ON f.id = ef.field \
                            LEFT JOIN entity AS e ON e.entity_type = ef.entity_type \
                          WHERE ef.isarchived = false AND e.id = $1",
              contentQ = "SELECT c.* FROM content WHERE entity = $1 AND isarchived = false";

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
              value: content[field.handle] };
          }
        }
        console.log(contentObj);
        return contentObj;
      } catch(e) { console.log(e); }
    },
    async entitiesContent(entityIds, user){
      try {
        const fieldsQ = "SELECT ef.name, f.handle, f.data_type, f.settings \
                        FROM entity_type_field AS ef \
                          LEFT JOIN (SELECT * FROM field WHERE isarchived = false) \
                            AS f ON f.id = ef.field \
                          LEFT JOIN entity AS e ON e.entity_type = ef.entity_type \
                        WHERE ef.isarchived = false AND e.id = $1",
              contentQ = "SELECT * FROM content WHERE entity IN($1:csv) AND isarchived = false";

        const fields = await db.any(fieldsQ, [entityIds[0]]);
        const content = await db.any(contentQ, [entityIds]);
        const contentObj = [];

        if(fields.length > 0 && content.length > 0){
          if(user.isadmin){
            for(const single of content){
              const row = [];

              for(const field of fields){
                row.push({
                  name: field.name,
                  handle: field.handle,
                  dataType: field.data_type,
                  settings: field.settings,
                  read: true,
                  write: true,
                  value: single[field.handle]
                });
              }

              contentObj.push(row);
            }
          } else {

          }
        }

        return contentObj;
      } catch(e) { console.log(e); }
    }
  }
}
