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
    },
    async jsonSearch(userId, type, args, access){
      try {
        const fields = access[type].fields,
              matrixedTypes = ["entities", "tags", "checkboxes"];
        let q = "SELECT ",
            qParams = [],
            i = 1,
            hasSearchTerm = false,
            dangerSort = [],
            sortDirections = [],
            safeSort = [],
            limit = 0,
            offset = 0,
            selectOptionQ = "",
            searchQ = "",
            sortQ = " c.name";

        if(args.search && args.search.length > 0){
          hasSearchTerm = true;
          searchTerm = '%'+ args.search + '%';
          qParams.push(searchTerm);
          delete args.search;
          i++;
        }

        if(args.sort && args.dir){
          dangerSort = args.sort.split(',');
          sortDirections = args.dir.split(',');
          for(const item of dangerSort){ safeSort.push(false) }
          delete args.sort;
          delete args.dir;
        }

        if(args.limit){
          limit = args.limit;
          delete args.limit;
        }

        if(args.offset){
          offset = args.offset;
          delete args.offset;
        }

        for(const handle in fields){
          if( matrixedTypes.indexOf(fields[handle].data_type) === -1 ){
            if(fields[handle].read || fields[handle].write){
              if(fields[handle].data_type == 'dropdown' || fields[handle].data_type == 'radio'){
                q += "select_option_" + handle + ".value AS " + handle + ", ";
                selectOptionQ += " LEFT JOIN select_option AS select_option_" + handle
                  + " ON select_option_" + handle + ".id = c." + handle;
                console.log(selectOptionQ);
              } else { q += "c." + handle + ", "; }

              if(hasSearchTerm && fields[handle].data_type == "text"){
                if(searchQ !== ""){ searchQ += "OR "}
                searchQ += "c." + handle + " ILIKE $1 "
              }

              // saving on pg-promise params
              if(dangerSort.length > 0) {
                const sortHandleIdx = dangerSort.indexOf(handle);
                if(sortHandleIdx !== -1){ safeSort[sortHandleIdx] = handle; }
              }
            }
          }
        }

        q += "ed.entity_type_name, ed.entity_type_handle, ed.entity_type_id, \
                    g.account_group_name, g.account_group_handle, ed.id AS entity, \
                    COUNT(*) OVER() AS results_count \
                  FROM (SELECT e.id AS id, et.name AS entity_type_name, \
                      et.handle AS entity_type_handle, et.id AS entity_type_id \
                    FROM entity AS e LEFT JOIN entity_type AS et ON et.id = e.entity_type \
                    WHERE et.isarchived = false AND e.isarchived = false AND et.handle = $"+i
              + ") AS ed LEFT JOIN content AS c ON c.entity = ed.id"
              + selectOptionQ
              + " LEFT JOIN (SELECT ea.entity AS entity, ag.name as account_group_name, \
                          ag.handle AS account_group_handle \
                        FROM entity_account AS ea LEFT JOIN account_group AS ag ON ag.id = ea.account_group \
                        WHERE ea.isarchived = false AND ea.account = " + userId + ") AS g ON g.entity = ed.id";
        qParams.push(type)
        i++;

        // used to keep pg-promise params under the 26 param limit
        if(safeSort.length > 0){
          for(let n = 0; n < safeSort.length; n++){
            if(safeSort[n]){
              const dir = sortDirections[n] == 1 ? "ASC" : "DESC";

              if(n == 0){ sortQ = " " + safeSort[n] + " " + dir; }
                else { sortQ += ", " + safeSort[n] + " " + dir; }
            }
          }
        }

        let baseline = i + 0;

        for(const prop in args){
          if(i == baseline){ q += " WHERE"; } else { q += " AND"; }
          q += " c.$" + i + "~ = ";
          i++;
          q += "$" + i;
          i++;

          qParams.push(prop, args[prop]);
        }

        if(hasSearchTerm){
          if(i == baseline){q += " WHERE (" + searchQ +")"; }
            else { q += " AND (" + searchQ +")"; }
        }

        q += " ORDER BY" + sortQ;

        if(offset){
          q += " OFFSET $" + i;
          qParams.push(offset);
          i++;
        }

        if(limit){
          q += " LIMIT $" + i;
          qParams.push(limit)
        }

        var res = await db.any(q, qParams);
        return res;
      } catch(e){ throw e }
    },
    async advancedSearch(userId, type, args, access){
      try {
        const fields = access[type].fields;
        let q = "SELECT ",
            qParams = [userId],
            i = 2,
            joinQ = "",
            searchQ = "",
            sortQ = " c.name";

        for(const handle in fields){
          if(fields[handle].read || fields[handle].write){
            if(fields[handle].data_type == 'dropdown' || fields[handle].data_type == 'radio'){
              q += "select_option_" + handle + ".value AS " + handle + ", ";
              joinQ += " LEFT JOIN select_option AS select_option_" + handle
                + " ON select_option_" + handle + ".id = c." + handle;
            } else if(fields[handle].data_type == 'entities'){
              q += "assoc_entity_" + handle + ".name AS " + handle + ", ";
              joinQ += " LEFT JOIN (SELECT em.parent AS parent, ARRAY_AGG(c.name) AS name, \
                                      ARRAY_AGG(e.id) AS ids\
                                    FROM entity_matrix AS em \
                                      LEFT JOIN field AS f ON f.id = em.field \
                                      LEFT JOIN entity AS e ON e.id = em.entity \
                                      LEFT JOIN content AS c ON c.entity = e.id \
                                    WHERE f.handle = '"+handle+"' GROUP BY parent) AS assoc_entity_"
                + handle + " ON assoc_entity_" + handle + ".parent = c.entity";
            } else if(fields[handle].data_type == 'tags'){
              q += "assoc_tag_" + handle + ".handle AS " + handle + ", ";
              joinQ += " LEFT JOIN (SELECT tm.entity AS entity, ARRAY_AGG(t.handle) AS handle, \
                                      ARRAY_AGG(t.id) AS ids \
                                    FROM tag_matrix AS tm \
                                      LEFT JOIN field AS f ON f.id = tm.field \
                                      LEFT JOIN entity AS e ON e.id = tm.entity \
                                      LEFT JOIN tag AS t ON t.id = tm.tag \
                                    WHERE (tm.account = $1 OR t.ispublic)  AND f.handle = '"+handle+"' \
                                      AND tm.isarchived = false AND t.isarchived = false \
                                    GROUP BY entity) AS assoc_tag_"
                + handle + " ON assoc_tag_" + handle + ".entity = c.entity";
            } else { q += "c." + handle + ", "; }

            if(args[handle] && args[handle] != ''){
              if(searchQ !== ""){ searchQ += " AND"; }
                else { searchQ += " WHERE"; }

              switch (fields[handle].data_type) {
                case "text":
                case "url":
                case "email":
                  const searchTerm = "%" + args[handle] + "%";
                  searchQ += " c." + handle + " ILIKE $" + i;
                  qParams.push(searchTerm);
                  i ++;
                  break;
                case "date":
                case "number":
                  switch (args[(handle+"__evaluator")]) {
                    case "equalTo":
                      searchQ += " c." + handle + " = $" + i;
                      qParams.push(args[handle]);
                      i++;
                      break;
                    case "greaterThan":
                      searchQ += " c." + handle + " > $" + i;
                      qParams.push(args[handle]);
                      i++;
                      break;
                    case "greaterThanOrEqualTo":
                      searchQ += " c." + handle + " >= $" + i;
                      qParams.push(args[handle]);
                      i++;
                      break;
                    case "lessThan":
                      searchQ += " c." + handle + " < $" + i;
                      qParams.push(args[handle]);
                      i++;
                      break;
                    case "lessThanOrEqualTo":
                      searchQ += " c." + handle + " <= $" + i;
                      qParams.push(args[handle]);
                      i++;
                      break;
                  }
                  break;
                case "dropdown":
                case "radio":
                  searchQ += " c." + handle + " = $" + i;
                  qParams.push(args[handle]);
                  i++;
                  break;
                case "lightswitch":
                  const searchVal = args[handle] == "true" ? true : false;
                  searchQ += " c." + handle + " = " + searchVal;
                  break;
                case "tags":
                  searchQ += " ARRAY[$" + i + ":csv]::int[] && assoc_tag_" + handle + '.ids';
                  qParams.push(args[handle]);
                  i++;
                  break;
                case "entities":
                  searchQ += " ARRAY[$" + i + ":csv]::int[] && assoc_entity_" + handle + '.ids';
                  qParams.push(args[handle]);
                  i++;
                  break;
              }
            }
          }
        }

        q += "ed.entity_type_name, ed.entity_type_handle, ed.entity_type_id, \
                g.account_group_name, g.account_group_handle, ed.id AS entity \
              FROM (SELECT e.id AS id, et.name AS entity_type_name, \
                  et.handle AS entity_type_handle, et.id AS entity_type_id \
                FROM entity AS e LEFT JOIN entity_type AS et ON et.id = e.entity_type \
                WHERE et.isarchived = false AND e.isarchived = false AND et.handle = $"+i
              + ") AS ed LEFT JOIN content AS c ON c.entity = ed.id" + joinQ
              + " LEFT JOIN (\
                    SELECT ea.entity AS entity, ag.name as account_group_name, \
                      ag.handle AS account_group_handle \
                    FROM entity_account AS ea \
                      LEFT JOIN account_group AS ag ON ag.id = ea.account_group \
                    WHERE ea.isarchived = false \
                      AND ea.account = " + userId + ") AS g ON g.entity = ed.id" + searchQ;
        qParams.push(type)
        i++;

        var res = await db.any(q, qParams);
        return res;
      } catch(e){ throw e }
    }
  }
}
