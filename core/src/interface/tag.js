module.exports = (db, sse) => {
  return {
    async getEntityTags(userId, fieldId, entityId){
      try {
        var q = "SELECT DISTINCT t.*, tg.name AS tag_group_name, tg.handle AS tag_group_handle \
                  FROM tag AS t \
                    LEFT JOIN (SELECT * FROM tag_matrix WHERE isarchived = false) \
                      AS tm ON tm.tag = t.id \
                    LEFT JOIN (SELECT * FROM tag_group_tag WHERE isarchived = false) \
                      AS tgt ON tgt.tag = t.id \
                    LEFT JOIN (SELECT * FROM tag_group WHERE isarchived = false) \
                      AS tg ON tg.id = tgt.tag_group \
                  WHERE t.isarchived = false AND tm.entity = $1 AND tm.field = $2 \
                    AND (t.ispublic OR tm.account = $3)";

        var res = await db.any(q, [entityId, fieldId, userId]);
        return res;
      } catch (e) { console.log(e); }
    },
    async tagSearch(userId, field, search=false){
      try {
        var q = "",
            res = [];

        if(search) {
          q = "SELECT t.*, tg.name AS tag_group_name, tg.handle AS tag_group_handle \
                FROM tag AS t \
                  LEFT JOIN (SELECT * FROM tag_group_tag WHERE isarchived = false) \
                    AS tgt ON tgt.tag = t.id \
                  LEFT JOIN (SELECT * FROM tag_group WHERE isarchived = false) \
                    AS tg ON tg.id = tgt.tag_group \
                WHERE t.isarchived = false \
                  AND (tm.account = $1 OR \
                    (t.ispublic = true AND tgt.tag_group IN (SELECT e::text::int AS source FROM field, \
                      jsonb_array_elements(settings->'source') e WHERE id = $2))) \
                  AND t.handle LIKE $3";
          search = '%'+search+'%';
          res = await db.any(q, [userId, field, search]);
        } else {
          q = "SELECT t.*, tg.name AS tag_group_name, tg.handle AS tag_group_handle \
                FROM tag AS t \
                  LEFT JOIN (SELECT * FROM tag_group_tag WHERE isarchived = false) \
                    AS tgt ON tgt.tag = t.id \
                  LEFT JOIN (SELECT * FROM tag_group WHERE isarchived = false) \
                    AS tg ON tg.id = tgt.tag_group \
                WHERE t.isarchived = false \
                  AND (tm.account = $1 OR \
                    (t.ispublic = true AND tgt.tag_group IN (SELECT e::text::int AS source FROM field, \
                      jsonb_array_elements(settings->'source') e WHERE id = $2)))";

          res = await db.any(q, [userId, field]);
        }

        return res;
      } catch (e) { console.log(e); }
    },
    async searchOuterTags(entityId, userId, field, search=false){
      try {
        var q = "",
            res = [];

        if(search) {
          q = "SELECT t.* \
                FROM (SELECT DISTINCT t.*, tg.name AS tag_group_name, tg.handle AS tag_group_handle \
                	  	FROM tag AS t LEFT JOIN tag_matrix AS tm ON tm.tag = t.id \
                			LEFT JOIN (SELECT * FROM tag_group_tag WHERE isarchived = false) \
                				AS tgt ON tgt.tag = t.id \
                			LEFT JOIN (SELECT * FROM tag_group WHERE isarchived = false) \
                				AS tg ON tg.id = tgt.tag_group \
                	 	WHERE (tm.account = $1 OR (t.ispublic = true AND tgt.tag_group IN \
                					(SELECT e::text::int AS source FROM field, \
                						jsonb_array_elements(settings->'source') e WHERE id = $2)))) AS t \
                	LEFT JOIN (SELECT * FROM tag_matrix WHERE isarchived = false \
                	   AND entity = $3) AS tm ON tm.tag = t.id \
                	WHERE t.isarchived = false AND tm.id IS NULL AND t.handle LIKE $4 LIMIT $5";
          search = '%'+search+'%';
          res = await db.any(q, [userId, field, entityId, search, 20]);
        } else {
          q = "SELECT t.* \
                FROM (SELECT DISTINCT t.*, tg.name AS tag_group_name, tg.handle AS tag_group_handle \
                	  	FROM tag AS t LEFT JOIN tag_matrix AS tm ON tm.tag = t.id \
                			LEFT JOIN (SELECT * FROM tag_group_tag WHERE isarchived = false) \
                				AS tgt ON tgt.tag = t.id \
                			LEFT JOIN (SELECT * FROM tag_group WHERE isarchived = false) \
                				AS tg ON tg.id = tgt.tag_group \
                	 	WHERE (tm.account = $1 OR (t.ispublic = true AND tgt.tag_group IN \
                					(SELECT e::text::int AS source FROM field, \
                						jsonb_array_elements(settings->'source') e WHERE id = $2)))) AS t \
                	LEFT JOIN (SELECT * FROM tag_matrix WHERE isarchived = false \
                	   AND entity = $3) AS tm ON tm.tag = t.id \
                	WHERE t.isarchived = false AND tm.id IS NULL LIMIT $4";

          res = await db.any(q, [entityId, userId, field, 20]);
        }

        return res;
      } catch (e) { console.log(e); }
    },
    async getGroupTags(groupHandles, userId, search=false){
      try {
        var q = "",
            res = [];

        if(search) {
          q = "SELECT t.* FROM tag AS t \
                  LEFT JOIN tag_group_tag AS tgt ON tgt.tag = t.id \
                  LEFT JOIN tag_group AS tg ON tg.id = tgt.tag_group \
                WHERE (t.ispublic = true OR tm.account = $1) AND t.isarchived = false \
                  AND tg.handle IN ($2:csv) AND t.handle LIKE $3";
          res = await db.any(q, [userId, groupHandles, search]);
        } else {
          q = "SELECT t.* FROM tag AS t \
                  LEFT JOIN tag_group_tag AS tgt ON tgt.tag = t.id \
                  LEFT JOIN tag_group AS tg ON tg.id = tgt.tag_group \
                WHERE (t.ispublic = true OR tm.account = $1) AND t.isarchived = false \
                  AND tg.handle IN ($2:csv)";
          res = await db.any(q, [userId, groupHandles]);
        }

        return res;
      } catch (e) { console.log(e); }
    },
    async getAllTagsAdmin(){
      try {
        /*
          var q = "SELECT t.*, u.firstname AS user_fname, u.lastname AS user_lname, \
                      u.isarchived AS user_isarchived FROM tag AS t \
                      LEFT JOIN user AS u ON u.id = t.account \
                    WHERE t.isarchived = false"
          res = await db.any();
          return res;
        */
      } catch (e) { console.log(e); }
    },
    async getGroupTagsAdmin(groupHandles){
      try {
        /*
          var q = "SELECT t.*, u.firstname AS user_fname, u.lastname AS user_lname, \
                      u.isarchived AS user_isarchived FROM tag AS t \
                      LEFT JOIN user AS u ON u.id = t.account \
                      LEFT JOIN tag_group_tag AS tgt ON tgt.tag = t.id \
                      LEFT JOIN tag_group AS tg ON tg.id = tgt.tag_group \
                    WHERE t.isarchived = false AND tg.handle IN ($2:csv)"

          res = await db.any(q, [groupHandles])
          return res;
        */
      } catch (e) { console.log(e); }
    },
    async tagsByIds(ids){
      try {
        let res = [];

        if(ids.length > 0){
          let q = "SELECT DISTINCT id, handle FROM tag WHERE isarchived = false AND id IN($1:csv)";
          res = await db.any(q, [ids]);
        }

        return res;
      } catch(e) { console.log(e); }
    },
    async searchTagsOutsideIds(ids, fieldId, userId, search){
      try {
        let res = [];

        if(search.length > 0){
          let qParams = [userId, fieldId];

          q = "SELECT DISTINCT t.id, t.handle \
          	  	FROM tag AS t LEFT JOIN tag_matrix AS tm ON tm.tag = t.id \
            			LEFT JOIN (SELECT * FROM tag_group_tag WHERE isarchived = false) \
            				AS tgt ON tgt.tag = t.id \
            			LEFT JOIN (SELECT * FROM tag_group WHERE isarchived = false) \
            				AS tg ON tg.id = tgt.tag_group \
            	 	WHERE (tm.account = $1 OR (t.ispublic = true AND tgt.tag_group IN \
          					(SELECT e::text::int AS source FROM field, \
          						jsonb_array_elements(settings->'source') e WHERE id = $2))) \
                	AND t.isarchived = false AND t.handle LIKE $3";

          search = '%'+search+'%';
          qParams.push(search);

          if(ids.length > 0){
            q += " AND t.id NOT IN($4:csv)";
            qParams.push(ids);
          }

          q += " LIMIT 20";
          res = await db.any(q, qParams);
        }

        return res;
      } catch(e) { console.log(e); }
    },
    async tagAdd(tag, fieldId, entityId, userId){
      try {
        const q = "WITH newtagsinput(handle, ispublic) AS (VALUES (LOWER($1), false)), \
                  	newtagsinsert AS ( \
                  		INSERT INTO tag (handle, ispublic) \
                  		SELECT * FROM newtagsinput \
                  			ON CONFLICT(handle) DO NOTHING \
                  		RETURNING id, ispublic), \
                  	newtags AS ( \
                  		SELECT id, ispublic FROM newtagsinsert \
                  			UNION ALL \
                  				SELECT t.id, t.ispublic FROM newtagsinput \
                  					JOIN tag AS t USING(handle)) \
                  INSERT INTO tag_matrix (tag, field, entity, account) \
                  SELECT id, $2, $3, $4 FROM newtags \
                  WHERE NOT EXISTS ( \
                      SELECT id FROM tag_matrix \
                  	WHERE tag = newtags.id AND field = $2 AND entity = $3 \
                      AND (newtags.ispublic = true OR account = $4))";

        const res = await db.none(q, [tag, fieldId, entityId, userId]);
        sse.blast('tag_matrix');
        return res;
      } catch(e) { console.log(e); }
    },
    async tagAttach(tagId, fieldId, entityId, userId){
      try {
        const q = "INSERT INTO tag_matrix (tag, field, entity, account) \
                    SELECT $1, $2, $3, $4 \
                    WHERE NOT EXISTS ( \
                        SELECT t.id FROM tag_matrix AS tm \
                          LEFT JOIN tag AS t ON t.id = tm .tag \
                    	WHERE tm.tag = $1 AND tm.field = $2 AND tm.entity = $3 \
                    		AND (t.ispublic = true OR tm.account = $4))";

        const res = await db.none(q, [tagId, fieldId, entityId, userId]);
        sse.blast('tag_matrix');
        return res;
      } catch(e) { console.log(e); }
    }
  }
}
